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
exports.PaidCollaborationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const CREDIT_PER_REPORT = 1;
let PaidCollaborationService = class PaidCollaborationService {
    constructor(reportRepo, influencerRepo, postRepo, shareRepo, categorizationRepo, userRepo, creditsService) {
        this.reportRepo = reportRepo;
        this.influencerRepo = influencerRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.categorizationRepo = categorizationRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
    }
    async createReport(userId, dto) {
        const startDate = new Date(dto.dateRangeStart);
        const endDate = new Date(dto.dateRangeEnd);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        if (startDate < threeMonthsAgo) {
            throw new common_1.BadRequestException('Date range start cannot be more than 3 months ago');
        }
        if (endDate < startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        if (!dto.hashtags?.length && !dto.mentions?.length) {
            throw new common_1.BadRequestException('At least one hashtag or mention is required');
        }
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_GENERATION,
            quantity: CREDIT_PER_REPORT,
            module: enums_1.ModuleType.PAID_COLLABORATION,
            resourceId: 'new-paid-collab-report',
            resourceType: 'paid_collaboration_report_creation',
        });
        const report = new entities_1.PaidCollabReport();
        report.title = dto.title || 'Untitled Collaboration Report';
        report.platform = dto.platform;
        report.hashtags = dto.hashtags || [];
        report.mentions = dto.mentions || [];
        report.queryLogic = dto.queryLogic || entities_1.QueryLogic.OR;
        report.dateRangeStart = startDate;
        report.dateRangeEnd = endDate;
        report.status = entities_1.PaidCollabReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `pc_${(0, uuid_1.v4)().substring(0, 8)}`;
        report.creditsUsed = CREDIT_PER_REPORT;
        const savedReport = await this.reportRepo.save(report);
        setTimeout(() => this.processReport(savedReport.id), 2000);
        return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
        });
        if (!report)
            return;
        try {
            report.status = entities_1.PaidCollabReportStatus.IN_PROGRESS;
            await this.reportRepo.save(report);
            await new Promise(resolve => setTimeout(resolve, 1500));
            const influencerCount = Math.floor(Math.random() * 20) + 5;
            const influencerData = await this.generateDummyInfluencers(report, influencerCount);
            let totalInfluencers = 0;
            let totalPosts = 0;
            let totalLikes = 0;
            let totalViews = 0;
            let totalComments = 0;
            let totalShares = 0;
            let totalFollowers = 0;
            const categoryData = {
                [entities_1.InfluencerCategory.ALL]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
                [entities_1.InfluencerCategory.NANO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
                [entities_1.InfluencerCategory.MICRO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
                [entities_1.InfluencerCategory.MACRO]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
                [entities_1.InfluencerCategory.MEGA]: { accounts: 0, followers: 0, posts: 0, likes: 0, views: 0, comments: 0, shares: 0 },
            };
            for (const infData of influencerData) {
                const fc = Number(infData.followerCount) || 0;
                const pc = Number(infData.postsCount) || 0;
                const lc = Number(infData.likesCount) || 0;
                const vc = Number(infData.viewsCount) || 0;
                const cc = Number(infData.commentsCount) || 0;
                const sc = Number(infData.sharesCount) || 0;
                totalInfluencers++;
                totalFollowers += fc;
                totalPosts += pc;
                totalLikes += lc;
                totalViews += vc;
                totalComments += cc;
                totalShares += sc;
                const cat = infData.category;
                categoryData[cat].accounts++;
                categoryData[cat].followers += fc;
                categoryData[cat].posts += pc;
                categoryData[cat].likes += lc;
                categoryData[cat].views += vc;
                categoryData[cat].comments += cc;
                categoryData[cat].shares += sc;
            }
            categoryData[entities_1.InfluencerCategory.ALL] = {
                accounts: totalInfluencers,
                followers: totalFollowers,
                posts: totalPosts,
                likes: totalLikes,
                views: totalViews,
                comments: totalComments,
                shares: totalShares,
            };
            for (const [category, data] of Object.entries(categoryData)) {
                const cat = new entities_1.PaidCollabCategorization();
                cat.reportId = reportId;
                cat.category = category;
                cat.accountsCount = data.accounts;
                cat.followersCount = data.followers;
                cat.postsCount = data.posts;
                cat.likesCount = data.likes;
                cat.viewsCount = data.views;
                cat.commentsCount = data.comments;
                cat.sharesCount = data.shares;
                const catDenom = data.posts > 0 && data.accounts > 0 ? data.posts * (data.followers / data.accounts) : 0;
                cat.engagementRate =
                    data.followers > 0 && catDenom > 0
                        ? ((data.likes + data.comments) / catDenom) * 100
                        : 0;
                await this.categorizationRepo.save(cat);
            }
            report.totalInfluencers = totalInfluencers;
            report.totalPosts = totalPosts;
            report.totalLikes = totalLikes;
            report.totalViews = totalViews;
            report.totalComments = totalComments;
            report.totalShares = totalShares;
            const avgFollowersPerInf = totalInfluencers > 0 ? totalFollowers / totalInfluencers : 0;
            const reportEngDenom = totalPosts * avgFollowersPerInf;
            report.avgEngagementRate = reportEngDenom > 0 ? ((totalLikes + totalComments) / reportEngDenom) * 100 : 0;
            report.engagementViewsRate = totalViews > 0
                ? ((totalLikes + totalComments) / totalViews) * 100
                : 0;
            report.status = entities_1.PaidCollabReportStatus.COMPLETED;
            report.completedAt = new Date();
            await this.reportRepo.save(report);
        }
        catch (error) {
            report.status = entities_1.PaidCollabReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
        }
    }
    async generateDummyInfluencers(report, count) {
        const influencers = [];
        const names = [
            'Fashion Star', 'Travel Guru', 'Fitness Pro', 'Tech Reviewer', 'Food Blogger',
            'Beauty Queen', 'Lifestyle Maven', 'Music Lover', 'Art Creator', 'Gaming Pro',
            'Health Coach', 'Business Mentor', 'DIY Master', 'Pet Lover', 'Car Enthusiast',
            'Sports Fan', 'Movie Buff', 'Book Worm', 'Coffee Addict', 'Adventure Seeker',
        ];
        for (let i = 0; i < count; i++) {
            const followerCount = Math.floor(Math.random() * 1000000) + 1000;
            const postsCount = Math.floor(Math.random() * 10) + 1;
            const inf = new entities_1.PaidCollabInfluencer();
            inf.reportId = report.id;
            inf.influencerName = names[i % names.length] + ` ${i + 1}`;
            inf.influencerUsername = names[i % names.length].toLowerCase().replace(' ', '_') + `_${i + 1}`;
            inf.platform = report.platform;
            inf.profilePictureUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.influencerName)}&background=random`;
            inf.followerCount = followerCount;
            inf.category = this.getInfluencerCategory(followerCount);
            inf.credibilityScore = Math.floor(Math.random() * 30) + 70;
            inf.displayOrder = i;
            let infLikes = 0, infViews = 0, infComments = 0, infShares = 0;
            for (let j = 0; j < postsCount; j++) {
                const post = await this.generateDummyPost(report, inf, j);
                infLikes += Number(post.likesCount) || 0;
                infViews += Number(post.viewsCount) || 0;
                infComments += Number(post.commentsCount) || 0;
                infShares += Number(post.sharesCount) || 0;
            }
            inf.postsCount = postsCount;
            inf.likesCount = infLikes;
            inf.viewsCount = infViews;
            inf.commentsCount = infComments;
            inf.sharesCount = infShares;
            const infDenom = postsCount * followerCount;
            inf.engagementRate =
                followerCount > 0 && infDenom > 0 ? ((infLikes + infComments) / infDenom) * 100 : 0;
            const savedInf = await this.influencerRepo.save(inf);
            influencers.push(savedInf);
        }
        return influencers;
    }
    async generateDummyPost(report, influencer, index) {
        const post = new entities_1.PaidCollabPost();
        post.reportId = report.id;
        post.influencerId = influencer.id;
        post.postId = `post_${Date.now()}_${index}`;
        post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
        post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now() + index}`;
        const matchedHashtags = report.hashtags.filter(() => Math.random() > 0.3);
        const matchedMentions = report.mentions.filter(() => Math.random() > 0.3);
        post.caption = `Check out this amazing collaboration! ${matchedHashtags.map(h => `#${h.replace('#', '')}`).join(' ')} ${matchedMentions.map(m => `@${m.replace('@', '')}`).join(' ')} #sponsored`;
        post.matchedHashtags = matchedHashtags;
        post.matchedMentions = matchedMentions;
        post.isSponsored = Math.random() > 0.5;
        post.likesCount = Math.floor(Math.random() * 20000) + 500;
        post.commentsCount = Math.floor(Math.random() * 500) + 20;
        post.viewsCount = Math.floor(Math.random() * 100000) + 5000;
        post.sharesCount = Math.floor(Math.random() * 200) + 10;
        post.engagementRate = influencer.followerCount > 0
            ? ((post.likesCount + post.commentsCount) / influencer.followerCount) * 100
            : 0;
        const startTime = new Date(report.dateRangeStart).getTime();
        const endTime = new Date(report.dateRangeEnd).getTime();
        const randomTime = startTime + Math.random() * (endTime - startTime);
        post.postDate = new Date(randomTime);
        post.postUrl = `https://instagram.com/p/${post.postId}`;
        return await this.postRepo.save(post);
    }
    getInfluencerCategory(followerCount) {
        if (followerCount < 10000)
            return entities_1.InfluencerCategory.NANO;
        if (followerCount < 100000)
            return entities_1.InfluencerCategory.MICRO;
        if (followerCount < 500000)
            return entities_1.InfluencerCategory.MACRO;
        return entities_1.InfluencerCategory.MEGA;
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
            queryBuilder.where('report.createdById IN (:...teamUserIds)', { teamUserIds: teamUserIds.filter(id => id !== userId) });
        }
        else if (filters.createdBy === 'SHARED') {
            const sharedReportIds = await this.getSharedReportIds(userId);
            if (sharedReportIds.length === 0) {
                return { reports: [], total: 0, page, limit, hasMore: false };
            }
            queryBuilder.where('report.id IN (:...sharedReportIds)', { sharedReportIds });
        }
        else {
            const teamUserIds = await this.getTeamUserIds(userId);
            const sharedReportIds = await this.getSharedReportIds(userId);
            if (sharedReportIds.length > 0) {
                queryBuilder.where('(report.createdById = :userId OR report.createdById IN (:...teamUserIds) OR report.id IN (:...sharedReportIds))', { userId, teamUserIds, sharedReportIds });
            }
            else {
                queryBuilder.where('(report.createdById = :userId OR report.createdById IN (:...teamUserIds))', { userId, teamUserIds });
            }
        }
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('(LOWER(report.title) LIKE :search OR LOWER(array_to_string(report.hashtags, \',\')) LIKE :search OR LOWER(array_to_string(report.mentions, \',\')) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
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
            relations: ['influencers', 'posts', 'categorizations'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        report.posts = report.posts?.sort((a, b) => new Date(b.postDate || 0).getTime() - new Date(a.postDate || 0).getTime()) || [];
        report.influencers = report.influencers?.sort((a, b) => Number(b.likesCount) - Number(a.likesCount)) || [];
        return this.toDetailDto(report);
    }
    async getReportByShareToken(token) {
        const report = await this.reportRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['influencers', 'posts', 'categorizations'],
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
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (report.status !== entities_1.PaidCollabReportStatus.FAILED) {
            throw new common_1.BadRequestException('Only failed reports can be retried');
        }
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_REFRESH,
            quantity: CREDIT_PER_REPORT,
            module: enums_1.ModuleType.PAID_COLLABORATION,
            resourceId: reportId,
            resourceType: 'paid_collab_report_retry',
        });
        await this.postRepo.delete({ reportId });
        await this.influencerRepo.delete({ reportId });
        await this.categorizationRepo.delete({ reportId });
        report.status = entities_1.PaidCollabReportStatus.PENDING;
        report.errorMessage = undefined;
        report.retryCount += 1;
        report.creditsUsed += CREDIT_PER_REPORT;
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
        let targetUserId = dto.sharedWithUserId;
        if (!targetUserId && dto.sharedWithEmail) {
            const targetUser = await this.userRepo.findOne({ where: { email: dto.sharedWithEmail } });
            if (!targetUser) {
                throw new common_1.NotFoundException('User with this email not found');
            }
            targetUserId = targetUser.id;
        }
        if (targetUserId) {
            const existingShare = await this.shareRepo.findOne({
                where: { reportId, sharedWithUserId: targetUserId },
            });
            if (!existingShare) {
                const share = new entities_1.PaidCollabShare();
                share.reportId = reportId;
                share.sharedWithUserId = targetUserId;
                share.sharedByUserId = userId;
                share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
                await this.shareRepo.save(share);
            }
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/paid-collaboration/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedReports = allReports.filter(r => r.status === entities_1.PaidCollabReportStatus.COMPLETED);
        const totalInfluencersAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalInfluencers || 0), 0);
        const totalPostsAnalyzed = completedReports.reduce((sum, r) => sum + (r.totalPosts || 0), 0);
        const avgEngagement = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + (Number(r.avgEngagementRate) || 0), 0) / completedReports.length
            : 0;
        return {
            totalReports: allReports.length,
            completedReports: completedReports.length,
            inProgressReports: allReports.filter(r => r.status === entities_1.PaidCollabReportStatus.IN_PROGRESS).length,
            pendingReports: allReports.filter(r => r.status === entities_1.PaidCollabReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.PaidCollabReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
            totalInfluencersAnalyzed,
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
                grouped[dateStr] = { posts: 0, influencers: new Set(), likes: 0, views: 0 };
            }
            grouped[dateStr].posts += 1;
            if (post.influencerId) {
                grouped[dateStr].influencers.add(post.influencerId);
            }
            grouped[dateStr].likes += post.likesCount || 0;
            grouped[dateStr].views += post.viewsCount || 0;
        });
        return Object.entries(grouped)
            .map(([date, data]) => ({
            date,
            postsCount: data.posts,
            influencersCount: data.influencers.size,
            likesCount: data.likes,
            viewsCount: data.views,
        }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    async getPosts(userId, reportId, sponsoredOnly = false, sortBy = 'likesCount', sortOrder = 'DESC', category, page = 1, limit = 20) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const queryBuilder = this.postRepo.createQueryBuilder('post')
            .leftJoinAndSelect('post.influencer', 'influencer')
            .where('post.reportId = :reportId', { reportId });
        if (sponsoredOnly) {
            queryBuilder.andWhere('post.isSponsored = true');
        }
        if (category && category !== entities_1.InfluencerCategory.ALL) {
            queryBuilder.andWhere('influencer.category = :category', { category });
        }
        const validSortFields = ['likesCount', 'commentsCount', 'viewsCount', 'sharesCount', 'postDate', 'engagementRate'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'likesCount';
        queryBuilder.orderBy(`post.${sortField}`, sortOrder);
        const total = await queryBuilder.getCount();
        const posts = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return {
            posts: posts.map(post => this.toPostDto(post)),
            total,
        };
    }
    async getInfluencers(userId, reportId, category, sortBy = 'likesCount', sortOrder = 'DESC', page = 1, limit = 20) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const queryBuilder = this.influencerRepo.createQueryBuilder('influencer')
            .where('influencer.reportId = :reportId', { reportId });
        if (category && category !== entities_1.InfluencerCategory.ALL) {
            queryBuilder.andWhere('influencer.category = :category', { category });
        }
        const sortFieldMap = {
            recent: 'createdAt',
            oldest: 'createdAt',
            leastLiked: 'likesCount',
            mostLiked: 'likesCount',
            leastCommented: 'commentsCount',
            mostCommented: 'commentsCount',
            lowestCredibility: 'credibilityScore',
            highestCredibility: 'credibilityScore',
            lowestFollowers: 'followerCount',
            highestFollowers: 'followerCount',
        };
        const orderMap = {
            recent: 'DESC',
            oldest: 'ASC',
            leastLiked: 'ASC',
            mostLiked: 'DESC',
            leastCommented: 'ASC',
            mostCommented: 'DESC',
            lowestCredibility: 'ASC',
            highestCredibility: 'DESC',
            lowestFollowers: 'ASC',
            highestFollowers: 'DESC',
        };
        const sortField = sortFieldMap[sortBy] || 'likesCount';
        const order = orderMap[sortBy] || sortOrder;
        queryBuilder.orderBy(`influencer.${sortField}`, order);
        const total = await queryBuilder.getCount();
        const influencers = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return {
            influencers: influencers.map(inf => this.toInfluencerDto(inf)),
            total,
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
    async getSharedReportIds(userId) {
        const shares = await this.shareRepo.find({
            where: { sharedWithUserId: userId },
            select: ['reportId'],
        });
        return shares.map(s => s.reportId);
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
            hashtags: report.hashtags || [],
            mentions: report.mentions || [],
            dateRangeStart: report.dateRangeStart ? (report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : String(report.dateRangeStart).split('T')[0]) : '',
            dateRangeEnd: report.dateRangeEnd ? (report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : String(report.dateRangeEnd).split('T')[0]) : '',
            totalInfluencers: report.totalInfluencers || 0,
            totalPosts: report.totalPosts || 0,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
        };
    }
    toDetailDto(report) {
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            status: report.status,
            errorMessage: report.errorMessage,
            hashtags: report.hashtags || [],
            mentions: report.mentions || [],
            queryLogic: report.queryLogic,
            dateRangeStart: report.dateRangeStart ? (report.dateRangeStart instanceof Date ? report.dateRangeStart.toISOString().split('T')[0] : String(report.dateRangeStart).split('T')[0]) : '',
            dateRangeEnd: report.dateRangeEnd ? (report.dateRangeEnd instanceof Date ? report.dateRangeEnd.toISOString().split('T')[0] : String(report.dateRangeEnd).split('T')[0]) : '',
            totalInfluencers: report.totalInfluencers || 0,
            totalPosts: report.totalPosts || 0,
            totalLikes: Number(report.totalLikes) || 0,
            totalViews: Number(report.totalViews) || 0,
            totalComments: Number(report.totalComments) || 0,
            totalShares: Number(report.totalShares) || 0,
            avgEngagementRate: report.avgEngagementRate ? Number(report.avgEngagementRate) : undefined,
            engagementViewsRate: report.engagementViewsRate ? Number(report.engagementViewsRate) : undefined,
            influencers: (report.influencers || []).map(inf => this.toInfluencerDto(inf)),
            posts: (report.posts || []).map(post => this.toPostDto(post)),
            categorizations: (report.categorizations || []).map(cat => this.toCategorizationDto(cat)),
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/paid-collaboration/shared/${report.shareUrlToken}` : undefined,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
    toInfluencerDto(inf) {
        return {
            id: inf.id,
            influencerName: inf.influencerName,
            influencerUsername: inf.influencerUsername,
            platform: inf.platform,
            profilePictureUrl: inf.profilePictureUrl,
            followerCount: Number(inf.followerCount),
            postsCount: inf.postsCount || 0,
            likesCount: Number(inf.likesCount) || 0,
            viewsCount: Number(inf.viewsCount) || 0,
            commentsCount: Number(inf.commentsCount) || 0,
            sharesCount: Number(inf.sharesCount) || 0,
            engagementRate: inf.engagementRate ? Number(inf.engagementRate) : undefined,
            category: inf.category,
            credibilityScore: inf.credibilityScore ? Number(inf.credibilityScore) : undefined,
        };
    }
    toPostDto(post) {
        return {
            id: post.id,
            postUrl: post.postUrl,
            postType: post.postType,
            thumbnailUrl: post.thumbnailUrl,
            caption: post.caption,
            matchedHashtags: post.matchedHashtags,
            matchedMentions: post.matchedMentions,
            isSponsored: post.isSponsored,
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            viewsCount: post.viewsCount || 0,
            sharesCount: post.sharesCount || 0,
            engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
            postDate: post.postDate ? (post.postDate instanceof Date ? post.postDate.toISOString().split('T')[0] : String(post.postDate).split('T')[0]) : undefined,
            influencerName: post.influencer?.influencerName,
            influencerUsername: post.influencer?.influencerUsername,
        };
    }
    toCategorizationDto(cat) {
        return {
            category: cat.category,
            accountsCount: cat.accountsCount || 0,
            followersCount: Number(cat.followersCount) || 0,
            postsCount: cat.postsCount || 0,
            likesCount: Number(cat.likesCount) || 0,
            viewsCount: Number(cat.viewsCount) || 0,
            commentsCount: Number(cat.commentsCount) || 0,
            sharesCount: Number(cat.sharesCount) || 0,
            engagementRate: cat.engagementRate ? Number(cat.engagementRate) : undefined,
        };
    }
};
exports.PaidCollaborationService = PaidCollaborationService;
exports.PaidCollaborationService = PaidCollaborationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PaidCollabReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PaidCollabInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.PaidCollabPost)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.PaidCollabShare)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.PaidCollabCategorization)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService])
], PaidCollaborationService);
//# sourceMappingURL=paid-collaboration.service.js.map