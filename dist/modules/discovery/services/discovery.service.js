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
var DiscoveryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoveryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const enums_1 = require("../../../common/enums");
const credits_service_1 = require("../../credits/credits.service");
const user_entity_1 = require("../../users/entities/user.entity");
const unlocked_influencer_entity_1 = require("../../credits/entities/unlocked-influencer.entity");
const entities_1 = require("../entities");
const modash_service_1 = require("./modash.service");
const CREDIT_PER_SEARCH_RESULT = 0.01;
const CREDIT_PER_UNBLUR = 0.04;
const CREDIT_PER_INSIGHT = 1;
const CREDIT_PER_REFRESH = 1;
const CREDIT_PER_EXPORT = 0.04;
let DiscoveryService = DiscoveryService_1 = class DiscoveryService {
    constructor(profileRepository, searchRepository, searchResultRepository, insightsAccessRepository, audienceDataRepository, unlockedInfluencerRepository, userRepository, modashService, creditsService, dataSource) {
        this.profileRepository = profileRepository;
        this.searchRepository = searchRepository;
        this.searchResultRepository = searchResultRepository;
        this.insightsAccessRepository = insightsAccessRepository;
        this.audienceDataRepository = audienceDataRepository;
        this.unlockedInfluencerRepository = unlockedInfluencerRepository;
        this.userRepository = userRepository;
        this.modashService = modashService;
        this.creditsService = creditsService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(DiscoveryService_1.name);
    }
    async searchInfluencers(userId, dto) {
        if (this.modashService.isModashEnabled()) {
            return this.searchInfluencersViaModash(userId, dto);
        }
        else {
            return this.searchInfluencersFromLocalDB(userId, dto);
        }
    }
    async searchInfluencersViaModash(userId, dto) {
        const balance = await this.creditsService.getBalance(userId);
        const estimatedCredits = 15 * CREDIT_PER_SEARCH_RESULT;
        if (balance.unifiedBalance < estimatedCredits) {
            throw new common_1.BadRequestException(`Insufficient credits. Minimum required: ${estimatedCredits}, Available: ${balance.unifiedBalance}`);
        }
        const search = this.searchRepository.create({
            userId,
            platform: dto.platform,
            filtersApplied: {
                influencer: dto.influencer,
                audience: dto.audience,
                sort: dto.sort,
            },
            page: dto.page || 0,
            status: entities_1.SearchStatus.IN_PROGRESS,
        });
        await this.searchRepository.save(search);
        try {
            const modashResponse = await this.modashService.searchInfluencers(dto, userId);
            const { profiles, searchResults } = await this.storeSearchResults(search, modashResponse, userId);
            const creditsToDeduct = modashResponse.lookalikes.length * CREDIT_PER_SEARCH_RESULT;
            const deductResult = await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.INFLUENCER_SEARCH,
                module: enums_1.ModuleType.UNIFIED_BALANCE,
                quantity: modashResponse.lookalikes.length,
                resourceId: search.id,
                resourceType: 'discovery_search',
            });
            search.status = entities_1.SearchStatus.COMPLETED;
            search.resultCount = modashResponse.lookalikes.length;
            search.totalAvailable = modashResponse.total;
            search.hasMore = modashResponse.hasMore;
            search.creditsUsed = creditsToDeduct;
            await this.searchRepository.save(search);
            const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);
            const results = profiles.map((profile, index) => ({
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
        }
        catch (error) {
            search.status = entities_1.SearchStatus.FAILED;
            search.errorMessage = error.message;
            await this.searchRepository.save(search);
            throw error;
        }
    }
    async searchInfluencersFromLocalDB(userId, dto) {
        const pageSize = 15;
        const page = dto.page || 0;
        const queryBuilder = this.profileRepository
            .createQueryBuilder('profile')
            .where('profile.platform = :platform', { platform: dto.platform });
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
            if (filters.engagementRate !== undefined && filters.engagementRate !== null) {
                queryBuilder.andWhere('profile.engagementRate >= :minEr', {
                    minEr: filters.engagementRate * 100,
                });
            }
            if (filters.isVerified !== undefined) {
                queryBuilder.andWhere('profile.isVerified = :isVerified', {
                    isVerified: filters.isVerified,
                });
            }
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
        if (dto.sort?.field) {
            const sortFieldMap = {
                followers: 'profile.followerCount',
                engagementRate: 'profile.engagementRate',
                avgLikes: 'profile.avgLikes',
                avgViews: 'profile.avgViews',
                avgComments: 'profile.avgComments',
            };
            const sortField = sortFieldMap[dto.sort.field] || 'profile.followerCount';
            queryBuilder.orderBy(sortField, dto.sort.direction === 'asc' ? 'ASC' : 'DESC');
        }
        else {
            queryBuilder.orderBy('profile.followerCount', 'DESC');
        }
        const totalCount = await queryBuilder.getCount();
        queryBuilder.skip(page * pageSize).take(pageSize);
        const profiles = await queryBuilder.getMany();
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
            status: entities_1.SearchStatus.COMPLETED,
            resultCount: profiles.length,
            totalAvailable: totalCount,
            hasMore: (page + 1) * pageSize < totalCount,
            creditsUsed: 0,
        });
        await this.searchRepository.save(search);
        for (let i = 0; i < profiles.length; i++) {
            const searchResult = this.searchResultRepository.create({
                searchId: search.id,
                influencerProfileId: profiles[i].id,
                rankPosition: i + 1,
                isBlurred: true,
            });
            await this.searchResultRepository.save(searchResult);
        }
        const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);
        const results = profiles.map((profile, index) => ({
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
            creditsUsed: 0,
            remainingBalance: balance.unifiedBalance,
        };
    }
    async unblurInfluencers(userId, dto) {
        const { profileIds, platform } = dto;
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
        const creditsNeeded = toUnlock.length * CREDIT_PER_UNBLUR;
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < creditsNeeded) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditsNeeded}, Available: ${balance.unifiedBalance}`);
        }
        const profiles = await this.profileRepository.find({
            where: { id: (0, typeorm_2.In)(toUnlock), platform },
        });
        if (profiles.length !== toUnlock.length) {
            throw new common_1.NotFoundException('Some influencer profiles not found');
        }
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
    async viewInsights(userId, profileId) {
        const profile = await this.profileRepository.findOne({
            where: { id: profileId },
            relations: ['audienceData'],
        });
        if (!profile) {
            throw new common_1.NotFoundException('Influencer profile not found');
        }
        const existingAccess = await this.insightsAccessRepository.findOne({
            where: { userId, influencerProfileId: profileId },
        });
        let isFirstAccess = !existingAccess;
        let creditsCharged = 0;
        const isModashEnabled = this.modashService.isModashEnabled();
        if (isFirstAccess && isModashEnabled) {
            const balance = await this.creditsService.getBalance(userId);
            if (balance.unifiedBalance < CREDIT_PER_INSIGHT) {
                throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_INSIGHT}, Available: ${balance.unifiedBalance}`);
            }
            await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.INFLUENCER_INSIGHT,
                module: enums_1.ModuleType.UNIFIED_BALANCE,
                quantity: 1,
                resourceId: profileId,
                resourceType: 'influencer_profile',
            });
            creditsCharged = CREDIT_PER_INSIGHT;
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
        }
        else if (existingAccess) {
            existingAccess.accessCount += 1;
            existingAccess.lastAccessedAt = new Date();
            await this.insightsAccessRepository.save(existingAccess);
        }
        let updatedProfile = profile;
        if (isModashEnabled) {
            const report = await this.modashService.getInfluencerReport(profile.platform, profile.platformUserId, userId);
            await this.updateProfileFromReport(profile, report);
            const refreshedProfile = await this.profileRepository.findOne({
                where: { id: profileId },
                relations: ['audienceData'],
            });
            if (!refreshedProfile) {
                throw new common_1.NotFoundException('Profile not found after update');
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
    async refreshInsights(userId, profileId) {
        if (!this.modashService.isModashEnabled()) {
            throw new common_1.BadRequestException('Refresh is not available in offline mode. Modash integration is disabled.');
        }
        const profile = await this.profileRepository.findOne({
            where: { id: profileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Influencer profile not found');
        }
        const access = await this.insightsAccessRepository.findOne({
            where: { userId, influencerProfileId: profileId },
        });
        if (!access) {
            throw new common_1.ForbiddenException('You must view insights first before refreshing');
        }
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < CREDIT_PER_REFRESH) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REFRESH}, Available: ${balance.unifiedBalance}`);
        }
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_REFRESH,
            module: enums_1.ModuleType.UNIFIED_BALANCE,
            quantity: 1,
            resourceId: profileId,
            resourceType: 'influencer_profile',
        });
        access.refreshCount += 1;
        access.lastRefreshAt = new Date();
        await this.insightsAccessRepository.save(access);
        const report = await this.modashService.getInfluencerReport(profile.platform, profile.platformUserId, userId);
        await this.updateProfileFromReport(profile, report);
        const updatedProfile = await this.profileRepository.findOne({
            where: { id: profileId },
            relations: ['audienceData'],
        });
        if (!updatedProfile) {
            throw new common_1.NotFoundException('Profile not found after refresh');
        }
        const newBalance = await this.creditsService.getBalance(userId);
        return {
            success: true,
            creditsCharged: CREDIT_PER_REFRESH,
            remainingBalance: newBalance.unifiedBalance,
            insights: this.mapToInsightsDto(updatedProfile),
        };
    }
    async getProfile(userId, profileId) {
        const profile = await this.profileRepository.findOne({
            where: { id: profileId },
        });
        if (!profile) {
            throw new common_1.NotFoundException('Influencer profile not found');
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
    async getSearchHistory(userId, page = 1, limit = 20) {
        const [searches, total] = await this.searchRepository.findAndCount({
            where: { userId, status: entities_1.SearchStatus.COMPLETED },
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
    async exportInfluencers(userId, dto) {
        const { profileIds, format } = dto;
        const unlockedIds = await this.getUnlockedProfileIds(userId, null);
        const notUnlocked = profileIds.filter((id) => !unlockedIds.has(id));
        if (notUnlocked.length > 0) {
            throw new common_1.ForbiddenException(`Some profiles are not unlocked. Please unblur them first.`);
        }
        const creditsNeeded = profileIds.length * CREDIT_PER_EXPORT;
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < creditsNeeded) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditsNeeded}, Available: ${balance.unifiedBalance}`);
        }
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.INFLUENCER_EXPORT,
            module: enums_1.ModuleType.UNIFIED_BALANCE,
            quantity: profileIds.length,
            resourceType: 'export',
        });
        const profiles = await this.profileRepository.find({
            where: { id: (0, typeorm_2.In)(profileIds) },
        });
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
    async getLocations(query) {
        if (!this.modashService.isModashEnabled()) {
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
            }
            catch (error) {
                this.logger.error('Error fetching local locations:', error);
                return { locations: [], message: 'Error fetching locations', source: 'local' };
            }
        }
        return this.modashService.getLocations(query);
    }
    async getInterests(platform) {
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
    async getBrands(query) {
        if (!this.modashService.isModashEnabled()) {
            return { brands: [], message: 'Modash integration disabled - no live data available' };
        }
        return this.modashService.getBrands(query);
    }
    async storeSearchResults(search, modashResponse, userId) {
        const profiles = [];
        const searchResults = [];
        for (let i = 0; i < modashResponse.lookalikes.length; i++) {
            const influencer = modashResponse.lookalikes[i];
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
            this.mapModashToProfile(profile, influencer);
            profile.modashFetchedAt = new Date();
            await this.profileRepository.save(profile);
            profiles.push(profile);
            const searchResult = this.searchResultRepository.create({
                searchId: search.id,
                influencerProfileId: profile.id,
                rankPosition: i + 1,
                isBlurred: true,
            });
            await this.searchResultRepository.save(searchResult);
            searchResults.push(searchResult);
        }
        return { profiles, searchResults };
    }
    mapModashToProfile(profile, modash) {
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
        profile.rawModashData = modash;
    }
    async updateProfileFromReport(profile, report) {
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
        profile.rawModashData = report;
        profile.modashFetchedAt = new Date();
        await this.profileRepository.save(profile);
        if (report.audience) {
            await this.updateAudienceData(profile.id, report.audience);
        }
    }
    async updateAudienceData(profileId, audience) {
        if (!audience)
            return;
        await this.audienceDataRepository.delete({ profileId });
        const audienceRecords = [];
        if (audience.genders) {
            for (const g of audience.genders) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.GENDER,
                    categoryKey: g.code,
                    percentage: g.weight * 100,
                });
            }
        }
        if (audience.ages) {
            for (const a of audience.ages) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.AGE,
                    categoryKey: a.code,
                    percentage: a.weight * 100,
                });
            }
        }
        if (audience.geoCountries) {
            for (const c of audience.geoCountries) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.LOCATION_COUNTRY,
                    categoryKey: c.name,
                    percentage: c.weight * 100,
                });
            }
        }
        if (audience.geoCities) {
            for (const c of audience.geoCities) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.LOCATION_CITY,
                    categoryKey: c.name,
                    percentage: c.weight * 100,
                });
            }
        }
        if (audience.interests) {
            for (const i of audience.interests) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.INTEREST,
                    categoryKey: i.name,
                    percentage: i.weight * 100,
                });
            }
        }
        if (audience.languages) {
            for (const l of audience.languages) {
                audienceRecords.push({
                    profileId,
                    dataType: entities_1.AudienceDataType.LANGUAGE,
                    categoryKey: l.name,
                    percentage: l.weight * 100,
                });
            }
        }
        for (const record of audienceRecords) {
            const entity = this.audienceDataRepository.create(record);
            await this.audienceDataRepository.save(entity);
        }
    }
    async getUnlockedProfileIds(userId, platform) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return new Set();
        const userIdsToCheck = [userId];
        if (user.parentId) {
            userIdsToCheck.push(user.parentId);
        }
        const whereClause = {
            userId: (0, typeorm_2.In)(userIdsToCheck),
        };
        if (platform) {
            whereClause.platform = platform;
        }
        const unlocked = await this.unlockedInfluencerRepository.find({
            where: whereClause,
        });
        const platformUserIds = unlocked.map((u) => u.influencerId);
        if (platformUserIds.length === 0)
            return new Set();
        const profiles = await this.profileRepository.find({
            where: { platformUserId: (0, typeorm_2.In)(platformUserIds) },
            select: ['id'],
        });
        return new Set(profiles.map((p) => p.id));
    }
    mapToInsightsDto(profile) {
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
    truncateBio(bio, maxLength = 100) {
        if (!bio)
            return '';
        if (bio.length <= maxLength)
            return bio;
        return bio.substring(0, maxLength) + '...';
    }
};
exports.DiscoveryService = DiscoveryService;
exports.DiscoveryService = DiscoveryService = DiscoveryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.InfluencerProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.DiscoverySearch)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.SearchResult)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.InsightsAccess)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.AudienceData)),
    __param(5, (0, typeorm_1.InjectRepository)(unlocked_influencer_entity_1.UnlockedInfluencer)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        modash_service_1.ModashService,
        credits_service_1.CreditsService,
        typeorm_2.DataSource])
], DiscoveryService);
//# sourceMappingURL=discovery.service.js.map