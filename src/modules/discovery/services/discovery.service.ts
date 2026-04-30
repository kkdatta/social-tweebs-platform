import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, MoreThan, Raw } from 'typeorm';
import { createHash } from 'crypto';
import { PlatformType, ActionType, ModuleType, UserRole } from '../../../common/enums';
import { CreditsService } from '../../credits/credits.service';
import { InsightsService } from '../../insights/insights.service';
import { User } from '../../users/entities/user.entity';
import { UnlockedInfluencer } from '../../credits/entities/unlocked-influencer.entity';
import {
  InfluencerProfile,
  DiscoverySearch,
  SearchResult,
  InsightsAccess,
  AudienceData,
  ExportRecord,
  SearchStatus,
  AudienceDataType,
} from '../entities';
import {
  ModashService,
  ModashInfluencer,
  ModashSearchResponse,
  ModashReportResponse,
} from './modash.service';
import {
  SearchInfluencersDto,
  SearchResponseDto,
  InfluencerResultDto,
  SearchHistoryResponseDto,
  SearchHistoryItemDto,
} from '../dto/search.dto';
import {
  UnblurInfluencersDto,
  UnblurResponseDto,
  ViewInsightsResponseDto,
  RefreshInsightsResponseDto,
  InfluencerInsightsDto,
  InfluencerProfileDto,
  ExportInfluencersDto,
  ExportResponseDto,
  ExportHistoryResponseDto,
  InsightsCheckResponseDto,
  ExportCostEstimateDto,
  AudienceDataDto,
} from '../dto/influencer.dto';

