import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { InfluencerInsight, SystemConfig, InsightAccessLog, InsightAccessType } from './entities';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService } from '../discovery/services/modash.service';
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
    private creditsService: CreditsService,
    private modashService: ModashService,
  ) {}

  /**
   * Get list of user's unlocked insights
   */
  async listInsights(
    userId: string,
    query: ListInsightsQueryDto,
  ): Promise<InsightListResponseDto> {
    const { platform, search, page = 1, limit = 20 } = query;

    const queryBuilder = this.insightsRepo
      .createQueryBuilder('insight')
      .where('insight.userId = :userId', { userId });

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
    const insight = await this.insightsRepo.findOne({
      where: { id: insightId, userId },
    });

    if (!insight) {
      throw new NotFoundException('Insight not found');
    }

    this.logAccess(insight.id, userId, InsightAccessType.VIEW, 0);
    return this.mapToFullResponse(insight);
  }

  /**
   * Force refresh insight (costs 1 credit)
   */
  async forceRefresh(
    userId: string,
    insightId: string,
  ): Promise<RefreshInsightResponseDto> {
    const insight = await this.insightsRepo.findOne({
      where: { id: insightId, userId },
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
      avgReelViews: profile.avgViews ? Math.floor(profile.avgViews * 1.5) : null, // Estimate reel views
      avgReelLikes: null,
      avgReelComments: null,
      brandPostER: null,
      locationCountry: profile.locationCountry || null,
      locationCity: profile.locationCity || null,
      isVerified: profile.isVerified || false,
      audienceCredibility: profile.audienceCredibility ? Number(profile.audienceCredibility) / 100 : 0.85,
      notableFollowersPct: Math.random() * 5 + 1, // 1-6%
      audienceData,
      engagementData,
      growthData,
      lookalikesData: { influencer: [], audience: [] },
      brandAffinityData: this.generateMockBrandAffinity(),
      interestsData: this.generateMockInterests(profile.category),
      hashtagsData: this.generateMockHashtags(profile.category),
      recentPosts: [],
      recentReels: [],
      popularPosts: [],
      sponsoredPosts: [],
      wordCloudData: null,
      creditsUsed: 1,
      unlockedAt: new Date(),
      lastRefreshedAt: new Date(),
      modashFetchedAt: null, // Not from Modash
    });

    return this.insightsRepo.save(insight);
  }

  /**
   * Generate mock audience data for local profiles
   */
  private generateMockAudienceData(profile: InfluencerProfile): any {
    return {
      genderSplit: { male: 35, female: 65 },
      ageGroups: [
        { range: '13-17', percentage: 8, male: 3, female: 5 },
        { range: '18-24', percentage: 35, male: 12, female: 23 },
        { range: '25-34', percentage: 38, male: 13, female: 25 },
        { range: '35-44', percentage: 12, male: 5, female: 7 },
        { range: '45-64', percentage: 5, male: 2, female: 3 },
        { range: '65+', percentage: 2, male: 0, female: 2 },
      ],
      topCountries: [
        { country: profile.locationCountry || 'United States', percentage: 45, followers: Math.floor((profile.followerCount || 0) * 0.45) },
        { country: 'India', percentage: 20, followers: Math.floor((profile.followerCount || 0) * 0.20) },
        { country: 'United Kingdom', percentage: 10, followers: Math.floor((profile.followerCount || 0) * 0.10) },
        { country: 'Brazil', percentage: 8, followers: Math.floor((profile.followerCount || 0) * 0.08) },
        { country: 'Germany', percentage: 5, followers: Math.floor((profile.followerCount || 0) * 0.05) },
      ],
      topCities: [
        { city: profile.locationCity || 'New York', percentage: 15, followers: Math.floor((profile.followerCount || 0) * 0.15) },
        { city: 'Los Angeles', percentage: 12, followers: Math.floor((profile.followerCount || 0) * 0.12) },
        { city: 'London', percentage: 8, followers: Math.floor((profile.followerCount || 0) * 0.08) },
      ],
      languages: [
        { language: 'English', percentage: 65 },
        { language: 'Spanish', percentage: 15 },
        { language: 'Portuguese', percentage: 10 },
      ],
      reachability: {
        below500: 55,
        '500to1000': 25,
        '1000to1500': 12,
        above1500: 8,
      },
    };
  }

  /**
   * Generate mock engagement data
   */
  private generateMockEngagementData(profile: InfluencerProfile): any {
    return {
      distribution: [
        { range: '0-1%', count: 5000 },
        { range: '1-2%', count: 15000 },
        { range: '2-3%', count: 25000 },
        { range: '3-4%', count: 30000 },
        { range: '4-5%', count: 18000 },
        { range: '5%+', count: 7000 },
      ],
      likesHistory: [],
      commentsHistory: [],
    };
  }

  /**
   * Generate mock growth data
   */
  private generateMockGrowthData(profile: InfluencerProfile): any {
    const currentFollowers = profile.followerCount || 100000;
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
    const history = months.map((month, i) => ({
      month,
      followers: Math.floor(currentFollowers * (0.85 + i * 0.03)),
      following: Math.floor((profile.followingCount || 500) * (0.95 + i * 0.01)),
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
        genderSplit: audience.genderSplit || audience.gender,
        ageGroups: audience.ageGroups || audience.ages,
        topCountries: audience.geoCountries || audience.countries,
        topCities: audience.geoCities || audience.cities,
        languages: audience.languages,
        interests: audience.interests,
        brandAffinity: audience.brandAffinity,
        reachability: audience.reachability,
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
        popular: [],
        sponsored: [],
      },
      lastRefreshedAt: insight.lastRefreshedAt,
      dataFreshnessStatus: this.daysBetween(insight.lastRefreshedAt, new Date()) <= 7
        ? 'FRESH'
        : 'STALE',
    };
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
