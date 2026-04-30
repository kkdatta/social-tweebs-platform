import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  TieBreakerComparison,
  TieBreakerInfluencer,
  TieBreakerShare,
  TieBreakerStatus,
  TieBreakerPlatform,
  TieBreakerSharePermission,
} from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { InfluencerInsight } from '../insights/entities/influencer-insight.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';
import { CreditsService } from '../credits/credits.service';
import { ActionType, ModuleType, PlatformType } from '../../common/enums';
import { ModashService } from '../discovery/services/modash.service';
import {
  CreateTieBreakerComparisonDto,
  UpdateTieBreakerComparisonDto,
  ShareTieBreakerComparisonDto,
  TieBreakerFilterDto,
  TieBreakerListResponseDto,
  TieBreakerComparisonDetailDto,
  TieBreakerDashboardStatsDto,
  TieBreakerInfluencerDto,
  SearchInfluencerResultDto,
} from './dto';

const CREDIT_PER_UNBLUR = 1; // 1 credit per unblurred influencer

@Injectable()
export class TieBreakerService {
  private readonly logger = new Logger(TieBreakerService.name);

  constructor(
    @InjectRepository(TieBreakerComparison)
    private readonly comparisonRepo: Repository<TieBreakerComparison>,
    @InjectRepository(TieBreakerInfluencer)
    private readonly influencerRepo: Repository<TieBreakerInfluencer>,
    @InjectRepository(TieBreakerShare)
    private readonly shareRepo: Repository<TieBreakerShare>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(InfluencerProfile)
    private readonly profileRepo: Repository<InfluencerProfile>,
    @InjectRepository(UnlockedInfluencer)
    private readonly unlockedRepo: Repository<UnlockedInfluencer>,
    @InjectRepository(InfluencerInsight)
    private readonly insightRepo: Repository<InfluencerInsight>,
    private readonly creditsService: CreditsService,
    private readonly modashService: ModashService,
  ) {}

  /**
   * Create a new tie breaker comparison
   */
  async createComparison(
    userId: string,
    dto: CreateTieBreakerComparisonDto,
  ): Promise<{ success: boolean; comparison: TieBreakerComparison; creditsUsed: number; unlockedCount: number }> {
    // Validate influencer count (2-3)
    if (dto.influencerIds.length < 2 || dto.influencerIds.length > 3) {
      throw new BadRequestException('You can compare 2 to 3 influencers at a time');
    }

    // Client-level unlock check: check unlocks for all users under the same client
    const clientUserIds = await this.getClientUserIds(userId);
    const unlockedInfluencers = await this.unlockedRepo.find({
      where: {
        userId: In(clientUserIds),
        influencerId: In(dto.influencerIds),
      },
    });

    const unlockedProfileIds = new Set(unlockedInfluencers.map(u => u.influencerId));

    // Also check 7-day cached profiles (already-fetched profiles don't need unlock credit)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const cachedProfiles = await this.profileRepo
      .createQueryBuilder('p')
      .where('p.id IN (:...ids)', { ids: dto.influencerIds })
      .andWhere('p.last_updated_at >= :since', { since: sevenDaysAgo })
      .getMany();
    const recentlyCachedIds = new Set(cachedProfiles.map(p => p.id));

    const influencersToUnlock = dto.influencerIds.filter(
      id => !unlockedProfileIds.has(id) && !recentlyCachedIds.has(id),
    );
    const creditsRequired = influencersToUnlock.length * CREDIT_PER_UNBLUR;

    // Validate balance upfront but defer deduction until after success (universal refresh guard)
    if (creditsRequired > 0) {
      const balance = await this.creditsService.getBalance(userId);
      if ((balance.unifiedBalance || 0) < creditsRequired) {
        throw new BadRequestException(
          `Insufficient credits. Required: ${creditsRequired}, Available: ${balance.unifiedBalance}`,
        );
      }
    }

    // Create comparison record
    const comparison = new TieBreakerComparison();
    comparison.title = dto.title || 'Influencer Comparison';
    comparison.platform = dto.platform;
    comparison.status = TieBreakerStatus.PROCESSING;
    comparison.searchQuery = dto.searchQuery;
    comparison.ownerId = userId;
    comparison.createdById = userId;
    comparison.creditsUsed = creditsRequired;
    comparison.shareUrlToken = `tb_${uuidv4().substring(0, 8)}`;

    const savedComparison = await this.comparisonRepo.save(comparison);

    // Add influencers and unlock new ones
    const influencers = await this.addInfluencersToComparison(
      savedComparison.id,
      dto.influencerIds,
      dto.platform,
      userId,
      influencersToUnlock,
    );

    setTimeout(() => this.processComparison(savedComparison.id).catch(err =>
      this.logger.error(`processComparison ${savedComparison.id} unhandled: ${err.message}`),
    ), 500);

    savedComparison.influencers = influencers;

    return {
      success: true,
      comparison: savedComparison,
      creditsUsed: creditsRequired,
      unlockedCount: influencersToUnlock.length,
    };
  }

