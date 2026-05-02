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
var CollabCheckService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollabCheckService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const influencer_profile_entity_1 = require("../discovery/entities/influencer-profile.entity");
const influencer_insight_entity_1 = require("../insights/entities/influencer-insight.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const modash_service_1 = require("../discovery/services/modash.service");
const CREDIT_PER_INFLUENCER = 1;
const RETRY_CREDIT_FLAT = 1;
let CollabCheckService = CollabCheckService_1 = class CollabCheckService {
    constructor(reportRepo, influencerRepo, postRepo, shareRepo, userRepo, profileRepo, insightRepo, creditsService, modashService) {
        this.reportRepo = reportRepo;
        this.influencerRepo = influencerRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.profileRepo = profileRepo;
        this.insightRepo = insightRepo;
        this.creditsService = creditsService;
        this.modashService = modashService;
        this.logger = new common_1.Logger(CollabCheckService_1.name);
    }
    async createReport(userId, dto) {
        const influencerCount = dto.influencers.length;
        const totalCredits = influencerCount * CREDIT_PER_INFLUENCER;
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < totalCredits) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${totalCredits}, Available: ${balance.unifiedBalance}`);
        }
        const report = new entities_1.CollabCheckReport();
        report.title = dto.title || 'Untitled Collab Report';
        report.platform = dto.platform;
        report.timePeriod = dto.timePeriod;
        report.queries = dto.queries;
        report.status = entities_1.CollabReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `collab_${(0, uuid_1.v4)().substring(0, 8)}`;
        report.creditsUsed = totalCredits;
        const savedReport = await this.reportRepo.save(report);
        for (let i = 0; i < dto.influencers.length; i++) {
            const inf = new entities_1.CollabCheckInfluencer();
            inf.reportId = savedReport.id;
            inf.influencerName = dto.influencers[i];
            inf.influencerUsername = dto.influencers[i].replace('@', '');
            inf.platform = dto.platform;
            inf.displayOrder = i;
            inf.followerCount = Math.floor(Math.random() * 500000) + 10000;
            await this.influencerRepo.save(inf);
        }
        setTimeout(() => this.processReport(savedReport.id), 2000);
        return { success: true, report: savedReport, creditsUsed: totalCredits };
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
        if (!report)
            return;
        try {
            report.status = entities_1.CollabReportStatus.PROCESSING;
            await this.reportRepo.save(report);
            if (this.modashService.isModashEnabled()) {
                await this.processReportWithModash(report);
            }
            else {
                await this.processReportSimulated(report);
            }
            const totalCredits = (report.influencers?.length || 1) * CREDIT_PER_INFLUENCER;
            await this.creditsService.deductCredits(report.ownerId, {
                actionType: enums_1.ActionType.REPORT_GENERATION,
                quantity: totalCredits,
                module: enums_1.ModuleType.INFLUENCER_COLLAB_CHECK,
                resourceId: reportId,
                resourceType: 'collab_report_creation',
            });
            this.logger.log(`Collab check ${reportId}: charged ${totalCredits} credits after success`);
        }
        catch (error) {
            report.status = entities_1.CollabReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
            this.logger.error(`Collab check ${reportId} failed — NO credits charged`);
        }
    }
    async processRetryReport(reportId, userId, creditsToCharge) {
        try {
            await this.processReport(reportId);
            const report = await this.reportRepo.findOne({ where: { id: reportId } });
            if (report?.status === entities_1.CollabReportStatus.COMPLETED) {
                this.logger.log(`Collab retry ${reportId}: completed successfully (credits already charged by processReport)`);
            }
            else {
                this.logger.log(`Collab retry ${reportId}: NOT charging — report did not complete successfully`);
            }
        }
        catch (error) {
            this.logger.error(`Collab retry ${reportId} failed — NO credits charged: ${error.message}`);
        }
    }
    async processReportWithModash(report) {
        this.logger.log(`Processing collab check via Modash for report ${report.id}`);
        let totalPosts = 0;
        let totalLikes = 0;
        let totalViews = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalFollowers = 0;
        for (const influencer of report.influencers) {
            const handle = influencer.influencerUsername || influencer.influencerName;
            const platform = (report.platform?.toLowerCase() || 'instagram');
            const collabResult = await this.modashService.getCollaborationPosts(handle, platform, { limit: 30 }, report.ownerId);
            const posts = collabResult.influencer?.posts || collabResult.brand?.posts || [];
            let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;
            for (const modashPost of posts) {
                const post = new entities_1.CollabCheckPost();
                post.reportId = report.id;
                post.influencerId = influencer.id;
                post.postId = modashPost.post_id;
                post.postType = 'IMAGE';
                post.thumbnailUrl = modashPost.post_thumbnail || '';
                post.description = modashPost.description || modashPost.title || '';
                post.matchedKeywords = report.queries.filter((q) => (modashPost.description || '').toLowerCase().includes(q.toLowerCase()));
                post.likesCount = modashPost.stats?.likes || 0;
                post.commentsCount = modashPost.stats?.comments || 0;
                post.viewsCount = modashPost.stats?.views || modashPost.stats?.plays || 0;
                post.sharesCount = modashPost.stats?.shares || 0;
                const fc = Number(influencer.followerCount) || 0;
                post.engagementRate = fc > 0 ? ((post.likesCount + post.commentsCount) / fc) * 100 : 0;
                const postTs = modashPost.post_timestamp
                    ? (modashPost.post_timestamp > 1e12 ? modashPost.post_timestamp : modashPost.post_timestamp * 1000)
                    : Date.now();
                post.postDate = new Date(postTs);
                post.postUrl = '';
                await this.postRepo.save(post);
                infLikes += post.likesCount;
                infViews += post.viewsCount;
                infComments += post.commentsCount;
                infShares += post.sharesCount;
            }
            influencer.postsCount = posts.length;
            influencer.likesCount = infLikes;
            influencer.viewsCount = infViews;
            influencer.commentsCount = infComments;
            influencer.sharesCount = infShares;
            const infFc = Number(influencer.followerCount) || 0;
            const infDenom = posts.length * infFc;
            influencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
            await this.influencerRepo.save(influencer);
            totalPosts += posts.length;
            totalLikes += infLikes;
            totalViews += infViews;
            totalComments += infComments;
            totalShares += infShares;
        }
        totalFollowers = 0;
        const reportPlatform = (report.platform?.toUpperCase() || 'INSTAGRAM');
        for (const influencer of report.influencers) {
            try {
                const modashReport = await this.modashService.getInfluencerReport(reportPlatform, influencer.influencerUsername || '', report.ownerId);
                const profileData = modashReport?.profile || modashReport;
                influencer.followerCount = Number(profileData?.followers) || influencer.followerCount;
                const fc = Number(influencer.followerCount) || 0;
                const denom = influencer.postsCount * fc;
                influencer.avgEngagementRate = denom > 0 ? ((influencer.likesCount + influencer.commentsCount) / denom) * 100 : 0;
                await this.influencerRepo.save(influencer);
            }
            catch (err) {
                this.logger.warn(`Failed to fetch follower count for ${influencer.influencerUsername}: ${err.message}`);
            }
            totalFollowers += Number(influencer.followerCount) || 0;
        }
        report.totalPosts = totalPosts;
        report.totalLikes = totalLikes;
        report.totalViews = totalViews;
        report.totalComments = totalComments;
        report.totalShares = totalShares;
        report.totalFollowers = totalFollowers;
        const infLen = report.influencers.length;
        const avgFollowersPerInf = infLen > 0 ? totalFollowers / infLen : 0;
        const reportEngDenom = totalPosts * avgFollowersPerInf;
        report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
        report.status = entities_1.CollabReportStatus.COMPLETED;
        report.completedAt = new Date();
        await this.reportRepo.save(report);
    }
    async processReportSimulated(report) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        let totalPosts = 0;
        let totalLikes = 0;
        let totalViews = 0;
        let totalComments = 0;
        let totalShares = 0;
        let totalFollowers = 0;
        const { startDate } = this.getDateRange(report.timePeriod);
        for (const influencer of report.influencers) {
            const postsCount = Math.floor(Math.random() * 15) + 5;
            let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;
            for (let i = 0; i < postsCount; i++) {
                const post = new entities_1.CollabCheckPost();
                post.reportId = report.id;
                post.influencerId = influencer.id;
                post.postId = `post_${Date.now()}_${i}`;
                post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
                post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + i}`;
                const matchedQueries = report.queries.filter(() => Math.random() > 0.3);
                post.description = `Check out this amazing collab! ${matchedQueries.join(' ')} #sponsored #collaboration`;
                post.matchedKeywords = matchedQueries;
                post.likesCount = Math.floor(Math.random() * 10000) + 500;
                post.commentsCount = Math.floor(Math.random() * 500) + 20;
                post.viewsCount = Math.floor(Math.random() * 50000) + 2000;
                post.sharesCount = Math.floor(Math.random() * 200) + 10;
                const fc = Number(influencer.followerCount) || 0;
                post.engagementRate = fc > 0 ? ((post.likesCount + post.commentsCount) / fc) * 100 : 0;
                const randomDays = Math.floor(Math.random() * this.getDaysFromPeriod(report.timePeriod));
                const postDate = new Date(startDate);
                postDate.setDate(postDate.getDate() + randomDays);
                post.postDate = postDate;
                post.postUrl = `https://instagram.com/p/${post.postId}`;
                await this.postRepo.save(post);
                infLikes += Number(post.likesCount) || 0;
                infViews += Number(post.viewsCount) || 0;
                infComments += Number(post.commentsCount) || 0;
                infShares += Number(post.sharesCount) || 0;
            }
            influencer.postsCount = postsCount;
            influencer.likesCount = infLikes;
            influencer.viewsCount = infViews;
            influencer.commentsCount = infComments;
            influencer.sharesCount = infShares;
            const infFc = Number(influencer.followerCount) || 0;
            const infDenom = postsCount * infFc;
            influencer.avgEngagementRate = infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
            await this.influencerRepo.save(influencer);
            totalPosts += postsCount;
            totalLikes += infLikes;
            totalViews += infViews;
            totalComments += infComments;
            totalShares += infShares;
            totalFollowers += Number(influencer.followerCount) || 0;
        }
        report.totalPosts = totalPosts;
        report.totalLikes = totalLikes;
        report.totalViews = totalViews;
        report.totalComments = totalComments;
        report.totalShares = totalShares;
        report.totalFollowers = totalFollowers;
        const infLen = report.influencers.length;
        const avgFollowersPerInf = infLen > 0 ? totalFollowers / infLen : 0;
        const reportEngDenom = totalPosts * avgFollowersPerInf;
        report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
        report.status = entities_1.CollabReportStatus.COMPLETED;
        report.completedAt = new Date();
        await this.reportRepo.save(report);
    }
    getDateRange(timePeriod) {
        const endDate = new Date();
        const startDate = new Date();
        switch (timePeriod) {
            case entities_1.TimePeriod.ONE_MONTH:
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case entities_1.TimePeriod.THREE_MONTHS:
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            case entities_1.TimePeriod.SIX_MONTHS:
                startDate.setMonth(startDate.getMonth() - 6);
                break;
            case entities_1.TimePeriod.ONE_YEAR:
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }
        return { startDate, endDate };
    }
    getDaysFromPeriod(timePeriod) {
        switch (timePeriod) {
            case entities_1.TimePeriod.ONE_MONTH: return 30;
            case entities_1.TimePeriod.THREE_MONTHS: return 90;
            case entities_1.TimePeriod.SIX_MONTHS: return 180;
            case entities_1.TimePeriod.ONE_YEAR: return 365;
            default: return 30;
        }
    }
    async getReports(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.reportRepo.createQueryBuilder('report')
            .leftJoinAndSelect('report.influencers', 'influencers');
        if (filters.createdBy === 'ME') {
            queryBuilder.where('report.createdById = :userId', { userId });
        }
        else if (filters.createdBy === 'TEAM') {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('report.createdById IN (:...teamUserIds)', { teamUserIds });
        }
        else {
            const teamUserIds = await this.getTeamUserIds(userId);
            queryBuilder.where('(report.createdById = :userId OR report.createdById IN (:...teamUserIds))', { userId, teamUserIds });
        }
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('(LOWER(report.title) LIKE :search OR LOWER(array_to_string(report.queries, \',\')) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
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
            relations: ['influencers', 'posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        report.posts = report.posts?.sort((a, b) => new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime()) || [];
        return this.toDetailDto(report);
    }
    async getReportByShareToken(token) {
        const report = await this.reportRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['influencers', 'posts'],
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
    async retryReport(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (report.status !== entities_1.CollabReportStatus.FAILED && report.status !== entities_1.CollabReportStatus.COMPLETED) {
            throw new common_1.BadRequestException('Only completed or failed reports can be retried');
        }
        const totalCredits = RETRY_CREDIT_FLAT;
        const balance = await this.creditsService.getBalance(userId);
        if ((balance.unifiedBalance || 0) < totalCredits) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${totalCredits}, Available: ${balance.unifiedBalance}`);
        }
        await this.postRepo.delete({ reportId });
        report.status = entities_1.CollabReportStatus.PENDING;
        report.errorMessage = undefined;
        report.retryCount += 1;
        await this.reportRepo.save(report);
        setTimeout(() => this.processRetryReport(reportId, userId, totalCredits), 2000);
        return { success: true, report, creditsUsed: totalCredits };
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
                const share = new entities_1.CollabCheckShare();
                share.reportId = reportId;
                share.sharedWithUserId = dto.sharedWithUserId;
                share.sharedByUserId = userId;
                share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
                await this.shareRepo.save(share);
            }
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `/collab-check/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedReports = allReports.filter(r => r.status === entities_1.CollabReportStatus.COMPLETED);
        const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
        const avgEngagement = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
            : 0;
        return {
            totalReports: allReports.length,
            completedReports: completedReports.length,
            processingReports: allReports.filter(r => r.status === entities_1.CollabReportStatus.PROCESSING).length,
            pendingReports: allReports.filter(r => r.status === entities_1.CollabReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.CollabReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
            totalPostsAnalyzed,
            avgEngagementRate: Number(avgEngagement.toFixed(2)),
        };
    }
    async getChartData(userId, reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const posts = await this.postRepo.find({ where: { reportId } });
        const grouped = {};
        posts.forEach(post => {
            const dateStr = post.postDate ? new Date(post.postDate).toISOString().split('T')[0] : 'Unknown';
            if (!grouped[dateStr]) {
                grouped[dateStr] = { posts: 0, likes: 0, views: 0, comments: 0 };
            }
            grouped[dateStr].posts += 1;
            grouped[dateStr].likes += Number(post.likesCount) || 0;
            grouped[dateStr].views += Number(post.viewsCount) || 0;
            grouped[dateStr].comments += Number(post.commentsCount) || 0;
        });
        return Object.entries(grouped)
            .map(([date, data]) => ({
            date,
            postsCount: data.posts,
            likesCount: data.likes,
            viewsCount: data.views,
            commentsCount: data.comments,
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async searchInfluencers(platform, query, limit = 10) {
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
                userId: p.id,
                username: p.username || '',
                fullName: p.fullName || undefined,
                profilePicUrl: p.profilePictureUrl || undefined,
                platform: p.platform,
                followerCount: Number(p.followerCount) || 0,
            });
        }
        for (const i of insights) {
            const key = (i.username || '').toLowerCase();
            if (seen.has(key))
                continue;
            seen.add(key);
            merged.push({
                userId: i.id,
                username: i.username || '',
                fullName: i.fullName || undefined,
                profilePicUrl: i.profilePictureUrl || undefined,
                platform: i.platform,
                followerCount: Number(i.followerCount) || 0,
            });
        }
        merged.sort((a, b) => b.followerCount - a.followerCount);
        return merged.slice(0, limit);
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
            platform: report.platform,
            status: report.status,
            timePeriod: report.timePeriod,
            queries: report.queries || [],
            totalPosts: report.totalPosts || 0,
            totalFollowers: Number(report.totalFollowers) || 0,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
            influencers: (report.influencers || []).map(inf => ({
                id: inf.id,
                influencerName: inf.influencerName,
                influencerUsername: inf.influencerUsername,
                platform: inf.platform,
                profilePictureUrl: inf.profilePictureUrl,
                followerCount: inf.followerCount,
                postsCount: inf.postsCount || 0,
            })),
        };
    }
    toDetailDto(report) {
        const influencerMap = new Map();
        (report.influencers || []).forEach(inf => {
            influencerMap.set(inf.id, inf);
        });
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            status: report.status,
            errorMessage: report.errorMessage,
            timePeriod: report.timePeriod,
            queries: report.queries || [],
            totalPosts: report.totalPosts || 0,
            totalLikes: Number(report.totalLikes) || 0,
            totalViews: Number(report.totalViews) || 0,
            totalComments: Number(report.totalComments) || 0,
            totalShares: Number(report.totalShares) || 0,
            avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
            totalFollowers: Number(report.totalFollowers) || 0,
            influencers: (report.influencers || []).map(inf => ({
                id: inf.id,
                influencerName: inf.influencerName,
                influencerUsername: inf.influencerUsername,
                platform: inf.platform,
                profilePictureUrl: inf.profilePictureUrl,
                followerCount: inf.followerCount,
                postsCount: inf.postsCount || 0,
                likesCount: Number(inf.likesCount) || 0,
                viewsCount: Number(inf.viewsCount) || 0,
                commentsCount: Number(inf.commentsCount) || 0,
                sharesCount: Number(inf.sharesCount) || 0,
                avgEngagementRate: inf.avgEngagementRate ? Number(inf.avgEngagementRate) : undefined,
            })),
            posts: (report.posts || []).map(post => {
                const influencer = post.influencerId ? influencerMap.get(post.influencerId) : null;
                return {
                    id: post.id,
                    postUrl: post.postUrl,
                    postType: post.postType,
                    thumbnailUrl: post.thumbnailUrl,
                    description: post.description,
                    matchedKeywords: post.matchedKeywords,
                    likesCount: post.likesCount || 0,
                    commentsCount: post.commentsCount || 0,
                    viewsCount: post.viewsCount || 0,
                    sharesCount: post.sharesCount || 0,
                    engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
                    postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
                    influencerName: influencer?.influencerName,
                    influencerUsername: influencer?.influencerUsername,
                };
            }),
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/collab-check/shared/${report.shareUrlToken}` : undefined,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
};
exports.CollabCheckService = CollabCheckService;
exports.CollabCheckService = CollabCheckService = CollabCheckService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CollabCheckReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CollabCheckInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CollabCheckPost)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.CollabCheckShare)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(influencer_profile_entity_1.InfluencerProfile)),
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
], CollabCheckService);
//# sourceMappingURL=collab-check.service.js.map