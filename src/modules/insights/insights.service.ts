import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { InfluencerInsight, SystemConfig, InsightAccessLog, InsightAccessType } from './entities';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService, ModashReportResponse } from '../discovery/services/modash.service';
import { PlatformType, ModuleType, ActionType } from '../../common/enums';
import {
  SearchInsightDto,
  ListInsightsQueryDto,
  InsightListResponseDto,
  SearchInsightResponseDto,
  RefreshInsightResponseDto,
  FullInsightResponseDto,
} from './dto';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly DEFAULT_CACHE_TTL_DAYS = 7;

  constructor(
    @InjectRepository(InfluencerInsight)
    private insightsRepo: Repository<InfluencerInsight>,
    @InjectRepository(SystemConfig)
    private configRepo: Repository<SystemConfig>,
    @InjectRepository(InsightAccessLog)
    private accessLogRepo: Repository<InsightAccessLog>,
    @InjectRepository(InfluencerProfile)
    private profilesRepo: Repository<InfluencerProfile>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private creditsService: CreditsService,
    private modashService: ModashService,
  ) {}

  /**
   * User IDs whose unlocked insights are visible to this user: self, parent (admin), and direct children.
   */
  private async getInsightVisibleUserIds(userId: string): Promise<string[]> {
    const ids = new Set<string>([userId]);
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return [userId];
    }
    if (user.parentId) {
      ids.add(user.parentId);
    }
    const children = await this.userRepo.find({
      where: { parentId: userId },
      select: ['id'],
    });
    for (const c of children) {
      ids.add(c.id);
    }
    return [...ids];
  }

  /**
   * Get list of user's unlocked insights
   */
  async listInsights(
    userId: string,
    query: ListInsightsQueryDto,
  ): Promise<InsightListResponseDto> {
    const { platform, search, page = 1, limit = 20 } = query;

    const visibleUserIds = await this.getInsightVisibleUserIds(userId);
    const queryBuilder = this.insightsRepo
      .createQueryBuilder('insight')
      .where('insight.userId IN (:...visibleUserIds)', { visibleUserIds });

    if (platform) {
      queryBuilder.andWhere('insight.platform = :platform', { platform });
    }

    if (search) {
      queryBuilder.andWhere(
        '(insight.username ILIKE :search OR insight.fullName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('insight.unlockedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [insights, total] = await queryBuilder.getManyAndCount();

    return {
      data: insights.map((i) => ({
        id: i.id,
        platform: i.platform,
        username: i.username,
        fullName: i.fullName || undefined,
        profilePictureUrl: i.profilePictureUrl || undefined,
        followerCount: Number(i.followerCount) || 0,
        engagementRate: i.engagementRate ? Number(i.engagementRate) : undefined,
        isVerified: i.isVerified,
        unlockedAt: i.unlockedAt,
        lastRefreshedAt: i.lastRefreshedAt,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Search and unlock a new insight or return cached
   */
  async searchAndUnlock(
    userId: string,
    dto: SearchInsightDto,
  ): Promise<SearchInsightResponseDto> {
    const { platform, username } = dto;

    // 1. Check if user already has this insight
    const existing = await this.insightsRepo.findOne({
      where: {
        userId,
        platform,
        username: ILike(username),
      },
    });

    if (existing) {
      // Check if data is fresh
      const isFresh = await this.isDataFresh(existing.lastRefreshedAt);

      if (isFresh) {
        // Return cached data, no credit charge
        this.logAccess(existing.id, userId, InsightAccessType.VIEW, 0);
        
        return {
          success: true,
          isNew: false,
          creditsUsed: 0,
          insight: this.mapToFullResponse(existing),
        };
      }

      // Data is stale, auto-refresh (free for already unlocked)
      // Only refresh from Modash if enabled, otherwise return existing data
      if (this.modashService.isModashEnabled()) {
        this.logger.log(`Auto-refreshing stale insight for ${username} on ${platform}`);
        const refreshed = await this.refreshFromModash(existing);
        this.logAccess(existing.id, userId, InsightAccessType.VIEW, 0);
        return {
          success: true,
          isNew: false,
          creditsUsed: 0,
          insight: this.mapToFullResponse(refreshed),
        };
      } else {
        // Modash disabled - return existing data as-is
        this.logger.log(`Modash disabled - returning existing insight for ${username}`);
        this.logAccess(existing.id, userId, InsightAccessType.VIEW, 0);
        return {
          success: true,
          isNew: false,
          creditsUsed: 0,
          insight: this.mapToFullResponse(existing),
        };
      }
    }

    // 2. New insight - check credits
    const creditBalance = await this.creditsService.getBalance(userId);
    if (creditBalance.unifiedBalance < 1) {
      throw new BadRequestException('Insufficient credits to unlock this insight');
    }

    // 3. Check if Modash is enabled
    if (this.modashService.isModashEnabled()) {
      // Fetch from Modash API
      this.logger.log(`Fetching new insight from Modash for ${username} on ${platform}`);
      const modashData = await this.modashService.getInfluencerReport(platform, username);

      if (!modashData || !modashData.profile) {
        throw new NotFoundException(`Influencer "${username}" not found on ${platform}`);
      }

      // Deduct credit
      const deductResult = await this.creditsService.deductCredits(userId, {
        actionType: ActionType.INFLUENCER_INSIGHT,
        module: ModuleType.INSIGHTS,
        quantity: 1,
        resourceId: `${platform}_${username}`,
        resourceType: 'INSIGHT_UNLOCK',
      });

      // Store insight from Modash data
      const insight = await this.createInsightFromModash(userId, platform, modashData);
      this.logAccess(insight.id, userId, InsightAccessType.UNLOCK, 1);

      return {
        success: true,
        isNew: true,
        creditsUsed: 1,
        remainingBalance: deductResult.remainingBalance,
        insight: this.mapToFullResponse(insight),
      };
    } else {
      // Modash disabled - fetch from local database (cached_influencer_profiles)
      this.logger.log(`Modash disabled - fetching from local DB for ${username} on ${platform}`);
      
      const localProfile = await this.profilesRepo.findOne({
        where: {
          platform,
          username: ILike(username),
        },
      });

      if (!localProfile) {
        throw new NotFoundException(`Influencer "${username}" not found in local database`);
      }

      // Deduct credit
      const deductResult = await this.creditsService.deductCredits(userId, {
        actionType: ActionType.INFLUENCER_INSIGHT,
        module: ModuleType.INSIGHTS,
        quantity: 1,
        resourceId: `${platform}_${username}`,
        resourceType: 'INSIGHT_UNLOCK',
      });

      // Create insight from local profile
      const insight = await this.createInsightFromLocalProfile(userId, localProfile);
      this.logAccess(insight.id, userId, InsightAccessType.UNLOCK, 1);

      return {
        success: true,
        isNew: true,
        creditsUsed: 1,
        remainingBalance: deductResult.remainingBalance,
        insight: this.mapToFullResponse(insight),
      };
    }
  }

  /**
   * Get full insight by ID
   */
  async getInsight(userId: string, insightId: string): Promise<FullInsightResponseDto> {
    const visibleUserIds = await this.getInsightVisibleUserIds(userId);
    const insight = await this.insightsRepo.findOne({
      where: { id: insightId, userId: In(visibleUserIds) },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    this.logAccess(insight.id, userId, InsightAccessType.VIEW, 0);
    return this.mapToFullResponse(insight);
  }

  /**
   * Resolve InfluencerInsight id for /insights/:id after discovery unlock.
   * Reuses existing row by profileId or (userId, platform, platformUserId), or creates one.
   */
  async ensureInsightRecordForDiscoveryProfile(
    userId: string,
    profile: InfluencerProfile,
    modashReport?: ModashReportResponse | null,
  ): Promise<string> {
    const visibleUserIds = await this.getInsightVisibleUserIds(userId);
    let insight = await this.insightsRepo.findOne({
      where: { profileId: profile.id, userId: In(visibleUserIds) },
    });
    if (insight) return insight.id;

    insight = await this.insightsRepo.findOne({
      where: {
        userId,
        platform: profile.platform,
        platformUserId: profile.platformUserId,
      },
    });
    if (insight) {
      if (!insight.profileId) {
        insight.profileId = profile.id;
        await this.insightsRepo.save(insight);
      }
      return insight.id;
    }

    if (this.modashService.isModashEnabled()) {
      const modashData =
        modashReport ??
        (await this.modashService.getInfluencerReport(
          profile.platform,
          profile.platformUserId,
          userId,
        ));
      if (modashData?.profile) {
        const created = await this.createInsightFromModash(userId, profile.platform, modashData);
        created.profileId = profile.id;
        await this.insightsRepo.save(created);
        return created.id;
      }
    }

    const created = await this.createInsightFromLocalProfile(userId, profile);
    return created.id;
  }

  /** Load profile and ensure an insight row exists; used by discovery insights-check. */
  async findOrEnsureInsightIdForProfile(
    userId: string,
    profileId: string,
  ): Promise<string | null> {
    const profile = await this.profilesRepo.findOne({ where: { id: profileId } });
    if (!profile) return null;
    return this.ensureInsightRecordForDiscoveryProfile(userId, profile);
  }

  /**
   * Force refresh insight (costs 1 credit)
   */
  async forceRefresh(
    userId: string,
    insightId: string,
  ): Promise<RefreshInsightResponseDto> {
    const visibleUserIds = await this.getInsightVisibleUserIds(userId);
    const insight = await this.insightsRepo.findOne({
      where: { id: insightId, userId: In(visibleUserIds) },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    // If Modash is disabled, just return existing data (no charge)
    if (!this.modashService.isModashEnabled()) {
      this.logger.log('Modash disabled - refresh not available, returning existing data');
      return {
        success: true,
        creditsUsed: 0,
        remainingBalance: (await this.creditsService.getBalance(userId)).unifiedBalance,
        insight: this.mapToFullResponse(insight),
      };
    }

    // Check credits
    const creditBalance = await this.creditsService.getBalance(userId);
    if (creditBalance.unifiedBalance < 1) {
      throw new BadRequestException('Insufficient credits to refresh insight');
    }

    // Deduct credit for manual refresh
    const deductResult = await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_REFRESH,
      module: ModuleType.INSIGHTS,
      quantity: 1,
      resourceId: insight.id,
      resourceType: 'INSIGHT_REFRESH',
    });

    // Fetch fresh data
    const refreshed = await this.refreshFromModash(insight);
    this.logAccess(insight.id, userId, InsightAccessType.REFRESH, 1);

    return {
      success: true,
      creditsUsed: 1,
      remainingBalance: deductResult.remainingBalance,
      insight: this.mapToFullResponse(refreshed),
    };
  }

  /**
   * Get cache TTL from system config
   */
  async getCacheTTLDays(): Promise<number> {
    const config = await this.configRepo.findOne({
      where: { configKey: 'INSIGHT_CACHE_TTL_DAYS', isActive: true },
    });

    return config ? parseInt(config.configValue, 10) : this.DEFAULT_CACHE_TTL_DAYS;
  }

  /**
   * Check if insight data is fresh based on configurable TTL
   */
  private async isDataFresh(lastRefreshedAt: Date): Promise<boolean> {
    const ttlDays = await this.getCacheTTLDays();
    const daysSinceRefresh = this.daysBetween(lastRefreshedAt, new Date());

    this.logger.debug(
      `Data freshness check: ${daysSinceRefresh} days since refresh, TTL is ${ttlDays} days`,
    );

    return daysSinceRefresh <= ttlDays;
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Refresh insight data from Modash
   */
  private async refreshFromModash(
    insight: InfluencerInsight,
  ): Promise<InfluencerInsight> {
    const modashData = await this.modashService.getInfluencerReport(
      insight.platform,
      insight.platformUserId || insight.username,
    );

    if (!modashData || !modashData.profile) {
      // If Modash fails, return existing data
      this.logger.warn(`Failed to refresh insight for ${insight.username}`);
      return insight;
    }

    // Update insight with fresh data
    return this.updateInsightFromModash(insight, modashData);
  }

  /**
   * Create new insight record from Modash data
   */
  private async createInsightFromModash(
    userId: string,
    platform: PlatformType,
    modashData: any,
  ): Promise<InfluencerInsight> {
    const profile = modashData.profile || {};
    const stats = modashData.stats || {};
    const audience = modashData.audience || {};

    const insight = this.insightsRepo.create({
      userId,
      platform,
      platformUserId: profile.userId || profile.username,
      username: profile.username || '',
      fullName: profile.fullName || null,
      profilePictureUrl: profile.picture || profile.profilePictureUrl || null,
      bio: profile.bio || profile.description || null,
      followerCount: profile.followers || 0,
      followingCount: profile.following || 0,
      postCount: profile.postsCount || stats.postsCount || 0,
      engagementRate: stats.engagementRate || null,
      avgLikes: stats.avgLikes || null,
      avgComments: stats.avgComments || null,
      avgViews: stats.avgViews || null,
      avgReelViews: stats.avgReelsPlays || stats.avgReelViews || null,
      avgReelLikes: stats.avgReelLikes || null,
      avgReelComments: stats.avgReelComments || null,
      brandPostER: stats.paidPostPerformance || null,
      locationCountry: profile.country || profile.location?.country || null,
      locationCity: profile.city || profile.location?.city || null,
      isVerified: profile.isVerified || false,
      audienceCredibility: audience.credibility || null,
      notableFollowersPct: audience.notableFollowers || null,
      audienceData: audience,
      engagementData: {
        distribution: stats.engagementDistribution,
        likesHistory: stats.likesHistory,
        commentsHistory: stats.commentsHistory,
      },
      growthData: {
        history: stats.followersHistory || modashData.growth,
      },
      lookalikesData: {
        influencer: modashData.lookalikes?.influencer,
        audience: modashData.lookalikes?.audience,
      },
      brandAffinityData: modashData.brandAffinity || audience.brandAffinity,
      interestsData: modashData.interests || audience.interests,
      hashtagsData: stats.hashtags,
      recentPosts: modashData.recentPosts || modashData.posts?.recent,
      recentReels: modashData.recentReels || modashData.reels?.recent,
      popularReels: modashData.popularReels || modashData.reels?.popular,
      popularPosts: modashData.popularPosts || modashData.posts?.popular,
      sponsoredPosts: modashData.sponsoredPosts || modashData.posts?.sponsored,
      wordCloudData: modashData.wordCloud,
      creditsUsed: 1,
      unlockedAt: new Date(),
      lastRefreshedAt: new Date(),
      modashFetchedAt: new Date(),
    });

    return this.insightsRepo.save(insight);
  }

  /**
   * Create new insight record from local cached_influencer_profiles
   */
  private async createInsightFromLocalProfile(
    userId: string,
    profile: InfluencerProfile,
  ): Promise<InfluencerInsight> {
    // Generate mock audience data based on profile
    const audienceData = this.generateMockAudienceData(profile);
    const engagementData = this.generateMockEngagementData(profile);
    const growthData = this.generateMockGrowthData(profile);

    const avgLikes = profile.avgLikes || 5000;
    const avgComments = profile.avgComments || 200;
    const avgViews = profile.avgViews || 15000;

    const uname = profile.username ?? '';
    const mockPosts = this.generateMockPosts(uname, avgLikes, avgComments);
    const mockReels = this.generateMockReels(uname, avgViews, avgLikes, avgComments);
    const wordCloud = this.generateMockWordCloud(profile.category);
    const lookalikes = this.generateMockLookalikes(profile.followerCount || 100000);

    const insight = this.insightsRepo.create({
      userId: userId,
      platform: profile.platform,
      profileId: profile.id,
      platformUserId: profile.platformUserId || profile.username || '',
      username: profile.username || '',
      fullName: profile.fullName || null,
      profilePictureUrl: profile.profilePictureUrl || null,
      bio: profile.biography || null,
      followerCount: profile.followerCount || 0,
      followingCount: profile.followingCount || 0,
      postCount: profile.postCount || 0,
      engagementRate: profile.engagementRate || null,
      avgLikes: profile.avgLikes || null,
      avgComments: profile.avgComments || null,
      avgViews: profile.avgViews || null,
      avgReelViews: avgViews ? Math.floor(avgViews * 1.5) : null,
      avgReelLikes: Math.floor(avgLikes * 0.8),
      avgReelComments: Math.floor(avgComments * 0.6),
      brandPostER: profile.engagementRate ? Number(profile.engagementRate) * 0.7 : null,
      postsWithHiddenLikesPct: Math.floor(Math.random() * 15),
      locationCountry: profile.locationCountry || null,
      locationCity: profile.locationCity || null,
      isVerified: profile.isVerified || false,
      audienceCredibility: profile.audienceCredibility ? Number(profile.audienceCredibility) / 100 : 0.85,
      notableFollowersPct: Math.random() * 5 + 1,
      engagerCredibility: (profile.audienceCredibility ? Number(profile.audienceCredibility) / 100 : 0.85) + 0.05,
      notableEngagersPct: Math.random() * 4 + 2,
      audienceData,
      engagementData,
      growthData,
      lookalikesData: lookalikes,
      brandAffinityData: this.generateMockBrandAffinity(),
      interestsData: this.generateMockInterests(profile.category),
      hashtagsData: this.generateMockHashtags(profile.category),
      recentPosts: mockPosts.recent,
      recentReels: mockReels.recent,
      popularReels: mockReels.popular,
      popularPosts: mockPosts.popular,
      sponsoredPosts: mockPosts.sponsored,
      wordCloudData: wordCloud,
      creditsUsed: 1,
      unlockedAt: new Date(),
      lastRefreshedAt: new Date(),
      modashFetchedAt: null,
    });

    return this.insightsRepo.save(insight);
  }

  /**
   * Generate mock audience data for local profiles (followers + engagers)
   */
  private generateMockAudienceData(profile: InfluencerProfile): any {
    const fc = profile.followerCount || 100000;
    const topCountries = [
      { country: profile.locationCountry || 'United States', percentage: 45, followers: Math.floor(fc * 0.45), engagements: Math.floor(fc * 0.45 * 0.03) },
      { country: 'India', percentage: 20, followers: Math.floor(fc * 0.20), engagements: Math.floor(fc * 0.20 * 0.03) },
      { country: 'United Kingdom', percentage: 10, followers: Math.floor(fc * 0.10), engagements: Math.floor(fc * 0.10 * 0.03) },
      { country: 'Brazil', percentage: 8, followers: Math.floor(fc * 0.08), engagements: Math.floor(fc * 0.08 * 0.03) },
      { country: 'Germany', percentage: 5, followers: Math.floor(fc * 0.05), engagements: Math.floor(fc * 0.05 * 0.03) },
    ];
    const topStates = [
      { state: 'California', percentage: 18, followers: Math.floor(fc * 0.18), engagements: Math.floor(fc * 0.18 * 0.03) },
      { state: 'Maharashtra', percentage: 12, followers: Math.floor(fc * 0.12), engagements: Math.floor(fc * 0.12 * 0.03) },
      { state: 'Texas', percentage: 9, followers: Math.floor(fc * 0.09), engagements: Math.floor(fc * 0.09 * 0.03) },
      { state: 'London', percentage: 7, followers: Math.floor(fc * 0.07), engagements: Math.floor(fc * 0.07 * 0.03) },
      { state: 'São Paulo', percentage: 5, followers: Math.floor(fc * 0.05), engagements: Math.floor(fc * 0.05 * 0.03) },
    ];
    const topCities = [
      { city: profile.locationCity || 'New York', percentage: 15, followers: Math.floor(fc * 0.15), likes: Math.floor(fc * 0.15 * 0.02), lat: 40.71, lng: -74.01 },
      { city: 'Los Angeles', percentage: 12, followers: Math.floor(fc * 0.12), likes: Math.floor(fc * 0.12 * 0.02), lat: 34.05, lng: -118.24 },
      { city: 'London', percentage: 8, followers: Math.floor(fc * 0.08), likes: Math.floor(fc * 0.08 * 0.02), lat: 51.51, lng: -0.13 },
      { city: 'Mumbai', percentage: 6, followers: Math.floor(fc * 0.06), likes: Math.floor(fc * 0.06 * 0.02), lat: 19.08, lng: 72.88 },
      { city: 'São Paulo', percentage: 4, followers: Math.floor(fc * 0.04), likes: Math.floor(fc * 0.04 * 0.02), lat: -23.55, lng: -46.63 },
    ];
    const ageGroups = [
      { range: '13-17', percentage: 8, male: 3, female: 5 },
      { range: '18-24', percentage: 35, male: 12, female: 23 },
      { range: '25-34', percentage: 38, male: 13, female: 25 },
      { range: '35-44', percentage: 12, male: 5, female: 7 },
      { range: '45-64', percentage: 5, male: 2, female: 3 },
      { range: '65+', percentage: 2, male: 0, female: 2 },
    ];
    const audienceTypes = [
      { type: 'Real Followers', percentage: 62 },
      { type: 'Influencers', percentage: 12 },
      { type: 'Mass Followers', percentage: 18 },
      { type: 'Suspicious', percentage: 8 },
    ];
    const notableFollowers = [
      { username: 'creator_jane', fullName: 'Jane Creator', followers: 125000, engagements: 4500, profilePictureUrl: null },
      { username: 'lifestyle_mike', fullName: 'Mike Lifestyle', followers: 98000, engagements: 3200, profilePictureUrl: null },
      { username: 'travel_sara', fullName: 'Sara Travels', followers: 75000, engagements: 2800, profilePictureUrl: null },
      { username: 'food_blogger_k', fullName: 'Kay Food', followers: 52000, engagements: 1900, profilePictureUrl: null },
      { username: 'fashion_lee', fullName: 'Lee Fashion', followers: 45000, engagements: 1600, profilePictureUrl: null },
    ];
    const brandAffinity = [
      { brand: 'Nike', percentage: 12.5, followers: Math.floor(fc * 0.125), likes: Math.floor(fc * 0.125 * 0.02), followersAffinity: 3.2, engagersAffinity: 2.8 },
      { brand: 'Adidas', percentage: 9.8, followers: Math.floor(fc * 0.098), likes: Math.floor(fc * 0.098 * 0.02), followersAffinity: 2.5, engagersAffinity: 2.1 },
      { brand: 'Apple', percentage: 8.2, followers: Math.floor(fc * 0.082), likes: Math.floor(fc * 0.082 * 0.02), followersAffinity: 2.1, engagersAffinity: 1.9 },
      { brand: 'Samsung', percentage: 6.5, followers: Math.floor(fc * 0.065), likes: Math.floor(fc * 0.065 * 0.02), followersAffinity: 1.7, engagersAffinity: 1.5 },
      { brand: 'Starbucks', percentage: 5.1, followers: Math.floor(fc * 0.051), likes: Math.floor(fc * 0.051 * 0.02), followersAffinity: 1.3, engagersAffinity: 1.2 },
      { brand: 'Zara', percentage: 4.3, followers: Math.floor(fc * 0.043), likes: Math.floor(fc * 0.043 * 0.02), followersAffinity: 1.1, engagersAffinity: 0.9 },
      { brand: 'H&M', percentage: 3.8, followers: Math.floor(fc * 0.038), likes: Math.floor(fc * 0.038 * 0.02), followersAffinity: 1.0, engagersAffinity: 0.8 },
    ];
    const interests = [
      { category: 'Clothes, Shoes, Handbags & Accessories', percentage: 35, followers: Math.floor(fc * 0.35), likes: Math.floor(fc * 0.35 * 0.02), followersAffinity: 2.8, engagersAffinity: 2.5 },
      { category: 'Television & Films', percentage: 28, followers: Math.floor(fc * 0.28), likes: Math.floor(fc * 0.28 * 0.02), followersAffinity: 2.2, engagersAffinity: 2.0 },
      { category: 'Travel, Tourism & Aviation', percentage: 22, followers: Math.floor(fc * 0.22), likes: Math.floor(fc * 0.22 * 0.02), followersAffinity: 1.8, engagersAffinity: 1.6 },
      { category: 'Fitness & Yoga', percentage: 18, followers: Math.floor(fc * 0.18), likes: Math.floor(fc * 0.18 * 0.02), followersAffinity: 1.5, engagersAffinity: 1.3 },
      { category: 'Restaurant, Food & Grocery', percentage: 15, followers: Math.floor(fc * 0.15), likes: Math.floor(fc * 0.15 * 0.02), followersAffinity: 1.2, engagersAffinity: 1.1 },
      { category: 'Beauty & Cosmetics', percentage: 12, followers: Math.floor(fc * 0.12), likes: Math.floor(fc * 0.12 * 0.02), followersAffinity: 1.0, engagersAffinity: 0.9 },
      { category: 'Music', percentage: 10, followers: Math.floor(fc * 0.10), likes: Math.floor(fc * 0.10 * 0.02), followersAffinity: 0.8, engagersAffinity: 0.7 },
    ];
    const credibilityDistribution = [
      { range: '0-20%', count: 800 },
      { range: '20-40%', count: 3200 },
      { range: '40-60%', count: 8500 },
      { range: '60-80%', count: 25000 },
      { range: '80-100%', count: 45000 },
    ];

    return {
      followers: {
        credibility: profile.audienceCredibility ? Number(profile.audienceCredibility) / 100 : 0.85,
        notableFollowersPct: Math.random() * 5 + 1,
        genderSplit: { male: 35, female: 65 },
        ageGroups,
        topCountries,
        topStates,
        topCities,
        audienceTypes,
        notableFollowers,
        brandAffinity,
        interests,
        credibilityDistribution,
        languages: [
          { language: 'English', percentage: 65 },
          { language: 'Spanish', percentage: 15 },
          { language: 'Portuguese', percentage: 10 },
        ],
        reachability: { below500: 55, '500to1000': 25, '1000to1500': 12, above1500: 8 },
      },
      engagers: {
        credibility: (profile.audienceCredibility ? Number(profile.audienceCredibility) / 100 : 0.85) + 0.05,
        notableEngagersPct: Math.random() * 4 + 2,
        genderSplit: { male: 40, female: 60 },
        ageGroups: [
          { range: '13-17', percentage: 10, male: 4, female: 6 },
          { range: '18-24', percentage: 38, male: 15, female: 23 },
          { range: '25-34', percentage: 33, male: 13, female: 20 },
          { range: '35-44', percentage: 12, male: 5, female: 7 },
          { range: '45-64', percentage: 5, male: 2, female: 3 },
          { range: '65+', percentage: 2, male: 1, female: 1 },
        ],
        topCountries: topCountries.map(c => ({ ...c, followers: Math.floor(c.followers * 0.4) })),
        topStates: topStates.map(s => ({ ...s, followers: Math.floor(s.followers * 0.4) })),
        topCities: topCities.map(c => ({ ...c, followers: Math.floor(c.followers * 0.4) })),
        audienceTypes: [
          { type: 'Real Followers', percentage: 72 },
          { type: 'Influencers', percentage: 15 },
          { type: 'Mass Followers', percentage: 9 },
          { type: 'Suspicious', percentage: 4 },
        ],
        notableEngagers: notableFollowers.slice(0, 3).map(f => ({ ...f, username: 'eng_' + f.username })),
        brandAffinity: brandAffinity.map(b => ({ ...b, percentage: b.percentage * 0.9 })),
        interests: interests.map(i => ({ ...i, percentage: i.percentage * 0.95 })),
        credibilityDistribution: credibilityDistribution.map(d => ({ ...d, count: Math.floor(d.count * 0.4) })),
        languages: [
          { language: 'English', percentage: 70 },
          { language: 'Spanish', percentage: 12 },
          { language: 'Portuguese', percentage: 8 },
        ],
        reachability: { below500: 60, '500to1000': 22, '1000to1500': 10, above1500: 8 },
      },
      genderSplit: { male: 35, female: 65 },
      ageGroups,
      topCountries,
      topCities,
      languages: [
        { language: 'English', percentage: 65 },
        { language: 'Spanish', percentage: 15 },
        { language: 'Portuguese', percentage: 10 },
      ],
      interests,
      brandAffinity,
      reachability: { below500: 55, '500to1000': 25, '1000to1500': 12, above1500: 8 },
    };
  }

  /**
   * Generate mock engagement data with likes/comments history for spread charts
   */
  private generateMockEngagementData(profile: InfluencerProfile): any {
    const avgLikes = profile.avgLikes || 5000;
    const avgComments = profile.avgComments || 200;
    const now = new Date();

    const likesHistory = Array.from({ length: 150 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (150 - i) * 2);
      return {
        date: d.toISOString().split('T')[0],
        likes: Math.floor(avgLikes * (0.5 + Math.random())),
        postUrl: `https://www.instagram.com/p/mock_${i}/`,
      };
    });
    const commentsHistory = Array.from({ length: 150 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (150 - i) * 2);
      return {
        date: d.toISOString().split('T')[0],
        comments: Math.floor(avgComments * (0.3 + Math.random() * 1.4)),
        postUrl: `https://www.instagram.com/p/mock_${i}/`,
      };
    });

    return {
      distribution: [
        { range: '0-1%', count: 5000 },
        { range: '1-2%', count: 15000 },
        { range: '2-3%', count: 25000 },
        { range: '3-4%', count: 30000 },
        { range: '4-5%', count: 18000 },
        { range: '5%+', count: 7000 },
      ],
      likesHistory,
      commentsHistory,
    };
  }

  /**
   * Generate mock growth data with followers, following, and likes
   */
  private generateMockGrowthData(profile: InfluencerProfile): any {
    const currentFollowers = profile.followerCount || 100000;
    const currentFollowing = profile.followingCount || 500;
    const avgLikes = profile.avgLikes || 5000;
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const history = months.map((month, i) => ({
      month,
      followers: Math.floor(currentFollowers * (0.85 + i * 0.03)),
      following: Math.floor(currentFollowing * (0.95 + i * 0.01)),
      likes: Math.floor(avgLikes * (0.8 + i * 0.04)),
    }));
    return { history };
  }

  /**
   * Generate mock brand affinity
   */
  private generateMockBrandAffinity(): any[] {
    return [
      { brand: 'Nike', percentage: 12.5 },
      { brand: 'Adidas', percentage: 9.8 },
      { brand: 'Apple', percentage: 8.2 },
      { brand: 'Samsung', percentage: 6.5 },
      { brand: 'Starbucks', percentage: 5.1 },
    ];
  }

  /**
   * Generate mock interests based on category
   */
  private generateMockInterests(category: string | null): any[] {
    const baseInterests = [
      { category: 'Fashion', percentage: 35 },
      { category: 'Entertainment', percentage: 28 },
      { category: 'Travel', percentage: 22 },
      { category: 'Fitness', percentage: 18 },
      { category: 'Food', percentage: 15 },
    ];
    
    if (category) {
      baseInterests.unshift({ category, percentage: 45 });
    }
    
    return baseInterests.slice(0, 5);
  }

  /**
   * Generate mock hashtags based on category
   */
  private generateMockHashtags(category: string | null): any[] {
    const hashtags = [
      { tag: '#lifestyle', usagePercentage: 35, count: 420 },
      { tag: '#instagood', usagePercentage: 28, count: 336 },
      { tag: '#photooftheday', usagePercentage: 22, count: 264 },
      { tag: '#fashion', usagePercentage: 18, count: 216 },
      { tag: '#love', usagePercentage: 15, count: 180 },
    ];
    
    if (category) {
      hashtags.unshift({ tag: `#${category.toLowerCase().replace(/\s+/g, '')}`, usagePercentage: 45, count: 540 });
    }
    
    return hashtags.slice(0, 5);
  }

  private generateMockWordCloud(category: string | null): any[] {
    const words = [
      'love', 'fashion', 'style', 'beauty', 'travel', 'life', 'food',
      'fitness', 'happy', 'photography', 'nature', 'art', 'music',
      'dance', 'wellness', 'luxury', 'model', 'creative', 'inspiration',
      'trending', 'viral', 'brand', 'collab', 'influencer', 'content',
    ];
    if (category) words.unshift(category.toLowerCase());
    return words.slice(0, 20).map((word, i) => ({
      text: word,
      value: Math.floor(100 - i * 4 + Math.random() * 10),
    }));
  }

  private generateMockLookalikes(followerCount: number): any {
    return {
      influencer: [
        { username: 'similar_creator_1', fullName: 'Alex Style', followers: Math.floor(followerCount * 0.9), similarity: 0.92, profilePictureUrl: null },
        { username: 'similar_creator_2', fullName: 'Jordan Arts', followers: Math.floor(followerCount * 1.1), similarity: 0.87, profilePictureUrl: null },
        { username: 'similar_creator_3', fullName: 'Sam Lifestyle', followers: Math.floor(followerCount * 0.75), similarity: 0.83, profilePictureUrl: null },
        { username: 'similar_creator_4', fullName: 'Riley Content', followers: Math.floor(followerCount * 1.3), similarity: 0.78, profilePictureUrl: null },
        { username: 'similar_creator_5', fullName: 'Casey Digital', followers: Math.floor(followerCount * 0.65), similarity: 0.74, profilePictureUrl: null },
      ],
      audience: [
        { username: 'audience_match_1', fullName: 'Taylor Buzz', followers: Math.floor(followerCount * 0.8), overlap: 0.45, profilePictureUrl: null },
        { username: 'audience_match_2', fullName: 'Morgan Vibe', followers: Math.floor(followerCount * 1.2), overlap: 0.38, profilePictureUrl: null },
        { username: 'audience_match_3', fullName: 'Quinn Wave', followers: Math.floor(followerCount * 0.6), overlap: 0.32, profilePictureUrl: null },
        { username: 'audience_match_4', fullName: 'Blake Trends', followers: Math.floor(followerCount * 0.95), overlap: 0.28, profilePictureUrl: null },
        { username: 'audience_match_5', fullName: 'Drew Social', followers: Math.floor(followerCount * 1.05), overlap: 0.24, profilePictureUrl: null },
      ],
    };
  }

  private generateMockPosts(username: string, avgLikes: number, avgComments: number): { recent: any[]; popular: any[]; sponsored: any[] } {
    const now = new Date();
    const makePosts = (count: number, multiplier: number, offset: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `post_${offset}_${i}`,
        imageUrl: `https://picsum.photos/seed/${username}${offset}${i}/400/400`,
        thumbnail: `https://picsum.photos/seed/${username}${offset}${i}/200/200`,
        caption: `Amazing content from @${username} #lifestyle #trending`,
        likes: Math.floor(avgLikes * multiplier * (0.7 + Math.random() * 0.6)),
        comments: Math.floor(avgComments * multiplier * (0.5 + Math.random())),
        views: 0,
        postedAt: new Date(now.getTime() - (i + offset) * 86400000 * 3).toISOString().split('T')[0],
        url: `https://www.instagram.com/p/mock_${offset}_${i}/`,
      }));

    return {
      recent: makePosts(10, 1, 0),
      popular: makePosts(10, 2, 10).sort((a, b) => b.likes - a.likes),
      sponsored: makePosts(5, 0.8, 20).map(p => ({
        ...p,
        caption: `Sponsored post with @brand_partner #ad #sponsored`,
      })),
    };
  }

  private generateMockReels(username: string, avgViews: number, avgLikes: number, avgComments: number): { recent: any[]; popular: any[] } {
    const now = new Date();
    const makeReels = (count: number, multiplier: number, offset: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `reel_${offset}_${i}`,
        thumbnail: `https://picsum.photos/seed/${username}r${offset}${i}/300/500`,
        caption: `Reel by @${username} #reels #viral`,
        likes: Math.floor(avgLikes * multiplier * (0.6 + Math.random() * 0.8)),
        comments: Math.floor(avgComments * multiplier * (0.4 + Math.random())),
        views: Math.floor(avgViews * multiplier * (0.8 + Math.random() * 0.4)),
        postedAt: new Date(now.getTime() - (i + offset) * 86400000 * 4).toISOString().split('T')[0],
        url: `https://www.instagram.com/reel/mock_${offset}_${i}/`,
      }));

    return {
      recent: makeReels(10, 1, 0),
      popular: makeReels(10, 1.8, 10).sort((a, b) => b.views - a.views),
    };
  }

  /**
   * Update existing insight with fresh Modash data
   */
  private async updateInsightFromModash(
    insight: InfluencerInsight,
    modashData: any,
  ): Promise<InfluencerInsight> {
    const profile = modashData.profile || {};
    const stats = modashData.stats || {};
    const audience = modashData.audience || {};

    insight.fullName = profile.fullName || insight.fullName;
    insight.profilePictureUrl = profile.picture || insight.profilePictureUrl;
    insight.bio = profile.bio || insight.bio;
    insight.followerCount = profile.followers || insight.followerCount;
    insight.followingCount = profile.following || insight.followingCount;
    insight.postCount = profile.postsCount || insight.postCount;
    insight.engagementRate = stats.engagementRate || insight.engagementRate;
    insight.avgLikes = stats.avgLikes || insight.avgLikes;
    insight.avgComments = stats.avgComments || insight.avgComments;
    insight.avgViews = stats.avgViews || insight.avgViews;
    insight.avgReelViews = stats.avgReelsPlays || insight.avgReelViews;
    insight.isVerified = profile.isVerified ?? insight.isVerified;
    insight.audienceCredibility = audience.credibility || insight.audienceCredibility;
    insight.audienceData = audience;
    insight.engagementData = {
      distribution: stats.engagementDistribution,
      likesHistory: stats.likesHistory,
      commentsHistory: stats.commentsHistory,
    };
    insight.growthData = { history: stats.followersHistory || modashData.growth };
    insight.lookalikesData = modashData.lookalikes || insight.lookalikesData;
    insight.brandAffinityData = modashData.brandAffinity || insight.brandAffinityData;
    insight.interestsData = modashData.interests || insight.interestsData;
    insight.hashtagsData = stats.hashtags || insight.hashtagsData;
    insight.recentPosts = modashData.recentPosts || insight.recentPosts;
    insight.recentReels = modashData.recentReels || insight.recentReels;
    insight.popularReels = modashData.popularReels || insight.popularReels;
    insight.popularPosts = modashData.popularPosts || insight.popularPosts;
    insight.sponsoredPosts = modashData.sponsoredPosts || insight.sponsoredPosts;
    insight.lastRefreshedAt = new Date();
    insight.modashFetchedAt = new Date();

    return this.insightsRepo.save(insight);
  }

  /**
   * Map entity to full response DTO
   */
  private mapToFullResponse(insight: InfluencerInsight): FullInsightResponseDto {
    const audience = insight.audienceData || {};
    const engagement = insight.engagementData || {};
    const growth = insight.growthData || {};
    const lookalikes = insight.lookalikesData || {};

    const followersData = audience.followers || {};
    const engagersData = audience.engagers || {};

    return {
      id: insight.id,
      platform: insight.platform,
      username: insight.username,
      fullName: insight.fullName || undefined,
      profilePictureUrl: insight.profilePictureUrl || undefined,
      bio: insight.bio || undefined,
      isVerified: insight.isVerified,
      locationCountry: insight.locationCountry || undefined,
      stats: {
        followerCount: Number(insight.followerCount) || 0,
        followingCount: Number(insight.followingCount) || 0,
        postCount: insight.postCount || 0,
        engagementRate: insight.engagementRate ? Number(insight.engagementRate) : undefined,
        avgLikes: insight.avgLikes ? Number(insight.avgLikes) : undefined,
        avgComments: insight.avgComments ? Number(insight.avgComments) : undefined,
        avgViews: insight.avgViews ? Number(insight.avgViews) : undefined,
        avgReelViews: insight.avgReelViews ? Number(insight.avgReelViews) : undefined,
        avgReelLikes: insight.avgReelLikes ? Number(insight.avgReelLikes) : undefined,
        avgReelComments: insight.avgReelComments ? Number(insight.avgReelComments) : undefined,
        brandPostER: insight.brandPostER ? Number(insight.brandPostER) : undefined,
        postsWithHiddenLikesPct: insight.postsWithHiddenLikesPct
          ? Number(insight.postsWithHiddenLikesPct)
          : undefined,
      },
      audience: {
        credibility: insight.audienceCredibility ? Number(insight.audienceCredibility) : undefined,
        notableFollowersPct: insight.notableFollowersPct
          ? Number(insight.notableFollowersPct)
          : undefined,
        genderSplit: followersData.genderSplit || audience.genderSplit || audience.gender,
        ageGroups: followersData.ageGroups || audience.ageGroups || audience.ages,
        topCountries: followersData.topCountries || audience.geoCountries || audience.topCountries || audience.countries,
        topStates: followersData.topStates || audience.topStates,
        topCities: followersData.topCities || audience.geoCities || audience.topCities || audience.cities,
        audienceTypes: followersData.audienceTypes || audience.audienceTypes,
        notableFollowers: followersData.notableFollowers || audience.notableFollowers,
        credibilityDistribution: followersData.credibilityDistribution || audience.credibilityDistribution,
        languages: followersData.languages || audience.languages,
        interests: followersData.interests || audience.interests,
        brandAffinity: followersData.brandAffinity || audience.brandAffinity,
        reachability: followersData.reachability || audience.reachability,
        engagers: {
          credibility: insight.engagerCredibility ? Number(insight.engagerCredibility) : engagersData.credibility,
          notableEngagersPct: insight.notableEngagersPct ? Number(insight.notableEngagersPct) : engagersData.notableEngagersPct,
          genderSplit: engagersData.genderSplit,
          ageGroups: engagersData.ageGroups,
          topCountries: engagersData.topCountries,
          topStates: engagersData.topStates,
          topCities: engagersData.topCities,
          audienceTypes: engagersData.audienceTypes,
          notableEngagers: engagersData.notableEngagers,
          credibilityDistribution: engagersData.credibilityDistribution,
          languages: engagersData.languages,
          interests: engagersData.interests,
          brandAffinity: engagersData.brandAffinity,
          reachability: engagersData.reachability,
        },
      },
      engagement: {
        rateDistribution: engagement.distribution,
        likesSpread: engagement.likesHistory,
        commentsSpread: engagement.commentsHistory,
        topHashtags: insight.hashtagsData,
      },
      growth: {
        last6Months: growth.history,
      },
      lookalikes: {
        influencer: lookalikes.influencer,
        audience: lookalikes.audience,
      },
      brandAffinity: insight.brandAffinityData,
      interests: insight.interestsData,
      wordCloud: insight.wordCloudData,
      posts: {
        recent: insight.recentPosts || [],
        popular: insight.popularPosts || [],
        sponsored: insight.sponsoredPosts || [],
      },
      reels: {
        recent: insight.recentReels || [],
        popular: insight.popularReels || (insight.recentReels ? [...insight.recentReels].sort((a: any, b: any) => (b.views || 0) - (a.views || 0)).slice(0, 10) : []),
        sponsored: [],
      },
      lastRefreshedAt: insight.lastRefreshedAt,
      dataFreshnessStatus: this.daysBetween(insight.lastRefreshedAt, new Date()) <= 7
        ? 'FRESH'
        : 'STALE',
    } as any;
  }

  /**
   * Log insight access
   */
  private async logAccess(
    insightId: string,
    userId: string,
    accessType: InsightAccessType,
    creditsDeducted: number,
  ): Promise<void> {
    try {
      await this.accessLogRepo.save({
        insightId,
        userId,
        accessType,
        creditsDeducted,
      });
    } catch (error) {
      this.logger.error(`Failed to log insight access: ${error.message}`);
    }
  }
}