const CREDIT_PER_UNBLUR = 0.04;
const CREDIT_PER_INSIGHT = 1;
const CREDIT_PER_REFRESH = 1;
const CREDIT_PER_EXPORT_INFLUENCER = 0.04;
const RESULTS_PER_PAGE = 10;
const SEARCH_CACHE_TTL_DAYS = 30;
const MODASH_RESULTS_PER_PAGE = 25;
const AUTO_UNBLUR_COUNT = 3;

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  constructor(
    @InjectRepository(InfluencerProfile)
    private profileRepository: Repository<InfluencerProfile>,
    @InjectRepository(DiscoverySearch)
    private searchRepository: Repository<DiscoverySearch>,
    @InjectRepository(SearchResult)
    private searchResultRepository: Repository<SearchResult>,
    @InjectRepository(InsightsAccess)
    private insightsAccessRepository: Repository<InsightsAccess>,
    @InjectRepository(AudienceData)
    private audienceDataRepository: Repository<AudienceData>,
    @InjectRepository(UnlockedInfluencer)
    private unlockedInfluencerRepository: Repository<UnlockedInfluencer>,
    @InjectRepository(ExportRecord)
    private exportRecordRepository: Repository<ExportRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private modashService: ModashService,
    private creditsService: CreditsService,
    private dataSource: DataSource,
    @Inject(forwardRef(() => InsightsService))
    private insightsService: InsightsService,
  ) {}

  // ============ SEARCH INFLUENCERS ============
  async searchInfluencers(
    userId: string,
    dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    // Check if Modash is enabled or use local DB
    if (this.modashService.isModashEnabled()) {
      return this.searchInfluencersViaModash(userId, dto);
    } else {
      return this.searchInfluencersFromLocalDB(userId, dto);
    }
  }

  /**
   * Generate a deterministic cache key from search parameters.
   * Same filters + platform = same hash, regardless of user/account.
   */
  private generateSearchCacheKey(dto: SearchInfluencersDto): string {
    const cachePayload = {
      platform: dto.platform,
      influencer: dto.influencer || {},
      audience: dto.audience || {},
      sort: dto.sort || {},
      page: dto.page || 0,
    };
    return createHash('sha256')
      .update(JSON.stringify(cachePayload))
      .digest('hex');
  }

  /**
   * Search via Modash API with 30-day query-level caching.
   * Cache is shared across ALL users and ALL accounts.
   */
  private async searchInfluencersViaModash(
    userId: string,
    dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    const cacheKey = this.generateSearchCacheKey(dto);
    const cacheCutoff = new Date();
    cacheCutoff.setDate(cacheCutoff.getDate() - SEARCH_CACHE_TTL_DAYS);

    // Check for cached search (any user, any account) within 30 days
    const cachedSearch = await this.searchRepository.findOne({
      where: {
        status: SearchStatus.COMPLETED,
        filtersApplied: Raw(
          (alias) => `${alias} @> :cacheFilter::jsonb`,
          { cacheFilter: JSON.stringify({ _cacheKey: cacheKey }) },
        ),
        createdAt: MoreThan(cacheCutoff),
      },
      order: { createdAt: 'DESC' },
    });

    if (cachedSearch) {
      this.logger.log(`Search cache HIT (key=${cacheKey.substring(0, 12)}…) — serving from DB, 0 Modash credits`);
      return this.serveCachedSearch(userId, cachedSearch, dto.platform);
    }

    // Cache MISS — call Modash
    this.logger.log(`Search cache MISS (key=${cacheKey.substring(0, 12)}…) — calling Modash`);

    const search = this.searchRepository.create({
      userId,
      platform: dto.platform,
      filtersApplied: {
        influencer: dto.influencer,
        audience: dto.audience,
        sort: dto.sort,
        _cacheKey: cacheKey,
      },
      page: dto.page || 0,
      status: SearchStatus.IN_PROGRESS,
    });
    await this.searchRepository.save(search);

    try {
      const modashResponse = await this.modashService.searchInfluencers(dto, userId);

      const { profiles } = await this.storeSearchResults(
        search,
        modashResponse,
        userId,
      );

      const balanceAfterSearch = await this.creditsService.getBalance(userId);
      search.status = SearchStatus.COMPLETED;
      search.resultCount = modashResponse.lookalikes.length;
      search.totalAvailable = modashResponse.total;
      search.hasMore = modashResponse.hasMore;
      search.creditsUsed = 0;
      await this.searchRepository.save(search);

      const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);

      const results: InfluencerResultDto[] = profiles
        .slice(0, RESULTS_PER_PAGE)
        .map((profile, index) => ({
          id: profile.id,
          platformUserId: profile.platformUserId,
          platform: profile.platform,
          username: profile.username ?? undefined,
          fullName: profile.fullName ?? undefined,
          profilePictureUrl: profile.profilePictureUrl ?? undefined,
          biography: this.truncateBio(profile.biography),
          followerCount: Number(profile.followerCount),
          engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
          avgLikes: profile.avgLikes ? Number(profile.avgLikes) : undefined,
          avgComments: profile.avgComments ? Number(profile.avgComments) : undefined,
          avgViews: profile.avgViews ? Number(profile.avgViews) : undefined,
          isVerified: profile.isVerified,
          locationCountry: profile.locationCountry ?? undefined,
          category: profile.category ?? undefined,
          isBlurred: index < AUTO_UNBLUR_COUNT ? false : !unlockedProfileIds.has(profile.id),
          rankPosition: index + 1,
        }));

      return {
        searchId: search.id,
        platform: dto.platform,
        results,
        resultCount: modashResponse.lookalikes.length,
        totalAvailable: modashResponse.total,
        page: dto.page || 0,
        hasMore: modashResponse.hasMore,
        creditsUsed: 0,
        remainingBalance: balanceAfterSearch.unifiedBalance,
      };
    } catch (error) {
      search.status = SearchStatus.FAILED;
      search.errorMessage = error.message;
      await this.searchRepository.save(search);
      throw error;
    }
  }

  /**
   * Serve results from a previously cached search (0 Modash credits).
   */
  private async serveCachedSearch(
    userId: string,
    cachedSearch: DiscoverySearch,
    platform: PlatformType,
  ): Promise<SearchResponseDto> {
    const searchResults = await this.searchResultRepository.find({
      where: { searchId: cachedSearch.id },
      order: { rankPosition: 'ASC' },
    });

    const profileIds = searchResults.map((sr) => sr.influencerProfileId);
    const profiles = profileIds.length > 0
      ? await this.profileRepository.find({ where: { id: In(profileIds) } })
      : [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const unlockedProfileIds = await this.getUnlockedProfileIds(userId, platform);
    const balance = await this.creditsService.getBalance(userId);

    const results: InfluencerResultDto[] = searchResults
      .slice(0, RESULTS_PER_PAGE)
      .map((sr, index) => {
        const profile = profileMap.get(sr.influencerProfileId);
        if (!profile) return null;
        return {
          id: profile.id,
          platformUserId: profile.platformUserId,
          platform: profile.platform,
          username: profile.username ?? undefined,
          fullName: profile.fullName ?? undefined,
          profilePictureUrl: profile.profilePictureUrl ?? undefined,
          biography: this.truncateBio(profile.biography),
          followerCount: Number(profile.followerCount),
          engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
          avgLikes: profile.avgLikes ? Number(profile.avgLikes) : undefined,
          avgComments: profile.avgComments ? Number(profile.avgComments) : undefined,
          avgViews: profile.avgViews ? Number(profile.avgViews) : undefined,
          isVerified: profile.isVerified,
          locationCountry: profile.locationCountry ?? undefined,
          category: profile.category ?? undefined,
          isBlurred: index < AUTO_UNBLUR_COUNT ? false : !unlockedProfileIds.has(profile.id),
          rankPosition: index + 1,
        };
      })
      .filter(Boolean) as InfluencerResultDto[];

    return {
      searchId: cachedSearch.id,
      platform,
      results,
      resultCount: cachedSearch.resultCount || results.length,
      totalAvailable: cachedSearch.totalAvailable || results.length,
      page: cachedSearch.page || 0,
      hasMore: cachedSearch.hasMore || false,
      creditsUsed: 0,
      remainingBalance: balance.unifiedBalance,
    };
  }

  // Search from local database (offline mode - MODASH_ENABLED=false)
  private async searchInfluencersFromLocalDB(
    userId: string,
    dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    const pageSize = RESULTS_PER_PAGE;
    const page = dto.page || 0;

    // Build query for local database
    const queryBuilder = this.profileRepository
      .createQueryBuilder('profile')
      .where('profile.platform = :platform', { platform: dto.platform });

    // Apply influencer filters
    if (dto.influencer) {
      const filters = dto.influencer;

      if (filters.followers?.min) {
        queryBuilder.andWhere('profile.followerCount >= :minFollowers', {
          minFollowers: filters.followers.min,
        });
      }
      if (filters.followers?.max) {
        queryBuilder.andWhere('profile.followerCount <= :maxFollowers', {
          maxFollowers: filters.followers.max,
        });
      }
      // engagementRate is now a single number (minimum value)
      // Frontend sends as decimal (0.02 for 2%), DB stores as percentage (2.0 for 2%)
      if (filters.engagementRate !== undefined && filters.engagementRate !== null) {
        queryBuilder.andWhere('profile.engagementRate >= :minEr', {
          minEr: filters.engagementRate * 100, // Convert 0.02 to 2.0
        });
      }
      if (filters.isVerified !== undefined) {
        queryBuilder.andWhere('profile.isVerified = :isVerified', {
          isVerified: filters.isVerified,
        });
      }
      // location is number[] (location IDs) - resolve to names for local DB query
      if (filters.location && filters.location.length > 0) {
        const locationNames = await this.dataSource.query(
          `SELECT name FROM zorbitads.locations WHERE id = ANY($1)`,
          [filters.location],
        );
        if (locationNames.length > 0) {
          const names = locationNames.map((l: any) => l.name);
          queryBuilder.andWhere('profile.locationCountry IN (:...countries)', {
            countries: names,
          });
        }
      }
      if (filters.bio) {
        queryBuilder.andWhere('profile.biography ILIKE :bio', {
          bio: `%${filters.bio}%`,
        });
      }
      if (filters.username) {
        queryBuilder.andWhere('profile.username ILIKE :username', {
          username: `%${filters.username}%`,
        });
      }
      if (filters.hasContactDetails) {
        queryBuilder.andWhere('profile.contactEmail IS NOT NULL');
      }
      if (filters.categories && filters.categories.length > 0) {
        queryBuilder.andWhere('profile.category IN (:...categories)', {
          categories: filters.categories,
        });
      }
      if (filters.accountTypes && filters.accountTypes.length > 0) {
        const typeMap: Record<number, string> = { 1: 'REGULAR', 2: 'BUSINESS', 3: 'CREATOR' };
        const mapped = filters.accountTypes.map(t => typeMap[t] || t).filter(Boolean);
        if (mapped.length > 0) {
          queryBuilder.andWhere('profile.accountType IN (:...accountTypes)', {
            accountTypes: mapped,
          });
        }
      }
    }

    // Apply sorting
    if (dto.sort?.field) {
      const sortFieldMap: Record<string, string> = {
        followers: 'profile.followerCount',
        engagementRate: 'profile.engagementRate',
        avgLikes: 'profile.avgLikes',
        avgViews: 'profile.avgViews',
        avgComments: 'profile.avgComments',
      };
      const sortField = sortFieldMap[dto.sort.field] || 'profile.followerCount';
      queryBuilder.orderBy(sortField, dto.sort.direction === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('profile.followerCount', 'DESC');
    }

    // Get total count
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(page * pageSize).take(pageSize);

    const profiles = await queryBuilder.getMany();

    // Create search record (no credits charged in offline mode)
    const search = this.searchRepository.create({
      userId,
      platform: dto.platform,
      filtersApplied: {
        influencer: dto.influencer,
        audience: dto.audience,
        sort: dto.sort,
        _mode: 'LOCAL_DB',
      },
      page,
      status: SearchStatus.COMPLETED,
      resultCount: profiles.length,
      totalAvailable: totalCount,
      hasMore: (page + 1) * pageSize < totalCount,
      creditsUsed: 0, // No credits charged in offline mode
    });
    await this.searchRepository.save(search);

    // Store search results
    for (let i = 0; i < profiles.length; i++) {
      const searchResult = this.searchResultRepository.create({
        searchId: search.id,
        influencerProfileId: profiles[i].id,
        rankPosition: i + 1,
        isBlurred: true,
      });
      await this.searchResultRepository.save(searchResult);
    }

    // Get unlocked profiles for this user
    const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);

    // Build response
    const results: InfluencerResultDto[] = profiles.map((profile, index) => ({
      id: profile.id,
      platformUserId: profile.platformUserId,
      platform: profile.platform,
      username: profile.username ?? undefined,
      fullName: profile.fullName ?? undefined,
      profilePictureUrl: profile.profilePictureUrl ?? undefined,
      biography: this.truncateBio(profile.biography),
      followerCount: Number(profile.followerCount),
      engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
      avgLikes: profile.avgLikes ? Number(profile.avgLikes) : undefined,
      avgComments: profile.avgComments ? Number(profile.avgComments) : undefined,
      avgViews: profile.avgViews ? Number(profile.avgViews) : undefined,
      isVerified: profile.isVerified,
      locationCountry: profile.locationCountry ?? undefined,
      category: profile.category ?? undefined,
      isBlurred: !unlockedProfileIds.has(profile.id),
      rankPosition: index + 1,
    }));

    const balance = await this.creditsService.getBalance(userId);

    return {
      searchId: search.id,
      platform: dto.platform,
      results,
      resultCount: profiles.length,
      totalAvailable: totalCount,
      page,
      hasMore: (page + 1) * pageSize < totalCount,
      creditsUsed: 0, // No credits in offline mode
      remainingBalance: balance.unifiedBalance,
    };
  }

  // ============ UNBLUR INFLUENCERS ============
  async unblurInfluencers(
    userId: string,
    dto: UnblurInfluencersDto,
  ): Promise<UnblurResponseDto> {
    const { profileIds, platform } = dto;

    // Get already unlocked profiles
    const alreadyUnlocked = await this.getUnlockedProfileIds(userId, platform);
    const toUnlock = profileIds.filter((id) => !alreadyUnlocked.has(id));

    if (toUnlock.length === 0) {
      const balance = await this.creditsService.getBalance(userId);
      return {
        success: true,
        unlockedCount: 0,
        alreadyUnlockedCount: profileIds.length,
        creditsUsed: 0,
        remainingBalance: balance.unifiedBalance,
        unlockedProfileIds: [],
      };
    }

    // Calculate credits needed
    const creditsNeeded = toUnlock.length * CREDIT_PER_UNBLUR;
    const balance = await this.creditsService.getBalance(userId);

    if (balance.unifiedBalance < creditsNeeded) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsNeeded}, Available: ${balance.unifiedBalance}`,
      );
    }

    // Verify profiles exist
    const profiles = await this.profileRepository.find({
      where: { id: In(toUnlock), platform },
    });

    if (profiles.length !== toUnlock.length) {
      throw new NotFoundException('Some influencer profiles not found');
    }

    // Deduct credits and record unlocks
    const deductResult = await this.creditsService.unblurInfluencers(userId, {
      influencerIds: profiles.map((p) => p.platformUserId),
      platform,
    });

    return {
      success: true,
      unlockedCount: toUnlock.length,
      alreadyUnlockedCount: profileIds.length - toUnlock.length,
      creditsUsed: deductResult.creditsUsed,
      remainingBalance: deductResult.remainingBalance,
      unlockedProfileIds: toUnlock,
    };
  }

  // ============ VIEW INSIGHTS ============
  async viewInsights(
    userId: string,
    profileId: string,
  ): Promise<ViewInsightsResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['audienceData'],
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found');
    }

    // CLIENT-LEVEL: Check if ANY user in the same client account already unlocked this
    const clientUserIds = await this.getClientUserIds(userId);
    const existingAccess = await this.insightsAccessRepository.findOne({
      where: clientUserIds.map((uid) => ({
        userId: uid,
        influencerProfileId: profileId,
      })),
    });

    let isFirstAccess = !existingAccess;
    let creditsCharged = 0;

    const isModashEnabled = this.modashService.isModashEnabled();
    let updatedProfile = profile;
    let modashReport: ModashReportResponse | undefined;

    if (isModashEnabled) {
      // Check 7-day TTL — only call Modash if data is missing or stale AND this is first access
      const isFresh = profile.modashFetchedAt &&
        (Date.now() - new Date(profile.modashFetchedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

      if (isFirstAccess) {
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < CREDIT_PER_INSIGHT) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${CREDIT_PER_INSIGHT}, Available: ${balance.unifiedBalance}`,
          );
        }
      }

      // PRD #3: On first access, serve existing DB data (even if stale). Do NOT auto-refresh.
      // User must explicitly call Refresh Insights if they want fresh data.
      // Only call Modash if data is completely missing (modashFetchedAt is epoch or null).
      const hasFetchedBefore = profile.modashFetchedAt &&
        new Date(profile.modashFetchedAt).getTime() > 86400000; // > 1 day from epoch = has been fetched before
      if (!hasFetchedBefore && isFirstAccess) {
        modashReport = await this.modashService.getInfluencerReport(
          profile.platform,
          profile.platformUserId,
          userId,
        );
        await this.updateProfileFromReport(profile, modashReport);
      }

      if (isFirstAccess) {
        await this.creditsService.deductCredits(userId, {
          actionType: ActionType.INFLUENCER_INSIGHT,
          module: ModuleType.UNIFIED_BALANCE,
          quantity: 1,
          resourceId: profileId,
          resourceType: 'influencer_profile',
        });
        creditsCharged = CREDIT_PER_INSIGHT;
      }

      const refreshedProfile = await this.profileRepository.findOne({
        where: { id: profileId },
        relations: ['audienceData'],
      });
      if (refreshedProfile) updatedProfile = refreshedProfile;
    }

    if (isFirstAccess) {
      const access = this.insightsAccessRepository.create({
        userId,
        influencerProfileId: profileId,
        platform: profile.platform,
        platformUserId: profile.platformUserId,
        creditsUsed: creditsCharged,
        firstAccessedAt: new Date(),
        lastAccessedAt: new Date(),
        accessCount: 1,
      });
      await this.insightsAccessRepository.save(access);
    } else if (existingAccess) {
      existingAccess.accessCount += 1;
      existingAccess.lastAccessedAt = new Date();
      await this.insightsAccessRepository.save(existingAccess);
    }

    const insightId = await this.insightsService.ensureInsightRecordForDiscoveryProfile(
      userId,
      updatedProfile,
      modashReport,
    );

    const balance = await this.creditsService.getBalance(userId);

    return {
      success: true,
      insightId,
      isFirstAccess,
      creditsCharged,
      remainingBalance: balance.unifiedBalance,
      insights: this.mapToInsightsDto(updatedProfile),
    };
  }

  // ============ REFRESH INSIGHTS ============
  async refreshInsights(
    userId: string,
    profileId: string,
  ): Promise<RefreshInsightsResponseDto> {
    if (!this.modashService.isModashEnabled()) {
      throw new BadRequestException(
        'Refresh is not available in offline mode. Modash integration is disabled.',
      );
    }

    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found');
    }

    // Check if any user in client account has access
    const clientUserIds = await this.getClientUserIds(userId);
    const access = await this.insightsAccessRepository.findOne({
      where: clientUserIds.map((uid) => ({
        userId: uid,
        influencerProfileId: profileId,
      })),
    });

    if (!access) {
      throw new ForbiddenException(
        'You must view insights first before refreshing',
      );
    }

    const balance = await this.creditsService.getBalance(userId);
    if (balance.unifiedBalance < CREDIT_PER_REFRESH) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${CREDIT_PER_REFRESH}, Available: ${balance.unifiedBalance}`,
      );
    }

    // Per spec: if data is already fresh (< 7 days), return same data but still charge 1 credit
    const isFresh = profile.modashFetchedAt &&
      (Date.now() - new Date(profile.modashFetchedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

    if (!isFresh) {
      // Call Modash FIRST — only deduct credit on success (universal refresh guard)
      const report = await this.modashService.getInfluencerReport(
        profile.platform,
        profile.platformUserId,
        userId,
      );
      await this.updateProfileFromReport(profile, report);
    }

    // Deduct credit AFTER success (or for fresh data per spec)
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_REFRESH,
      module: ModuleType.UNIFIED_BALANCE,
      quantity: 1,
      resourceId: profileId,
      resourceType: 'influencer_profile',
    });

    access.refreshCount += 1;
    access.lastRefreshAt = new Date();
    await this.insightsAccessRepository.save(access);

    const updatedProfile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['audienceData'],
    });

    if (!updatedProfile) {
      throw new NotFoundException('Profile not found after refresh');
    }

    const newBalance = await this.creditsService.getBalance(userId);

    return {
      success: true,
      creditsCharged: CREDIT_PER_REFRESH,
      remainingBalance: newBalance.unifiedBalance,
      insights: this.mapToInsightsDto(updatedProfile),
    };
  }

  // ============ GET PROFILE ============
  async getProfile(userId: string, profileId: string): Promise<InfluencerProfileDto> {
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found');
    }

    const unlockedIds = await this.getUnlockedProfileIds(userId, profile.platform);

    return {
      id: profile.id,
      platformUserId: profile.platformUserId,
      platform: profile.platform,
      username: profile.username ?? undefined,
      fullName: profile.fullName ?? undefined,
      profilePictureUrl: profile.profilePictureUrl ?? undefined,
      biography: unlockedIds.has(profile.id) ? (profile.biography ?? undefined) : this.truncateBio(profile.biography),
      followerCount: Number(profile.followerCount),
      engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
      avgLikes: profile.avgLikes ? Number(profile.avgLikes) : undefined,
      isVerified: profile.isVerified,
      locationCountry: profile.locationCountry ?? undefined,
      category: profile.category ?? undefined,
      isUnlocked: unlockedIds.has(profile.id),
      lastUpdatedAt: profile.lastUpdatedAt,
    };
  }

  // ============ TYPEAHEAD ============
  async typeaheadSearch(q: string, limit: number = 8) {
    const term = q.trim();
    const likeQ = `%${term}%`;

    const profileQb = this.profileRepository.createQueryBuilder('p')
      .select(['p.id', 'p.username', 'p.fullName', 'p.profilePictureUrl', 'p.followerCount', 'p.platform', 'p.isVerified'])
      .orderBy('p.followerCount', 'DESC')
      .take(limit);
    if (term) profileQb.andWhere('(p.username ILIKE :q OR p.fullName ILIKE :q)', { q: likeQ });
    const cached = await profileQb.getMany();

    const insightQb = this.insightsAccessRepository.manager
      .createQueryBuilder('InfluencerInsight', 'i')
      .select(['i.id', 'i.username', 'i.fullName', 'i.profilePictureUrl', 'i.followerCount', 'i.platform', 'i.isVerified'])
      .orderBy('i.followerCount', 'DESC')
      .take(limit);
    if (term) insightQb.andWhere('(i.username ILIKE :q OR i.fullName ILIKE :q)', { q: likeQ });
    const insights = await insightQb.getMany();

    const seen = new Set<string>();
    const results: any[] = [];
    const addItem = (item: any, source: string) => {
      const key = `${(item.platform || '').toLowerCase()}_${(item.username || '').toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push({
        id: item.id,
        username: item.username,
        fullName: item.fullName,
        profilePictureUrl: item.profilePictureUrl,
        followerCount: item.followerCount,
        platform: item.platform,
        isVerified: item.isVerified,
        source,
      });
    };

    for (const p of cached) addItem(p, 'discovery');
    for (const i of insights) addItem(i, 'insights');

    results.sort((a, b) => Number(b.followerCount || 0) - Number(a.followerCount || 0));
    return results.slice(0, limit);
  }

  // ============ SEARCH HISTORY ============
  async getSearchHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchHistoryResponseDto> {
    const [searches, total] = await this.searchRepository.findAndCount({
      where: { userId, status: SearchStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      searches: searches.map((s) => ({
        id: s.id,
        platform: s.platform,
        filtersApplied: s.filtersApplied,
        resultCount: s.resultCount,
        creditsUsed: Number(s.creditsUsed),
        createdAt: s.createdAt,
      })),
      total,
    };
  }

  // ============ EXPORT INFLUENCERS ============
  async exportInfluencers(
    userId: string,
    dto: ExportInfluencersDto,
  ): Promise<ExportResponseDto> {
    let { profileIds, format, fileName, excludePreviouslyExported } = dto;

    // If excluding previously exported, filter them out
    if (excludePreviouslyExported) {
      const previouslyExported = await this.getPreviouslyExportedProfileIds(userId);
      profileIds = profileIds.filter((id) => !previouslyExported.has(id));
    }

    if (profileIds.length === 0) {
      const balance = await this.creditsService.getBalance(userId);
      return {
        success: true,
        exportedCount: 0,
        creditsUsed: 0,
        remainingBalance: balance.unifiedBalance,
        data: [],
      };
    }

    // Verify all profiles are unlocked
    const unlockedIds = await this.getUnlockedProfileIds(userId, null);
    const notUnlocked = profileIds.filter((id) => !unlockedIds.has(id));

    if (notUnlocked.length > 0) {
      throw new ForbiddenException(
        `Some profiles are not unlocked. Please unblur them first.`,
      );
    }

    // 1 credit per 25 influencers = 0.04 per influencer
    const creditsNeeded = profileIds.length * CREDIT_PER_EXPORT_INFLUENCER;
    const balance = await this.creditsService.getBalance(userId);

    if (balance.unifiedBalance < creditsNeeded) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsNeeded.toFixed(2)}, Available: ${balance.unifiedBalance}`,
      );
    }

    // Deduct credits
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.INFLUENCER_EXPORT,
      module: ModuleType.UNIFIED_BALANCE,
      quantity: profileIds.length,
      resourceType: 'export',
    });

    // Get profiles
    const profiles = await this.profileRepository.find({
      where: { id: In(profileIds) },
    });

    // Build export data
    const data = profiles.map((p) => ({
      username: p.username,
      fullName: p.fullName,
      platform: p.platform,
      followers: p.followerCount,
      engagementRate: p.engagementRate,
      avgLikes: p.avgLikes,
      avgComments: p.avgComments,
      isVerified: p.isVerified,
      location: p.locationCountry,
      category: p.category,
      contactEmail: p.contactEmail,
      website: p.websiteUrl,
    }));

    // Record the export
    const exportRecord = this.exportRecordRepository.create({
      userId,
      fileName: fileName || `influencer_export_${new Date().toISOString().split('T')[0]}`,
      format,
      profileIds,
      exportedCount: profiles.length,
      creditsUsed: creditsNeeded,
      excludedPreviouslyExported: excludePreviouslyExported || false,
    });
    await this.exportRecordRepository.save(exportRecord);

    const newBalance = await this.creditsService.getBalance(userId);

    return {
      success: true,
      exportedCount: profiles.length,
      creditsUsed: creditsNeeded,
      remainingBalance: newBalance.unifiedBalance,
      data,
    };
  }

  // ============ EXPORT HISTORY ============
  async getExportHistory(userId: string): Promise<ExportHistoryResponseDto> {
    const exports = await this.exportRecordRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    const allExportedProfileIds = new Set<string>();
    exports.forEach((e) => e.profileIds.forEach((id) => allExportedProfileIds.add(id)));

    return {
      exports: exports.map((e) => ({
        id: e.id,
        fileName: e.fileName,
        exportedCount: e.exportedCount,
        creditsUsed: Number(e.creditsUsed),
        createdAt: e.createdAt,
        profileIds: e.profileIds,
      })),
      total: exports.length,
      allExportedProfileIds: Array.from(allExportedProfileIds),
    };
  }

  // ============ EXPORT COST ESTIMATE ============
  async getExportCostEstimate(
    userId: string,
    profileIds: string[],
    excludePreviouslyExported: boolean,
  ): Promise<ExportCostEstimateDto> {
    let previouslyExportedCount = 0;
    let effectiveIds = profileIds;

    if (excludePreviouslyExported) {
      const previouslyExported = await this.getPreviouslyExportedProfileIds(userId);
      const filtered = profileIds.filter((id) => !previouslyExported.has(id));
      previouslyExportedCount = profileIds.length - filtered.length;
      effectiveIds = filtered;
    }

    const creditCost = effectiveIds.length * CREDIT_PER_EXPORT_INFLUENCER;

    return {
      count: profileIds.length,
      creditCost: Math.round(creditCost * 100) / 100,
      previouslyExportedCount,
      newExportCount: effectiveIds.length,
    };
  }

  // ============ CHECK INSIGHTS ACCESS ============
  async checkInsightsAccess(
    userId: string,
    profileId: string,
  ): Promise<InsightsCheckResponseDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { hasAccess: false, creditCost: CREDIT_PER_INSIGHT };
    }

    // Client-level check: all users under the same client account
    const clientUserIds = await this.getClientUserIds(userId);

    const existingAccess = await this.insightsAccessRepository.findOne({
      where: clientUserIds.map((uid) => ({
        userId: uid,
        influencerProfileId: profileId,
      })),
    });

    if (existingAccess) {
      const insightId =
        (await this.insightsService.findOrEnsureInsightIdForProfile(
          userId,
          profileId,
        )) ?? undefined;
      return {
        hasAccess: true,
        creditCost: 0,
        firstAccessedAt: existingAccess.firstAccessedAt,
        insightId,
      };
    }

    return {
      hasAccess: false,
      creditCost: CREDIT_PER_INSIGHT,
    };
  }

  // ============ DICTIONARY ENDPOINTS (Passthrough to Modash) ============
  async getLocations(query?: string) {
    if (!this.modashService.isModashEnabled()) {
      // Return locations from local database when Modash is disabled
      try {
        let queryBuilder = this.dataSource
          .createQueryBuilder()
          .select('l.id', 'id')
          .addSelect('l.name', 'name')
          .addSelect('l.type', 'type')
          .addSelect('l.country_code', 'countryCode')
          .from('zorbitads.locations', 'l');
        
        if (query) {
          queryBuilder = queryBuilder.where('LOWER(l.name) LIKE LOWER(:query)', { query: `%${query}%` });
        }
        
        const locations = await queryBuilder.limit(100).getRawMany();
        
        return { 
          locations,
          source: 'local'
        };
      } catch (error) {
        this.logger.error('Error fetching local locations:', error);
        return { locations: [], message: 'Error fetching locations', source: 'local' };
      }
    }
    const cacheKey = `locations_${query || 'all'}`;
    const cached = this.getCachedDict(cacheKey);
    if (cached) return cached;
    const result = await this.modashService.getLocations(query);
    this.setCachedDict(cacheKey, result);
    return result;
  }

  private dictCache = new Map<string, { data: any; expiresAt: number }>();
  private readonly DICT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getCachedDict(key: string): any | null {
    const entry = this.dictCache.get(key);
    if (entry && Date.now() < entry.expiresAt) return entry.data;
    this.dictCache.delete(key);
    return null;
  }

  private setCachedDict(key: string, data: any): void {
    this.dictCache.set(key, { data, expiresAt: Date.now() + this.DICT_CACHE_TTL_MS });
  }

  async getInterests(platform: PlatformType) {
    if (!this.modashService.isModashEnabled()) {
      return { interests: [], message: 'Modash integration disabled - no live data available' };
    }
    const cacheKey = `interests_${platform}`;
    const cached = this.getCachedDict(cacheKey);
    if (cached) return cached;
    const result = await this.modashService.getInterests(platform);
    this.setCachedDict(cacheKey, result);
    return result;
  }

  async getLanguages() {
    if (!this.modashService.isModashEnabled()) {
      return { languages: [], message: 'Modash integration disabled - no live data available' };
    }
    const cached = this.getCachedDict('languages');
    if (cached) return cached;
    const result = await this.modashService.getLanguages();
    this.setCachedDict('languages', result);
    return result;
  }

  async getBrands(query?: string) {
    if (!this.modashService.isModashEnabled()) {
      return { brands: [], message: 'Modash integration disabled - no live data available' };
    }
    if (!query) {
      const cached = this.getCachedDict('brands_all');
      if (cached) return cached;
    }
    const result = await this.modashService.getBrands(query);
    if (!query) this.setCachedDict('brands_all', result);
    return result;
  }

  async getModashAccountInfo() {
    if (!this.modashService.isModashEnabled()) {
      return {
        enabled: false,
        message: 'Modash API is disabled (APP_MODE=development)',
      };
    }
    const info = await this.modashService.getAccountInfo();
    return {
      enabled: true,
      billing: info.billing,
      rateLimits: info.rateLimits,
    };
  }

  // ============ PRIVATE HELPER METHODS ============

  private async getPreviouslyExportedProfileIds(userId: string): Promise<Set<string>> {
    const exports = await this.exportRecordRepository.find({
      where: { userId },
      select: ['profileIds'],
    });
    const ids = new Set<string>();
    exports.forEach((e) => e.profileIds.forEach((id) => ids.add(id)));
    return ids;
  }

  private async storeSearchResults(
    search: DiscoverySearch,
    modashResponse: ModashSearchResponse,
    userId: string,
  ): Promise<{ profiles: InfluencerProfile[]; searchResults: SearchResult[] }> {
    const profiles: InfluencerProfile[] = [];
    const searchResults: SearchResult[] = [];

    for (let i = 0; i < modashResponse.lookalikes.length; i++) {
      const influencer = modashResponse.lookalikes[i];

      // Find or create profile
      let profile = await this.profileRepository.findOne({
        where: {
          platform: search.platform,
          platformUserId: influencer.userId,
        },
      });

      if (!profile) {
        profile = this.profileRepository.create({
          platform: search.platform,
          platformUserId: influencer.userId,
        });
      }

      // Update profile with search-level data (NOT a full report).
      // Set modashFetchedAt to epoch so the freshness check knows no report has been fetched.
      this.mapModashToProfile(profile, influencer);
      profile.modashFetchedAt = new Date(0);
      await this.profileRepository.save(profile);
      profiles.push(profile);

      // Create search result
      const searchResult = this.searchResultRepository.create({
        searchId: search.id,
        influencerProfileId: profile.id,
        rankPosition: i + 1,
        isBlurred: true, // Default to blurred
      });
      await this.searchResultRepository.save(searchResult);
      searchResults.push(searchResult);
    }

    return { profiles, searchResults };
  }

  private mapModashToProfile(
    profile: InfluencerProfile,
    modash: ModashInfluencer,
  ): void {
    profile.username = modash.profile?.username || null;
    profile.fullName = modash.profile?.fullname || null;
    profile.profilePictureUrl = modash.profile?.picture || null;
    profile.biography = modash.profile?.bio || null;
    profile.isVerified = modash.profile?.isVerified || false;
    profile.isBusinessAccount = modash.profile?.accountType === 'BUSINESS';
    profile.accountType = modash.profile?.accountType || null;
    profile.locationCountry = modash.profile?.geo?.country?.name || null;
    profile.locationCity = modash.profile?.geo?.city?.name || null;
    profile.contactEmail = modash.profile?.contacts?.email || null;

    const profileAny = modash.profile as any;
    profile.followerCount = modash.stats?.followers || profileAny?.followers || 0;
    profile.followingCount = modash.stats?.following || 0;
    profile.postCount = modash.stats?.posts || 0;
    const rawER = modash.stats?.engagementRate || profileAny?.engagementRate || null;
    profile.engagementRate = rawER != null && rawER < 1 ? rawER * 100 : rawER;
    profile.avgLikes = modash.stats?.avgLikes || 0;
    profile.avgComments = modash.stats?.avgComments || 0;
    profile.avgViews = modash.stats?.avgViews || 0;

    profile.audienceCredibility = modash.audience?.credibility || null;
    profile.rawModashData = modash as any;
  }

  /**
   * Extract a numeric value from Modash stats fields which can be
   * either a plain number or an object like {value: number, compared: number}.
   */
  private extractStatValue(stat: any): number | null {
    if (stat == null) return null;
    if (typeof stat === 'number') return stat;
    if (typeof stat === 'object' && 'value' in stat) return stat.value;
    return null;
  }

  /**
   * Map a Modash profile report (after unwrapping response.profile) to our DB entity.
   *
   * The actual structure after unwrap is:
   *   report.profile  → { fullname, username, picture, url, followers, engagementRate, avgLikes, avgComments }
   *   report.bio, report.isVerified, report.accountType, report.postsCount, ... → top-level fields
   *   report.stats    → { followers: {value,compared}, avgLikes: {value,compared}, ... }
   *   report.audience → { credibility, genders, ages, geoCountries, ... }
   *   report.avgLikes, report.avgComments → direct numbers (duplicated from profile sub-object)
   */
  private async updateProfileFromReport(
    profile: InfluencerProfile,
    report: ModashReportResponse,
  ): Promise<void> {
    const r = report as any;

    if (report.profile) {
      profile.username = report.profile.username ?? profile.username;
      profile.fullName = report.profile.fullname ?? profile.fullName;
      profile.profilePictureUrl = report.profile.picture ?? profile.profilePictureUrl;
    }

    profile.biography = r.bio ?? profile.biography;
    profile.isVerified = r.isVerified ?? profile.isVerified ?? false;
    const rawAccountType = r.accountType ? String(r.accountType).toUpperCase() : null;
    profile.isBusinessAccount = rawAccountType === 'BUSINESS';
    profile.accountType = rawAccountType ?? profile.accountType;
    profile.postCount = r.postsCount ?? profile.postCount ?? 0;

    if (r.language?.name) {
      // language info is at top level
    }
    if (r.contacts && Array.isArray(r.contacts) && r.contacts.length > 0) {
      const emailContact = r.contacts.find((c: any) => c.type === 'email');
      if (emailContact) profile.contactEmail = emailContact.value;
    }

    const innerProfile = report.profile as any;
    profile.followerCount =
      innerProfile?.followers ??
      this.extractStatValue(r.stats?.followers) ??
      profile.followerCount ?? 0;
    const reportER = innerProfile?.engagementRate ?? null;
    profile.engagementRate = reportER != null
      ? (reportER < 1 ? reportER * 100 : reportER)
      : profile.engagementRate ?? null;
    profile.avgLikes =
      r.avgLikes ??
      innerProfile?.avgLikes ??
      this.extractStatValue(r.stats?.avgLikes) ??
      profile.avgLikes ?? 0;
    profile.avgComments =
      r.avgComments ??
      innerProfile?.avgComments ??
      this.extractStatValue(r.stats?.avgComments) ??
      profile.avgComments ?? 0;
    profile.avgViews =
      r.avgReelsPlays ??
      this.extractStatValue(r.stats?.avgViews) ??
      profile.avgViews ?? 0;

    if (r.audience?.credibility != null) {
      profile.audienceCredibility = r.audience.credibility;
    }

    // Look for geo data in audience countries for location
    if (r.audience?.geoCountries?.length > 0) {
      profile.locationCountry = profile.locationCountry ?? r.audience.geoCountries[0].name;
    }

    profile.rawModashData = report as any;
    profile.modashFetchedAt = new Date();
    await this.profileRepository.save(profile);

    if (r.audience) {
      await this.updateAudienceData(profile.id, r.audience);
    }
  }

  private async updateAudienceData(
    profileId: string,
    audience: ModashReportResponse['audience'],
  ): Promise<void> {
    if (!audience) return;

    // Delete existing audience data
    await this.audienceDataRepository.delete({ profileId });

    const audienceRecords: Partial<AudienceData>[] = [];

    const pushIfValid = (dataType: AudienceDataType, key: string | undefined | null, weight: number) => {
      if (key && weight != null) {
        audienceRecords.push({ profileId, dataType, categoryKey: key, percentage: weight * 100 });
      }
    };

    if (audience.genders) {
      for (const g of audience.genders) pushIfValid(AudienceDataType.GENDER, g.code, g.weight);
    }
    if (audience.ages) {
      for (const a of audience.ages) pushIfValid(AudienceDataType.AGE, a.code, a.weight);
    }
    if (audience.geoCountries) {
      for (const c of audience.geoCountries) pushIfValid(AudienceDataType.LOCATION_COUNTRY, c.name || c.code, c.weight);
    }
    if (audience.geoCities) {
      for (const c of audience.geoCities) pushIfValid(AudienceDataType.LOCATION_CITY, c.name || c.code, c.weight);
    }
    if (audience.interests) {
      for (const i of audience.interests) pushIfValid(AudienceDataType.INTEREST, i.name, i.weight ?? 0);
    }
    if (audience.languages) {
      for (const l of audience.languages) pushIfValid(AudienceDataType.LANGUAGE, l.name || l.code, l.weight);
    }

    // Save all audience data
    for (const record of audienceRecords) {
      const entity = this.audienceDataRepository.create(record);
      await this.audienceDataRepository.save(entity);
    }
  }

  private async getUnlockedProfileIds(
    userId: string,
    platform: PlatformType | null,
  ): Promise<Set<string>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return new Set();

    const userIdsToCheck = [userId];
    if (user.parentId) {
      userIdsToCheck.push(user.parentId);
    }
    if (user.role === UserRole.ADMIN) {
      const children = await this.userRepository.find({
        where: { parentId: userId },
        select: ['id'],
      });
      userIdsToCheck.push(...children.map((c) => c.id));
    }

    const whereClause: any = {
      userId: In(userIdsToCheck),
    };

    if (platform) {
      whereClause.platform = platform;
    }

    const unlocked = await this.unlockedInfluencerRepository.find({
      where: whereClause,
    });

    // Get profile IDs from platformUserIds
    const platformUserIds = unlocked.map((u) => u.influencerId);
    if (platformUserIds.length === 0) return new Set();

    const profiles = await this.profileRepository.find({
      where: { platformUserId: In(platformUserIds) },
      select: ['id'],
    });

    return new Set(profiles.map((p) => p.id));
  }

  private mapToInsightsDto(profile: InfluencerProfile): InfluencerInsightsDto {
    return {
      id: profile.id,
      platformUserId: profile.platformUserId,
      platform: profile.platform,
      username: profile.username ?? '',
      fullName: profile.fullName ?? undefined,
      profilePictureUrl: profile.profilePictureUrl ?? undefined,
      biography: profile.biography ?? undefined,
      followerCount: Number(profile.followerCount),
      followingCount: Number(profile.followingCount),
      postCount: profile.postCount,
      engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
      avgLikes: Number(profile.avgLikes),
      avgComments: Number(profile.avgComments),
      avgViews: Number(profile.avgViews),
      isVerified: profile.isVerified,
      isBusinessAccount: profile.isBusinessAccount,
      accountType: profile.accountType ?? undefined,
      locationCountry: profile.locationCountry ?? undefined,
      locationCity: profile.locationCity ?? undefined,
      category: profile.category ?? undefined,
      audienceCredibility: profile.audienceCredibility ? Number(profile.audienceCredibility) : undefined,
      contactEmail: profile.contactEmail ?? undefined,
      websiteUrl: profile.websiteUrl ?? undefined,
      audienceData: profile.audienceData?.map((a) => ({
        dataType: a.dataType,
        categoryKey: a.categoryKey,
        percentage: Number(a.percentage),
        affinityScore: a.affinityScore ? Number(a.affinityScore) : undefined,
      })) || [],
      lastUpdatedAt: profile.lastUpdatedAt,
      modashFetchedAt: profile.modashFetchedAt,
    };
  }

  /**
   * Get all user IDs within the same client account (parent + children).
   * Used for client-level unlock/access sharing.
   */
  private async getClientUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [userId];

    const adminId = user.role === UserRole.ADMIN ? userId : user.parentId;
    if (!adminId) return [userId];

    const children = await this.userRepository.find({
      where: { parentId: adminId },
      select: ['id'],
    });

    return [adminId, ...children.map((c) => c.id)];
  }

  private truncateBio(bio: string | null, maxLength: number = 100): string {
    if (!bio) return '';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  }
}