  /**
   * Add influencers to comparison and unlock new ones
   */
  private async addInfluencersToComparison(
    comparisonId: string,
    influencerIds: string[],
    platform: TieBreakerPlatform,
    userId: string,
    idsToUnlock: string[],
  ): Promise<TieBreakerInfluencer[]> {
    const influencers: TieBreakerInfluencer[] = [];
    const idsToUnlockSet = new Set(idsToUnlock);

    for (let i = 0; i < influencerIds.length; i++) {
      const profileId = influencerIds[i];
      const profile = await this.profileRepo.findOne({ where: { id: profileId } });

      const influencer = new TieBreakerInfluencer();
      influencer.comparisonId = comparisonId;
      influencer.influencerProfileId = profileId;
      influencer.platform = platform;
      influencer.displayOrder = i + 1;
      influencer.wasUnlocked = idsToUnlockSet.has(profileId);

      if (profile) {
        influencer.platformUserId = profile.platformUserId;
        influencer.influencerName = profile.fullName || profile.username || `Influencer ${i + 1}`;
        influencer.influencerUsername = profile.username || undefined;
        influencer.profilePictureUrl = profile.profilePictureUrl || undefined;
        influencer.followerCount = profile.followerCount || 0;
        influencer.followingCount = profile.followingCount;
        influencer.avgLikes = profile.avgLikes || 0;
        influencer.avgViews = profile.avgViews || 0;
        influencer.avgComments = profile.avgComments || 0;
        influencer.avgReelViews = 0;
        influencer.engagementRate = Number(profile.engagementRate) || 0;
        influencer.isVerified = profile.isVerified || false;
      } else {
        // Profile not in cached_influencer_profiles — check influencer_insights
        const insight = await this.insightRepo.findOne({ where: { id: profileId } });
        if (insight) {
          influencer.platformUserId = insight.platformUserId || insight.username;
          influencer.influencerName = insight.fullName || insight.username || `Influencer ${i + 1}`;
          influencer.influencerUsername = insight.username || undefined;
          influencer.profilePictureUrl = insight.profilePictureUrl || undefined;
          influencer.followerCount = Number(insight.followerCount) || 0;
          influencer.followingCount = Number(insight.followingCount) || 0;
          influencer.avgLikes = Number(insight.avgLikes) || 0;
          influencer.avgViews = Number(insight.avgViews) || 0;
          influencer.avgComments = Number(insight.avgComments) || 0;
          influencer.avgReelViews = Number(insight.avgReelViews) || 0;
          influencer.engagementRate = Number(insight.engagementRate) || 0;
          influencer.isVerified = insight.isVerified || false;
        } else {
          throw new BadRequestException(
            `Influencer with ID ${profileId} not found in profiles or insights`,
          );
        }
      }

      // If this influencer was unlocked, create unlock record
      if (influencer.wasUnlocked) {
        const unlock = new UnlockedInfluencer();
        unlock.userId = userId;
        unlock.influencerId = profileId;
        unlock.platform = platform as any;
        unlock.unlockType = 'UNBLUR';
        unlock.creditsUsed = CREDIT_PER_UNBLUR;
        await this.unlockedRepo.save(unlock);
      }

      influencers.push(await this.influencerRepo.save(influencer));
    }

    return influencers;
  }

  /**
   * Process comparison - fetch detailed data
   */
  private async processComparison(comparisonId: string): Promise<void> {
    const comparison = await this.comparisonRepo.findOne({
      where: { id: comparisonId },
      relations: ['influencers'],
    });
    if (!comparison) return;

    try {
      for (const influencer of comparison.influencers) {
        const usedInsights = await this.populateFromInsights(influencer);
        if (!usedInsights) {
          const usedCache = await this.populateFromCacheIfFresh(influencer);
          if (!usedCache) {
            if (this.modashService.isModashEnabled()) {
              try {
                await this.populateInfluencerFromModash(influencer);
              } catch (err) {
                this.logger.warn(`Modash fetch failed for ${influencer.influencerUsername}: ${err instanceof Error ? err.message : err}`);
              }
            } else {
              this.logger.warn(`No data source available for ${influencer.influencerUsername} — Modash disabled, no insights/cache found`);
            }
          }
        }
        await this.influencerRepo.save(influencer);
      }

      comparison.status = TieBreakerStatus.COMPLETED;
      comparison.completedAt = new Date();
      await this.comparisonRepo.save(comparison);

      // Deduct credits ONLY after successful processing (universal refresh guard)
      if (comparison.creditsUsed > 0) {
        await this.creditsService.deductCredits(comparison.ownerId, {
          actionType: ActionType.PROFILE_UNLOCK,
          quantity: Number(comparison.creditsUsed),
          module: ModuleType.TIE_BREAKER,
          resourceId: comparisonId,
          resourceType: 'influencer_comparison_unlock',
        });
        this.logger.log(`Tie breaker ${comparisonId}: charged ${comparison.creditsUsed} credits after success`);
      }
    } catch (error) {
      comparison.status = TieBreakerStatus.FAILED;
      comparison.errorMessage = error instanceof Error ? error.message : 'Processing failed';
      await this.comparisonRepo.save(comparison);
      this.logger.error(`Tie breaker ${comparisonId} failed — NO credits charged`);
    }
  }

