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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TieBreakerService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const unlocked_influencer_entity_1 = require("../credits/entities/unlocked-influencer.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const CREDIT_PER_UNBLUR = 1;
let TieBreakerService = class TieBreakerService {
    constructor(comparisonRepo, influencerRepo, shareRepo, userRepo, profileRepo, unlockedRepo, creditsService) {
        this.comparisonRepo = comparisonRepo;
        this.influencerRepo = influencerRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.unlockedRepo = unlockedRepo;
        this.creditsService = creditsService;
    }
    async createComparison(userId, dto) {
        if (dto.influencerIds.length < 2 || dto.influencerIds.length > 3) {
            throw new common_1.BadRequestException('You can compare 2 to 3 influencers at a time');
        }
        const unlockedInfluencers = await this.unlockedRepo.find({
            where: {
                userId,
                influencerId: (0, typeorm_2.In)(dto.influencerIds),
            },
        });
        const unlockedProfileIds = new Set(unlockedInfluencers.map(u => u.influencerId));
        const influencersToUnlock = dto.influencerIds.filter(id => !unlockedProfileIds.has(id));
        const creditsRequired = influencersToUnlock.length * CREDIT_PER_UNBLUR;
        if (creditsRequired > 0) {
            await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.PROFILE_UNLOCK,
                quantity: creditsRequired,
                module: enums_1.ModuleType.TIE_BREAKER,
                resourceId: 'tie-breaker-comparison',
                resourceType: 'influencer_comparison_unlock',
            });
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
        setTimeout(() => this.processComparison(savedComparison.id), 1500);
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
                influencer.influencerName = `Influencer ${i + 1}`;
                influencer.influencerUsername = `influencer_${i + 1}`;
                influencer.followerCount = Math.floor(Math.random() * 500000) + 50000;
                influencer.avgLikes = Math.floor(Math.random() * 10000) + 1000;
                influencer.avgViews = Math.floor(Math.random() * 50000) + 5000;
                influencer.avgComments = Math.floor(Math.random() * 500) + 50;
                influencer.engagementRate = Number((Math.random() * 5 + 1).toFixed(2));
                influencer.isVerified = Math.random() > 0.7;
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
                await this.populateInfluencerAudienceData(influencer);
                await this.influencerRepo.save(influencer);
            }
            comparison.status = entities_1.TieBreakerStatus.COMPLETED;
            comparison.completedAt = new Date();
            await this.comparisonRepo.save(comparison);
        }
        catch (error) {
            comparison.status = entities_1.TieBreakerStatus.FAILED;
            comparison.errorMessage = error.message || 'Processing failed';
            await this.comparisonRepo.save(comparison);
        }
    }
    async populateInfluencerAudienceData(influencer) {
        influencer.audienceQuality = Number((Math.random() * 30 + 60).toFixed(2));
        influencer.notableFollowersPct = Number((Math.random() * 10 + 2).toFixed(2));
        influencer.followersGenderData = {
            male: Math.floor(Math.random() * 30 + 30),
            female: 100 - Math.floor(Math.random() * 30 + 30),
        };
        influencer.followersAgeData = [
            { ageRange: '13-17', male: Math.random() * 10, female: Math.random() * 10 },
            { ageRange: '18-24', male: Math.random() * 20 + 10, female: Math.random() * 20 + 10 },
            { ageRange: '25-34', male: Math.random() * 25 + 15, female: Math.random() * 25 + 15 },
            { ageRange: '35-44', male: Math.random() * 15 + 5, female: Math.random() * 15 + 5 },
            { ageRange: '45-64', male: Math.random() * 10, female: Math.random() * 10 },
            { ageRange: '65+', male: Math.random() * 5, female: Math.random() * 5 },
        ];
        influencer.followersCountries = [
            { country: 'India', percentage: Math.random() * 30 + 30 },
            { country: 'United States', percentage: Math.random() * 15 + 10 },
            { country: 'United Kingdom', percentage: Math.random() * 10 + 5 },
            { country: 'Australia', percentage: Math.random() * 8 + 3 },
            { country: 'Canada', percentage: Math.random() * 6 + 2 },
            { country: 'Germany', percentage: Math.random() * 5 + 2 },
        ];
        influencer.followersCities = [
            { city: 'Mumbai', percentage: Math.random() * 15 + 10 },
            { city: 'Delhi', percentage: Math.random() * 12 + 8 },
            { city: 'Bangalore', percentage: Math.random() * 10 + 5 },
            { city: 'New York', percentage: Math.random() * 8 + 3 },
            { city: 'London', percentage: Math.random() * 6 + 2 },
            { city: 'Los Angeles', percentage: Math.random() * 5 + 2 },
        ];
        influencer.followersInterests = [
            { interest: 'Fashion', percentage: Math.random() * 20 + 20 },
            { interest: 'Lifestyle', percentage: Math.random() * 18 + 15 },
            { interest: 'Travel', percentage: Math.random() * 15 + 10 },
            { interest: 'Sports', percentage: Math.random() * 12 + 8 },
            { interest: 'Technology', percentage: Math.random() * 10 + 5 },
        ];
        influencer.engagersQuality = Number((Math.random() * 25 + 65).toFixed(2));
        influencer.notableEngagersPct = Number((Math.random() * 8 + 3).toFixed(2));
        influencer.engagersGenderData = {
            male: Math.floor(Math.random() * 25 + 35),
            female: 100 - Math.floor(Math.random() * 25 + 35),
        };
        influencer.engagersAgeData = [
            { ageRange: '13-17', male: Math.random() * 8, female: Math.random() * 8 },
            { ageRange: '18-24', male: Math.random() * 25 + 15, female: Math.random() * 25 + 15 },
            { ageRange: '25-34', male: Math.random() * 25 + 15, female: Math.random() * 25 + 15 },
            { ageRange: '35-44', male: Math.random() * 12 + 5, female: Math.random() * 12 + 5 },
            { ageRange: '45-64', male: Math.random() * 8, female: Math.random() * 8 },
            { ageRange: '65+', male: Math.random() * 3, female: Math.random() * 3 },
        ];
        influencer.engagersCountries = [
            { country: 'India', percentage: Math.random() * 35 + 30 },
            { country: 'United States', percentage: Math.random() * 12 + 8 },
            { country: 'United Kingdom', percentage: Math.random() * 8 + 4 },
            { country: 'Indonesia', percentage: Math.random() * 6 + 3 },
            { country: 'Brazil', percentage: Math.random() * 5 + 2 },
            { country: 'Turkey', percentage: Math.random() * 4 + 2 },
        ];
        influencer.engagersCities = [
            { city: 'Mumbai', percentage: Math.random() * 12 + 8 },
            { city: 'Delhi', percentage: Math.random() * 10 + 6 },
            { city: 'Kolkata', percentage: Math.random() * 8 + 4 },
            { city: 'Chennai', percentage: Math.random() * 6 + 3 },
            { city: 'Hyderabad', percentage: Math.random() * 5 + 2 },
            { city: 'Pune', percentage: Math.random() * 4 + 2 },
        ];
        influencer.engagersInterests = [
            { interest: 'Fashion', percentage: Math.random() * 22 + 18 },
            { interest: 'Beauty', percentage: Math.random() * 18 + 12 },
            { interest: 'Fitness', percentage: Math.random() * 14 + 8 },
            { interest: 'Music', percentage: Math.random() * 12 + 6 },
            { interest: 'Food', percentage: Math.random() * 10 + 5 },
        ];
        influencer.topPosts = [];
        for (let i = 0; i < 10; i++) {
            influencer.topPosts.push({
                postId: `post_${(0, uuid_1.v4)().substring(0, 8)}`,
                postUrl: `https://instagram.com/p/${(0, uuid_1.v4)().substring(0, 8)}`,
                thumbnailUrl: `https://picsum.photos/seed/${Math.random()}/300/300`,
                caption: `Amazing post #${i + 1} 🔥 #trending #viral`,
                likes: Math.floor(Math.random() * 50000) + 5000,
                comments: Math.floor(Math.random() * 2000) + 100,
                views: Math.floor(Math.random() * 200000) + 20000,
                engagementRate: Number((Math.random() * 8 + 2).toFixed(2)),
                isSponsored: i < 3,
                postDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
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
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/tie-breaker/shared/${comparison.shareUrlToken}`;
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
        const queryBuilder = this.profileRepo.createQueryBuilder('profile');
        queryBuilder.where('profile.platform = :platform', { platform: platform.toUpperCase() });
        if (query) {
            queryBuilder.andWhere('(LOWER(profile.username) LIKE :query OR LOWER(profile.fullName) LIKE :query)', { query: `%${query.toLowerCase()}%` });
        }
        queryBuilder.orderBy('profile.followerCount', 'DESC').take(limit);
        const profiles = await queryBuilder.getMany();
        const unlockedProfiles = await this.unlockedRepo.find({
            where: {
                userId,
                influencerId: (0, typeorm_2.In)(profiles.map(p => p.id)),
            },
        });
        const unlockedIds = new Set(unlockedProfiles.map(u => u.influencerId));
        return profiles.map(profile => ({
            id: profile.id,
            platform: profile.platform,
            platformUserId: profile.platformUserId,
            username: profile.username || '',
            fullName: profile.fullName || undefined,
            profilePictureUrl: profile.profilePictureUrl || undefined,
            followerCount: profile.followerCount || 0,
            engagementRate: profile.engagementRate ? Number(profile.engagementRate) : undefined,
            isVerified: profile.isVerified || false,
            isUnlocked: unlockedIds.has(profile.id),
            locationCountry: profile.locationCountry || undefined,
        }));
    }
    async getComparisonForDownload(userId, comparisonId) {
        return this.getComparisonById(userId, comparisonId);
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
exports.TieBreakerService = TieBreakerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerComparison)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.TieBreakerShare)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(influencer_profile_entity_1.InfluencerProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(unlocked_influencer_entity_1.UnlockedInfluencer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService])
], TieBreakerService);
//# sourceMappingURL=tie-breaker.service.js.map