import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { PlatformType, ActionType, ModuleType } from '../../../common/enums';
import { CreditsService } from '../../credits/credits.service';
import { User } from '../../users/entities/user.entity';
import { UnlockedInfluencer } from '../../credits/entities/unlocked-influencer.entity';
import {
  InfluencerProfile,
  DiscoverySearch,
  SearchResult,
  InsightsAccess,
  AudienceData,
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
  AudienceDataDto,
} from '../dto/influencer.dto';

// Credit costs
const CREDIT_PER_SEARCH_RESULT = 0.01;
const CREDIT_PER_UNBLUR = 0.04;
const CREDIT_PER_INSIGHT = 1;
const CREDIT_PER_REFRESH = 1;
const CREDIT_PER_EXPORT = 0.04;

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
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private modashService: ModashService,
    private creditsService: CreditsService,
    private dataSource: DataSource,
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

  // Search via Modash API (live mode)
  private async searchInfluencersViaModash(
    userId: string,
    dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    // 1. Validate user and credits
    const balance = await this.creditsService.getBalance(userId);

    // Estimate minimum credits needed (15 results per page)
    const estimatedCredits = 15 * CREDIT_PER_SEARCH_RESULT;
    if (balance.unifiedBalance < estimatedCredits) {
      throw new BadRequestException(
        `Insufficient credits. Minimum required: ${estimatedCredits}, Available: ${balance.unifiedBalance}`,
      );
    }

    // 2. Create search record
    const search = this.searchRepository.create({
      userId,
      platform: dto.platform,
      filtersApplied: {
        influencer: dto.influencer,
        audience: dto.audience,
        sort: dto.sort,
      },
      page: dto.page || 0,
      status: SearchStatus.IN_PROGRESS,
    });
    await this.searchRepository.save(search);

    try {
      // 3. Call Modash API (ALWAYS - no caching)
      const modashResponse = await this.modashService.searchInfluencers(dto, userId);

      // 4. Store results in DB
      const { profiles, searchResults } = await this.storeSearchResults(
        search,
        modashResponse,
        userId,
      );

      // 5. Deduct credits based on actual result count
      const creditsToDeduct = modashResponse.lookalikes.length * CREDIT_PER_SEARCH_RESULT;
      const deductResult = await this.creditsService.deductCredits(userId, {
        actionType: ActionType.INFLUENCER_SEARCH,
        module: ModuleType.UNIFIED_BALANCE,
        quantity: modashResponse.lookalikes.length,
        resourceId: search.id,
        resourceType: 'discovery_search',
      });

      // 6. Update search record
      search.status = SearchStatus.COMPLETED;
      search.resultCount = modashResponse.lookalikes.length;
      search.totalAvailable = modashResponse.total;
      search.hasMore = modashResponse.hasMore;
      search.creditsUsed = creditsToDeduct;
      await this.searchRepository.save(search);

      // 7. Get unlocked profiles for this user
      const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);

      // 8. Build response
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

      return {
        searchId: search.id,
        platform: dto.platform,
        results,
        resultCount: modashResponse.lookalikes.length,
        totalAvailable: modashResponse.total,
        page: dto.page || 0,
        hasMore: modashResponse.hasMore,
        creditsUsed: creditsToDeduct,
        remainingBalance: deductResult.remainingBalance,
      };
    } catch (error) {
      // Update search as failed
      search.status = SearchStatus.FAILED;
      search.errorMessage = error.message;
      await this.searchRepository.save(search);
      throw error;
    }
  }

  // Search from local database (offline mode - MODASH_ENABLED=false)
  private async searchInfluencersFromLocalDB(
    userId: string,
    dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    const pageSize = 15;
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
      // location is now number[] (location IDs)
      if (filters.location && filters.location.length > 0) {
        queryBuilder.andWhere('profile.locationCountry IN (:...countries)', {
          countries: filters.location,
        });
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
        queryBuilder.andWhere('profile.accountType IN (:...accountTypes)', {
          accountTypes: filters.accountTypes,
        });
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
    // Find profile
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
      relations: ['audienceData'],
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found');
    }

    // Check if already accessed (free re-access)
    const existingAccess = await this.insightsAccessRepository.findOne({
      where: { userId, influencerProfileId: profileId },
    });

    let isFirstAccess = !existingAccess;
    let creditsCharged = 0;

    // Only charge credits if Modash is enabled (live mode)
    const isModashEnabled = this.modashService.isModashEnabled();

    if (isFirstAccess && isModashEnabled) {
      // Charge 1 credit for first access (only in live mode)
      const balance = await this.creditsService.getBalance(userId);
      if (balance.unifiedBalance < CREDIT_PER_INSIGHT) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${CREDIT_PER_INSIGHT}, Available: ${balance.unifiedBalance}`,
        );
      }

      await this.creditsService.deductCredits(userId, {
        actionType: ActionType.INFLUENCER_INSIGHT,
        module: ModuleType.UNIFIED_BALANCE,
        quantity: 1,
        resourceId: profileId,
        resourceType: 'influencer_profile',
      });

      creditsCharged = CREDIT_PER_INSIGHT;
    }

    // Record or update access
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

    let updatedProfile = profile;

    // Only call Modash if enabled
    if (isModashEnabled) {
      const report = await this.modashService.getInfluencerReport(
        profile.platform,
        profile.platformUserId,
        userId,
      );

      // Update profile with latest data
      await this.updateProfileFromReport(profile, report);

      // Get updated profile with audience data
      const refreshedProfile = await this.profileRepository.findOne({
        where: { id: profileId },
        relations: ['audienceData'],
      });

      if (!refreshedProfile) {
        throw new NotFoundException('Profile not found after update');
      }
      updatedProfile = refreshedProfile;
    }

    const balance = await this.creditsService.getBalance(userId);

    return {
      success: true,
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
    // Check if Modash is enabled - refresh only makes sense in live mode
    if (!this.modashService.isModashEnabled()) {
      throw new BadRequestException(
        'Refresh is not available in offline mode. Modash integration is disabled.',
      );
    }

    // Find profile
    const profile = await this.profileRepository.findOne({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException('Influencer profile not found');
    }

    // Check if user has access
    const access = await this.insightsAccessRepository.findOne({
      where: { userId, influencerProfileId: profileId },
    });

    if (!access) {
      throw new ForbiddenException(
        'You must view insights first before refreshing',
      );
    }

    // Charge 1 credit for refresh
    const balance = await this.creditsService.getBalance(userId);
    if (balance.unifiedBalance < CREDIT_PER_REFRESH) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${CREDIT_PER_REFRESH}, Available: ${balance.unifiedBalance}`,
      );
    }

    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_REFRESH,
      module: ModuleType.UNIFIED_BALANCE,
      quantity: 1,
      resourceId: profileId,
      resourceType: 'influencer_profile',
    });

    // Update refresh tracking
    access.refreshCount += 1;
    access.lastRefreshAt = new Date();
    await this.insightsAccessRepository.save(access);

    // Call Modash for fresh data
    const report = await this.modashService.getInfluencerReport(
      profile.platform,
      profile.platformUserId,
      userId,
    );

    // Update profile
    await this.updateProfileFromReport(profile, report);

    // Get updated profile
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
    const { profileIds, format } = dto;

    // Verify all profiles are unlocked
    const unlockedIds = await this.getUnlockedProfileIds(userId, null);
    const notUnlocked = profileIds.filter((id) => !unlockedIds.has(id));

    if (notUnlocked.length > 0) {
      throw new ForbiddenException(
        `Some profiles are not unlocked. Please unblur them first.`,
      );
    }

    // Calculate credits
    const creditsNeeded = profileIds.length * CREDIT_PER_EXPORT;
    const balance = await this.creditsService.getBalance(userId);

    if (balance.unifiedBalance < creditsNeeded) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsNeeded}, Available: ${balance.unifiedBalance}`,
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

    const newBalance = await this.creditsService.getBalance(userId);

    return {
      success: true,
      exportedCount: profiles.length,
      creditsUsed: creditsNeeded,
      remainingBalance: newBalance.unifiedBalance,
      data: format === 'json' ? data : undefined,
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
    return this.modashService.getLocations(query);
  }

  async getInterests(platform: PlatformType) {
    if (!this.modashService.isModashEnabled()) {
      return { interests: [], message: 'Modash integration disabled - no live data available' };
    }
    return this.modashService.getInterests(platform);
  }

  async getLanguages() {
    if (!this.modashService.isModashEnabled()) {
      return { languages: [], message: 'Modash integration disabled - no live data available' };
    }
    return this.modashService.getLanguages();
  }

  async getBrands(query?: string) {
    if (!this.modashService.isModashEnabled()) {
      return { brands: [], message: 'Modash integration disabled - no live data available' };
    }
    return this.modashService.getBrands(query);
  }

  // ============ PRIVATE HELPER METHODS ============

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

      // Update profile with Modash data
      this.mapModashToProfile(profile, influencer);
      profile.modashFetchedAt = new Date();
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

    profile.followerCount = modash.stats?.followers || 0;
    profile.followingCount = modash.stats?.following || 0;
    profile.postCount = modash.stats?.posts || 0;
    profile.engagementRate = modash.stats?.engagementRate || null;
    profile.avgLikes = modash.stats?.avgLikes || 0;
    profile.avgComments = modash.stats?.avgComments || 0;
    profile.avgViews = modash.stats?.avgViews || 0;

    profile.audienceCredibility = modash.audience?.credibility || null;
    profile.rawModashData = modash as any;
  }

  private async updateProfileFromReport(
    profile: InfluencerProfile,
    report: ModashReportResponse,
  ): Promise<void> {
    // Update basic profile info
    if (report.profile) {
      profile.username = report.profile.username ?? null;
      profile.fullName = report.profile.fullname ?? null;
      profile.profilePictureUrl = report.profile.picture ?? null;
      profile.biography = report.profile.bio ?? null;
      profile.isVerified = report.profile.isVerified || false;
      profile.locationCountry = report.profile.geo?.country?.name ?? null;
      profile.locationCity = report.profile.geo?.city?.name ?? null;
      profile.contactEmail = report.profile.contacts?.email ?? null;
    }

    if (report.stats) {
      profile.followerCount = report.stats.followers || 0;
      profile.followingCount = report.stats.following || 0;
      profile.postCount = report.stats.posts || 0;
      profile.engagementRate = report.stats.engagementRate ?? null;
      profile.avgLikes = report.stats.avgLikes || 0;
      profile.avgComments = report.stats.avgComments || 0;
      profile.avgViews = report.stats.avgViews || 0;
    }

    if (report.audience) {
      profile.audienceCredibility = report.audience.credibility ?? null;
    }

    profile.rawModashData = report as any;
    profile.modashFetchedAt = new Date();
    await this.profileRepository.save(profile);

    // Update audience data
    if (report.audience) {
      await this.updateAudienceData(profile.id, report.audience);
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

    // Gender data
    if (audience.genders) {
      for (const g of audience.genders) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.GENDER,
          categoryKey: g.code,
          percentage: g.weight * 100,
        });
      }
    }

    // Age data
    if (audience.ages) {
      for (const a of audience.ages) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.AGE,
          categoryKey: a.code,
          percentage: a.weight * 100,
        });
      }
    }

    // Country data
    if (audience.geoCountries) {
      for (const c of audience.geoCountries) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.LOCATION_COUNTRY,
          categoryKey: c.name,
          percentage: c.weight * 100,
        });
      }
    }

    // City data
    if (audience.geoCities) {
      for (const c of audience.geoCities) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.LOCATION_CITY,
          categoryKey: c.name,
          percentage: c.weight * 100,
        });
      }
    }

    // Interests
    if (audience.interests) {
      for (const i of audience.interests) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.INTEREST,
          categoryKey: i.name,
          percentage: i.weight * 100,
        });
      }
    }

    // Languages
    if (audience.languages) {
      for (const l of audience.languages) {
        audienceRecords.push({
          profileId,
          dataType: AudienceDataType.LANGUAGE,
          categoryKey: l.name,
          percentage: l.weight * 100,
        });
      }
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

  private truncateBio(bio: string | null, maxLength: number = 100): string {
    if (!bio) return '';
    if (bio.length <= maxLength) return bio;
    return bio.substring(0, maxLength) + '...';
  }
}
