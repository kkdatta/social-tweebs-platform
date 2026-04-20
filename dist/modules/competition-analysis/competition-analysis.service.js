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
var CompetitionAnalysisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompetitionAnalysisService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const modash_service_1 = require("../discovery/services/modash.service");
const CREDIT_PER_REPORT = 1;
const BRAND_COLORS = [
    '#4F46E5',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
];
let CompetitionAnalysisService = CompetitionAnalysisService_1 = class CompetitionAnalysisService {
    constructor(reportRepo, brandRepo, influencerRepo, postRepo, shareRepo, userRepo, creditsService, modashService) {
        this.reportRepo = reportRepo;
        this.brandRepo = brandRepo;
        this.influencerRepo = influencerRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
        this.modashService = modashService;
        this.logger = new common_1.Logger(CompetitionAnalysisService_1.name);
    }
    async createReport(userId, dto) {
        if (dto.brands.length < 2 || dto.brands.length > 5) {
            throw new common_1.BadRequestException('Competition analysis requires 2-5 brands');
        }
        for (const brand of dto.brands) {
            if (!brand.hashtags?.length && !brand.username && !brand.keywords?.length) {
                throw new common_1.BadRequestException(`Brand "${brand.brandName}" must have at least one of: hashtags, username, or keywords`);
            }
        }
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < CREDIT_PER_REPORT) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REPORT}, Available: ${balance.unifiedBalance}`);
        }
        const report = new entities_1.CompetitionAnalysisReport();
        report.title = dto.title || 'Untitled Competition Report';
        report.platforms = dto.platforms;
        report.dateRangeStart = new Date(dto.dateRangeStart);
        report.dateRangeEnd = new Date(dto.dateRangeEnd);
        report.autoRefreshEnabled = dto.autoRefreshEnabled || false;
        report.status = entities_1.CompetitionReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `comp_${(0, uuid_1.v4)().substring(0, 8)}`;
        report.creditsUsed = CREDIT_PER_REPORT;
        report.totalBrands = dto.brands.length;
        if (dto.autoRefreshEnabled) {
            const nextRefresh = new Date();
            nextRefresh.setDate(nextRefresh.getDate() + 1);
            report.nextRefreshDate = nextRefresh;
        }
        const savedReport = await this.reportRepo.save(report);
        for (let i = 0; i < dto.brands.length; i++) {
            const brandDto = dto.brands[i];
            const brand = new entities_1.CompetitionBrand();
            brand.reportId = savedReport.id;
            brand.brandName = brandDto.brandName;
            brand.hashtags = brandDto.hashtags || [];
            brand.username = brandDto.username;
            brand.keywords = brandDto.keywords || [];
            brand.platform = brandDto.platform;
            brand.displayColor = BRAND_COLORS[i % BRAND_COLORS.length];
            brand.displayOrder = i;
            await this.brandRepo.save(brand);
        }
        setTimeout(() => this.processReport(savedReport.id), 2000);
        return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report)
            return;
        try {
            report.status = entities_1.CompetitionReportStatus.IN_PROGRESS;
            await this.reportRepo.save(report);
            let totalInfluencers = 0;
            let totalPosts = 0;
            let totalLikes = 0;
            let totalViews = 0;
            let totalComments = 0;
            let totalShares = 0;
            let totalFollowers = 0;
            for (const brand of report.brands) {
                let brandResult;
                if (this.modashService.isModashEnabled()) {
                    brandResult = await this.processBrandWithModash(reportId, brand, report);
                }
                else {
                    brandResult = await this.processBrand(reportId, brand, report);
                }
                totalInfluencers += brandResult.influencerCount;
                totalPosts += brandResult.postsCount;
                totalLikes += brandResult.totalLikes;
                totalViews += brandResult.totalViews;
                totalComments += brandResult.totalComments;
                totalShares += brandResult.totalShares;
                totalFollowers += brandResult.totalFollowers;
            }
            report.totalInfluencers = totalInfluencers;
            report.totalPosts = totalPosts;
            report.totalLikes = totalLikes;
            report.totalViews = totalViews;
            report.totalComments = totalComments;
            report.totalShares = totalShares;
            report.totalFollowers = totalFollowers;
            const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
            const reportEngDenom = totalPosts * avgFollowersPerInf;
            report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
            report.status = entities_1.CompetitionReportStatus.COMPLETED;
            report.completedAt = new Date();
            await this.reportRepo.save(report);
            await this.creditsService.deductCredits(report.ownerId, {
                actionType: enums_1.ActionType.REPORT_GENERATION,
                quantity: CREDIT_PER_REPORT,
                module: enums_1.ModuleType.COMPETITION_ANALYSIS,
                resourceId: reportId,
                resourceType: 'competition_report_creation',
            });
        }
        catch (error) {
            report.status = entities_1.CompetitionReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
            this.logger.error(`Competition report ${reportId} failed — NO credits charged`);
        }
    }
    async processBrandWithModash(reportId, brand, report) {
        this.logger.log(`Processing brand ${brand.brandName} via Modash for report ${reportId}`);
        const brandHandle = brand.username || brand.brandName;
        const platform = (report.platforms?.[0]?.toLowerCase() || 'instagram');
        const collabPosts = await this.modashService.getCollaborationPosts(brandHandle, platform, { limit: 30 }, report.ownerId);
        try {
            const summaryResp = await this.modashService.getCollaborationSummary(brandHandle, platform, undefined, report.ownerId);
            const summary = summaryResp?.brand?.summary || summaryResp?.influencer?.summary;
            if (summary) {
                brand.totalFollowers = summary.total_followers || brand.totalFollowers || 0;
                brand.avgEngagementRate = summary.avg_engagement_rate ?? brand.avgEngagementRate;
            }
        }
        catch (summaryErr) {
            this.logger.warn(`Collaboration summary for ${brandHandle} failed (non-critical): ${summaryErr.message}`);
        }
        const posts = collabPosts.brand?.posts || collabPosts.influencer?.posts || [];
        const seenInfluencers = new Map();
        let brandTotalLikes = 0, brandTotalViews = 0, brandTotalComments = 0, brandTotalShares = 0;
        for (const modashPost of posts) {
            const compPost = new entities_1.CompetitionPost();
            compPost.reportId = reportId;
            compPost.brandId = brand.id;
            compPost.platform = brand.platform || report.platforms?.[0] || 'INSTAGRAM';
            compPost.postId = modashPost.post_id;
            compPost.postType = entities_1.PostType.PHOTO;
            compPost.thumbnailUrl = modashPost.post_thumbnail || '';
            compPost.description = modashPost.description || modashPost.title || '';
            compPost.likesCount = modashPost.stats?.likes || 0;
            compPost.commentsCount = modashPost.stats?.comments || 0;
            compPost.viewsCount = modashPost.stats?.views || modashPost.stats?.plays || 0;
            compPost.sharesCount = modashPost.stats?.shares || 0;
            const compTs = modashPost.post_timestamp
                ? (modashPost.post_timestamp > 1e12 ? modashPost.post_timestamp : modashPost.post_timestamp * 1000)
                : Date.now();
            compPost.postDate = new Date(compTs);
            compPost.isSponsored = modashPost.label?.includes('Sponsorship') || false;
            await this.postRepo.save(compPost);
            brandTotalLikes += compPost.likesCount;
            brandTotalViews += compPost.viewsCount;
            brandTotalComments += compPost.commentsCount;
            brandTotalShares += compPost.sharesCount;
            const infKey = modashPost.username || modashPost.user_id || `unknown_${modashPost.post_id}`;
            if (!seenInfluencers.has(infKey)) {
                seenInfluencers.set(infKey, { likes: 0, views: 0, comments: 0, shares: 0, posts: 0, followers: 0 });
            }
            const inf = seenInfluencers.get(infKey);
            inf.likes += compPost.likesCount;
            inf.views += compPost.viewsCount;
            inf.comments += compPost.commentsCount;
            inf.shares += compPost.sharesCount;
            inf.posts++;
        }
        let brandTotalFollowers = 0;
        for (const [username, data] of seenInfluencers) {
            const compInf = new entities_1.CompetitionInfluencer();
            compInf.reportId = reportId;
            compInf.brandId = brand.id;
            compInf.platform = brand.platform || report.platforms?.[0] || 'INSTAGRAM';
            compInf.influencerName = username;
            compInf.influencerUsername = username;
            compInf.followerCount = data.followers;
            compInf.postsCount = data.posts;
            compInf.likesCount = data.likes;
            compInf.viewsCount = data.views;
            compInf.commentsCount = data.comments;
            compInf.sharesCount = data.shares;
            compInf.category = entities_1.InfluencerCategory.NANO;
            await this.influencerRepo.save(compInf);
            brandTotalFollowers += data.followers;
        }
        brand.influencerCount = seenInfluencers.size;
        brand.postsCount = posts.length;
        brand.totalLikes = brandTotalLikes;
        brand.totalViews = brandTotalViews;
        brand.totalComments = brandTotalComments;
        brand.totalShares = brandTotalShares;
        brand.totalFollowers = brandTotalFollowers;
        await this.brandRepo.save(brand);
        return {
            influencerCount: seenInfluencers.size,
            postsCount: posts.length,
            totalLikes: brandTotalLikes,
            totalViews: brandTotalViews,
            totalComments: brandTotalComments,
            totalShares: brandTotalShares,
            totalFollowers: brandTotalFollowers,
        };
    }
    async processBrand(reportId, brand, report) {
        const influencerCount = Math.floor(Math.random() * 15) + 5;
        let brandPosts = 0;
        let brandLikes = 0;
        let brandViews = 0;
        let brandComments = 0;
        let brandShares = 0;
        let brandFollowers = 0;
        let nanoCount = 0, microCount = 0, macroCount = 0, megaCount = 0;
        let photoCount = 0, videoCount = 0, carouselCount = 0, reelCount = 0;
        const searchTerms = [
            ...(brand.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`),
            brand.username ? (brand.username.startsWith('@') ? brand.username : `@${brand.username}`) : '',
            ...(brand.keywords || []),
        ].filter(t => t && t.length > 0);
        for (let i = 0; i < influencerCount; i++) {
            const followerCount = this.generateFollowerCount();
            const category = this.categorizeInfluencer(followerCount);
            switch (category) {
                case entities_1.InfluencerCategory.NANO:
                    nanoCount++;
                    break;
                case entities_1.InfluencerCategory.MICRO:
                    microCount++;
                    break;
                case entities_1.InfluencerCategory.MACRO:
                    macroCount++;
                    break;
                case entities_1.InfluencerCategory.MEGA:
                    megaCount++;
                    break;
            }
            const influencer = new entities_1.CompetitionInfluencer();
            influencer.reportId = reportId;
            influencer.brandId = brand.id;
            const platformPool = brand.platform?.trim()
                ? [brand.platform.trim().toUpperCase()]
                : (report.platforms?.length ? report.platforms : ['INSTAGRAM']);
            influencer.platform = platformPool[Math.floor(Math.random() * platformPool.length)];
            influencer.influencerName = this.generateInfluencerName();
            influencer.influencerUsername = influencer.influencerName.toLowerCase().replace(/\s/g, '_');
            influencer.platformUserId = `user_${Date.now()}_${brand.id}_${i}`;
            influencer.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.influencerName)}&background=random`;
            influencer.followerCount = followerCount;
            influencer.category = category;
            influencer.audienceCredibility = Math.floor(Math.random() * 30) + 70;
            influencer.displayOrder = i;
            const savedInfluencer = await this.influencerRepo.save(influencer);
            const postsCount = Math.floor(Math.random() * 8) + 2;
            let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;
            for (let j = 0; j < postsCount; j++) {
                const postType = this.getRandomPostType();
                switch (postType) {
                    case entities_1.PostType.PHOTO:
                        photoCount++;
                        break;
                    case entities_1.PostType.VIDEO:
                        videoCount++;
                        break;
                    case entities_1.PostType.CAROUSEL:
                        carouselCount++;
                        break;
                    case entities_1.PostType.REEL:
                        reelCount++;
                        break;
                }
                const post = new entities_1.CompetitionPost();
                post.reportId = reportId;
                post.brandId = brand.id;
                post.influencerId = savedInfluencer.id;
                post.platform = savedInfluencer.platform;
                post.postId = `post_${Date.now()}_${brand.id}_${i}_${j}`;
                post.postType = postType;
                post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i + j}`;
                const matchedTerms = searchTerms.filter(() => Math.random() > 0.3);
                post.description = `Amazing ${brand.brandName} content! ${matchedTerms.join(' ')} #influencer`;
                post.matchedHashtags = matchedTerms.filter(t => t.startsWith('#'));
                post.matchedUsername = matchedTerms.find(t => t.startsWith('@')) || undefined;
                post.matchedKeywords = matchedTerms.filter(t => !t.startsWith('#') && !t.startsWith('@'));
                post.likesCount = Math.floor(Math.random() * 12000) + 500;
                post.commentsCount = Math.floor(Math.random() * 600) + 20;
                post.viewsCount = Math.floor(Math.random() * 70000) + 2000;
                post.sharesCount = Math.floor(Math.random() * 300) + 10;
                const postFc = Number(savedInfluencer.followerCount) || 0;
                post.engagementRate = postFc > 0 ? ((post.likesCount + post.commentsCount) / postFc) * 100 : 0;
                post.isSponsored = Math.random() > 0.75;
                const startMs = new Date(report.dateRangeStart).getTime();
                const endMs = new Date(report.dateRangeEnd).getTime();
                const randomMs = startMs + Math.random() * (endMs - startMs);
                post.postDate = new Date(randomMs);
                post.postUrl = `https://instagram.com/p/${post.postId}`;
                await this.postRepo.save(post);
                infLikes += Number(post.likesCount) || 0;
                infViews += Number(post.viewsCount) || 0;
                infComments += Number(post.commentsCount) || 0;
                infShares += Number(post.sharesCount) || 0;
            }
            savedInfluencer.postsCount = postsCount;
            savedInfluencer.likesCount = infLikes;
            savedInfluencer.viewsCount = infViews;
            savedInfluencer.commentsCount = infComments;
            savedInfluencer.sharesCount = infShares;
            const infFc = Number(savedInfluencer.followerCount) || 0;
            const infDenom = postsCount * infFc;
            savedInfluencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
            await this.influencerRepo.save(savedInfluencer);
            brandPosts += postsCount;
            brandLikes += infLikes;
            brandViews += infViews;
            brandComments += infComments;
            brandShares += infShares;
            brandFollowers += Number(savedInfluencer.followerCount) || 0;
        }
        brand.influencerCount = influencerCount;
        brand.postsCount = brandPosts;
        brand.totalLikes = brandLikes;
        brand.totalViews = brandViews;
        brand.totalComments = brandComments;
        brand.totalShares = brandShares;
        brand.totalFollowers = brandFollowers;
        const brandAvgFollowersPerInf = influencerCount > 0 ? brandFollowers / influencerCount : 0;
        const brandEngDenom = brandPosts * brandAvgFollowersPerInf;
        brand.avgEngagementRate = brandEngDenom > 0 ? ((brandLikes + brandComments) / brandEngDenom) * 100 : 0;
        brand.nanoCount = nanoCount;
        brand.microCount = microCount;
        brand.macroCount = macroCount;
        brand.megaCount = megaCount;
        brand.photoCount = photoCount;
        brand.videoCount = videoCount;
        brand.carouselCount = carouselCount;
        brand.reelCount = reelCount;
        await this.brandRepo.save(brand);
        return {
            influencerCount,
            postsCount: brandPosts,
            totalLikes: brandLikes,
            totalViews: brandViews,
            totalComments: brandComments,
            totalShares: brandShares,
            totalFollowers: brandFollowers,
        };
    }
    getRandomPostType() {
        const types = [entities_1.PostType.PHOTO, entities_1.PostType.VIDEO, entities_1.PostType.CAROUSEL, entities_1.PostType.REEL];
        const weights = [35, 25, 15, 25];
        const random = Math.random() * 100;
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative)
                return types[i];
        }
        return entities_1.PostType.PHOTO;
    }
    generateFollowerCount() {
        const ranges = [
            { min: 1000, max: 10000, weight: 30 },
            { min: 10000, max: 100000, weight: 40 },
            { min: 100000, max: 500000, weight: 20 },
            { min: 500000, max: 5000000, weight: 10 },
        ];
        const random = Math.random() * 100;
        let cumulative = 0;
        for (const range of ranges) {
            cumulative += range.weight;
            if (random <= cumulative) {
                return Math.floor(Math.random() * (range.max - range.min)) + range.min;
            }
        }
        return 50000;
    }
    categorizeInfluencer(followers) {
        if (followers < 10000)
            return entities_1.InfluencerCategory.NANO;
        if (followers < 100000)
            return entities_1.InfluencerCategory.MICRO;
        if (followers < 500000)
            return entities_1.InfluencerCategory.MACRO;
        return entities_1.InfluencerCategory.MEGA;
    }
    generateInfluencerName() {
        const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Peyton', 'Dakota'];
        const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Anderson'];
        const suffixes = ['', 'Official', 'HQ', 'Live', 'Daily'];
        const first = firstNames[Math.floor(Math.random() * firstNames.length)];
        const last = lastNames[Math.floor(Math.random() * lastNames.length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        return `${first} ${last}${suffix ? ' ' + suffix : ''}`;
    }
    async getReports(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.reportRepo.createQueryBuilder('report');
        if (filters.createdBy === 'ME') {
            queryBuilder.where('report.createdById = :userId', { userId });
        }
        else if (filters.createdBy === 'TEAM') {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('report.createdById IN (:...teamUserIds) AND report.createdById != :userId', { teamUserIds, userId });
        }
        else if (filters.createdBy === 'SHARED') {
            const sharedReportIds = await this.shareRepo.find({
                where: { sharedWithUserId: userId },
                select: ['reportId'],
            });
            const reportIds = sharedReportIds.map(s => s.reportId);
            if (reportIds.length === 0) {
                return { reports: [], total: 0, page, limit, hasMore: false };
            }
            queryBuilder.where('report.id IN (:...reportIds)', { reportIds });
        }
        else {
            const teamUserIds = await this.getTeamUserIds(userId);
            const sharedReportIds = await this.shareRepo.find({
                where: { sharedWithUserId: userId },
                select: ['reportId'],
            });
            const reportIds = sharedReportIds.map(s => s.reportId);
            queryBuilder.where('(report.createdById = :userId OR report.createdById IN (:...teamUserIds) OR report.id IN (:...reportIds) OR report.isPublic = true)', { userId, teamUserIds, reportIds: reportIds.length > 0 ? reportIds : ['00000000-0000-0000-0000-000000000000'] });
        }
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere(':platform = ANY(report.platforms)', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('LOWER(report.title) LIKE :search', { search: `%${filters.search.toLowerCase()}%` });
        }
        queryBuilder.orderBy('report.createdAt', 'DESC')
            .skip(skip)
            .take(limit);
        const [reports, total] = await queryBuilder.getManyAndCount();
        return {
            reports: reports.map(r => this.toSummaryDto(r)),
            total,
            page,
            limit,
            hasMore: skip + reports.length < total,
        };
    }
    async getReportById(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands', 'influencers', 'posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        return this.toDetailDto(report);
    }
    async getReportByShareToken(token) {
        const report = await this.reportRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['brands', 'influencers', 'posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found or not publicly shared');
        }
        return this.toDetailDto(report);
    }
    async updateReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.title !== undefined)
            report.title = dto.title;
        if (dto.isPublic !== undefined)
            report.isPublic = dto.isPublic;
        const savedReport = await this.reportRepo.save(report);
        return { success: true, report: savedReport };
    }
    async deleteReport(userId, reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        await this.reportRepo.remove(report);
        return { success: true };
    }
    async bulkDeleteReports(userId, reportIds) {
        let deletedCount = 0;
        for (const reportId of reportIds) {
            try {
                const report = await this.reportRepo.findOne({ where: { id: reportId } });
                if (report && (report.createdById === userId || report.ownerId === userId)) {
                    await this.reportRepo.remove(report);
                    deletedCount++;
                }
            }
            catch {
            }
        }
        return { success: true, deletedCount };
    }
    async retryReport(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (report.status !== entities_1.CompetitionReportStatus.FAILED) {
            throw new common_1.BadRequestException('Only failed reports can be retried');
        }
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < CREDIT_PER_REPORT) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${CREDIT_PER_REPORT}, Available: ${balance.unifiedBalance}`);
        }
        await this.postRepo.delete({ reportId });
        await this.influencerRepo.delete({ reportId });
        for (const brand of report.brands) {
            brand.influencerCount = 0;
            brand.postsCount = 0;
            brand.totalLikes = 0;
            brand.totalViews = 0;
            brand.totalComments = 0;
            brand.totalShares = 0;
            await this.brandRepo.save(brand);
        }
        report.status = entities_1.CompetitionReportStatus.PENDING;
        report.errorMessage = undefined;
        report.retryCount += 1;
        report.totalInfluencers = 0;
        report.totalPosts = 0;
        report.totalLikes = 0;
        report.totalViews = 0;
        report.totalComments = 0;
        report.totalShares = 0;
        await this.reportRepo.save(report);
        setTimeout(() => this.processReport(reportId), 2000);
        return { success: true, report, creditsUsed: CREDIT_PER_REPORT };
    }
    async shareReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.sharedWithUserId) {
            const existingShare = await this.shareRepo.findOne({
                where: { reportId, sharedWithUserId: dto.sharedWithUserId },
            });
            if (!existingShare) {
                const share = new entities_1.CompetitionShare();
                share.reportId = reportId;
                share.sharedWithUserId = dto.sharedWithUserId;
                share.sharedByUserId = userId;
                share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
                await this.shareRepo.save(share);
            }
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/competition-analysis/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedReports = allReports.filter(r => r.status === entities_1.CompetitionReportStatus.COMPLETED);
        const totalBrandsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalBrands || 0), 0);
        const totalInfluencersAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalInfluencers || 0), 0);
        const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
        const avgEngagement = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
            : 0;
        return {
            totalReports: allReports.length,
            completedReports: completedReports.length,
            inProgressReports: allReports.filter(r => r.status === entities_1.CompetitionReportStatus.IN_PROGRESS).length,
            pendingReports: allReports.filter(r => r.status === entities_1.CompetitionReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.CompetitionReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
            totalBrandsAnalyzed,
            totalInfluencersAnalyzed,
            totalPostsAnalyzed,
            avgEngagementRate: Number(avgEngagement.toFixed(2)),
        };
    }
    async getChartData(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const posts = await this.postRepo.find({ where: { reportId } });
        const brands = report.brands || [];
        const grouped = {};
        posts.forEach(post => {
            const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
            if (!grouped[dateStr]) {
                grouped[dateStr] = {};
                brands.forEach(b => { grouped[dateStr][b.id] = 0; });
            }
            if (post.brandId && grouped[dateStr][post.brandId] !== undefined) {
                grouped[dateStr][post.brandId] += 1;
            }
        });
        const brandNameMap = {};
        brands.forEach(b => { brandNameMap[b.id] = b.brandName; });
        return Object.entries(grouped)
            .map(([date, brandPosts]) => {
            const namedBrandPosts = {};
            Object.entries(brandPosts).forEach(([brandId, count]) => {
                namedBrandPosts[brandNameMap[brandId] || brandId] = count;
            });
            return {
                date,
                brandPosts: namedBrandPosts,
                totalPosts: Object.values(brandPosts).reduce((sum, c) => sum + c, 0),
            };
        })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getEnhancedChartData(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const posts = await this.postRepo.find({ where: { reportId } });
        const brands = report.brands || [];
        const brandNameMap = {};
        const brandColorMap = {};
        brands.forEach(b => {
            brandNameMap[b.id] = b.brandName;
            brandColorMap[b.id] = b.displayColor || '#6b7280';
        });
        const postsGrouped = {};
        const influencersByDate = {};
        posts.forEach(post => {
            const dateStr = post.postDate
                ? new Date(post.postDate).toISOString().split('T')[0]
                : 'Unknown';
            if (!postsGrouped[dateStr]) {
                postsGrouped[dateStr] = {};
                influencersByDate[dateStr] = {};
                brands.forEach(b => {
                    postsGrouped[dateStr][b.id] = 0;
                    influencersByDate[dateStr][b.id] = new Set();
                });
            }
            if (post.brandId && postsGrouped[dateStr][post.brandId] !== undefined) {
                postsGrouped[dateStr][post.brandId] += 1;
            }
            if (post.brandId && post.influencerId && influencersByDate[dateStr][post.brandId]) {
                influencersByDate[dateStr][post.brandId].add(post.influencerId);
            }
        });
        const sortedDates = Object.keys(postsGrouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        const postsOverTime = sortedDates.map(date => {
            const namedBrands = {};
            let total = 0;
            Object.entries(postsGrouped[date]).forEach(([brandId, count]) => {
                namedBrands[brandNameMap[brandId] || brandId] = count;
                total += count;
            });
            return { date, brands: namedBrands, total };
        });
        const influencersOverTime = sortedDates.map(date => {
            const namedBrands = {};
            let total = 0;
            Object.entries(influencersByDate[date]).forEach(([brandId, infSet]) => {
                const count = infSet.size;
                namedBrands[brandNameMap[brandId] || brandId] = count;
                total += count;
            });
            return { date, brands: namedBrands, total };
        });
        const postsShare = brands.map(b => ({
            brandName: b.brandName,
            value: b.postsCount || 0,
            color: b.displayColor || '#6b7280',
        }));
        const influencersShare = brands.map(b => ({
            brandName: b.brandName,
            value: b.influencerCount || 0,
            color: b.displayColor || '#6b7280',
        }));
        const engagementShare = brands.map(b => ({
            brandName: b.brandName,
            value: (Number(b.totalLikes) || 0) + (Number(b.totalComments) || 0) + (Number(b.totalShares) || 0),
            color: b.displayColor || '#6b7280',
        }));
        return { postsOverTime, influencersOverTime, postsShare, influencersShare, engagementShare };
    }
    async getPosts(userId, reportId, filters) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.influencer', 'influencer')
            .leftJoinAndSelect('post.brand', 'brand')
            .where('post.reportId = :reportId', { reportId });
        if (filters.brandId) {
            queryBuilder.andWhere('post.brandId = :brandId', { brandId: filters.brandId });
        }
        if (filters.category && filters.category !== 'ALL') {
            queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
        }
        const sortField = filters.sortBy || 'postDate';
        const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const sortMap = {
            'recent': 'post.postDate',
            'postDate': 'post.postDate',
            'likes': 'post.likesCount',
            'views': 'post.viewsCount',
            'comments': 'post.commentsCount',
            'shares': 'post.sharesCount',
            'engagement': 'post.engagementRate',
            'credibility': 'influencer.audienceCredibility',
            'followers': 'influencer.followerCount',
        };
        queryBuilder.orderBy(sortMap[sortField] || 'post.postDate', sortOrder);
        const [posts, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
        return {
            posts: posts.map(p => this.toPostDto(p)),
            total,
            page,
            limit,
        };
    }
    async getInfluencers(userId, reportId, filters) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['brands'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        const queryBuilder = this.influencerRepo.createQueryBuilder('influencer')
            .leftJoinAndSelect('influencer.brand', 'brand')
            .where('influencer.reportId = :reportId', { reportId });
        if (filters.brandId) {
            queryBuilder.andWhere('influencer.brandId = :brandId', { brandId: filters.brandId });
        }
        if (filters.category && filters.category !== 'ALL') {
            queryBuilder.andWhere('influencer.category = :category', { category: filters.category });
        }
        const sortField = filters.sortBy || 'likesCount';
        const sortOrder = filters.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const sortMap = {
            'recent': 'influencer.createdAt',
            'likes': 'influencer.likesCount',
            'followers': 'influencer.followerCount',
            'comments': 'influencer.commentsCount',
            'credibility': 'influencer.audienceCredibility',
            'engagement': 'influencer.avgEngagementRate',
        };
        queryBuilder.orderBy(sortMap[sortField] || 'influencer.likesCount', sortOrder);
        const [influencers, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();
        return {
            influencers: influencers.map(i => this.toInfluencerDto(i)),
            total,
            page,
            limit,
        };
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
    async checkReportAccess(userId, report, level = 'view') {
        if (report.ownerId === userId || report.createdById === userId)
            return;
        if (report.isPublic && level === 'view')
            return;
        const share = await this.shareRepo.findOne({
            where: { reportId: report.id, sharedWithUserId: userId },
        });
        if (share) {
            if (level === 'edit' && share.permissionLevel === entities_1.SharePermission.VIEW) {
                throw new common_1.ForbiddenException('Edit access required');
            }
            return;
        }
        const teamUserIds = await this.getTeamUserIds(userId);
        if (teamUserIds.includes(report.createdById)) {
            if (level === 'edit') {
                throw new common_1.ForbiddenException('Cannot edit team member reports');
            }
            return;
        }
        throw new common_1.ForbiddenException('No access to this report');
    }
    toSummaryDto(report) {
        return {
            id: report.id,
            title: report.title,
            platforms: report.platforms,
            status: report.status,
            dateRangeStart: report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : report.dateRangeStart,
            dateRangeEnd: report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : report.dateRangeEnd,
            totalBrands: report.totalBrands || 0,
            totalPosts: report.totalPosts || 0,
            totalInfluencers: report.totalInfluencers || 0,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
        };
    }
    toDetailDto(report) {
        const categorization = this.calculateCategorization(report.influencers || []);
        const postTypeBreakdown = this.calculatePostTypeBreakdown(report.brands || []);
        return {
            id: report.id,
            title: report.title,
            platforms: report.platforms,
            status: report.status,
            errorMessage: report.errorMessage,
            dateRangeStart: report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : report.dateRangeStart,
            dateRangeEnd: report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : report.dateRangeEnd,
            autoRefreshEnabled: report.autoRefreshEnabled,
            totalBrands: report.totalBrands || 0,
            totalInfluencers: report.totalInfluencers || 0,
            totalPosts: report.totalPosts || 0,
            totalLikes: Number(report.totalLikes) || 0,
            totalViews: Number(report.totalViews) || 0,
            totalComments: Number(report.totalComments) || 0,
            totalShares: Number(report.totalShares) || 0,
            avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
            totalFollowers: Number(report.totalFollowers) || 0,
            brands: (report.brands || []).map(b => this.toBrandSummaryDto(b)),
            influencers: (report.influencers || []).slice(0, 50).map(i => this.toInfluencerDto(i)),
            posts: (report.posts || []).slice(0, 50).map(p => this.toPostDto(p)),
            categorization,
            postTypeBreakdown,
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/competition-analysis/shared/${report.shareUrlToken}` : undefined,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
    toBrandSummaryDto(brand) {
        return {
            id: brand.id,
            brandName: brand.brandName,
            hashtags: brand.hashtags,
            username: brand.username,
            keywords: brand.keywords,
            platform: brand.platform,
            displayColor: brand.displayColor,
            influencerCount: brand.influencerCount || 0,
            postsCount: brand.postsCount || 0,
            totalLikes: Number(brand.totalLikes) || 0,
            totalViews: Number(brand.totalViews) || 0,
            totalComments: Number(brand.totalComments) || 0,
            totalShares: Number(brand.totalShares) || 0,
            totalFollowers: Number(brand.totalFollowers) || 0,
            avgEngagementRate: brand.avgEngagementRate ? Number(brand.avgEngagementRate) : undefined,
            photoCount: brand.photoCount || 0,
            videoCount: brand.videoCount || 0,
            carouselCount: brand.carouselCount || 0,
            reelCount: brand.reelCount || 0,
            nanoCount: brand.nanoCount || 0,
            microCount: brand.microCount || 0,
            macroCount: brand.macroCount || 0,
            megaCount: brand.megaCount || 0,
        };
    }
    toInfluencerDto(inf) {
        return {
            id: inf.id,
            brandId: inf.brandId,
            brandName: inf.brand?.brandName || '',
            influencerName: inf.influencerName,
            influencerUsername: inf.influencerUsername,
            platform: inf.platform,
            profilePictureUrl: inf.profilePictureUrl,
            followerCount: Number(inf.followerCount) || 0,
            category: inf.category,
            audienceCredibility: inf.audienceCredibility ? Number(inf.audienceCredibility) : undefined,
            postsCount: inf.postsCount || 0,
            likesCount: Number(inf.likesCount) || 0,
            viewsCount: Number(inf.viewsCount) || 0,
            commentsCount: Number(inf.commentsCount) || 0,
            sharesCount: Number(inf.sharesCount) || 0,
            avgEngagementRate: inf.avgEngagementRate ? Number(inf.avgEngagementRate) : undefined,
        };
    }
    toPostDto(post) {
        return {
            id: post.id,
            brandId: post.brandId,
            brandName: post.brand?.brandName || '',
            platform: post.platform,
            postUrl: post.postUrl,
            postType: post.postType,
            thumbnailUrl: post.thumbnailUrl,
            description: post.description,
            matchedHashtags: post.matchedHashtags,
            matchedUsername: post.matchedUsername,
            matchedKeywords: post.matchedKeywords,
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            viewsCount: post.viewsCount || 0,
            sharesCount: post.sharesCount || 0,
            engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
            isSponsored: post.isSponsored,
            postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
            influencerId: post.influencerId,
            influencerName: post.influencer?.influencerName,
            influencerUsername: post.influencer?.influencerUsername,
            influencerFollowerCount: post.influencer ? Number(post.influencer.followerCount) : undefined,
            influencerCredibility: post.influencer ? Number(post.influencer.audienceCredibility) : undefined,
        };
    }
    calculateCategorization(influencers) {
        const categories = {
            ALL: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            NANO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MICRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MACRO: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            MEGA: { count: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
        };
        const labels = {
            ALL: 'All Influencers',
            NANO: 'Nano (<10K)',
            MICRO: 'Micro (10K-100K)',
            MACRO: 'Macro (100K-500K)',
            MEGA: 'Mega (>500K)',
        };
        for (const inf of influencers) {
            const cat = inf.category || 'NANO';
            categories[cat].count += 1;
            categories[cat].followers += Number(inf.followerCount) || 0;
            categories[cat].posts += inf.postsCount || 0;
            categories[cat].likes += Number(inf.likesCount) || 0;
            categories[cat].views += Number(inf.viewsCount) || 0;
            categories[cat].comments += Number(inf.commentsCount) || 0;
            categories[cat].shares += Number(inf.sharesCount) || 0;
            categories.ALL.count += 1;
            categories.ALL.followers += Number(inf.followerCount) || 0;
            categories.ALL.posts += inf.postsCount || 0;
            categories.ALL.likes += Number(inf.likesCount) || 0;
            categories.ALL.views += Number(inf.viewsCount) || 0;
            categories.ALL.comments += Number(inf.commentsCount) || 0;
            categories.ALL.shares += Number(inf.sharesCount) || 0;
        }
        return Object.entries(categories).map(([key, data]) => ({
            category: key,
            label: labels[key],
            accountsCount: data.count,
            followersCount: data.followers,
            postsCount: data.posts,
            likesCount: data.likes,
            viewsCount: data.views,
            commentsCount: data.comments,
            sharesCount: data.shares,
            engagementRate: data.posts > 0 && data.followers > 0 && data.count > 0
                ? ((data.likes + data.comments) / (data.posts * (data.followers / data.count))) * 100
                : 0,
        }));
    }
    calculatePostTypeBreakdown(brands) {
        return brands.map(brand => {
            const total = brand.photoCount + brand.videoCount + brand.carouselCount + brand.reelCount;
            return {
                brandId: brand.id,
                brandName: brand.brandName,
                photoCount: brand.photoCount,
                videoCount: brand.videoCount,
                carouselCount: brand.carouselCount,
                reelCount: brand.reelCount,
                photoPercentage: total > 0 ? (brand.photoCount / total) * 100 : 0,
                videoPercentage: total > 0 ? (brand.videoCount / total) * 100 : 0,
                carouselPercentage: total > 0 ? (brand.carouselCount / total) * 100 : 0,
                reelPercentage: total > 0 ? (brand.reelCount / total) * 100 : 0,
            };
        });
    }
};
exports.CompetitionAnalysisService = CompetitionAnalysisService;
exports.CompetitionAnalysisService = CompetitionAnalysisService = CompetitionAnalysisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CompetitionAnalysisReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CompetitionBrand)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CompetitionInfluencer)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.CompetitionPost)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.CompetitionShare)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        modash_service_1.ModashService])
], CompetitionAnalysisService);
//# sourceMappingURL=competition-analysis.service.js.map