  private extractStat(val: any, fallback = 0): number {
    if (val == null) return fallback;
    if (typeof val === 'number') return val;
    if (typeof val === 'object') {
      if ('value' in val) return Number(val.value) || fallback;
      if ('compared' in val) return Number(val.compared) || fallback;
    }
    return Number(val) || fallback;
  }

  /**
   * If the cached_influencer_profiles row was fetched within 7 days,
   * populate TieBreakerInfluencer from DB instead of burning a 1-credit Modash call.
   */
  private async populateFromCacheIfFresh(influencer: TieBreakerInfluencer): Promise<boolean> {
    if (!influencer.influencerProfileId) return false;

    const profile = await this.profileRepo.findOne({
      where: { id: influencer.influencerProfileId },
      relations: ['audienceData'],
    });
    if (!profile?.modashFetchedAt) return false;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (profile.modashFetchedAt < sevenDaysAgo) return false;

    this.logger.log(
      `Tie-breaker: using cached profile for ${influencer.influencerUsername} (fetched ${profile.modashFetchedAt.toISOString()}) — saved 1 Modash credit`,
    );

    influencer.followerCount = Number(profile.followerCount) || influencer.followerCount;
    influencer.followingCount = Number(profile.followingCount) || influencer.followingCount;
    influencer.avgLikes = Number(profile.avgLikes) || influencer.avgLikes;
    influencer.avgComments = Number(profile.avgComments) || influencer.avgComments;
    influencer.avgViews = Number(profile.avgViews) || influencer.avgViews;
    influencer.engagementRate = Number(profile.engagementRate) || influencer.engagementRate;
    influencer.isVerified = profile.isVerified ?? influencer.isVerified;
    const cacheCredibility = Number(profile.audienceCredibility) || null;
    if (cacheCredibility != null) {
      influencer.audienceQuality = cacheCredibility <= 1 ? cacheCredibility * 100 : cacheCredibility;
    }

    if (profile.profilePictureUrl) {
      influencer.profilePictureUrl = profile.profilePictureUrl;
    }

    // Populate audience demographics from rawModashData if available
    if (profile.rawModashData?.audience) {
      const aud = profile.rawModashData.audience;
      if (aud.genders?.length) {
        const male = aud.genders.find((g: any) => g.code === 'male');
        const female = aud.genders.find((g: any) => g.code === 'female');
        influencer.followersGenderData = {
          male: male ? male.weight * 100 : 0,
          female: female ? female.weight * 100 : 0,
        };
      }
      if (aud.ages?.length) {
        influencer.followersAgeData = aud.ages.map((a: any) => ({
          ageRange: a.code,
          male: a.weight * 50,
          female: a.weight * 50,
        }));
      }
      if (aud.geoCountries?.length) {
        influencer.followersCountries = aud.geoCountries.map((g: any) => ({
          country: g.name,
          percentage: g.weight * 100,
        }));
      }
      if (aud.geoCities?.length) {
        influencer.followersCities = aud.geoCities.map((c: any) => ({
          city: c.name,
          percentage: c.weight * 100,
        }));
      }
      if (aud.interests?.length) {
        influencer.followersInterests = aud.interests.map((i: any) => ({
          interest: i.name,
          percentage: i.weight * 100,
        }));
      }
    }

    // Mirror followers to engagers if engager-specific data isn't set
    if (!influencer.engagersGenderData && influencer.followersGenderData) {
      influencer.engagersGenderData = { ...influencer.followersGenderData };
    }
    if (!influencer.engagersAgeData && influencer.followersAgeData) {
      influencer.engagersAgeData = [...influencer.followersAgeData];
    }
    if (!influencer.engagersCountries && influencer.followersCountries) {
      influencer.engagersCountries = [...influencer.followersCountries];
    }
    if (!influencer.engagersCities && influencer.followersCities) {
      influencer.engagersCities = [...influencer.followersCities];
    }
    if (!influencer.engagersInterests && influencer.followersInterests) {
      influencer.engagersInterests = [...influencer.followersInterests];
    }
    if (!influencer.engagersQuality && influencer.audienceQuality) {
      influencer.engagersQuality = influencer.audienceQuality;
    }
    if (!influencer.notableEngagersPct && influencer.notableFollowersPct) {
      influencer.notableEngagersPct = influencer.notableFollowersPct;
    }

    return true;
  }

