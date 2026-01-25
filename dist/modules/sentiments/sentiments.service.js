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
exports.SentimentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const PDFDocument = require("pdfkit");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const CREDIT_PER_URL = 1;
let SentimentsService = class SentimentsService {
    constructor(reportRepo, postRepo, emotionRepo, wordCloudRepo, shareRepo, userRepo, creditsService) {
        this.reportRepo = reportRepo;
        this.postRepo = postRepo;
        this.emotionRepo = emotionRepo;
        this.wordCloudRepo = wordCloudRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
    }
    async createReport(userId, dto) {
        const urlCount = dto.urls.length;
        const totalCredits = urlCount * CREDIT_PER_URL;
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_GENERATION,
            quantity: totalCredits,
            module: enums_1.ModuleType.SOCIAL_SENTIMENTS,
            resourceId: 'new-sentiment-reports',
            resourceType: 'sentiment_report_creation',
        });
        const reports = [];
        for (const url of dto.urls) {
            const report = new entities_1.SentimentReport();
            report.title = dto.title || 'Untitled Sentiment Report';
            report.reportType = dto.reportType;
            report.platform = dto.platform;
            report.targetUrl = url;
            report.status = entities_1.SentimentReportStatus.PENDING;
            report.ownerId = userId;
            report.createdById = userId;
            report.shareUrlToken = `sent_share_${(0, uuid_1.v4)().substring(0, 8)}`;
            report.creditsUsed = CREDIT_PER_URL;
            if (dto.deepBrandAnalysis) {
                report.deepBrandAnalysis = true;
                report.brandName = dto.brandName;
                report.brandUsername = dto.brandUsername;
                report.productName = dto.productName;
            }
            report.influencerName = 'Influencer';
            report.influencerUsername = this.extractUsernameFromUrl(url);
            const savedReport = await this.reportRepo.save(report);
            reports.push(savedReport);
            setTimeout(() => this.processReport(savedReport.id), 2000);
        }
        return { success: true, reports, creditsUsed: totalCredits };
    }
    extractUsernameFromUrl(url) {
        const match = url.match(/instagram\.com\/(?:p\/)?([^\/\?]+)/);
        return match ? match[1] : 'unknown';
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report)
            return;
        try {
            report.status = entities_1.SentimentReportStatus.AGGREGATING;
            await this.reportRepo.save(report);
            await new Promise(resolve => setTimeout(resolve, 500));
            report.status = entities_1.SentimentReportStatus.IN_PROCESS;
            await this.reportRepo.save(report);
            await new Promise(resolve => setTimeout(resolve, 1000));
            const positive = Math.random() * 50 + 30;
            const neutral = Math.random() * 30 + 10;
            const negative = 100 - positive - neutral;
            report.overallSentimentScore = positive * 1.2 - negative * 0.5 + 20;
            report.positivePercentage = Number(positive.toFixed(2));
            report.neutralPercentage = Number(neutral.toFixed(2));
            report.negativePercentage = Number(negative.toFixed(2));
            const post = new entities_1.SentimentPost();
            post.reportId = reportId;
            post.postId = `post_${Date.now()}`;
            post.postUrl = report.targetUrl;
            post.thumbnailUrl = `https://picsum.photos/400/400?random=${Date.now()}`;
            post.description = 'Sample post description with #hashtags and @mentions';
            post.likesCount = Math.floor(Math.random() * 10000) + 1000;
            post.commentsCount = Math.floor(Math.random() * 500) + 50;
            post.viewsCount = Math.floor(Math.random() * 50000) + 5000;
            post.engagementRate = ((post.likesCount + post.commentsCount) / 50000) * 100;
            post.sentimentScore = report.overallSentimentScore;
            post.positivePercentage = report.positivePercentage;
            post.neutralPercentage = report.neutralPercentage;
            post.negativePercentage = report.negativePercentage;
            post.commentsAnalyzed = post.commentsCount;
            post.postDate = new Date();
            const savedPost = await this.postRepo.save(post);
            const emotions = ['love', 'joy', 'admiration', 'neutral', 'disappointment', 'anger'];
            let remainingPercentage = 100;
            for (let i = 0; i < emotions.length; i++) {
                const emotion = new entities_1.SentimentEmotion();
                emotion.reportId = reportId;
                emotion.postId = savedPost.id;
                emotion.emotion = emotions[i];
                if (i === emotions.length - 1) {
                    emotion.percentage = remainingPercentage;
                }
                else {
                    emotion.percentage = Math.floor(Math.random() * (remainingPercentage / 2));
                    remainingPercentage -= emotion.percentage;
                }
                emotion.count = Math.floor(emotion.percentage * post.commentsCount / 100);
                await this.emotionRepo.save(emotion);
            }
            const words = ['amazing', 'love', 'beautiful', 'great', 'awesome', 'good', 'nice', 'perfect', 'bad', 'poor'];
            const sentiments = ['POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'POSITIVE', 'NEUTRAL', 'NEUTRAL', 'POSITIVE', 'NEGATIVE', 'NEGATIVE'];
            for (let i = 0; i < words.length; i++) {
                const wordCloud = new entities_1.SentimentWordCloud();
                wordCloud.reportId = reportId;
                wordCloud.postId = savedPost.id;
                wordCloud.word = words[i];
                wordCloud.frequency = Math.floor(Math.random() * 100) + 20;
                wordCloud.sentiment = sentiments[i];
                await this.wordCloudRepo.save(wordCloud);
            }
            report.status = entities_1.SentimentReportStatus.COMPLETED;
            report.completedAt = new Date();
            await this.reportRepo.save(report);
        }
        catch (error) {
            report.status = entities_1.SentimentReportStatus.FAILED;
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
        if (filters.reportType) {
            queryBuilder.andWhere('report.reportType = :reportType', { reportType: filters.reportType });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('(LOWER(report.title) LIKE :search OR LOWER(report.influencerName) LIKE :search)', { search: `%${filters.search.toLowerCase()}%` });
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
        const emotions = await this.emotionRepo.find({ where: { reportId } });
        const wordCloud = await this.wordCloudRepo.find({ where: { reportId } });
        return this.toDetailDto(report, emotions, wordCloud);
    }
    async getReportByShareToken(token) {
        const report = await this.reportRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found or not publicly shared');
        }
        const emotions = await this.emotionRepo.find({ where: { reportId: report.id } });
        const wordCloud = await this.wordCloudRepo.find({ where: { reportId: report.id } });
        return this.toDetailDto(report, emotions, wordCloud);
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
        let deleted = 0;
        for (const reportId of reportIds) {
            try {
                await this.deleteReport(userId, reportId);
                deleted++;
            }
            catch (err) {
            }
        }
        return { success: true, deleted };
    }
    async shareReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({ where: { id: reportId } });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (dto.sharedWithUserId) {
            const share = new entities_1.SentimentShare();
            share.reportId = reportId;
            share.sharedWithUserId = dto.sharedWithUserId;
            share.sharedByUserId = userId;
            share.permissionLevel = dto.permissionLevel || entities_1.SharePermission.VIEW;
            await this.shareRepo.save(share);
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/sentiments/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const completedReports = allReports.filter(r => r.status === entities_1.SentimentReportStatus.COMPLETED);
        const avgScore = completedReports.length > 0
            ? completedReports.reduce((sum, r) => sum + (Number(r.overallSentimentScore) || 0), 0) / completedReports.length
            : 0;
        return {
            totalReports: allReports.length,
            completedReports: completedReports.length,
            processingReports: allReports.filter(r => r.status === entities_1.SentimentReportStatus.IN_PROCESS || r.status === entities_1.SentimentReportStatus.AGGREGATING).length,
            pendingReports: allReports.filter(r => r.status === entities_1.SentimentReportStatus.PENDING).length,
            failedReports: allReports.filter(r => r.status === entities_1.SentimentReportStatus.FAILED).length,
            reportsThisMonth: allReports.filter(r => r.createdAt >= startOfMonth).length,
            avgSentimentScore: Number(avgScore.toFixed(2)),
        };
    }
    async generatePdf(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['posts'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        if (report.status !== entities_1.SentimentReportStatus.COMPLETED) {
            throw new common_1.BadRequestException('Report must be completed to download PDF');
        }
        const emotions = await this.emotionRepo.find({ where: { reportId } });
        const wordCloud = await this.wordCloudRepo.find({ where: { reportId } });
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    const filename = `${report.title.replace(/[^a-z0-9]/gi, '_')}_sentiment_report.pdf`;
                    resolve({ buffer, filename });
                });
                doc.on('error', reject);
                doc.fontSize(24).fillColor('#7C3AED').text('Social Sentiments Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(18).fillColor('#1F2937').text(report.title);
                doc.fontSize(12).fillColor('#6B7280');
                doc.text(`Platform: ${report.platform}`);
                doc.text(`Type: ${report.reportType}`);
                doc.text(`Influencer: ${report.influencerName || 'Unknown'} (@${report.influencerUsername || 'unknown'})`);
                doc.text(`Created: ${report.createdAt.toLocaleDateString()}`);
                doc.text(`Completed: ${report.completedAt?.toLocaleDateString() || 'N/A'}`);
                doc.moveDown();
                if (report.deepBrandAnalysis) {
                    doc.fontSize(14).fillColor('#7C3AED').text('Deep Brand Analysis');
                    doc.fontSize(12).fillColor('#1F2937');
                    doc.text(`Brand: ${report.brandName || 'N/A'}`);
                    doc.text(`Brand Username: @${report.brandUsername || 'N/A'}`);
                    doc.text(`Product: ${report.productName || 'N/A'}`);
                    doc.moveDown();
                }
                doc.fontSize(16).fillColor('#1F2937').text('Sentiment Analysis', { underline: true });
                doc.moveDown(0.5);
                doc.fontSize(14).fillColor('#7C3AED').text(`Overall Score: ${report.overallSentimentScore?.toFixed(1)}%`);
                doc.moveDown(0.3);
                doc.fontSize(12);
                doc.fillColor('#10B981').text(`Positive: ${report.positivePercentage?.toFixed(1)}%`);
                doc.fillColor('#6B7280').text(`Neutral: ${report.neutralPercentage?.toFixed(1)}%`);
                doc.fillColor('#EF4444').text(`Negative: ${report.negativePercentage?.toFixed(1)}%`);
                doc.moveDown();
                if (emotions.length > 0) {
                    doc.fontSize(16).fillColor('#1F2937').text('Emotions Distribution', { underline: true });
                    doc.moveDown(0.5);
                    doc.fontSize(12).fillColor('#374151');
                    emotions.forEach(e => {
                        doc.text(`${e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1)}: ${e.percentage.toFixed(1)}% (${e.count} comments)`);
                    });
                    doc.moveDown();
                }
                if (wordCloud.length > 0) {
                    doc.fontSize(16).fillColor('#1F2937').text('Most Used Words', { underline: true });
                    doc.moveDown(0.5);
                    doc.fontSize(12).fillColor('#374151');
                    const sortedWords = [...wordCloud].sort((a, b) => b.frequency - a.frequency);
                    const topWords = sortedWords.slice(0, 15).map(w => `${w.word} (${w.frequency})`).join(', ');
                    doc.text(topWords);
                    doc.moveDown();
                }
                const posts = report.posts || [];
                if (posts.length > 0) {
                    doc.addPage();
                    doc.fontSize(16).fillColor('#1F2937').text('Analyzed Posts', { underline: true });
                    doc.moveDown(0.5);
                    posts.forEach((post, index) => {
                        doc.fontSize(14).fillColor('#7C3AED').text(`Post ${index + 1}`);
                        doc.fontSize(11).fillColor('#374151');
                        if (post.description) {
                            doc.text(`Description: ${post.description.substring(0, 100)}${post.description.length > 100 ? '...' : ''}`);
                        }
                        doc.text(`Likes: ${post.likesCount?.toLocaleString() || 0} | Comments: ${post.commentsCount?.toLocaleString() || 0} | Views: ${post.viewsCount?.toLocaleString() || 0}`);
                        if (post.engagementRate) {
                            doc.text(`Engagement Rate: ${post.engagementRate.toFixed(2)}%`);
                        }
                        if (post.sentimentScore !== undefined) {
                            doc.text(`Sentiment: +${post.positivePercentage?.toFixed(0)}% | ${post.neutralPercentage?.toFixed(0)}% | -${post.negativePercentage?.toFixed(0)}%`);
                        }
                        doc.moveDown(0.5);
                    });
                }
                doc.fontSize(10).fillColor('#9CA3AF');
                doc.text('Generated by SocialTweebs - Social Sentiments Module', 50, doc.page.height - 50, { align: 'center' });
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
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
            reportType: report.reportType,
            influencerName: report.influencerName,
            influencerAvatarUrl: report.influencerAvatarUrl,
            overallSentimentScore: report.overallSentimentScore ? Number(report.overallSentimentScore) : undefined,
            status: report.status,
            creditsUsed: report.creditsUsed,
            createdAt: report.createdAt,
        };
    }
    toDetailDto(report, emotions, wordCloud) {
        const posts = report.posts || [];
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            reportType: report.reportType,
            targetUrl: report.targetUrl,
            influencerName: report.influencerName,
            influencerUsername: report.influencerUsername,
            influencerAvatarUrl: report.influencerAvatarUrl,
            status: report.status,
            errorMessage: report.errorMessage,
            overallSentimentScore: report.overallSentimentScore ? Number(report.overallSentimentScore) : undefined,
            positivePercentage: report.positivePercentage ? Number(report.positivePercentage) : undefined,
            neutralPercentage: report.neutralPercentage ? Number(report.neutralPercentage) : undefined,
            negativePercentage: report.negativePercentage ? Number(report.negativePercentage) : undefined,
            deepBrandAnalysis: report.deepBrandAnalysis,
            brandName: report.brandName,
            brandUsername: report.brandUsername,
            productName: report.productName,
            posts: posts.map(p => ({
                id: p.id,
                postUrl: p.postUrl,
                thumbnailUrl: p.thumbnailUrl,
                description: p.description,
                likesCount: p.likesCount,
                commentsCount: p.commentsCount,
                viewsCount: p.viewsCount,
                engagementRate: p.engagementRate ? Number(p.engagementRate) : undefined,
                sentimentScore: p.sentimentScore ? Number(p.sentimentScore) : undefined,
                positivePercentage: p.positivePercentage ? Number(p.positivePercentage) : undefined,
                neutralPercentage: p.neutralPercentage ? Number(p.neutralPercentage) : undefined,
                negativePercentage: p.negativePercentage ? Number(p.negativePercentage) : undefined,
                commentsAnalyzed: p.commentsAnalyzed,
                postDate: p.postDate ? (p.postDate instanceof Date ? p.postDate.toISOString().split('T')[0] : String(p.postDate).split('T')[0]) : undefined,
            })),
            emotions: emotions.map(e => ({
                emotion: e.emotion,
                percentage: Number(e.percentage),
                count: e.count,
            })),
            wordCloud: wordCloud.map(w => ({
                word: w.word,
                frequency: w.frequency,
                sentiment: w.sentiment,
            })),
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/sentiments/shared/${report.shareUrlToken}` : undefined,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
        };
    }
};
exports.SentimentsService = SentimentsService;
exports.SentimentsService = SentimentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.SentimentReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.SentimentPost)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.SentimentEmotion)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.SentimentWordCloud)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.SentimentShare)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService])
], SentimentsService);
//# sourceMappingURL=sentiments.service.js.map