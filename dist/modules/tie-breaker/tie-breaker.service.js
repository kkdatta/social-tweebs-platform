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
var TieBreakerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TieBreakerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const influencer_insight_entity_1 = require("../insights/entities/influencer-insight.entity");
const unlocked_influencer_entity_1 = require("../credits/entities/unlocked-influencer.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const modash_service_1 = require("../discovery/services/modash.service");
const CREDIT_PER_UNBLUR = 1;
let TieBreakerService = TieBreakerService_1 = class TieBreakerService {
    constructor(comparisonRepo, influencerRepo, shareRepo, userRepo, profileRepo, unlockedRepo, insightRepo, creditsService, modashService) {
        this.comparisonRepo = comparisonRepo;
        this.influencerRepo = influencerRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.unlockedRepo = unlockedRepo;
        this.insightRepo = insightRepo;
        this.creditsService = creditsService;
        this.modashService = modashService;
        this.logger = new common_1.Logger(TieBreakerService_1.name);
    }
    async createComparison(userId, dto) {
        if (dto.influencerIds.length < 2 || dto.influencerIds.length > 3) {
            throw new common_1.BadRequestException('You can compare 2 to 3 influencers at a time');
        }
        const clientUserIds = await this.getClientUserIds(userId);
        const unlockedInfluencers = await this.unlockedRepo.find({
            where: {
                userId: (0, typeorm_2.In)(clientUserIds),
                influencerId: (0, typeorm_2.In)(dto.influencerIds),
            },
        });
        const unlockedProfileIds = new Set(unlockedInfluencers.map(u => u.influencerId));
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const cachedProfiles = await this.profileRepo
            .createQueryBuilder('p')
            .where('p.id IN (:...ids)', { ids: dto.influencerIds })
            .andWhere('p.last_updated_at >= :since', { since: sevenDaysAgo })
            .getMany();
        const recentlyCachedIds = new Set(cachedProfiles.map(p => p.id));
        const influencersToUnlock = dto.influencerIds.filter(id => !unlockedProfileIds.has(id) && !recentlyCachedIds.has(id));
        const creditsRequired = influencersToUnlock.length * CREDIT_PER_UNBLUR;
        if (creditsRequired > 0) {
            const balance = await this.creditsService.getBalance(userId);
            if ((balance.unifiedBalance || 0) < creditsRequired) {
                throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditsRequired}, Available: ${balance.unifiedBalance}`);
            }
        }
        const comparison = new entities_1.TieBreakerComparison();
        comparison.title = dto.title || 'Influencer Comparison';
        comparison.platform = dto.platform;
        comparison.status = entities_1.TieBreakerStatus.PROCESSING;
        comparison.searchQuery = dto.searchQuery;
        comparison.ownerId = userId;
        comparison.createdById = userId;
        comparison.creditsUsed = creditsRequired;
        comparison.shareUrlToken = `tb_${(0, uuid_1.v4)().substring(0, 8)}`;
        const savedComparison = await this.comparisonRepo.save(comparison);
        const influencers = await this.addInfluencersToComparison(savedComparison.id, dto.influencerIds, dto.platform, userId, influencersToUnlock);
        setTimeout(() => this.processComparison(savedComparison.id).catch(err => this.logger.error(`processComparison ${savedComparison.id} unhandled: ${err.message}`)), 500);
        savedComparison.influencers = influencers;
        return {
            success: true,
            comparison: savedComparison,
            creditsUsed: creditsRequired,
            unlockedCount: influencersToUnlock.length,
        };
    }
    async addInfluencersToComparison(comparisonId, influencerIds, platform, userId, idsToUnlock) {
        const influencers = [];
        const idsToUnlockSet = new Set(idsToUnlock);
        for (let i = 0; i < influencerIds.length; i++) {
            const profileId = influencerIds[i];
            const profile = await this.profileRepo.findOne({ where: { id: profileId } });
            const influencer = new entities_1.TieBreakerInfluencer();
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
            }
            else {
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
                }
                else {
                    throw new common_1.BadRequestException(`Influencer with ID ${profileId} not found in profiles or insights`);
                }
            }
            if (influencer.wasUnlocked) {
                const unlock = new unlocked_influencer_entity_1.UnlockedInfluencer();
                unlock.userId = userId;
                unlock.influencerId = profileId;
                unlock.platform = platform;
                unlock.unlockType = 'UNBLUR';
                unlock.creditsUsed = CREDIT_PER_UNBLUR;
                await this.unlockedRepo.save(unlock);
            }
            influencers.push(await this.influencerRepo.save(influencer));
        }
        return influencers;
    }
    async processComparison(comparisonId) {
        const comparison = await this.comparisonRepo.findOne({
            where: { id: comparisonId },
            relations: ['influencers'],
        });
        if (!comparison)
            return;
        try {
            for (const influencer of comparison.influencers) {
                const usedInsights = await this.populateFromInsights(influencer);
                if (!usedInsights) {
                    const usedCache = await this.populateFromCacheIfFresh(influencer);
                    if (!usedCache) {
                        if (this.modashService.isModashEnabled()) {
                            try {
                                await this.populateInfluencerFromModash(influencer);
                            }
                            catch (err) {
                                this.logger.warn(`Modash fetch failed for ${influencer.influencerUsername}: ${err instanceof Error ? err.message : err}`);
                            }
                        }
                        else {
                            this.logger.warn(`No data source available for ${influencer.influencerUsername} — Modash disabled, no insights/cache found`);
                        }
                    }
                }
                await this.influencerRepo.save(influencer);
            }
            comparison.status = entities_1.TieBreakerStatus.COMPLETED;
            comparison.completedAt = new Date();
            await this.comparisonRepo.save(comparison);
            if (comparison.creditsUsed > 0) {
                await this.creditsService.deductCredits(comparison.ownerId, {
                    actionType: enums_1.ActionType.PROFILE_UNLOCK,
                    quantity: Number(comparison.creditsUsed),
                    module: enums_1.ModuleType.TIE_BREAKER,
                    resourceId: comparisonId,
                    resourceType: 'influencer_comparison_unlock',
                });
                this.logger.log(`Tie breaker ${comparisonId}: charged ${comparison.creditsUsed} credits after success`);
            }
        }
        catch (error) {
            comparison.status = entities_1.TieBreakerStatus.FAILED;
            comparison.errorMessage = error instanceof Error ? error.message : 'Processing failed';
            await this.comparisonRepo.save(comparison);
            this.logger.error(`Tie breaker ${comparisonId} failed — NO credits charged`);
        }
    }
    extractStat(val, fallback = 0) {
        if (val == null)
            return fallback;
        if (typeof val === 'number')
            return val;
        if (typeof val === 'object') {
            if ('value' in val)
                return Number(val.value) || fallback;
            if ('compared' in val)
                return Number(val.compared) || fallback;
        }
        return Number(val) || fallback;
    }
    async populateFromCacheIfFresh(influencer) {
        if (!influencer.influencerProfileId)
            return false;
        const profile = await this.profileRepo.findOne({
            where: { id: influencer.influencerProfileId },
            relations: ['audienceData'],
        });
        if (!profile?.modashFetchedAt)
            return false;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (profile.modashFetchedAt < sevenDaysAgo)
            return false;
        this.logger.log(`Tie-breaker: using cached profile for ${influencer.influencerUsername} (fetched ${profile.modashFetchedAt.toISOString()}) — saved 1 Modash credit`);
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
        if (profile.rawModashData?.audience) {
            const aud = profile.rawModashData.audience;
            if (aud.genders?.length) {
                const male = aud.genders.find((g) => g.code === 'male');
                const female = aud.genders.find((g) => g.code === 'female');
                influencer.followersGenderData = {
                    male: male ? male.weight * 100 : 0,
                    female: female ? female.weight * 100 : 0,
                };
            }
            if (aud.ages?.length) {
                influencer.followersAgeData = aud.ages.map((a) => ({
                    ageRange: a.code,
                    male: a.weight * 50,
                    female: a.weight * 50,
                }));
            }
            if (aud.geoCountries?.length) {
                influencer.followersCountries = aud.geoCountries.map((g) => ({
                    country: g.name,
                    percentage: g.weight * 100,
                }));
            }
            if (aud.geoCities?.length) {
                influencer.followersCities = aud.geoCities.map((c) => ({
                    city: c.name,
                    percentage: c.weight * 100,
                }));
            }
            if (aud.interests?.length) {
                influencer.followersInterests = aud.interests.map((i) => ({
                    interest: i.name,
                    percentage: i.weight * 100,
                }));
            }
        }
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
    async populateFromInsights(influencer) {
        const username = influencer.influencerUsername || influencer.platformUserId;
        const profileId = influencer.influencerProfileId;
        let insight = profileId
            ? await this.insightRepo.findOne({ where: { id: profileId } })
            : null;
        if (!insight && username) {
            insight = await this.insightRepo.findOne({
                where: [
                    { username },
                    { platformUserId: username },
                ],
            });
        }
        if (!insight)
            return false;
        this.logger.log(`Tie-breaker: using existing insights for ${insight.username}`);
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
        if (insight.profilePictureUrl)
            influencer.profilePictureUrl = insight.profilePictureUrl;
        const aud = insight.audienceData || {};
        const rawCredibility = aud.credibility ?? Number(insight.audienceCredibility) ?? null;
        if (rawCredibility != null) {
            influencer.audienceQuality = rawCredibility <= 1 ? rawCredibility * 100 : rawCredibility;
        }
        influencer.notableFollowersPct = aud.notable != null ? aud.notable * 100 : (insight.notableFollowersPct ?? influencer.notableFollowersPct);
        const genders = aud.genders || aud.followers?.genderSplit;
        if (Array.isArray(genders) && genders.length) {
            const m = genders.find((g) => /^male$/i.test(g.code));
            const f = genders.find((g) => /^female$/i.test(g.code));
            influencer.followersGenderData = { male: m ? m.weight * 100 : 0, female: f ? f.weight * 100 : 0 };
        }
        else if (typeof genders === 'object' && genders && !Array.isArray(genders)) {
            influencer.followersGenderData = { male: (genders.male || 0) * 100, female: (genders.female || 0) * 100 };
        }
        const gendersPerAge = aud.gendersPerAge;
        if (Array.isArray(gendersPerAge) && gendersPerAge.length) {
            influencer.followersAgeData = gendersPerAge.map((a) => ({
                ageRange: a.code,
                male: (a.male || 0) * 100,
                female: (a.female || 0) * 100,
            }));
        }
        else {
            const ages = aud.ages || aud.followers?.ageGroups;
            if (Array.isArray(ages) && ages.length) {
                influencer.followersAgeData = ages.map((a) => ({ ageRange: a.code, male: a.weight * 50, female: a.weight * 50 }));
            }
        }
        const countries = aud.geoCountries || aud.followers?.topCountries;
        if (Array.isArray(countries) && countries.length) {
            influencer.followersCountries = countries.map((c) => ({ country: c.name, percentage: (c.weight || c.percentage || 0) * 100 }));
        }
        const cities = aud.geoCities || aud.followers?.topCities;
        if (Array.isArray(cities) && cities.length) {
            influencer.followersCities = cities.map((c) => ({ city: c.name, percentage: (c.weight || c.percentage || 0) * 100 }));
        }
        const interests = aud.interests || aud.followers?.interests;
        if (Array.isArray(interests) && interests.length) {
            influencer.followersInterests = interests.map((i) => ({ interest: i.name, percentage: (i.weight || 0) * 100 }));
        }
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
                const m = eGenders.find((g) => /^male$/i.test(g.code));
                const f = eGenders.find((g) => /^female$/i.test(g.code));
                influencer.engagersGenderData = { male: m ? m.weight * 100 : 0, female: f ? f.weight * 100 : 0 };
            }
            const eAges = eng.ages;
            if (Array.isArray(eAges) && eAges.length) {
                influencer.engagersAgeData = eAges.map((a) => ({ ageRange: a.code, male: a.weight * 50, female: a.weight * 50 }));
            }
            const eCountries = eng.geoCountries;
            if (Array.isArray(eCountries) && eCountries.length) {
                influencer.engagersCountries = eCountries.map((c) => ({ country: c.name, percentage: (c.weight || 0) * 100 }));
            }
            const eCities = eng.geoCities;
            if (Array.isArray(eCities) && eCities.length) {
                influencer.engagersCities = eCities.map((c) => ({ city: c.name, percentage: (c.weight || 0) * 100 }));
            }
            const eInterests = eng.interests;
            if (Array.isArray(eInterests) && eInterests.length) {
                influencer.engagersInterests = eInterests.map((i) => ({ interest: i.name, percentage: (i.weight || 0) * 100 }));
            }
        }
        else {
            if (influencer.followersGenderData)
                influencer.engagersGenderData = { ...influencer.followersGenderData };
            if (influencer.followersAgeData)
                influencer.engagersAgeData = [...influencer.followersAgeData];
            if (influencer.followersCountries)
                influencer.engagersCountries = [...influencer.followersCountries];
            if (influencer.followersCities)
                influencer.engagersCities = [...influencer.followersCities];
            if (influencer.followersInterests)
                influencer.engagersInterests = [...influencer.followersInterests];
        }
        const topPosts = [];
        const seenUrls = new Set();
        const followerCount = Number(insight.followerCount) || Number(influencer.followerCount) || 1;
        const addPosts = (list) => {
            for (const p of (list || [])) {
                if (topPosts.length >= 10)
                    break;
                const postUrl = p.url || '';
                if (postUrl && seenUrls.has(postUrl))
                    continue;
                if (postUrl)
                    seenUrls.add(postUrl);
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
        if (topPosts.length > 0)
            influencer.topPosts = topPosts;
        return true;
    }
    async populateInfluencerFromModash(influencer) {
        this.logger.log(`Fetching Modash report for tie-breaker influencer ${influencer.influencerUsername}`);
        try {
            const platformMap = {
                instagram: enums_1.PlatformType.INSTAGRAM,
                youtube: enums_1.PlatformType.YOUTUBE,
                tiktok: enums_1.PlatformType.TIKTOK,
            };
            const platform = platformMap[influencer.platform?.toLowerCase()] || enums_1.PlatformType.INSTAGRAM;
            const report = await this.modashService.getInfluencerReport(platform, influencer.platformUserId || influencer.influencerUsername || '');
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
        }
        catch (error) {
            this.logger.warn(`Failed to fetch Modash data for ${influencer.influencerUsername}: ${error instanceof Error ? error.message : error}`);
            throw error;
        }
    }
    async getComparisons(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.comparisonRepo.createQueryBuilder('comparison')
            .leftJoinAndSelect('comparison.influencers', 'influencers')
            .leftJoinAndSelect('comparison.createdBy', 'createdBy');
        if (filters.createdBy === 'ME') {
            queryBuilder.where('comparison.createdById = :userId', { userId });
        }
        else if (filters.createdBy === 'TEAM') {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('comparison.createdById IN (:...teamUserIds)', { teamUserIds });
        }
        else {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('(comparison.createdById = :userId OR comparison.createdById IN (:...teamUserIds))', { userId, teamUserIds });
        }
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere('comparison.platform = :platform', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('comparison.status = :status', { status: filters.status });
        }
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
    async getComparisonById(userId, comparisonId) {
        const comparison = await this.comparisonRepo.findOne({
            where: { id: comparisonId },
            relations: ['influencers', 'owner', 'createdBy'],
        });
        if (!comparison) {
            throw new common_1.NotFoundException('Comparison not found');
        }
        await this.checkComparisonAccess(userId, comparison);
        return this.toDetailDto(comparison);
    }
    async getComparisonByShareToken(token) {
        const comparison = await this.comparisonRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['influencers'],
        });
        if (!comparison) {
            throw new common_1.NotFoundException('Comparison not found or not publicly shared');
        }
        return this.toDetailDto(comparison);
    }
    async updateComparison(userId, comparisonId, dto) {
        const comparison = await this.comparisonRepo.findOne({
            where: { id: comparisonId },
            relations: ['influencers'],
        });
        if (!comparison) {
            throw new common_1.NotFoundException('Comparison not found');
        }
        await this.checkComparisonAccess(userId, comparison, 'edit');
        if (dto.title !== undefined)
            comparison.title = dto.title;
        if (dto.isPublic !== undefined)
            comparison.isPublic = dto.isPublic;
        const savedComparison = await this.comparisonRepo.save(comparison);
        return { success: true, comparison: savedComparison };
    }
    async deleteComparison(userId, comparisonId) {
        const comparison = await this.comparisonRepo.findOne({ where: { id: comparisonId } });
        if (!comparison) {
            throw new common_1.NotFoundException('Comparison not found');
        }
        await this.checkComparisonAccess(userId, comparison, 'edit');
        await this.comparisonRepo.remove(comparison);
        return { success: true };
    }
    async shareComparison(userId, comparisonId, dto) {
        const comparison = await this.comparisonRepo.findOne({ where: { id: comparisonId } });
        if (!comparison) {
            throw new common_1.NotFoundException('Comparison not found');
        }
        await this.checkComparisonAccess(userId, comparison, 'edit');
        if (dto.makePublic) {
            comparison.isPublic = true;
            await this.comparisonRepo.save(comparison);
        }
        if (dto.sharedWithUserId) {
            const existingShare = await this.shareRepo.findOne({
                where: { comparisonId, sharedWithUserId: dto.sharedWithUserId },
            });
            if (!existingShare) {
                const share = new entities_1.TieBreakerShare();
                share.comparisonId = comparisonId;
                share.sharedWithUserId = dto.sharedWithUserId;
                share.sharedByUserId = userId;
                share.permissionLevel = dto.permissionLevel || entities_1.TieBreakerSharePermission.VIEW;
                await this.shareRepo.save(share);
            }
        }
        const shareUrl = `/tie-breaker/shared/${comparison.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allComparisons = await this.comparisonRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
            relations: ['influencers'],
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const comparisonsThisMonth = allComparisons.filter(c => c.createdAt >= startOfMonth).length;
        const totalInfluencers = allComparisons.reduce((sum, c) => sum + (c.influencers?.length || 0), 0);
        const totalCredits = allComparisons.reduce((sum, c) => sum + Number(c.creditsUsed || 0), 0);
        return {
            totalComparisons: allComparisons.length,
            completedComparisons: allComparisons.filter(c => c.status === entities_1.TieBreakerStatus.COMPLETED).length,
            pendingComparisons: allComparisons.filter(c => c.status === entities_1.TieBreakerStatus.PENDING).length,
            processingComparisons: allComparisons.filter(c => c.status === entities_1.TieBreakerStatus.PROCESSING).length,
            failedComparisons: allComparisons.filter(c => c.status === entities_1.TieBreakerStatus.FAILED).length,
            comparisonsThisMonth,
            totalInfluencersCompared: totalInfluencers,
            totalCreditsUsed: totalCredits,
        };
    }
    async searchInfluencers(userId, platform, query, limit = 20) {
        const safePlatform = (platform || 'INSTAGRAM').toUpperCase();
        const likeQ = query ? `%${query.toLowerCase()}%` : null;
        const profileQb = this.profileRepo.createQueryBuilder('profile')
            .where('profile.platform = :platform', { platform: safePlatform });
        if (likeQ) {
            profileQb.andWhere('(LOWER(profile.username) LIKE :query OR LOWER(profile.fullName) LIKE :query)', { query: likeQ });
        }
        profileQb.orderBy('profile.followerCount', 'DESC').take(limit);
        const profiles = await profileQb.getMany();
        const insightQb = this.insightRepo.createQueryBuilder('i')
            .where('i.platform = :platform', { platform: safePlatform });
        if (likeQ) {
            insightQb.andWhere('(LOWER(i.username) LIKE :query OR LOWER(i.fullName) LIKE :query)', { query: likeQ });
        }
        insightQb.orderBy('i.followerCount', 'DESC').take(limit);
        const insights = await insightQb.getMany();
        const seen = new Set();
        const merged = [];
        for (const p of profiles) {
            const key = (p.username || '').toLowerCase();
            if (seen.has(key))
                continue;
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
            if (seen.has(key))
                continue;
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
        const profileIds = results.filter(r => r._source === 'profile').map(r => r.id);
        const unlockedProfiles = profileIds.length > 0
            ? await this.unlockedRepo.find({ where: { userId, influencerId: (0, typeorm_2.In)(profileIds) } })
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
    async getComparisonForDownload(userId, comparisonId) {
        return this.getComparisonById(userId, comparisonId);
    }
    async getClientUserIds(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return [userId];
        const adminId = user.parentId || userId;
        const clientUsers = await this.userRepo.find({
            where: [
                { id: adminId },
                { parentId: adminId },
            ],
        });
        return [...new Set([userId, ...clientUsers.map(u => u.id)])];
    }
    async getTeamUserIds(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return [userId];
        const teamMembers = await this.userRepo.find({
            where: [
                { id: user.parentId || undefined },
                { parentId: userId },
                { parentId: user.parentId || undefined },
            ],
        });
        return [userId, ...teamMembers.map(m => m.id)];
    }
    async checkComparisonAccess(userId, comparison, level = 'view') {
        if (comparison.ownerId === userId || comparison.createdById === userId)
            return;
        const share = await this.shareRepo.findOne({
            where: { comparisonId: comparison.id, sharedWithUserId: userId },
        });
        if (share) {
            if (level === 'edit' && share.permissionLevel === entities_1.TieBreakerSharePermission.VIEW) {
                throw new common_1.ForbiddenException('Edit access required');
            }
            return;
        }
        const teamUserIds = await this.getTeamUserIds(userId);
        if (teamUserIds.includes(comparison.createdById)) {
            if (level === 'edit') {
                throw new common_1.ForbiddenException('Cannot edit team member comparisons');
            }
            return;
        }
        throw new common_1.ForbiddenException('No access to this comparison');
    }
    toSummaryDto(comparison) {
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
    toDetailDto(comparison) {
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
    toInfluencerDto(influencer) {
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
};
exports.TieBreakerService = TieBreakerService;
exports.TieBreakerService = TieBreakerService = TieBreakerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerComparison)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerShare)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(influencer_profile_entity_1.InfluencerProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(unlocked_influencer_entity_1.UnlockedInfluencer)),
    __param(6, (0, typeorm_1.InjectRepository)(influencer_insight_entity_1.InfluencerInsight)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        modash_service_1.ModashService])
], TieBreakerService);
//# sourceMappingURL=tie-breaker.service.js.map