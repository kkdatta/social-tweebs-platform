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
exports.CustomErService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const XLSX = require("xlsx");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
let CustomErService = class CustomErService {
    constructor(reportRepo, postRepo, shareRepo, userRepo) {
        this.reportRepo = reportRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
    }
    async createReport(userId, dto) {
        const startDate = new Date(dto.dateRangeStart);
        const endDate = new Date(dto.dateRangeEnd);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (startDate < oneYearAgo) {
            throw new common_1.BadRequestException('Date range cannot be more than 1 year old');
        }
        if (endDate < startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const report = new entities_1.CustomErReport();
        report.influencerProfileId = dto.influencerProfileId;
        report.platform = dto.platform;
        report.dateRangeStart = startDate;
        report.dateRangeEnd = endDate;
        report.status = entities_1.CustomErReportStatus.PENDING;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `er_share_${(0, uuid_1.v4)().substring(0, 8)}`;
        report.influencerName = 'Test Influencer';
        report.influencerUsername = 'test_influencer';
        report.followerCount = 50000;
        const savedReport = await this.reportRepo.save(report);
        setTimeout(() => this.processReport(savedReport.id), 2000);
        return { success: true, report: savedReport };
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report)
            return;
        try {
            report.status = entities_1.CustomErReportStatus.PROCESSING;
            await this.reportRepo.save(report);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const followerCountNum = Number(report.followerCount) || 0;
            if (followerCountNum === 0) {
                report.followerCount = Math.floor(Math.random() * 90000) + 10000;
                await this.reportRepo.save(report);
            }
            const fcForMetrics = Number(report.followerCount) || 0;
            const numPosts = Math.floor(Math.random() * 20) + 10;
            const posts = [];
            let totalLikes = 0, totalViews = 0, totalComments = 0, totalShares = 0;
            let sponsoredLikes = 0, sponsoredViews = 0, sponsoredComments = 0, sponsoredShares = 0;
            let sponsoredCount = 0;
            for (let i = 0; i < numPosts; i++) {
                const isSponsored = Math.random() < 0.2;
                const likes = Math.floor(Math.random() * 5000) + 500;
                const views = Math.floor(Math.random() * 30000) + 5000;
                const comments = Math.floor(Math.random() * 300) + 20;
                const shares = Math.floor(Math.random() * 100) + 10;
                const post = new entities_1.CustomErPost();
                post.reportId = reportId;
                post.postId = `post_${Date.now()}_${i}`;
                post.postUrl = `https://instagram.com/p/${post.postId}`;
                post.postType = ['IMAGE', 'VIDEO', 'REEL', 'CAROUSEL'][Math.floor(Math.random() * 4)];
                post.thumbnailUrl = `https://picsum.photos/400/400?random=${i}`;
                post.description = isSponsored
                    ? `AD: Check out this amazing product! #sponsored #ad`
                    : `Beautiful day! #lifestyle #photography`;
                post.hashtags = isSponsored ? ['#sponsored', '#ad', '#partnership'] : ['#lifestyle', '#photography'];
                post.mentions = isSponsored ? ['@brand_partner'] : [];
                post.likesCount = likes;
                post.viewsCount = views;
                post.commentsCount = comments;
                post.sharesCount = shares;
                post.engagementRate = fcForMetrics > 0
                    ? Math.min(((likes + comments) / fcForMetrics) * 100, 99999999.9999)
                    : 0;
                post.isSponsored = isSponsored;
                const rangeStart = new Date(report.dateRangeStart).getTime();
                const rangeEnd = new Date(report.dateRangeEnd).getTime();
                post.postDate = new Date(rangeStart + Math.random() * (rangeEnd - rangeStart));
                posts.push(post);
                totalLikes += likes;
                totalViews += views;
                totalComments += comments;
                totalShares += shares;
                if (isSponsored) {
                    sponsoredCount++;
                    sponsoredLikes += likes;
                    sponsoredViews += views;
                    sponsoredComments += comments;
                    sponsoredShares += shares;
                }
            }
            await this.postRepo.save(posts);
            report.allPostsCount = numPosts;
            report.allLikesCount = totalLikes;
            report.allViewsCount = totalViews;
            report.allCommentsCount = totalComments;
            report.allSharesCount = totalShares;
            report.allAvgEngagementRate = fcForMetrics > 0 && numPosts > 0
                ? Math.min(((totalLikes + totalComments) / fcForMetrics / numPosts) * 100, 99999999.9999)
                : 0;
            report.allEngagementViewsRate = totalViews > 0
                ? Math.min(((totalLikes + totalComments) / totalViews) * 100, 99999999.9999)
                : 0;
            if (sponsoredCount > 0) {
                report.hasSponsoredPosts = true;
                report.sponsoredPostsCount = sponsoredCount;
                report.sponsoredLikesCount = sponsoredLikes;
                report.sponsoredViewsCount = sponsoredViews;
                report.sponsoredCommentsCount = sponsoredComments;
                report.sponsoredSharesCount = sponsoredShares;
                report.sponsoredAvgEngagementRate = fcForMetrics > 0 && sponsoredCount > 0
                    ? Math.min(((sponsoredLikes + sponsoredComments) / fcForMetrics / sponsoredCount) * 100, 99999999.9999)
                    : 0;
                report.sponsoredEngagementViewsRate = sponsoredViews > 0
                    ? Math.min(((sponsoredLikes + sponsoredComments) / sponsoredViews) * 100, 99999999.9999)
                    : 0;
            }
            report.status = entities_1.CustomErReportStatus.COMPLETED;
            report.completedAt = new Date();
            await this.reportRepo.save(report);
        }
        catch (error) {
            report.status = entities_1.CustomErReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
        }
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
            queryBuilder.andWhere('(LOWER(report.influencerName) LIKE :search OR LOWER(report.influencerUsername) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
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
            relations: ['posts'],
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
            relations: ['posts'],
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
        if (dto.isPublic !== undefined)
            report.isPublic = dto.isPublic;
        if (dto.influencerName !== undefined)
            report.influencerName = dto.influencerName.trim();
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
    async shareReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.sharedWithUserId) {
            const share = new entities_1.CustomErShare();
            share.reportId = reportId;
            share.sharedWithUserId = dto.sharedWithUserId;
            share.sharedByUserId = userId;
            share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
            await this.shareRepo.save(share);
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/custom-er/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            totalReports: allReports.length,
            completedReports: allReports.filter(r => r.status === entities_1.CustomErReportStatus.COMPLETED).length,
            processingReports: allReports.filter(r => r.status === entities_1.CustomErReportStatus.PROCESSING).length,
            pendingReports: allReports.filter(r => r.status === entities_1.CustomErReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.CustomErReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
        };
    }
    async getReportPosts(userId, reportId, sponsoredOnly = false) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const queryBuilder = this.postRepo.createQueryBuilder('post')
            .where('post.reportId = :reportId', { reportId });
        if (sponsoredOnly) {
            queryBuilder.andWhere('post.isSponsored = true');
        }
        queryBuilder.orderBy('post.postDate', 'DESC');
        const posts = await queryBuilder.getMany();
        return posts.map(p => this.toPostDto(p));
    }
    async createReportsFromExcel(userId, file, platform, dateRangeStart, dateRangeEnd) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        if (!platform || !dateRangeStart || !dateRangeEnd) {
            throw new common_1.BadRequestException('Platform and date range are required');
        }
        const startDate = new Date(dateRangeStart);
        const endDate = new Date(dateRangeEnd);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        if (startDate < oneYearAgo) {
            throw new common_1.BadRequestException('Date range cannot be more than 1 year old');
        }
        if (endDate < startDate) {
            throw new common_1.BadRequestException('End date must be after start date');
        }
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new common_1.BadRequestException('Excel file has no sheets');
        }
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet);
        if (rows.length === 0) {
            throw new common_1.BadRequestException('Excel file has no data rows');
        }
        const errors = [];
        let reportsCreated = 0;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const profileUrl = row['Profile URL'] || row['profile_url'] || row['profileUrl'] || row['url'] || '';
            const influencerName = row['Influencer Name'] || row['influencer_name'] || row['name'] || '';
            const followers = parseInt(row['Followers'] || row['followers'] || row['follower_count'] || '0', 10) || 0;
            if (!profileUrl && !influencerName) {
                errors.push(`Row ${i + 2}: Missing profile URL and influencer name`);
                continue;
            }
            try {
                let username = '';
                if (profileUrl) {
                    const urlMatch = profileUrl.match(/(?:instagram\.com|tiktok\.com)\/@?([^/?]+)/i);
                    username = urlMatch ? urlMatch[1] : profileUrl;
                }
                const report = new entities_1.CustomErReport();
                report.influencerProfileUrl = profileUrl;
                report.influencerName = influencerName || username || `Influencer ${i + 1}`;
                report.influencerUsername = username || influencerName;
                report.platform = platform;
                report.dateRangeStart = startDate;
                report.dateRangeEnd = endDate;
                report.status = entities_1.CustomErReportStatus.PENDING;
                report.ownerId = userId;
                report.createdById = userId;
                report.followerCount = followers;
                report.shareUrlToken = `er_share_${(0, uuid_1.v4)().substring(0, 8)}`;
                const savedReport = await this.reportRepo.save(report);
                reportsCreated++;
                setTimeout(() => this.processReport(savedReport.id), 2000 + i * 1000);
            }
            catch (err) {
                errors.push(`Row ${i + 2}: Failed to create report - ${err.message}`);
            }
        }
        return { success: reportsCreated > 0, reportsCreated, errors };
    }
    generateSampleExcel() {
        const sampleData = [
            { 'Influencer Name': 'John Doe', 'Profile URL': 'https://instagram.com/johndoe', 'Followers': 50000 },
            { 'Influencer Name': 'Jane Smith', 'Profile URL': 'https://instagram.com/janesmith', 'Followers': 120000 },
            { 'Influencer Name': 'Creator Pro', 'Profile URL': 'https://instagram.com/creatorpro', 'Followers': 75000 },
        ];
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        worksheet['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Influencers');
        return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
    }
    async downloadReportAsXlsx(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const workbook = XLSX.utils.book_new();
        const summaryData = [
            { Metric: 'Influencer Name', Value: report.influencerName },
            { Metric: 'Username', Value: report.influencerUsername || '' },
            { Metric: 'Platform', Value: report.platform },
            { Metric: 'Followers', Value: report.followerCount },
            { Metric: 'Date Range', Value: `${report.dateRangeStart} to ${report.dateRangeEnd}` },
            { Metric: 'Report Status', Value: report.status },
            { Metric: '', Value: '' },
            { Metric: '--- All Posts ---', Value: '' },
            { Metric: 'Total Posts', Value: report.allPostsCount },
            { Metric: 'Total Likes', Value: Number(report.allLikesCount) },
            { Metric: 'Total Views', Value: Number(report.allViewsCount) },
            { Metric: 'Total Comments', Value: Number(report.allCommentsCount) },
            { Metric: 'Total Shares', Value: Number(report.allSharesCount) },
            { Metric: 'Avg Engagement Rate (%)', Value: report.allAvgEngagementRate ? Number(report.allAvgEngagementRate).toFixed(2) : '0' },
            { Metric: 'Engagements/Views Rate (%)', Value: report.allEngagementViewsRate ? Number(report.allEngagementViewsRate).toFixed(2) : '0' },
        ];
        if (report.hasSponsoredPosts) {
            summaryData.push({ Metric: '', Value: '' }, { Metric: '--- Sponsored Posts ---', Value: '' }, { Metric: 'Sponsored Posts', Value: report.sponsoredPostsCount }, { Metric: 'Sponsored Likes', Value: Number(report.sponsoredLikesCount) }, { Metric: 'Sponsored Views', Value: Number(report.sponsoredViewsCount) }, { Metric: 'Sponsored Comments', Value: Number(report.sponsoredCommentsCount) }, { Metric: 'Sponsored Shares', Value: Number(report.sponsoredSharesCount) }, { Metric: 'Sponsored Avg ER (%)', Value: report.sponsoredAvgEngagementRate ? Number(report.sponsoredAvgEngagementRate).toFixed(2) : '0' }, { Metric: 'Sponsored Eng/Views (%)', Value: report.sponsoredEngagementViewsRate ? Number(report.sponsoredEngagementViewsRate).toFixed(2) : '0' });
        }
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        const posts = report.posts || [];
        const postsData = posts.map(p => ({
            'Post Date': p.postDate instanceof Date ? p.postDate.toISOString().split('T')[0] : String(p.postDate).split('T')[0],
            'Post Type': p.postType || '',
            'Description': p.description || '',
            'Likes': p.likesCount,
            'Views': p.viewsCount,
            'Comments': p.commentsCount,
            'Shares': p.sharesCount,
            'Engagement Rate (%)': p.engagementRate ? Number(p.engagementRate).toFixed(2) : '0',
            'Sponsored': p.isSponsored ? 'Yes' : 'No',
            'Post URL': p.postUrl || '',
            'Hashtags': (p.hashtags || []).join(', '),
            'Mentions': (p.mentions || []).join(', '),
        }));
        if (postsData.length > 0) {
            const postsSheet = XLSX.utils.json_to_sheet(postsData);
            postsSheet['!cols'] = [
                { wch: 12 }, { wch: 10 }, { wch: 40 }, { wch: 10 },
                { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 },
                { wch: 10 }, { wch: 45 }, { wch: 30 }, { wch: 30 },
            ];
            XLSX.utils.book_append_sheet(workbook, postsSheet, 'Posts');
        }
        const buffer = Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
        const filename = `ER_Report_${report.influencerUsername || report.influencerName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        return { buffer, filename };
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
            influencerName: report.influencerName,
            influencerUsername: report.influencerUsername,
            influencerAvatarUrl: report.influencerAvatarUrl,
            platform: report.platform,
            dateRangeStart: report.dateRangeStart instanceof Date
                ? report.dateRangeStart.toISOString().split('T')[0]
                : String(report.dateRangeStart).split('T')[0],
            dateRangeEnd: report.dateRangeEnd instanceof Date
                ? report.dateRangeEnd.toISOString().split('T')[0]
                : String(report.dateRangeEnd).split('T')[0],
            postsCount: report.allPostsCount,
            status: report.status,
            createdAt: report.createdAt,
        };
    }
    toDetailDto(report) {
        const posts = report.posts || [];
        const postsChartData = this.generateChartData(posts, report.dateRangeStart, report.dateRangeEnd);
        return {
            id: report.id,
            influencerName: report.influencerName,
            influencerUsername: report.influencerUsername,
            influencerAvatarUrl: report.influencerAvatarUrl,
            followerCount: report.followerCount,
            platform: report.platform,
            dateRangeStart: report.dateRangeStart instanceof Date
                ? report.dateRangeStart.toISOString().split('T')[0]
                : String(report.dateRangeStart).split('T')[0],
            dateRangeEnd: report.dateRangeEnd instanceof Date
                ? report.dateRangeEnd.toISOString().split('T')[0]
                : String(report.dateRangeEnd).split('T')[0],
            status: report.status,
            errorMessage: report.errorMessage,
            allPostsMetrics: {
                postsCount: report.allPostsCount,
                likesCount: Number(report.allLikesCount),
                viewsCount: Number(report.allViewsCount),
                commentsCount: Number(report.allCommentsCount),
                sharesCount: Number(report.allSharesCount),
                avgEngagementRate: report.allAvgEngagementRate ? Number(report.allAvgEngagementRate) : undefined,
                engagementViewsRate: report.allEngagementViewsRate ? Number(report.allEngagementViewsRate) : undefined,
            },
            sponsoredPostsMetrics: report.hasSponsoredPosts ? {
                postsCount: report.sponsoredPostsCount,
                likesCount: Number(report.sponsoredLikesCount),
                viewsCount: Number(report.sponsoredViewsCount),
                commentsCount: Number(report.sponsoredCommentsCount),
                sharesCount: Number(report.sponsoredSharesCount),
                avgEngagementRate: report.sponsoredAvgEngagementRate ? Number(report.sponsoredAvgEngagementRate) : undefined,
                engagementViewsRate: report.sponsoredEngagementViewsRate ? Number(report.sponsoredEngagementViewsRate) : undefined,
            } : undefined,
            hasSponsoredPosts: report.hasSponsoredPosts,
            posts: posts.map(p => this.toPostDto(p)),
            postsChartData,
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/custom-er/shared/${report.shareUrlToken}` : undefined,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
    toPostDto(post) {
        return {
            id: post.id,
            postId: post.postId,
            postUrl: post.postUrl,
            postType: post.postType,
            thumbnailUrl: post.thumbnailUrl,
            description: post.description,
            hashtags: post.hashtags,
            mentions: post.mentions,
            likesCount: post.likesCount,
            viewsCount: post.viewsCount,
            commentsCount: post.commentsCount,
            sharesCount: post.sharesCount,
            engagementRate: post.engagementRate ? Number(post.engagementRate) : undefined,
            isSponsored: post.isSponsored,
            postDate: post.postDate instanceof Date
                ? post.postDate.toISOString().split('T')[0]
                : String(post.postDate).split('T')[0],
        };
    }
    generateChartData(posts, startDate, endDate) {
        const chartData = {};
        const start = new Date(startDate);
        const end = new Date(endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            chartData[dateStr] = { regularPosts: 0, sponsoredPosts: 0 };
        }
        for (const post of posts) {
            const dateStr = post.postDate instanceof Date
                ? post.postDate.toISOString().split('T')[0]
                : String(post.postDate).split('T')[0];
            if (chartData[dateStr]) {
                if (post.isSponsored) {
                    chartData[dateStr].sponsoredPosts++;
                }
                else {
                    chartData[dateStr].regularPosts++;
                }
            }
        }
        return Object.entries(chartData).map(([date, data]) => ({
            date,
            regularPosts: data.regularPosts,
            sponsoredPosts: data.sponsoredPosts,
        }));
    }
};
exports.CustomErService = CustomErService;
exports.CustomErService = CustomErService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.CustomErReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CustomErPost)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CustomErShare)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CustomErService);
//# sourceMappingURL=custom-er.service.js.map