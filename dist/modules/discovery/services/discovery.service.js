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
const crypto_1 = require("crypto");
const enums_1 = require("../../../common/enums");
const credits_service_1 = require("../../credits/credits.service");
const insights_service_1 = require("../../insights/insights.service");
const user_entity_1 = require("../../users/entities/user.entity");
const unlocked_influencer_entity_1 = require("../../credits/entities/unlocked-influencer.entity");
const entities_1 = require("../entities");
const modash_service_1 = require("./modash.service");
const CREDIT_PER_UNBLUR = 0.04;
const CREDIT_PER_INSIGHT = 1;
const CREDIT_PER_REFRESH = 1;
const CREDIT_PER_EXPORT_INFLUENCER = 0.04;
const RESULTS_PER_PAGE = 10;
const SEARCH_CACHE_TTL_DAYS = 30;
const MODASH_RESULTS_PER_PAGE = 25;
const AUTO_UNBLUR_COUNT = 3;
let DiscoveryService = DiscoveryService_1 = class DiscoveryService {
    constructor(profileRepository, searchRepository, searchResultRepository, insightsAccessRepository, audienceDataRepository, unlockedInfluencerRepository, exportRecordRepository, userRepository, modashService, creditsService, dataSource, insightsService) {
        this.profileRepository = profileRepository;
        this.searchRepository = searchRepository;
        this.searchResultRepository = searchResultRepository;
        this.insightsAccessRepository = insightsAccessRepository;
        this.audienceDataRepository = audienceDataRepository;
        this.unlockedInfluencerRepository = unlockedInfluencerRepository;
        this.exportRecordRepository = exportRecordRepository;
        this.userRepository = userRepository;
        this.modashService = modashService;
        this.creditsService = creditsService;
        this.dataSource = dataSource;
        this.insightsService = insightsService;
        this.logger = new common_1.Logger(DiscoveryService_1.name);
        this.dictCache = new Map();
        this.DICT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
    }
    async searchInfluencers(userId, dto) {
        if (this.modashService.isModashEnabled()) {
            return this.searchInfluencersViaModash(userId, dto);
        }
        else {
            return this.searchInfluencersFromLocalDB(userId, dto);
        }
    }
    generateSearchCacheKey(dto) {
        const cachePayload = {
            platform: dto.platform,
            influencer: dto.influencer || {},
            audience: dto.audience || {},
            sort: dto.sort || {},
            page: dto.page || 0,
        };
        return (0, crypto_1.createHash)('sha256')
            .update(JSON.stringify(cachePayload))
            .digest('hex');
    }
    async searchInfluencersViaModash(userId, dto) {
        const cacheKey = this.generateSearchCacheKey(dto);
        const cacheCutoff = new Date();
        cacheCutoff.setDate(cacheCutoff.getDate() - SEARCH_CACHE_TTL_DAYS);
        const cachedSearch = await this.searchRepository.findOne({
            where: {
                status: entities_1.SearchStatus.COMPLETED,
                filtersApplied: (0, typeorm_2.Raw)((alias) => `${alias} @> :cacheFilter::jsonb`, { cacheFilter: JSON.stringify({ _cacheKey: cacheKey }) }),
                createdAt: (0, typeorm_2.MoreThan)(cacheCutoff),
            },
            order: { createdAt: 'DESC' },
        });
        if (cachedSearch) {
            this.logger.log(`Search cache HIT (key=${cacheKey.substring(0, 12)}…) — serving from DB, 0 Modash credits`);
            return this.serveCachedSearch(userId, cachedSearch, dto.platform);
        }
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
            status: entities_1.SearchStatus.IN_PROGRESS,
        });
        await this.searchRepository.save(search);
        try {
            const modashResponse = await this.modashService.searchInfluencers(dto, userId);
            const { profiles } = await this.storeSearchResults(search, modashResponse, userId);
            const balanceAfterSearch = await this.creditsService.getBalance(userId);
            search.status = entities_1.SearchStatus.COMPLETED;
            search.resultCount = modashResponse.lookalikes.length;
            search.totalAvailable = modashResponse.total;
            search.hasMore = modashResponse.hasMore;
            search.creditsUsed = 0;
            await this.searchRepository.save(search);
            const unlockedProfileIds = await this.getUnlockedProfileIds(userId, dto.platform);
            const results = profiles
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
        }
        catch (error) {
            search.status = entities_1.SearchStatus.FAILED;
            search.errorMessage = error.message;
            await this.searchRepository.save(search);
            throw error;
        }
    }
    async serveCachedSearch(userId, cachedSearch, platform) {
        const searchResults = await this.searchResultRepository.find({
            where: { searchId: cachedSearch.id },
            order: { rankPosition: 'ASC' },
        });
        const profileIds = searchResults.map((sr) => sr.influencerProfileId);
        const profiles = profileIds.length > 0
            ? await this.profileRepository.find({ where: { id: (0, typeorm_2.In)(profileIds) } })
            : [];
        const profileMap = new Map(profiles.map((p) => [p.id, p]));
        const unlockedProfileIds = await this.getUnlockedProfileIds(userId, platform);
        const balance = await this.creditsService.getBalance(userId);
        const results = searchResults
            .slice(0, RESULTS_PER_PAGE)
            .map((sr, index) => {
            const profile = profileMap.get(sr.influencerProfileId);
            if (!profile)
                return null;
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
            .filter(Boolean);
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
    async searchInfluencersFromLocalDB(userId, dto) {
        const pageSize = RESULTS_PER_PAGE;
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
                const typeMap = { 1: 'REGULAR', 2: 'BUSINESS', 3: 'CREATOR' };
                const mapped = filters.accountTypes.map(t => typeMap[t] || t).filter(Boolean);
                if (mapped.length > 0) {
                    queryBuilder.andWhere('profile.accountType IN (:...accountTypes)', {
                        accountTypes: mapped,
                    });
                }
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
        let modashReport;
        if (isModashEnabled) {
            const isFresh = profile.modashFetchedAt &&
                (Date.now() - new Date(profile.modashFetchedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
            if (isFirstAccess) {
                const balance = await this.creditsService.getBalance(userId);
                if (balance.unifiedBalance < CREDIT_PER_INSIGHT) {
                    throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_INSIGHT}, Available: ${balance.unifiedBalance}`);
                }
            }
            const hasFetchedBefore = profile.modashFetchedAt &&
                new Date(profile.modashFetchedAt).getTime() > 86400000;
            if (!hasFetchedBefore && isFirstAccess) {
                modashReport = await this.modashService.getInfluencerReport(profile.platform, profile.platformUserId, userId);
                await this.updateProfileFromReport(profile, modashReport);
            }
            if (isFirstAccess) {
                await this.creditsService.deductCredits(userId, {
                    actionType: enums_1.ActionType.INFLUENCER_INSIGHT,
                    module: enums_1.ModuleType.UNIFIED_BALANCE,
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
            if (refreshedProfile)
                updatedProfile = refreshedProfile;
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
        const insightId = await this.insightsService.ensureInsightRecordForDiscoveryProfile(userId, updatedProfile, modashReport);
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
        const clientUserIds = await this.getClientUserIds(userId);
        const access = await this.insightsAccessRepository.findOne({
            where: clientUserIds.map((uid) => ({
                userId: uid,
                influencerProfileId: profileId,
            })),
        });
        if (!access) {
            throw new common_1.ForbiddenException('You must view insights first before refreshing');
        }
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < CREDIT_PER_REFRESH) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REFRESH}, Available: ${balance.unifiedBalance}`);
        }
        const isFresh = profile.modashFetchedAt &&
            (Date.now() - new Date(profile.modashFetchedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
        if (!isFresh) {
            const report = await this.modashService.getInfluencerReport(profile.platform, profile.platformUserId, userId);
            await this.updateProfileFromReport(profile, report);
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
        let { profileIds, format, fileName, excludePreviouslyExported } = dto;
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
        const unlockedIds = await this.getUnlockedProfileIds(userId, null);
        const notUnlocked = profileIds.filter((id) => !unlockedIds.has(id));
        if (notUnlocked.length > 0) {
            throw new common_1.ForbiddenException(`Some profiles are not unlocked. Please unblur them first.`);
        }
        const creditsNeeded = profileIds.length * CREDIT_PER_EXPORT_INFLUENCER;
        const balance = await this.creditsService.getBalance(userId);
        if (balance.unifiedBalance < creditsNeeded) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditsNeeded.toFixed(2)}, Available: ${balance.unifiedBalance}`);
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
    async getExportHistory(userId) {
        const exports = await this.exportRecordRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            take: 50,
        });
        const allExportedProfileIds = new Set();
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
    async getExportCostEstimate(userId, profileIds, excludePreviouslyExported) {
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
    async checkInsightsAccess(userId, profileId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return { hasAccess: false, creditCost: CREDIT_PER_INSIGHT };
        }
        const clientUserIds = await this.getClientUserIds(userId);
        const existingAccess = await this.insightsAccessRepository.findOne({
            where: clientUserIds.map((uid) => ({
                userId: uid,
                influencerProfileId: profileId,
            })),
        });
        if (existingAccess) {
            const insightId = (await this.insightsService.findOrEnsureInsightIdForProfile(userId, profileId)) ?? undefined;
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
        const cacheKey = `locations_${query || 'all'}`;
        const cached = this.getCachedDict(cacheKey);
        if (cached)
            return cached;
        const result = await this.modashService.getLocations(query);
        this.setCachedDict(cacheKey, result);
        return result;
    }
    getCachedDict(key) {
        const entry = this.dictCache.get(key);
        if (entry && Date.now() < entry.expiresAt)
            return entry.data;
        this.dictCache.delete(key);
        return null;
    }
    setCachedDict(key, data) {
        this.dictCache.set(key, { data, expiresAt: Date.now() + this.DICT_CACHE_TTL_MS });
    }
    async getInterests(platform) {
        if (!this.modashService.isModashEnabled()) {
            return { interests: [], message: 'Modash integration disabled - no live data available' };
        }
        const cacheKey = `interests_${platform}`;
        const cached = this.getCachedDict(cacheKey);
        if (cached)
            return cached;
        const result = await this.modashService.getInterests(platform);
        this.setCachedDict(cacheKey, result);
        return result;
    }
    async getLanguages() {
        if (!this.modashService.isModashEnabled()) {
            return { languages: [], message: 'Modash integration disabled - no live data available' };
        }
        const cached = this.getCachedDict('languages');
        if (cached)
            return cached;
        const result = await this.modashService.getLanguages();
        this.setCachedDict('languages', result);
        return result;
    }
    async getBrands(query) {
        if (!this.modashService.isModashEnabled()) {
            return { brands: [], message: 'Modash integration disabled - no live data available' };
        }
        if (!query) {
            const cached = this.getCachedDict('brands_all');
            if (cached)
                return cached;
        }
        const result = await this.modashService.getBrands(query);
        if (!query)
            this.setCachedDict('brands_all', result);
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
    async getPreviouslyExportedProfileIds(userId) {
        const exports = await this.exportRecordRepository.find({
            where: { userId },
            select: ['profileIds'],
        });
        const ids = new Set();
        exports.forEach((e) => e.profileIds.forEach((id) => ids.add(id)));
        return ids;
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
            profile.modashFetchedAt = new Date(0);
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
        const profileAny = modash.profile;
        profile.followerCount = modash.stats?.followers || profileAny?.followers || 0;
        profile.followingCount = modash.stats?.following || 0;
        profile.postCount = modash.stats?.posts || 0;
        profile.engagementRate = modash.stats?.engagementRate || profileAny?.engagementRate || null;
        profile.avgLikes = modash.stats?.avgLikes || 0;
        profile.avgComments = modash.stats?.avgComments || 0;
        profile.avgViews = modash.stats?.avgViews || 0;
        profile.audienceCredibility = modash.audience?.credibility || null;
        profile.rawModashData = modash;
    }
    extractStatValue(stat) {
        if (stat == null)
            return null;
        if (typeof stat === 'number')
            return stat;
        if (typeof stat === 'object' && 'value' in stat)
            return stat.value;
        return null;
    }
    async updateProfileFromReport(profile, report) {
        const r = report;
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
        }
        if (r.contacts && Array.isArray(r.contacts) && r.contacts.length > 0) {
            const emailContact = r.contacts.find((c) => c.type === 'email');
            if (emailContact)
                profile.contactEmail = emailContact.value;
        }
        const innerProfile = report.profile;
        profile.followerCount =
            innerProfile?.followers ??
                this.extractStatValue(r.stats?.followers) ??
                profile.followerCount ?? 0;
        profile.engagementRate =
            innerProfile?.engagementRate ??
                profile.engagementRate ?? null;
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
        if (r.audience?.geoCountries?.length > 0) {
            profile.locationCountry = profile.locationCountry ?? r.audience.geoCountries[0].name;
        }
        profile.rawModashData = report;
        profile.modashFetchedAt = new Date();
        await this.profileRepository.save(profile);
        if (r.audience) {
            await this.updateAudienceData(profile.id, r.audience);
        }
    }
    async updateAudienceData(profileId, audience) {
        if (!audience)
            return;
        await this.audienceDataRepository.delete({ profileId });
        const audienceRecords = [];
        const pushIfValid = (dataType, key, weight) => {
            if (key && weight != null) {
                audienceRecords.push({ profileId, dataType, categoryKey: key, percentage: weight * 100 });
            }
        };
        if (audience.genders) {
            for (const g of audience.genders)
                pushIfValid(entities_1.AudienceDataType.GENDER, g.code, g.weight);
        }
        if (audience.ages) {
            for (const a of audience.ages)
                pushIfValid(entities_1.AudienceDataType.AGE, a.code, a.weight);
        }
        if (audience.geoCountries) {
            for (const c of audience.geoCountries)
                pushIfValid(entities_1.AudienceDataType.LOCATION_COUNTRY, c.name || c.code, c.weight);
        }
        if (audience.geoCities) {
            for (const c of audience.geoCities)
                pushIfValid(entities_1.AudienceDataType.LOCATION_CITY, c.name || c.code, c.weight);
        }
        if (audience.interests) {
            for (const i of audience.interests)
                pushIfValid(entities_1.AudienceDataType.INTEREST, i.name, i.weight);
        }
        if (audience.languages) {
            for (const l of audience.languages)
                pushIfValid(entities_1.AudienceDataType.LANGUAGE, l.name || l.code, l.weight);
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
        if (user.role === enums_1.UserRole.ADMIN) {
            const children = await this.userRepository.find({
                where: { parentId: userId },
                select: ['id'],
            });
            userIdsToCheck.push(...children.map((c) => c.id));
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
    async getClientUserIds(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return [userId];
        const adminId = user.role === enums_1.UserRole.ADMIN ? userId : user.parentId;
        if (!adminId)
            return [userId];
        const children = await this.userRepository.find({
            where: { parentId: adminId },
            select: ['id'],
        });
        return [adminId, ...children.map((c) => c.id)];
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
    __param(6, (0, typeorm_1.InjectRepository)(entities_1.ExportRecord)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(11, (0, common_1.Inject)((0, common_1.forwardRef)(() => insights_service_1.InsightsService))),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        modash_service_1.ModashService,
        credits_service_1.CreditsService,
        typeorm_2.DataSource,
        insights_service_1.InsightsService])
], DiscoveryService);
//# sourceMappingURL=discovery.service.js.map