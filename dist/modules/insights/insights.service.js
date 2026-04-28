"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var InsightsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("./entities");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const modash_service_1 = require("../discovery/services/modash.service");
const enums_1 = require("../../common/enums");
let InsightsService = InsightsService_1 = class InsightsService {
    constructor(insightsRepo, configRepo, accessLogRepo, profilesRepo, userRepo, creditsService, modashService) {
        this.insightsRepo = insightsRepo;
        this.configRepo = configRepo;
        this.accessLogRepo = accessLogRepo;
        this.profilesRepo = profilesRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
        this.modashService = modashService;
        this.logger = new common_1.Logger(InsightsService_1.name);
        this.DEFAULT_CACHE_TTL_DAYS = 7;
    }
    async getInsightVisibleUserIds(userId) {
        const ids = new Set([userId]);
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
    async listInsights(userId, query) {
        const { platform, search, page = 1, limit = 20 } = query;
        const visibleUserIds = await this.getInsightVisibleUserIds(userId);
        const queryBuilder = this.insightsRepo
            .createQueryBuilder('insight')
            .where('insight.userId IN (:...visibleUserIds)', { visibleUserIds });
        if (platform) {
            queryBuilder.andWhere('insight.platform = :platform', { platform });
        }
        if (search) {
            queryBuilder.andWhere('(insight.username ILIKE :search OR insight.fullName ILIKE :search)', { search: `%${search}%` });
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
    async searchAndUnlock(userId, dto) {
        const { platform, username } = dto;
        const visibleUserIds = await this.getInsightVisibleUserIds(userId);
        const existing = await this.insightsRepo.findOne({
            where: visibleUserIds.map((uid) => ({
                userId: uid,
                platform,
                username: (0, typeorm_2.ILike)(username),
            })),
        });
        if (existing) {
            this.logAccess(existing.id, userId, entities_1.InsightAccessType.VIEW, 0);
            return {
                success: true,
                isNew: false,
                creditsUsed: 0,
                insight: this.mapToFullResponse(existing),
            };
        }
        const creditBalance = await this.creditsService.getBalance(userId);
        if (creditBalance.unifiedBalance < 1) {
            throw new common_1.BadRequestException('Insufficient credits to unlock this insight');
        }
        if (this.modashService.isModashEnabled()) {
            this.logger.log(`Fetching new insight from Modash for ${username} on ${platform}`);
            const modashData = await this.modashService.getInfluencerReport(platform, username, userId);
            if (!modashData || !modashData.profile) {
                throw new common_1.NotFoundException(`Influencer "${username}" not found on ${platform}`);
            }
            const deductResult = await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.INFLUENCER_INSIGHT,
                module: enums_1.ModuleType.INSIGHTS,
                quantity: 1,
                resourceId: `${platform}_${username}`,
                resourceType: 'INSIGHT_UNLOCK',
            });
            const insight = await this.createInsightFromModash(userId, platform, modashData);
            this.logAccess(insight.id, userId, entities_1.InsightAccessType.UNLOCK, 1);
            return {
                success: true,
                isNew: true,
                creditsUsed: 1,
                remainingBalance: deductResult.remainingBalance,
                insight: this.mapToFullResponse(insight),
            };
        }
        else {
            this.logger.log(`Modash disabled - fetching from local DB for ${username} on ${platform}`);
            const localProfile = await this.profilesRepo.findOne({
                where: { platform, username: (0, typeorm_2.ILike)(username) },
            });
            if (!localProfile) {
                throw new common_1.NotFoundException(`Influencer "${username}" not found in local database`);
            }
            const deductResult = await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.INFLUENCER_INSIGHT,
                module: enums_1.ModuleType.INSIGHTS,
                quantity: 1,
                resourceId: `${platform}_${username}`,
                resourceType: 'INSIGHT_UNLOCK',
            });
            const insight = await this.createInsightFromLocalProfile(userId, localProfile);
            this.logAccess(insight.id, userId, entities_1.InsightAccessType.UNLOCK, 1);
            return {
                success: true,
                isNew: true,
                creditsUsed: 1,
                remainingBalance: deductResult.remainingBalance,
                insight: this.mapToFullResponse(insight),
            };
        }
    }
    async getInsight(userId, insightId) {
        const visibleUserIds = await this.getInsightVisibleUserIds(userId);
        const insight = await this.insightsRepo.findOne({
            where: { id: insightId, userId: (0, typeorm_2.In)(visibleUserIds) },
        });
        if (!insight) {
            throw new common_1.NotFoundException('Insight not found');
        }
        this.logAccess(insight.id, userId, entities_1.InsightAccessType.VIEW, 0);
        return this.mapToFullResponse(insight);
    }
    async ensureInsightRecordForDiscoveryProfile(userId, profile, modashReport) {
        const visibleUserIds = await this.getInsightVisibleUserIds(userId);
        let insight = await this.insightsRepo.findOne({
            where: { profileId: profile.id, userId: (0, typeorm_2.In)(visibleUserIds) },
        });
        if (insight)
            return insight.id;
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
            const modashData = modashReport ??
                (await this.modashService.getInfluencerReport(profile.platform, profile.platformUserId, userId).catch(err => {
                    this.logger.warn(`Modash API failed for ensureInsight: ${err.message}`);
                    return null;
                }));
            if (modashData?.profile) {
                const created = await this.createInsightFromModash(userId, profile.platform, modashData);
                created.profileId = profile.id;
                await this.insightsRepo.save(created);
                return created.id;
            }
            this.logger.warn(`Modash enabled but no profile payload for ${profile.platformUserId}; falling back to cached profile with generated engagement sections`);
        }
        const created = await this.createInsightFromLocalProfile(userId, profile);
        return created.id;
    }
    async findOrEnsureInsightIdForProfile(userId, profileId) {
        const profile = await this.profilesRepo.findOne({ where: { id: profileId } });
        if (!profile)
            return null;
        return this.ensureInsightRecordForDiscoveryProfile(userId, profile);
    }
    async forceRefresh(userId, insightId) {
        const visibleUserIds = await this.getInsightVisibleUserIds(userId);
        const insight = await this.insightsRepo.findOne({
            where: { id: insightId, userId: (0, typeorm_2.In)(visibleUserIds) },
        });
        if (!insight) {
            throw new common_1.NotFoundException('Insight not found');
        }
        if (!this.modashService.isModashEnabled()) {
            this.logger.log('Modash disabled - refresh not available, returning existing data');
            return {
                success: true,
                creditsUsed: 0,
                remainingBalance: (await this.creditsService.getBalance(userId)).unifiedBalance,
                insight: this.mapToFullResponse(insight),
            };
        }
        const creditBalance = await this.creditsService.getBalance(userId);
        if (creditBalance.unifiedBalance < 1) {
            throw new common_1.BadRequestException('Insufficient credits to refresh insight');
        }
        const isFresh = insight.modashFetchedAt &&
            (Date.now() - new Date(insight.modashFetchedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
        let refreshedInsight = insight;
        if (!isFresh) {
            const modashData = await this.modashService.getInfluencerReport(insight.platform, insight.platformUserId || insight.username, userId);
            if (!modashData || !modashData.profile) {
                throw new common_1.BadRequestException('Unable to fetch fresh data from Modash. No credits were charged. Please try again later.');
            }
            refreshedInsight = await this.updateInsightFromModash(insight, modashData);
        }
        else {
            this.logger.log(`Insight ${insightId} already fresh (fetched ${insight.modashFetchedAt}) — skipping Modash call, saving 1 Modash credit`);
        }
        const deductResult = await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_REFRESH,
            module: enums_1.ModuleType.INSIGHTS,
            quantity: 1,
            resourceId: insight.id,
            resourceType: 'INSIGHT_REFRESH',
        });
        this.logAccess(insight.id, userId, entities_1.InsightAccessType.REFRESH, 1);
        return {
            success: true,
            creditsUsed: 1,
            remainingBalance: deductResult.remainingBalance,
            insight: this.mapToFullResponse(refreshedInsight),
        };
    }
    async getCacheTTLDays() {
        const config = await this.configRepo.findOne({
            where: { configKey: 'INSIGHT_CACHE_TTL_DAYS', isActive: true },
        });
        return config ? parseInt(config.configValue, 10) : this.DEFAULT_CACHE_TTL_DAYS;
    }
    async isDataFresh(lastRefreshedAt) {
        const ttlDays = await this.getCacheTTLDays();
        const daysSinceRefresh = this.daysBetween(lastRefreshedAt, new Date());
        this.logger.debug(`Data freshness check: ${daysSinceRefresh} days since refresh, TTL is ${ttlDays} days`);
        return daysSinceRefresh <= ttlDays;
    }
    daysBetween(date1, date2) {
        const diffTime = Math.abs(new Date(date2).getTime() - new Date(date1).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    async refreshFromModash(insight) {
        try {
            const cachedProfile = await this.insightsRepo.manager.getRepository('InfluencerProfile').findOne({
                where: { platformUserId: insight.platformUserId || insight.username, platform: insight.platform },
            });
            if (cachedProfile?.rawModashData && cachedProfile.modashFetchedAt) {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                if (new Date(cachedProfile.modashFetchedAt) > sevenDaysAgo) {
                    this.logger.log(`Insights refresh for ${insight.username}: using cached profile data (fetched ${cachedProfile.modashFetchedAt}) — saved 1 Modash credit`);
                    return this.updateInsightFromModash(insight, cachedProfile.rawModashData);
                }
            }
        }
        catch (cacheErr) {
            this.logger.debug(`Cache check skipped for ${insight.username}: ${cacheErr.message}`);
        }
        const modashData = await this.modashService.getInfluencerReport(insight.platform, insight.platformUserId || insight.username);
        if (!modashData || !modashData.profile) {
            this.logger.warn(`Failed to refresh insight for ${insight.username}`);
            return insight;
        }
        return this.updateInsightFromModash(insight, modashData);
    }
    extractStat(stat) {
        if (stat == null)
            return null;
        if (typeof stat === 'number')
            return stat;
        if (typeof stat === 'object' && 'value' in stat)
            return stat.value;
        return null;
    }
    normalizeER(er) {
        if (er == null)
            return null;
        return er < 1 ? er * 100 : er;
    }
    async createInsightFromModash(userId, platform, modashData) {
        const innerProfile = modashData.profile || {};
        const audience = modashData.audience || {};
        const allStats = modashData.statsByContentType?.all || {};
        const reelsStats = modashData.statsByContentType?.reels || {};
        const allPosts = [...(modashData.recentPosts || []), ...(modashData.popularPosts || [])];
        const reelPosts = allPosts.filter((p) => this.isReelOrVideo(p));
        const imagePosts = allPosts.filter((p) => !this.isReelOrVideo(p));
        const popularPosts = modashData.popularPosts
            || [...(modashData.recentPosts || [])].sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0))).slice(0, 12);
        const popularReels = reelPosts.length > 0
            ? [...reelPosts].sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0))).slice(0, 12)
            : [];
        const sponsoredPosts = allPosts.filter((p) => p.text && /#(ad|sponsored|partner|collab)\b/i.test(p.text));
        const hashtagsFromModash = modashData.hashtags;
        const wordCloudFromHashtags = Array.isArray(hashtagsFromModash) && hashtagsFromModash.length > 0
            ? hashtagsFromModash.slice(0, 25).map((h, i) => ({
                text: (h.tag || '').replace(/^#/, ''),
                value: Math.round((h.weight || 0) * 100) || Math.max(1, 100 - i * 4),
            }))
            : (modashData.mentions || []).slice(0, 25).map((m, i) => ({
                text: (m.tag || '').replace(/^@/, ''),
                value: Math.round((m.weight || 0) * 100) || Math.max(1, 100 - i * 4),
            }));
        const lookalikesData = this.buildLookalikes(modashData.lookalikes, audience);
        const insight = this.insightsRepo.create({
            userId,
            platform,
            platformUserId: modashData.userId || innerProfile.userId || innerProfile.username,
            username: innerProfile.username || '',
            fullName: innerProfile.fullname || null,
            profilePictureUrl: innerProfile.picture || null,
            bio: modashData.bio || innerProfile.bio || null,
            followerCount: innerProfile.followers || 0,
            followingCount: this.extractStat(modashData.statHistory?.[modashData.statHistory.length - 1]?.following) || 0,
            postCount: modashData.postsCount || 0,
            engagementRate: this.normalizeER(innerProfile.engagementRate || allStats.engagementRate || null),
            avgLikes: allStats.avgLikes || innerProfile.avgLikes || null,
            avgComments: allStats.avgComments || innerProfile.avgComments || null,
            avgViews: allStats.avgViews || innerProfile.averageViews || null,
            avgReelViews: allStats.avgReelsPlays || reelsStats.avgReelsPlays || null,
            avgReelLikes: reelsStats.avgLikes || null,
            avgReelComments: reelsStats.avgComments || null,
            brandPostER: modashData.paidPostPerformance ?? allStats.paidPostPerformance ?? null,
            postsWithHiddenLikesPct: this.calcHiddenLikesPct(allPosts),
            locationCountry: modashData.country || audience.geoCountries?.[0]?.name || null,
            locationCity: modashData.city || audience.geoCities?.[0]?.name || null,
            isVerified: modashData.isVerified ?? innerProfile.isVerified ?? false,
            audienceCredibility: audience.credibility ?? null,
            notableFollowersPct: audience.notable != null ? audience.notable * 100 : null,
            engagerCredibility: audience.engagers?.credibility ?? null,
            notableEngagersPct: audience.engagers?.notable != null ? audience.engagers.notable * 100 : null,
            audienceData: audience,
            engagementData: {
                distribution: modashData.engagementDistribution || this.buildEngagementDistribution(allPosts, innerProfile.engagementRate || allStats.engagementRate, innerProfile.followers),
                likesHistory: allStats.statHistory || modashData.statHistory,
                commentsHistory: allStats.statHistory || modashData.statHistory,
            },
            growthData: {
                history: this.mergeStatHistories(modashData.statHistory, allStats.statHistory),
            },
            lookalikesData,
            brandAffinityData: audience.brandAffinity,
            interestsData: audience.interests,
            hashtagsData: hashtagsFromModash,
            recentPosts: modashData.recentPosts,
            recentReels: reelPosts.length > 0 ? reelPosts : null,
            popularReels,
            popularPosts,
            sponsoredPosts: sponsoredPosts.length > 0 ? sponsoredPosts : null,
            wordCloudData: wordCloudFromHashtags.length > 0 ? wordCloudFromHashtags : null,
            creditsUsed: 1,
            unlockedAt: new Date(),
            lastRefreshedAt: new Date(),
            modashFetchedAt: new Date(),
        });
        const saved = await this.insightsRepo.save(insight);
        this.syncStatsToDiscoveryProfile(saved).catch(() => { });
        return saved;
    }
    async createInsightFromLocalProfile(userId, profile) {
        const audienceData = this.generateMockAudienceData(profile);
        const engagementData = this.generateMockEngagementData(profile);
        const growthData = this.generateMockGrowthData(profile);
        const avgLikes = Number(profile.avgLikes) || 5000;
        const avgComments = Number(profile.avgComments) || 200;
        const avgViews = Number(profile.avgViews) || 15000;
        const uname = profile.username ?? '';
        const mockPosts = this.generateMockPosts(uname, avgLikes, avgComments);
        const mockReels = this.generateMockReels(uname, avgViews, avgLikes, avgComments);
        const wordCloud = this.generateMockWordCloud(profile.category);
        const lookalikes = this.generateMockLookalikes(Number(profile.followerCount) || 100000);
        const insight = this.insightsRepo.create({
            userId: userId,
            platform: profile.platform,
            profileId: profile.id,
            platformUserId: profile.platformUserId || profile.username || '',
            username: profile.username || '',
            fullName: profile.fullName || null,
            profilePictureUrl: profile.profilePictureUrl || null,
            bio: profile.biography || null,
            followerCount: Number(profile.followerCount) || 0,
            followingCount: Number(profile.followingCount) || 0,
            postCount: Number(profile.postCount) || 0,
            engagementRate: profile.engagementRate || null,
            avgLikes: profile.avgLikes != null ? Number(profile.avgLikes) : null,
            avgComments: profile.avgComments != null ? Number(profile.avgComments) : null,
            avgViews: profile.avgViews != null ? Number(profile.avgViews) : null,
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
    generateMockAudienceData(profile) {
        const fc = Number(profile.followerCount) || 100000;
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
    generateMockEngagementData(profile) {
        const avgLikes = Number(profile.avgLikes) || 5000;
        const avgComments = Number(profile.avgComments) || 200;
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
    generateMockGrowthData(profile) {
        const currentFollowers = Number(profile.followerCount) || 100000;
        const currentFollowing = Number(profile.followingCount) || 500;
        const avgLikes = Number(profile.avgLikes) || 5000;
        const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
        const history = months.map((month, i) => ({
            month,
            followers: Math.floor(currentFollowers * (0.85 + i * 0.03)),
            following: Math.floor(currentFollowing * (0.95 + i * 0.01)),
            likes: Math.floor(avgLikes * (0.8 + i * 0.04)),
        }));
        return { history };
    }
    generateMockBrandAffinity() {
        return [
            { brand: 'Nike', percentage: 12.5 },
            { brand: 'Adidas', percentage: 9.8 },
            { brand: 'Apple', percentage: 8.2 },
            { brand: 'Samsung', percentage: 6.5 },
            { brand: 'Starbucks', percentage: 5.1 },
        ];
    }
    generateMockInterests(category) {
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
    generateMockHashtags(category) {
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
    generateMockWordCloud(category) {
        const words = [
            'love', 'fashion', 'style', 'beauty', 'travel', 'life', 'food',
            'fitness', 'happy', 'photography', 'nature', 'art', 'music',
            'dance', 'wellness', 'luxury', 'model', 'creative', 'inspiration',
            'trending', 'viral', 'brand', 'collab', 'influencer', 'content',
        ];
        if (category)
            words.unshift(category.toLowerCase());
        return words.slice(0, 20).map((word, i) => ({
            text: word,
            value: Math.floor(100 - i * 4 + Math.random() * 10),
        }));
    }
    generateMockLookalikes(followerCount) {
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
    generateMockPosts(username, avgLikes, avgComments) {
        const now = new Date();
        const makePosts = (count, multiplier, offset) => Array.from({ length: count }, (_, i) => ({
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
    generateMockReels(username, avgViews, avgLikes, avgComments) {
        const now = new Date();
        const makeReels = (count, multiplier, offset) => Array.from({ length: count }, (_, i) => ({
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
    async updateInsightFromModash(insight, modashData) {
        const innerProfile = modashData.profile || {};
        const audience = modashData.audience || {};
        const allStats = modashData.statsByContentType?.all || {};
        const reelsStats = modashData.statsByContentType?.reels || {};
        const allPosts = [...(modashData.recentPosts || []), ...(modashData.popularPosts || [])];
        const reelPosts = allPosts.filter((p) => this.isReelOrVideo(p));
        const popularPosts = modashData.popularPosts
            || [...(modashData.recentPosts || [])].sort((a, b) => ((b.likes || 0) + (b.comments || 0)) - ((a.likes || 0) + (a.comments || 0))).slice(0, 12);
        const popularReels = reelPosts.length > 0
            ? [...reelPosts].sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0))).slice(0, 12)
            : [];
        const sponsoredPosts = allPosts.filter((p) => p.text && /#(ad|sponsored|partner|collab)\b/i.test(p.text));
        const hashtagsFromModash = modashData.hashtags;
        const wordCloudFromHashtags = Array.isArray(hashtagsFromModash) && hashtagsFromModash.length > 0
            ? hashtagsFromModash.slice(0, 25).map((h, i) => ({
                text: (h.tag || '').replace(/^#/, ''),
                value: Math.round((h.weight || 0) * 100) || Math.max(1, 100 - i * 4),
            }))
            : null;
        const lookalikesData = this.buildLookalikes(modashData.lookalikes, audience, insight.lookalikesData);
        insight.fullName = innerProfile.fullname || insight.fullName;
        insight.profilePictureUrl = innerProfile.picture || insight.profilePictureUrl;
        insight.bio = modashData.bio || innerProfile.bio || insight.bio;
        insight.followerCount = innerProfile.followers || insight.followerCount;
        insight.followingCount = this.extractStat(modashData.statHistory?.[modashData.statHistory?.length - 1]?.following) || insight.followingCount;
        insight.postCount = modashData.postsCount || insight.postCount;
        insight.engagementRate = this.normalizeER(innerProfile.engagementRate || allStats.engagementRate) || insight.engagementRate;
        insight.avgLikes = allStats.avgLikes || innerProfile.avgLikes || insight.avgLikes;
        insight.avgComments = allStats.avgComments || innerProfile.avgComments || insight.avgComments;
        insight.avgViews = allStats.avgViews || innerProfile.averageViews || insight.avgViews;
        insight.avgReelViews = allStats.avgReelsPlays || reelsStats.avgReelsPlays || insight.avgReelViews;
        insight.avgReelLikes = reelsStats.avgLikes || insight.avgReelLikes;
        insight.avgReelComments = reelsStats.avgComments || insight.avgReelComments;
        insight.brandPostER = modashData.paidPostPerformance ?? allStats.paidPostPerformance ?? insight.brandPostER;
        insight.postsWithHiddenLikesPct = this.calcHiddenLikesPct(allPosts) ?? insight.postsWithHiddenLikesPct;
        insight.isVerified = modashData.isVerified ?? innerProfile.isVerified ?? insight.isVerified;
        insight.locationCountry = modashData.country || audience.geoCountries?.[0]?.name || insight.locationCountry;
        insight.locationCity = modashData.city || audience.geoCities?.[0]?.name || insight.locationCity;
        insight.audienceCredibility = audience.credibility ?? insight.audienceCredibility;
        insight.notableFollowersPct = audience.notable != null ? audience.notable * 100 : insight.notableFollowersPct;
        insight.engagerCredibility = audience.engagers?.credibility ?? insight.engagerCredibility;
        insight.notableEngagersPct = audience.engagers?.notable != null ? audience.engagers.notable * 100 : insight.notableEngagersPct;
        insight.audienceData = audience;
        insight.engagementData = {
            distribution: modashData.engagementDistribution || this.buildEngagementDistribution(allPosts, innerProfile.engagementRate || allStats.engagementRate, innerProfile.followers) || insight.engagementData?.distribution,
            likesHistory: allStats.statHistory || modashData.statHistory || insight.engagementData?.likesHistory,
            commentsHistory: allStats.statHistory || modashData.statHistory || insight.engagementData?.commentsHistory,
        };
        insight.growthData = { history: this.mergeStatHistories(modashData.statHistory, allStats.statHistory) || insight.growthData?.history };
        insight.lookalikesData = lookalikesData;
        insight.brandAffinityData = audience.brandAffinity || insight.brandAffinityData;
        insight.interestsData = audience.interests || insight.interestsData;
        insight.hashtagsData = hashtagsFromModash || insight.hashtagsData;
        insight.recentPosts = modashData.recentPosts || insight.recentPosts;
        insight.recentReels = reelPosts.length > 0 ? reelPosts : insight.recentReels;
        insight.popularReels = popularReels.length > 0 ? popularReels : insight.popularReels;
        insight.popularPosts = popularPosts;
        insight.sponsoredPosts = sponsoredPosts.length > 0 ? sponsoredPosts : insight.sponsoredPosts;
        insight.wordCloudData = wordCloudFromHashtags || insight.wordCloudData;
        insight.lastRefreshedAt = new Date();
        insight.modashFetchedAt = new Date();
        const saved = await this.insightsRepo.save(insight);
        this.syncStatsToDiscoveryProfile(saved).catch(() => { });
        return saved;
    }
    async syncStatsToDiscoveryProfile(insight) {
        try {
            const profile = await this.profilesRepo.findOne({
                where: { platform: insight.platform, platformUserId: insight.platformUserId },
            });
            if (!profile)
                return;
            if (insight.avgLikes && Number(insight.avgLikes) > 0) {
                profile.avgLikes = Number(insight.avgLikes);
            }
            if (insight.avgComments && Number(insight.avgComments) > 0) {
                profile.avgComments = Number(insight.avgComments);
            }
            if (insight.avgViews && Number(insight.avgViews) > 0) {
                profile.avgViews = Number(insight.avgViews);
            }
            if (insight.engagementRate && Number(insight.engagementRate) > Number(profile.engagementRate || 0)) {
                profile.engagementRate = Number(insight.engagementRate);
            }
            if (insight.followerCount && Number(insight.followerCount) > 0) {
                profile.followerCount = Number(insight.followerCount);
            }
            await this.profilesRepo.save(profile);
        }
        catch (err) {
            this.logger.warn(`Failed to sync stats to discovery profile: ${err.message}`);
        }
    }
    mapToFullResponse(insight) {
        const audience = insight.audienceData || {};
        const engagement = insight.engagementData || {};
        const growth = insight.growthData || {};
        const lookalikes = insight.lookalikesData || {};
        const followersData = audience.followers || {};
        const engagersData = audience.engagers || {};
        const isModashRaw = !audience.followers && (Array.isArray(audience.genders) || audience.credibility != null);
        const genderSplit = followersData.genderSplit
            || audience.genderSplit
            || this.convertGenders(audience.genders);
        const ageGroups = followersData.ageGroups
            || audience.ageGroups
            || this.convertGendersPerAge(audience.gendersPerAge)
            || this.convertAgeGroups(audience.ages, audience.genders);
        const topCountries = followersData.topCountries
            || this.convertGeoWeighted(audience.geoCountries, 'country')
            || audience.topCountries;
        const topStates = followersData.topStates
            || this.convertGeoWeighted(audience.geoStates || audience.geoSubdivisions, 'state')
            || audience.topStates;
        const topCities = followersData.topCities
            || this.convertGeoWeighted(audience.geoCities, 'city')
            || audience.topCities;
        const audienceTypes = followersData.audienceTypes
            || this.convertAudienceTypes(audience.audienceTypes || audience.types);
        const notableFollowers = followersData.notableFollowers
            || this.convertNotableUsers(audience.notableUsers)
            || audience.notableFollowers;
        const reachability = followersData.reachability
            || this.convertReachability(audience.audienceReachability)
            || audience.reachability;
        const languages = followersData.languages
            || this.convertLanguages(audience.languages)
            || audience.languages;
        const audInterests = followersData.interests || audience.interests;
        const audBrandAffinity = followersData.brandAffinity || audience.brandAffinity;
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
                postCount: Number(insight.postCount) || 0,
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
                credibility: insight.audienceCredibility != null ? Number(insight.audienceCredibility) : undefined,
                notableFollowersPct: insight.notableFollowersPct != null
                    ? Number(insight.notableFollowersPct)
                    : undefined,
                genderSplit,
                ageGroups,
                topCountries,
                topStates,
                topCities,
                audienceTypes,
                notableFollowers,
                credibilityDistribution: followersData.credibilityDistribution || audience.credibilityDistribution,
                languages,
                interests: audInterests,
                brandAffinity: audBrandAffinity,
                reachability,
                ethnicities: audience.ethnicities,
                engagers: isModashRaw
                    ? undefined
                    : {
                        credibility: insight.engagerCredibility ? Number(insight.engagerCredibility) : engagersData.credibility,
                        notableEngagersPct: insight.notableEngagersPct ? Number(insight.notableEngagersPct) : (engagersData.notableEngagersPct || engagersData.notable),
                        genderSplit: engagersData.genderSplit || this.convertGenders(engagersData.genders),
                        ageGroups: engagersData.ageGroups || this.convertAgeGroups(engagersData.ages, engagersData.genders),
                        topCountries: engagersData.topCountries || this.convertGeoWeighted(engagersData.geoCountries, 'country'),
                        topStates: engagersData.topStates || this.convertGeoWeighted(engagersData.geoStates || engagersData.geoSubdivisions, 'state'),
                        topCities: engagersData.topCities || this.convertGeoWeighted(engagersData.geoCities, 'city'),
                        audienceTypes: engagersData.audienceTypes || this.convertAudienceTypes(engagersData.types),
                        notableEngagers: engagersData.notableEngagers || this.convertNotableUsers(engagersData.notableUsers),
                        credibilityDistribution: engagersData.credibilityDistribution,
                        languages: engagersData.languages ? (this.convertLanguages(engagersData.languages) || engagersData.languages) : undefined,
                        interests: engagersData.interests,
                        brandAffinity: engagersData.brandAffinity,
                        reachability: engagersData.reachability || this.convertReachability(engagersData.audienceReachability),
                    },
            },
            engagement: {
                rateDistribution: engagement.distribution
                    || this.buildEngagementDistribution(insight.recentPosts, insight.engagementRate ? Number(insight.engagementRate) : undefined, insight.followerCount ? Number(insight.followerCount) : undefined),
                likesSpread: this.normalizeLikesSpread(engagement.likesHistory) || this.buildLikesSpreadFromPosts(insight.recentPosts),
                commentsSpread: this.normalizeCommentsSpread(engagement.commentsHistory) || this.buildCommentsSpreadFromPosts(insight.recentPosts),
                topHashtags: this.normalizeHashtags(insight.hashtagsData),
            },
            growth: {
                last6Months: this.normalizeGrowthHistory(growth.history),
            },
            lookalikes: {
                influencer: this.normalizeLookalikes(lookalikes.influencer?.length ? lookalikes.influencer
                    : (audience.notableUsers?.length ? audience.notableUsers : []), 'similarity'),
                audience: this.normalizeLookalikes(lookalikes.audience?.length ? lookalikes.audience
                    : (audience.audienceLookalikes?.length ? audience.audienceLookalikes : []), 'overlap'),
            },
            brandAffinity: this.normalizeBrandAffinity(insight.brandAffinityData),
            interests: this.normalizeInterests(insight.interestsData),
            wordCloud: insight.wordCloudData || this.generateWordCloudFallback(insight),
            posts: {
                recent: this.normalizePosts(insight.recentPosts),
                popular: this.normalizePosts(insight.popularPosts),
                sponsored: this.normalizePosts(insight.sponsoredPosts),
            },
            reels: (() => {
                const reels = insight.recentReels?.length ? insight.recentReels
                    : (insight.recentPosts || []).filter((p) => this.isReelOrVideo(p));
                const recentSorted = [...reels].sort((a, b) => {
                    const da = a.created ? new Date(a.created).getTime() : 0;
                    const db = b.created ? new Date(b.created).getTime() : 0;
                    return db - da;
                });
                const popReels = [...reels].sort((a, b) => ((b.views || 0) + (b.likes || 0)) - ((a.views || 0) + (a.likes || 0))).slice(0, 10);
                return {
                    recent: this.normalizePosts(recentSorted),
                    popular: this.normalizePosts(popReels),
                    sponsored: [],
                };
            })(),
            lastRefreshedAt: insight.lastRefreshedAt,
            dataFreshnessStatus: this.daysBetween(insight.lastRefreshedAt, new Date()) <= 7
                ? 'FRESH'
                : 'STALE',
        };
    }
    convertGenders(genders) {
        if (!genders || !Array.isArray(genders) || genders.length === 0)
            return undefined;
        const result = {};
        for (const g of genders) {
            if (g.code && g.weight != null) {
                result[g.code] = Math.round(g.weight * 100 * 10) / 10;
            }
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }
    convertAgeGroups(ages, genders) {
        if (!ages || !Array.isArray(ages) || ages.length === 0)
            return undefined;
        const maleRatio = genders?.find((g) => g.code === 'male')?.weight ?? 0.5;
        const femaleRatio = 1 - maleRatio;
        return ages.map(a => ({
            range: a.code,
            male: Math.round(a.weight * maleRatio * 100 * 10) / 10,
            female: Math.round(a.weight * femaleRatio * 100 * 10) / 10,
            percentage: Math.round(a.weight * 100 * 10) / 10,
        }));
    }
    convertAudienceTypes(types) {
        if (!types || !Array.isArray(types) || types.length === 0)
            return undefined;
        if (types[0]?.type && types[0]?.percentage != null)
            return types;
        const labelMap = {
            real: 'Real People',
            influencers: 'Influencers',
            suspicious: 'Suspicious',
            mass_followers: 'Mass Followers',
        };
        return types.map(t => ({
            type: labelMap[t.code] || t.code,
            percentage: Math.round((t.weight || 0) * 100 * 10) / 10,
        }));
    }
    convertGendersPerAge(gendersPerAge) {
        if (!gendersPerAge || !Array.isArray(gendersPerAge) || gendersPerAge.length === 0)
            return undefined;
        return gendersPerAge.map(g => ({
            range: g.code,
            male: Math.round((g.male || 0) * 100 * 10) / 10,
            female: Math.round((g.female || 0) * 100 * 10) / 10,
            percentage: Math.round(((g.male || 0) + (g.female || 0)) * 100 * 10) / 10,
        }));
    }
    convertGeoWeighted(items, type) {
        if (!items || !Array.isArray(items) || items.length === 0)
            return undefined;
        if (items[0]?.percentage != null)
            return items;
        return items.map(item => ({
            [type]: item.name || item.code,
            name: item.name || item.code,
            code: item.code,
            percentage: Math.round((item.weight || 0) * 100 * 10) / 10,
        }));
    }
    convertNotableUsers(notableUsers) {
        if (!notableUsers || !Array.isArray(notableUsers) || notableUsers.length === 0)
            return undefined;
        return notableUsers.map(u => ({
            username: u.username,
            fullName: u.fullname || u.fullName,
            followers: u.followers,
            engagements: u.engagements,
            profilePictureUrl: u.picture || u.profilePictureUrl,
        }));
    }
    convertReachability(reachability) {
        if (!reachability || !Array.isArray(reachability) || reachability.length === 0)
            return undefined;
        const result = {};
        for (const item of reachability) {
            const key = item.code === '-500' ? 'below500'
                : item.code === '500-1000' ? '500to1000'
                    : item.code === '1000-1500' ? '1000to1500'
                        : item.code === '1500-' ? 'above1500'
                            : item.code;
            result[key] = Math.round((item.weight || 0) * 100 * 10) / 10;
        }
        return Object.keys(result).length > 0 ? result : undefined;
    }
    convertLanguages(languages) {
        if (!languages || !Array.isArray(languages) || languages.length === 0)
            return undefined;
        if (languages[0]?.percentage != null)
            return languages;
        return languages.map(l => ({
            language: l.name || l.code,
            code: l.code,
            percentage: Math.round((l.weight || 0) * 100 * 10) / 10,
        }));
    }
    normalizeLikesSpread(history) {
        if (!history || !Array.isArray(history) || history.length === 0)
            return undefined;
        if (history[0]?.likes != null) {
            return history.some((h) => h.likes > 0) ? history : undefined;
        }
        const mapped = history.map(h => ({
            date: h.month,
            likes: h.avgLikes || 0,
        }));
        return mapped.some(h => h.likes > 0) ? mapped : undefined;
    }
    normalizeCommentsSpread(history) {
        if (!history || !Array.isArray(history) || history.length === 0)
            return undefined;
        if (history[0]?.comments != null) {
            return history.some((h) => h.comments > 0) ? history : undefined;
        }
        const mapped = history.map(h => ({
            date: h.month,
            comments: h.avgComments || 0,
        }));
        return mapped.some(h => h.comments > 0) ? mapped : undefined;
    }
    buildLikesSpreadFromPosts(posts) {
        if (!posts || !Array.isArray(posts) || posts.length === 0)
            return undefined;
        const sorted = [...posts]
            .filter((p) => p.created || p.postedAt)
            .sort((a, b) => {
            const da = new Date(a.postedAt || a.created).getTime();
            const db = new Date(b.postedAt || b.created).getTime();
            return da - db;
        });
        if (sorted.length === 0)
            return undefined;
        return sorted.map((p) => ({
            date: this.safeParseDate(p.postedAt || p.created)?.slice(0, 10) || '',
            likes: p.likes || 0,
            postUrl: p.url,
        }));
    }
    buildCommentsSpreadFromPosts(posts) {
        if (!posts || !Array.isArray(posts) || posts.length === 0)
            return undefined;
        const sorted = [...posts]
            .filter((p) => p.created || p.postedAt)
            .sort((a, b) => {
            const da = new Date(a.postedAt || a.created).getTime();
            const db = new Date(b.postedAt || b.created).getTime();
            return da - db;
        });
        if (sorted.length === 0)
            return undefined;
        return sorted.map((p) => ({
            date: this.safeParseDate(p.postedAt || p.created)?.slice(0, 10) || '',
            comments: p.comments || 0,
            postUrl: p.url,
        }));
    }
    normalizeHashtags(hashtags) {
        if (!hashtags || !Array.isArray(hashtags) || hashtags.length === 0)
            return undefined;
        if (hashtags[0]?.usagePercentage != null || hashtags[0]?.count != null)
            return hashtags;
        return hashtags.map(h => ({
            tag: h.tag?.startsWith('#') ? h.tag : `#${h.tag || ''}`,
            usagePercentage: Math.round((h.weight || 0) * 100 * 10) / 10,
        }));
    }
    normalizeBrandAffinity(data) {
        if (!data || !Array.isArray(data) || data.length === 0)
            return undefined;
        if (data[0]?.percentage != null && data[0]?.brand != null)
            return data;
        return data.map((b, i) => ({
            brand: b.brand || b.name || b.id,
            percentage: b.percentage ?? (b.weight != null
                ? Math.round(b.weight * 100 * 10) / 10
                : Math.round((100 / data.length) * (1 - i * 0.08) * 10) / 10),
        }));
    }
    normalizeInterests(data) {
        if (!data || !Array.isArray(data) || data.length === 0)
            return undefined;
        if (data[0]?.percentage != null && data[0]?.category != null)
            return data;
        return data.map((item, i) => ({
            category: item.category || item.name || item.id,
            percentage: item.percentage ?? (item.weight != null
                ? Math.round(item.weight * 100 * 10) / 10
                : Math.round((100 / data.length) * (1 - i * 0.08) * 10) / 10),
        }));
    }
    generateWordCloudFallback(insight) {
        const words = [];
        const brands = insight.brandAffinityData;
        if (Array.isArray(brands)) {
            brands.forEach((b, i) => {
                const name = b.brand || b.name;
                if (name)
                    words.push({ text: name, value: Math.max(80 - i * 8, 10) });
            });
        }
        const interests = insight.interestsData;
        if (Array.isArray(interests)) {
            interests.forEach((item, i) => {
                const name = item.category || item.name;
                if (name)
                    words.push({ text: name, value: Math.max(70 - i * 7, 10) });
            });
        }
        if (insight.bio) {
            const bioWords = insight.bio.split(/[\s,|\/]+/).filter((w) => w.length > 3 && !/^(http|www|the|and|for|with|this|that|from|have|your|will|been)$/i.test(w));
            bioWords.slice(0, 8).forEach((w, i) => {
                words.push({ text: w.replace(/[^a-zA-Z0-9]/g, ''), value: Math.max(40 - i * 4, 10) });
            });
        }
        return words.length > 0 ? words.slice(0, 25) : null;
    }
    normalizeGrowthHistory(history) {
        if (!history || !Array.isArray(history) || history.length === 0)
            return undefined;
        return history.map(h => ({
            month: h.month,
            followers: h.followers || 0,
            following: h.following || 0,
            likes: h.likes || h.avgLikes || 0,
        }));
    }
    normalizeLookalikes(items, scoreField) {
        if (!items || !Array.isArray(items) || items.length === 0)
            return [];
        return items.map((l, i) => {
            const explicit = l[scoreField] ?? l.similarity ?? l.overlap ?? l.weight;
            const score = explicit != null ? explicit : Math.round((1 - i / (items.length + 1)) * 100) / 100;
            return { ...l, [scoreField]: score };
        });
    }
    buildLookalikes(rawLookalikes, audience, existing) {
        const mapInfluencer = (l, index, total) => {
            const explicit = l.similarity ?? l.weight ?? l.overlap;
            const score = explicit != null ? explicit : Math.round((1 - index / (total + 1)) * 100) / 100;
            return {
                username: l.username,
                fullName: l.fullname || l.fullName || l.full_name,
                followers: l.followers,
                similarity: score,
                profilePictureUrl: l.picture || l.profilePictureUrl || l.avatar,
            };
        };
        const mapAudience = (l, index, total) => {
            const explicit = l.overlap ?? l.weight ?? l.similarity;
            const score = explicit != null ? explicit : Math.round((1 - index / (total + 1)) * 100) / 100;
            return {
                username: l.username,
                fullName: l.fullname || l.fullName || l.full_name,
                followers: l.followers,
                overlap: score,
                profilePictureUrl: l.picture || l.profilePictureUrl || l.avatar,
            };
        };
        const influencerRaw = rawLookalikes?.influencer;
        const audienceRaw = rawLookalikes?.audience;
        const infSource = Array.isArray(influencerRaw) && influencerRaw.length > 0
            ? influencerRaw
            : (Array.isArray(audience?.notableUsers) && audience.notableUsers.length > 0
                ? audience.notableUsers
                : null);
        const influencerList = infSource
            ? infSource.map((l, i) => mapInfluencer(l, i, infSource.length))
            : existing?.influencer || [];
        const audSource = Array.isArray(audienceRaw) && audienceRaw.length > 0
            ? audienceRaw
            : (Array.isArray(audience?.audienceLookalikes) && audience.audienceLookalikes.length > 0
                ? audience.audienceLookalikes
                : null);
        const audienceList = audSource
            ? audSource.map((l, i) => mapAudience(l, i, audSource.length))
            : existing?.audience || [];
        return { influencer: influencerList, audience: audienceList };
    }
    calcHiddenLikesPct(posts) {
        if (!posts || posts.length === 0)
            return null;
        const total = posts.length;
        const hidden = posts.filter((p) => (p.likes == null || p.likes === 0) && (p.comments > 0 || p.views > 0)).length;
        return Math.round((hidden / total) * 100 * 10) / 10;
    }
    isReelOrVideo(post) {
        const t = (post.type || '').toLowerCase();
        if (['reel', 'video', 'ig_reel', 'graphvideo', 'short', 'clips'].includes(t))
            return true;
        if (post.url && /\/reel\//i.test(post.url))
            return true;
        if ((post.views != null || post.plays != null) && t !== 'image' && t !== 'photo' && t !== 'carousel')
            return true;
        return false;
    }
    buildEngagementDistribution(posts, engagementRate, followerCount) {
        if ((!posts || posts.length === 0) && !engagementRate)
            return undefined;
        const ranges = [
            { range: '0-1%', min: 0, max: 0.01 },
            { range: '1-2%', min: 0.01, max: 0.02 },
            { range: '2-3%', min: 0.02, max: 0.03 },
            { range: '3-5%', min: 0.03, max: 0.05 },
            { range: '5-10%', min: 0.05, max: 0.10 },
            { range: '10%+', min: 0.10, max: Infinity },
        ];
        const denom = followerCount && followerCount > 0 ? followerCount : 0;
        if (posts && posts.length > 0 && denom > 0) {
            const distribution = ranges.map(r => ({ range: r.range, count: 0 }));
            for (const p of posts) {
                const er = ((p.likes || 0) + (p.comments || 0)) / denom;
                const idx = ranges.findIndex(r => er >= r.min && er < r.max);
                if (idx >= 0)
                    distribution[idx].count++;
            }
            if (distribution.some(d => d.count > 0))
                return distribution;
        }
        if (engagementRate != null) {
            const rate = engagementRate > 1 ? engagementRate / 100 : engagementRate;
            return ranges.map(r => ({
                range: r.range,
                count: (rate >= r.min && rate < r.max) ? 1 : 0,
            }));
        }
        return undefined;
    }
    mergeStatHistories(growthHistory, engagementHistory) {
        if (!growthHistory && !engagementHistory)
            return undefined;
        if (!growthHistory || !Array.isArray(growthHistory) || growthHistory.length === 0)
            return engagementHistory;
        if (!engagementHistory || !Array.isArray(engagementHistory) || engagementHistory.length === 0)
            return growthHistory;
        const engMap = new Map();
        for (const entry of engagementHistory) {
            if (entry.month)
                engMap.set(entry.month, entry);
        }
        return growthHistory.map(g => {
            const eng = engMap.get(g.month) || {};
            return {
                ...g,
                avgLikes: g.avgLikes ?? eng.avgLikes,
                avgComments: g.avgComments ?? eng.avgComments,
                avgViews: g.avgViews ?? eng.avgViews,
            };
        });
    }
    normalizePosts(posts) {
        if (!posts || !Array.isArray(posts))
            return [];
        return posts.map(p => ({
            ...p,
            caption: p.caption || p.text || undefined,
            postedAt: p.postedAt || this.safeParseDate(p.created),
            imageUrl: p.imageUrl || p.thumbnail || p.image || undefined,
        }));
    }
    safeParseDate(value) {
        if (!value)
            return undefined;
        try {
            if (typeof value === 'number') {
                return new Date(value * 1000).toISOString();
            }
            const d = new Date(value);
            if (!isNaN(d.getTime()))
                return d.toISOString();
            return undefined;
        }
        catch {
            return undefined;
        }
    }
    async logAccess(insightId, userId, accessType, creditsDeducted) {
        try {
            await this.accessLogRepo.save({
                insightId,
                userId,
                accessType,
                creditsDeducted,
            });
        }
        catch (error) {
            this.logger.error(`Failed to log insight access: ${error.message}`);
        }
    }
};
exports.InsightsService = InsightsService;
exports.InsightsService = InsightsService = InsightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.InfluencerInsight)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SystemConfig)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.InsightAccessLog)),
    __param(3, (0, typeorm_1.InjectRepository)(influencer_profile_entity_1.InfluencerProfile)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        modash_service_1.ModashService])
], InsightsService);
//# sourceMappingURL=insights.service.js.map