  /**
   * Pull data from existing influencer_insights (already paid for, free to reuse).
   */
  private async populateFromInsights(influencer: TieBreakerInfluencer): Promise<boolean> {
    const username = influencer.influencerUsername || influencer.platformUserId;
    const profileId = influencer.influencerProfileId;

    // Try by ID first (covers cases where the ID is from influencer_insights table)
    let insight = profileId
      ? await this.insightRepo.findOne({ where: { id: profileId } })
      : null;

    // Fall back to username/platformUserId lookup
    if (!insight && username) {
      insight = await this.insightRepo.findOne({
        where: [
          { username },
          { platformUserId: username },
        ],
      });
    }
    if (!insight) return false;

    this.logger.log(`Tie-breaker: using existing insights for ${insight.username}`);

    // Correct name/username if they were set to fallback values
    if (insight.username && (!influencer.influencerUsername || influencer.influencerUsername.startsWith('influencer_'))) {
      influencer.influencerUsername = insight.username;
    }
    if (insight.fullName && (!influencer.influencerName || influencer.influencerName.startsWith('Influencer '))) {
      influencer.influencerName = insight.fullName;
    }
    if (insight.profilePictureUrl && !influencer.profilePictureUrl) {
      influencer.profilePictureUrl = insight.profilePictureUrl;
    }
    if (insight.platformUserId && !influencer.platformUserId) {
      influencer.platformUserId = insight.platformUserId;
    }

    influencer.followerCount = Number(insight.followerCount) || influencer.followerCount;
    influencer.followingCount = Number(insight.followingCount) || influencer.followingCount;
    influencer.avgLikes = Number(insight.avgLikes) || influencer.avgLikes;
    influencer.avgComments = Number(insight.avgComments) || influencer.avgComments;
    influencer.avgViews = Number(insight.avgViews) || influencer.avgViews;
    influencer.avgReelViews = Number(insight.avgReelViews) || influencer.avgReelViews;
    influencer.engagementRate = Number(insight.engagementRate) || influencer.engagementRate;
    influencer.isVerified = insight.isVerified ?? influencer.isVerified;
    if (insight.profilePictureUrl) influencer.profilePictureUrl = insight.profilePictureUrl;

    const aud = insight.audienceData || {};
    const rawCredibility = aud.credibility ?? Number(insight.audienceCredibility) ?? null;
    if (rawCredibility != null) {
      influencer.audienceQuality = rawCredibility <= 1 ? rawCredibility * 100 : rawCredibility;
    }
    influencer.notableFollowersPct = aud.notable != null ? aud.notable * 100 : (insight.notableFollowersPct ?? influencer.notableFollowersPct);

    const genders = aud.genders || aud.followers?.genderSplit;
    if (Array.isArray(genders) && genders.length) {
      const m = genders.find((g: any) => /^male$/i.test(g.code));
      const f = genders.find((g: any) => /^female$/i.test(g.code));
      influencer.followersGenderData = { male: m ? m.weight * 100 : 0, female: f ? f.weight * 100 : 0 };
    } else if (typeof genders === 'object' && genders && !Array.isArray(genders)) {
      influencer.followersGenderData = { male: (genders.male || 0) * 100, female: (genders.female || 0) * 100 };
    }

    const gendersPerAge = aud.gendersPerAge;
    if (Array.isArray(gendersPerAge) && gendersPerAge.length) {
      influencer.followersAgeData = gendersPerAge.map((a: any) => ({
        ageRange: a.code,
        male: (a.male || 0) * 100,
        female: (a.female || 0) * 100,
      }));
    } else {
      const ages = aud.ages || aud.followers?.ageGroups;
      if (Array.isArray(ages) && ages.length) {
        influencer.followersAgeData = ages.map((a: any) => ({ ageRange: a.code, male: a.weight * 50, female: a.weight * 50 }));
      }
    }

    const countries = aud.geoCountries || aud.followers?.topCountries;
    if (Array.isArray(countries) && countries.length) {
      influencer.followersCountries = countries.map((c: any) => ({ country: c.name, percentage: (c.weight || c.percentage || 0) * 100 }));
    }

    const cities = aud.geoCities || aud.followers?.topCities;
    if (Array.isArray(cities) && cities.length) {
      influencer.followersCities = cities.map((c: any) => ({ city: c.name, percentage: (c.weight || c.percentage || 0) * 100 }));
    }

    const interests = aud.interests || aud.followers?.interests;
    if (Array.isArray(interests) && interests.length) {
      influencer.followersInterests = interests.map((i: any) => ({ interest: i.name, percentage: (i.weight || 0) * 100 }));
    }

    // Engagers audience — use dedicated engager data if available, otherwise mirror followers
    const eng = aud.engagers || {};
    const hasEngagerData = eng.genders || eng.ages || eng.geoCountries;

    const rawEngCredibility = eng.credibility ?? aud.credibility ?? null;
    if (rawEngCredibility != null) {
      influencer.engagersQuality = rawEngCredibility <= 1 ? rawEngCredibility * 100 : rawEngCredibility;
    }
    influencer.notableEngagersPct = eng.notable != null ? eng.notable * 100
      : (aud.notable != null ? aud.notable * 100 : influencer.notableEngagersPct);

    if (hasEngagerData) {
      const eGenders = eng.genders;
      if (Array.isArray(eGenders) && eGenders.length) {
        const m = eGenders.find((g: any) => /^male$/i.test(g.code));
        const f = eGenders.find((g: any) => /^female$/i.test(g.code));
        influencer.engagersGenderData = { male: m ? m.weight * 100 : 0, female: f ? f.weight * 100 : 0 };
      }
      const eAges = eng.ages;
      if (Array.isArray(eAges) && eAges.length) {
        influencer.engagersAgeData = eAges.map((a: any) => ({ ageRange: a.code, male: a.weight * 50, female: a.weight * 50 }));
      }
      const eCountries = eng.geoCountries;
      if (Array.isArray(eCountries) && eCountries.length) {
        influencer.engagersCountries = eCountries.map((c: any) => ({ country: c.name, percentage: (c.weight || 0) * 100 }));
      }
      const eCities = eng.geoCities;
      if (Array.isArray(eCities) && eCities.length) {
        influencer.engagersCities = eCities.map((c: any) => ({ city: c.name, percentage: (c.weight || 0) * 100 }));
      }
      const eInterests = eng.interests;
      if (Array.isArray(eInterests) && eInterests.length) {
        influencer.engagersInterests = eInterests.map((i: any) => ({ interest: i.name, percentage: (i.weight || 0) * 100 }));
      }
    } else {
      // Mirror followers' audience data as proxy for engagers
      if (influencer.followersGenderData) influencer.engagersGenderData = { ...influencer.followersGenderData };
      if (influencer.followersAgeData) influencer.engagersAgeData = [...influencer.followersAgeData];
      if (influencer.followersCountries) influencer.engagersCountries = [...influencer.followersCountries];
      if (influencer.followersCities) influencer.engagersCities = [...influencer.followersCities];
      if (influencer.followersInterests) influencer.engagersInterests = [...influencer.followersInterests];
    }

    // Top posts from insights
    const topPosts: any[] = [];
    const seenUrls = new Set<string>();
    const followerCount = Number(insight.followerCount) || Number(influencer.followerCount) || 1;
    const addPosts = (list: any[]) => {
      for (const p of (list || [])) {
        if (topPosts.length >= 10) break;
        const postUrl = p.url || '';
        if (postUrl && seenUrls.has(postUrl)) continue;
        if (postUrl) seenUrls.add(postUrl);
        const likes = Number(p.likes) || 0;
        const comments = Number(p.comments) || 0;
        const views = Number(p.views) || 0;
        const er = followerCount > 0 ? Number(((likes + comments) / followerCount * 100).toFixed(2)) : 0;
        topPosts.push({
          postId: p.id || p.postId || `post_${topPosts.length}`,
          postUrl,
          thumbnailUrl: p.thumbnail || p.image || p.imageUrl || '',
          caption: p.text || p.caption || '',
          likes,
          comments,
          views,
          engagementRate: er,
          isSponsored: !!(p.text && /#(ad|sponsored|partner|collab)\b/i.test(p.text)),
          postDate: p.created || p.postedAt || null,
        });
      }
    };
    addPosts(insight.popularPosts);
    addPosts(insight.recentPosts);
    if (topPosts.length > 0) influencer.topPosts = topPosts;

    return true;
  }

  private async populateInfluencerFromModash(influencer: TieBreakerInfluencer): Promise<void> {
    this.logger.log(`Fetching Modash report for tie-breaker influencer ${influencer.influencerUsername}`);
    try {
      const platformMap: Record<string, PlatformType> = {
        instagram: PlatformType.INSTAGRAM,
        youtube: PlatformType.YOUTUBE,
        tiktok: PlatformType.TIKTOK,
      };
      const platform = platformMap[influencer.platform?.toLowerCase()] || PlatformType.INSTAGRAM;
      const report = await this.modashService.getInfluencerReport(
        platform,
        influencer.platformUserId || influencer.influencerUsername || '',
      );

      if (report?.stats) {
        influencer.followerCount = this.extractStat(report.stats.followers, influencer.followerCount);
        influencer.followingCount = this.extractStat(report.stats.following, influencer.followingCount);
        influencer.avgLikes = this.extractStat(report.stats.avgLikes, influencer.avgLikes);
        influencer.avgComments = this.extractStat(report.stats.avgComments, influencer.avgComments);
        influencer.avgViews = this.extractStat(report.stats.avgViews, influencer.avgViews);
        influencer.avgReelViews = this.extractStat(report.stats.avgReelPlays, influencer.avgReelViews);
        influencer.engagementRate = this.extractStat(report.stats.engagementRate, influencer.engagementRate);
      }

      if (report?.audience) {
        influencer.audienceQuality = report.audience.credibility ?? influencer.audienceQuality;

        if (report.audience.genders?.length) {
          const male = report.audience.genders.find(g => g.code === 'male');
          const female = report.audience.genders.find(g => g.code === 'female');
          influencer.followersGenderData = {
            male: male ? male.weight * 100 : 0,
            female: female ? female.weight * 100 : 0,
          };
        }

        if (report.audience.ages?.length) {
          influencer.followersAgeData = report.audience.ages.map(a => ({
            ageRange: a.code,
            male: a.weight * 50,
            female: a.weight * 50,
          }));
        }

        if (report.audience.geoCountries?.length) {
          influencer.followersCountries = report.audience.geoCountries.map(g => ({
            country: g.name,
            percentage: g.weight * 100,
          }));
        }

        if (report.audience.geoCities?.length) {
          influencer.followersCities = report.audience.geoCities.map(c => ({
            city: c.name,
            percentage: c.weight * 100,
          }));
        }

        if (report.audience.interests?.length) {
          influencer.followersInterests = report.audience.interests.map(i => ({
            interest: i.name,
            percentage: (i.weight ?? 0) * 100,
          }));
        }
      }

      if (report?.profile) {
        influencer.isVerified = report.profile.isVerified ?? influencer.isVerified;
        if (report.profile.picture) {
          influencer.profilePictureUrl = report.profile.picture;
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch Modash data for ${influencer.influencerUsername}: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  // No mock/synthetic data generation — all data must come from real sources
  // (influencer_insights, cached_influencer_profiles, or Modash API)

  /**
   * Get list of comparisons with filters
   */
  async getComparisons(userId: string, filters: TieBreakerFilterDto): Promise<TieBreakerListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.comparisonRepo.createQueryBuilder('comparison')
      .leftJoinAndSelect('comparison.influencers', 'influencers')
      .leftJoinAndSelect('comparison.createdBy', 'createdBy');

    // Filter by creator
    if (filters.createdBy === 'ME') {
      queryBuilder.where('comparison.createdById = :userId', { userId });
    } else if (filters.createdBy === 'TEAM') {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where('comparison.createdById IN (:...teamUserIds)', { teamUserIds });
    } else {
      const teamUserIds = await this.getTeamUserIds(userId);
      queryBuilder.where(
        '(comparison.createdById = :userId OR comparison.createdById IN (:...teamUserIds))',
        { userId, teamUserIds },
      );
    }

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere('comparison.platform = :platform', { platform: filters.platform });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('comparison.status = :status', { status: filters.status });
    }

    // Search by title
    if (filters.search) {
      queryBuilder.andWhere('LOWER(comparison.title) LIKE :search', {
        search: `%${filters.search.toLowerCase()}%`,
      });
    }

    queryBuilder.orderBy('comparison.createdAt', 'DESC').skip(skip).take(limit);

    const [comparisons, total] = await queryBuilder.getManyAndCount();

    return {
      comparisons: comparisons.map(c => this.toSummaryDto(c)),
      total,
      page,
      limit,
      hasMore: skip + comparisons.length < total,
    };
  }

  /**
   * Get comparison by ID
   */
  async getComparisonById(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto> {
    const comparison = await this.comparisonRepo.findOne({
      where: { id: comparisonId },
      relations: ['influencers', 'owner', 'createdBy'],
    });

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    await this.checkComparisonAccess(userId, comparison);

    return this.toDetailDto(comparison);
  }

  /**
   * Get comparison by share token (public access)
   */
  async getComparisonByShareToken(token: string): Promise<TieBreakerComparisonDetailDto> {
    const comparison = await this.comparisonRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['influencers'],
    });

    if (!comparison) {
      throw new NotFoundException('Comparison not found or not publicly shared');
    }

    return this.toDetailDto(comparison);
  }

  /**
   * Update comparison
   */
  async updateComparison(
    userId: string,
    comparisonId: string,
    dto: UpdateTieBreakerComparisonDto,
  ): Promise<{ success: boolean; comparison: TieBreakerComparison }> {
    const comparison = await this.comparisonRepo.findOne({
      where: { id: comparisonId },
      relations: ['influencers'],
    });

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    await this.checkComparisonAccess(userId, comparison, 'edit');

    if (dto.title !== undefined) comparison.title = dto.title;
    if (dto.isPublic !== undefined) comparison.isPublic = dto.isPublic;

    const savedComparison = await this.comparisonRepo.save(comparison);

    return { success: true, comparison: savedComparison };
  }

  /**
   * Delete comparison
   */
  async deleteComparison(userId: string, comparisonId: string): Promise<{ success: boolean }> {
    const comparison = await this.comparisonRepo.findOne({ where: { id: comparisonId } });

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    await this.checkComparisonAccess(userId, comparison, 'edit');

    await this.comparisonRepo.remove(comparison);

    return { success: true };
  }

  /**
   * Share comparison
   */
  async shareComparison(
    userId: string,
    comparisonId: string,
    dto: ShareTieBreakerComparisonDto,
  ): Promise<{ success: boolean; shareUrl?: string }> {
    const comparison = await this.comparisonRepo.findOne({ where: { id: comparisonId } });

    if (!comparison) {
      throw new NotFoundException('Comparison not found');
    }

    await this.checkComparisonAccess(userId, comparison, 'edit');

    // Make public if requested
    if (dto.makePublic) {
      comparison.isPublic = true;
      await this.comparisonRepo.save(comparison);
    }

    // Share with specific user
    if (dto.sharedWithUserId) {
      const existingShare = await this.shareRepo.findOne({
        where: { comparisonId, sharedWithUserId: dto.sharedWithUserId },
      });

      if (!existingShare) {
        const share = new TieBreakerShare();
        share.comparisonId = comparisonId;
        share.sharedWithUserId = dto.sharedWithUserId;
        share.sharedByUserId = userId;
        share.permissionLevel = dto.permissionLevel || TieBreakerSharePermission.VIEW;
        await this.shareRepo.save(share);
      }
    }

    const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/tie-breaker/shared/${comparison.shareUrlToken}`;

    return { success: true, shareUrl };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string): Promise<TieBreakerDashboardStatsDto> {
    const teamUserIds = await this.getTeamUserIds(userId);

    const allComparisons = await this.comparisonRepo.find({
      where: { createdById: In([userId, ...teamUserIds]) },
      relations: ['influencers'],
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const comparisonsThisMonth = allComparisons.filter(c => c.createdAt >= startOfMonth).length;
    const totalInfluencers = allComparisons.reduce((sum, c) => sum + (c.influencers?.length || 0), 0);
    const totalCredits = allComparisons.reduce((sum, c) => sum + Number(c.creditsUsed || 0), 0);

    return {
      totalComparisons: allComparisons.length,
      completedComparisons: allComparisons.filter(c => c.status === TieBreakerStatus.COMPLETED).length,
      pendingComparisons: allComparisons.filter(c => c.status === TieBreakerStatus.PENDING).length,
      processingComparisons: allComparisons.filter(c => c.status === TieBreakerStatus.PROCESSING).length,
      failedComparisons: allComparisons.filter(c => c.status === TieBreakerStatus.FAILED).length,
      comparisonsThisMonth,
      totalInfluencersCompared: totalInfluencers,
      totalCreditsUsed: totalCredits,
    };
  }

  /**
   * Search influencers for comparison
   */
  async searchInfluencers(
    userId: string,
    platform: string,
    query: string,
    limit: number = 20,
  ): Promise<SearchInfluencerResultDto[]> {
    const safePlatform = (platform || 'INSTAGRAM').toUpperCase();
    const likeQ = query ? `%${query.toLowerCase()}%` : null;

    // Search cached_influencer_profiles
    const profileQb = this.profileRepo.createQueryBuilder('profile')
      .where('profile.platform = :platform', { platform: safePlatform });
    if (likeQ) {
      profileQb.andWhere('(LOWER(profile.username) LIKE :query OR LOWER(profile.fullName) LIKE :query)', { query: likeQ });
    }
    profileQb.orderBy('profile.followerCount', 'DESC').take(limit);
    const profiles = await profileQb.getMany();

    // Also search influencer_insights for influencers that may not be in cached profiles
    const insightQb = this.insightRepo.createQueryBuilder('i')
      .where('i.platform = :platform', { platform: safePlatform });
    if (likeQ) {
      insightQb.andWhere('(LOWER(i.username) LIKE :query OR LOWER(i.fullName) LIKE :query)', { query: likeQ });
    }
    insightQb.orderBy('i.followerCount', 'DESC').take(limit);
    const insights = await insightQb.getMany();

    // Merge and deduplicate by username
    const seen = new Set<string>();
    const merged: any[] = [];

    for (const p of profiles) {
      const key = (p.username || '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: p.id,
        platform: p.platform,
        platformUserId: p.platformUserId,
        username: p.username || '',
        fullName: p.fullName || undefined,
        profilePictureUrl: p.profilePictureUrl || undefined,
        followerCount: p.followerCount || 0,
        engagementRate: p.engagementRate ? Number(p.engagementRate) : undefined,
        isVerified: p.isVerified || false,
        locationCountry: p.locationCountry || undefined,
        _source: 'profile',
      });
    }

    for (const i of insights) {
      const key = (i.username || '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({
        id: i.id,
        platform: i.platform,
        platformUserId: i.platformUserId || i.username,
        username: i.username || '',
        fullName: i.fullName || undefined,
        profilePictureUrl: i.profilePictureUrl || undefined,
        followerCount: Number(i.followerCount) || 0,
        engagementRate: i.engagementRate ? Number(i.engagementRate) : undefined,
        isVerified: i.isVerified || false,
        locationCountry: i.locationCountry || undefined,
        _source: 'insight',
      });
    }

    merged.sort((a, b) => Number(b.followerCount || 0) - Number(a.followerCount || 0));
    const results = merged.slice(0, limit);

    // Check which are unlocked
    const profileIds = results.filter(r => r._source === 'profile').map(r => r.id);
    const unlockedProfiles = profileIds.length > 0
      ? await this.unlockedRepo.find({ where: { userId, influencerId: In(profileIds) } })
      : [];
    const unlockedIds = new Set(unlockedProfiles.map(u => u.influencerId));

    return results.map(r => ({
      id: r.id,
      platform: r.platform,
      platformUserId: r.platformUserId,
      username: r.username,
      fullName: r.fullName,
      profilePictureUrl: r.profilePictureUrl,
      followerCount: r.followerCount,
      engagementRate: r.engagementRate,
      isVerified: r.isVerified,
      isUnlocked: r._source === 'insight' ? true : unlockedIds.has(r.id),
      locationCountry: r.locationCountry,
    }));
  }

  /**
   * Download comparison as PDF data
   */
  async getComparisonForDownload(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto> {
    // Same as getComparisonById but can be extended for PDF-specific data
    return this.getComparisonById(userId, comparisonId);
  }

  // ==================== Helper Methods ====================

  private async getClientUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [userId];

    const adminId = user.parentId || userId;
    const clientUsers = await this.userRepo.find({
      where: [
        { id: adminId },
        { parentId: adminId },
      ],
    });
    return [...new Set([userId, ...clientUsers.map(u => u.id)])];
  }

  private async getTeamUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [userId];

    const teamMembers = await this.userRepo.find({
      where: [
        { id: user.parentId || undefined },
        { parentId: userId },
        { parentId: user.parentId || undefined },
      ],
    });

    return [userId, ...teamMembers.map(m => m.id)];
  }

  private async checkComparisonAccess(
    userId: string,
    comparison: TieBreakerComparison,
    level: 'view' | 'edit' = 'view',
  ): Promise<void> {
    // Owner has full access
    if (comparison.ownerId === userId || comparison.createdById === userId) return;

    // Check shares
    const share = await this.shareRepo.findOne({
      where: { comparisonId: comparison.id, sharedWithUserId: userId },
    });

    if (share) {
      if (level === 'edit' && share.permissionLevel === TieBreakerSharePermission.VIEW) {
        throw new ForbiddenException('Edit access required');
      }
      return;
    }

    // Check team
    const teamUserIds = await this.getTeamUserIds(userId);
    if (teamUserIds.includes(comparison.createdById)) {
      if (level === 'edit') {
        throw new ForbiddenException('Cannot edit team member comparisons');
      }
      return;
    }

    throw new ForbiddenException('No access to this comparison');
  }

  private toSummaryDto(comparison: TieBreakerComparison): any {
    return {
      id: comparison.id,
      title: comparison.title,
      platform: comparison.platform,
      status: comparison.status,
      influencerCount: comparison.influencers?.length || 0,
      influencers: (comparison.influencers || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(inf => ({
          id: inf.id,
          influencerName: inf.influencerName,
          influencerUsername: inf.influencerUsername,
          platform: inf.platform,
          profilePictureUrl: inf.profilePictureUrl,
          followerCount: inf.followerCount,
          engagementRate: Number(inf.engagementRate),
        })),
      createdAt: comparison.createdAt,
      createdById: comparison.createdById,
      creditsUsed: Number(comparison.creditsUsed),
    };
  }

  private toDetailDto(comparison: TieBreakerComparison): TieBreakerComparisonDetailDto {
    return {
      id: comparison.id,
      title: comparison.title,
      platform: comparison.platform,
      status: comparison.status,
      searchQuery: comparison.searchQuery,
      influencers: (comparison.influencers || [])
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(inf => this.toInfluencerDto(inf)),
      isPublic: comparison.isPublic,
      shareUrl: comparison.shareUrlToken ? `/tie-breaker/shared/${comparison.shareUrlToken}` : undefined,
      creditsUsed: Number(comparison.creditsUsed),
      createdAt: comparison.createdAt,
      completedAt: comparison.completedAt,
      errorMessage: comparison.errorMessage,
      ownerId: comparison.ownerId,
      createdById: comparison.createdById,
    };
  }

  private toInfluencerDto(influencer: TieBreakerInfluencer): TieBreakerInfluencerDto {
    return {
      id: influencer.id,
      influencerProfileId: influencer.influencerProfileId,
      influencerName: influencer.influencerName,
      influencerUsername: influencer.influencerUsername,
      platform: influencer.platform,
      profilePictureUrl: influencer.profilePictureUrl,
      followerCount: Number(influencer.followerCount),
      followingCount: influencer.followingCount ? Number(influencer.followingCount) : undefined,
      avgLikes: Number(influencer.avgLikes),
      avgViews: Number(influencer.avgViews),
      avgComments: Number(influencer.avgComments),
      avgReelViews: influencer.avgReelViews ? Number(influencer.avgReelViews) : undefined,
      engagementRate: Number(influencer.engagementRate),
      isVerified: influencer.isVerified,
      followersAudience: {
        quality: influencer.audienceQuality ? Number(influencer.audienceQuality) : undefined,
        notablePct: influencer.notableFollowersPct ? Number(influencer.notableFollowersPct) : undefined,
        genderData: influencer.followersGenderData,
        ageData: influencer.followersAgeData,
        countries: influencer.followersCountries,
        cities: influencer.followersCities,
        interests: influencer.followersInterests,
      },
      engagersAudience: {
        quality: influencer.engagersQuality ? Number(influencer.engagersQuality) : undefined,
        notablePct: influencer.notableEngagersPct ? Number(influencer.notableEngagersPct) : undefined,
        genderData: influencer.engagersGenderData,
        ageData: influencer.engagersAgeData,
        countries: influencer.engagersCountries,
        cities: influencer.engagersCities,
        interests: influencer.engagersInterests,
      },
      topPosts: influencer.topPosts,
      displayOrder: influencer.displayOrder,
      wasUnlocked: influencer.wasUnlocked,
    };
  }
}
