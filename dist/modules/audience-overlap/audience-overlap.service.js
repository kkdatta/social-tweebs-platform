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
exports.AudienceOverlapService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const XLSX = require("xlsx");
const entities_1 = require("./entities");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const CREDIT_PER_REPORT = 1;
const DEFAULT_REPORT_QUOTA = 50;
let AudienceOverlapService = class AudienceOverlapService {
    constructor(reportRepo, influencerRepo, shareRepo, userRepo, creditsService) {
        this.reportRepo = reportRepo;
        this.influencerRepo = influencerRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
    }
    async createReport(userId, dto) {
        if (dto.influencerIds.length < 2) {
            throw new common_1.BadRequestException('At least 2 influencers are required for audience overlap analysis');
        }
        const inProcessReport = await this.reportRepo.findOne({
            where: { ownerId: userId, status: entities_1.OverlapReportStatus.IN_PROCESS },
        });
        const initialStatus = inProcessReport ? entities_1.OverlapReportStatus.PENDING : entities_1.OverlapReportStatus.IN_PROCESS;
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_GENERATION,
            quantity: CREDIT_PER_REPORT,
            module: enums_1.ModuleType.AUDIENCE_OVERLAP,
            resourceId: 'new-overlap-report',
            resourceType: 'overlap_report_creation',
        });
        const report = new entities_1.AudienceOverlapReport();
        report.title = dto.title || 'Untitled';
        report.platform = dto.platform;
        report.status = initialStatus;
        report.ownerId = userId;
        report.createdById = userId;
        report.shareUrlToken = `share_${(0, uuid_1.v4)().substring(0, 8)}`;
        const savedReport = await this.reportRepo.save(report);
        const influencers = await this.addInfluencersToReport(savedReport.id, dto.influencerIds, dto.platform);
        if (initialStatus === entities_1.OverlapReportStatus.IN_PROCESS) {
            setTimeout(() => this.processReport(savedReport.id), 2000);
        }
        savedReport.influencers = influencers;
        return {
            success: true,
            report: savedReport,
            creditsUsed: CREDIT_PER_REPORT,
        };
    }
    async addInfluencersToReport(reportId, influencerIds, platform) {
        const influencers = [];
        for (let i = 0; i < influencerIds.length; i++) {
            const influencer = new entities_1.AudienceOverlapInfluencer();
            influencer.reportId = reportId;
            influencer.influencerProfileId = influencerIds[i];
            influencer.platform = platform;
            influencer.displayOrder = i + 1;
            influencer.influencerName = `Influencer ${i + 1}`;
            influencer.influencerUsername = `influencer_${i + 1}`;
            influencer.followerCount = Math.floor(Math.random() * 100000) + 10000;
            influencers.push(await this.influencerRepo.save(influencer));
        }
        return influencers;
    }
    async processReport(reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
        if (!report)
            return;
        try {
            const totalFollowers = report.influencers.reduce((sum, inf) => sum + inf.followerCount, 0);
            const overlapPercentage = Math.random() * 30 + 10;
            const overlappingFollowers = Math.floor(totalFollowers * (overlapPercentage / 100));
            const uniqueFollowers = totalFollowers - overlappingFollowers;
            report.totalFollowers = totalFollowers;
            report.uniqueFollowers = uniqueFollowers;
            report.overlappingFollowers = overlappingFollowers;
            report.overlapPercentage = Number(overlapPercentage.toFixed(2));
            report.uniquePercentage = Number((100 - overlapPercentage).toFixed(2));
            report.status = entities_1.OverlapReportStatus.COMPLETED;
            report.completedAt = new Date();
            await this.reportRepo.save(report);
            for (const influencer of report.influencers) {
                const uniquePct = Math.random() * 30 + 60;
                influencer.uniquePercentage = Number(uniquePct.toFixed(2));
                influencer.overlappingPercentage = Number((100 - uniquePct).toFixed(2));
                influencer.uniqueFollowers = Math.floor(influencer.followerCount * (uniquePct / 100));
                influencer.overlappingFollowers = influencer.followerCount - influencer.uniqueFollowers;
                await this.influencerRepo.save(influencer);
            }
            await this.processPendingReports(report.ownerId);
        }
        catch (error) {
            report.status = entities_1.OverlapReportStatus.FAILED;
            report.errorMessage = error.message || 'Processing failed';
            await this.reportRepo.save(report);
        }
    }
    async processPendingReports(userId) {
        const pendingReport = await this.reportRepo.findOne({
            where: { ownerId: userId, status: entities_1.OverlapReportStatus.PENDING },
            order: { createdAt: 'ASC' },
        });
        if (pendingReport) {
            pendingReport.status = entities_1.OverlapReportStatus.IN_PROCESS;
            await this.reportRepo.save(pendingReport);
            setTimeout(() => this.processReport(pendingReport.id), 2000);
        }
    }
    async getReports(userId, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const queryBuilder = this.reportRepo.createQueryBuilder('report')
            .leftJoinAndSelect('report.influencers', 'influencers')
            .leftJoinAndSelect('report.createdBy', 'createdBy');
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
            relations: ['influencers', 'owner', 'createdBy'],
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
            relations: ['influencers'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found or not publicly shared');
        }
        return this.toDetailDto(report);
    }
    async updateReport(userId, reportId, dto) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
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
    async retryReport(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report, 'edit');
        if (report.status !== entities_1.OverlapReportStatus.FAILED) {
            throw new common_1.BadRequestException('Only failed reports can be retried');
        }
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_GENERATION,
            quantity: CREDIT_PER_REPORT,
            module: enums_1.ModuleType.AUDIENCE_OVERLAP,
            resourceId: reportId,
            resourceType: 'overlap_report_retry',
        });
        report.status = entities_1.OverlapReportStatus.IN_PROCESS;
        report.errorMessage = undefined;
        report.retryCount += 1;
        const savedReport = await this.reportRepo.save(report);
        setTimeout(() => this.processReport(reportId), 2000);
        return { success: true, report: savedReport, creditsUsed: CREDIT_PER_REPORT };
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
            const share = new entities_1.AudienceOverlapShare();
            share.reportId = reportId;
            share.sharedWithUserId = dto.sharedWithUserId;
            share.sharedByUserId = userId;
            share.permissionLevel = dto.permissionLevel || entities_1.OverlapSharePermission.VIEW;
            await this.shareRepo.save(share);
        }
        report.isPublic = true;
        await this.reportRepo.save(report);
        const shareUrl = `${process.env.APP_URL || 'http://localhost:5173'}/audience-overlap/shared/${report.shareUrlToken}`;
        return { success: true, shareUrl };
    }
    async getDashboardStats(userId) {
        const teamUserIds = await this.getTeamUserIds(userId);
        const allReports = await this.reportRepo.find({
            where: { createdById: (0, typeorm_2.In)([userId, ...teamUserIds]) },
        });
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const reportsThisMonth = allReports.filter(r => r.createdAt >= startOfMonth).length;
        return {
            totalReports: allReports.length,
            completedReports: allReports.filter(r => r.status === entities_1.OverlapReportStatus.COMPLETED).length,
            pendingReports: allReports.filter(r => r.status === entities_1.OverlapReportStatus.PENDING).length,
            inProcessReports: allReports.filter(r => r.status === entities_1.OverlapReportStatus.IN_PROCESS).length,
            failedReports: allReports.filter(r => r.status === entities_1.OverlapReportStatus.FAILED).length,
            reportsThisMonth,
            remainingQuota: DEFAULT_REPORT_QUOTA - reportsThisMonth,
        };
    }
    async searchInfluencers(platform, query, limit = 10) {
        return [];
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
            if (level === 'edit' && share.permissionLevel === entities_1.OverlapSharePermission.VIEW) {
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
            overlapPercentage: report.overlapPercentage ? Number(report.overlapPercentage) : undefined,
            influencerCount: report.influencers?.length || 0,
            influencers: (report.influencers || [])
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map(inf => ({
                id: inf.id,
                influencerName: inf.influencerName,
                influencerUsername: inf.influencerUsername,
                platform: inf.platform,
                profilePictureUrl: inf.profilePictureUrl,
                followerCount: inf.followerCount,
            })),
            createdAt: report.createdAt,
            createdById: report.createdById,
        };
    }
    async downloadReportAsXlsx(userId, reportId) {
        const report = await this.reportRepo.findOne({
            where: { id: reportId },
            relations: ['influencers'],
        });
        if (!report) {
            throw new common_1.NotFoundException('Report not found');
        }
        await this.checkReportAccess(userId, report);
        const workbook = XLSX.utils.book_new();
        const summaryData = [
            { Metric: 'Report Title', Value: report.title },
            { Metric: 'Platform', Value: report.platform },
            { Metric: 'Status', Value: report.status },
            { Metric: 'Created', Value: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : '' },
            { Metric: '', Value: '' },
            { Metric: 'Total Followers', Value: report.totalFollowers },
            { Metric: 'Unique Followers', Value: report.uniqueFollowers },
            { Metric: 'Overlapping Followers', Value: report.overlappingFollowers },
            { Metric: 'Overlap Rate (%)', Value: report.overlapPercentage ? Number(report.overlapPercentage).toFixed(2) : '0' },
            { Metric: 'Unique Rate (%)', Value: report.uniquePercentage ? Number(report.uniquePercentage).toFixed(2) : '0' },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        const influencers = (report.influencers || []).sort((a, b) => a.displayOrder - b.displayOrder);
        const influencerData = influencers.map(inf => ({
            'Influencer Name': inf.influencerName,
            'Username': inf.influencerUsername || '',
            'Platform': inf.platform,
            'Followers': inf.followerCount,
            'Unique Followers': inf.uniqueFollowers,
            'Unique (%)': inf.uniquePercentage ? Number(inf.uniquePercentage).toFixed(2) : '0',
            'Overlapping Followers': inf.overlappingFollowers,
            'Overlap (%)': inf.overlappingPercentage ? Number(inf.overlappingPercentage).toFixed(2) : '0',
        }));
        if (influencerData.length > 0) {
            const infSheet = XLSX.utils.json_to_sheet(influencerData);
            infSheet['!cols'] = [
                { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
                { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
            ];
            XLSX.utils.book_append_sheet(workbook, infSheet, 'Influencer Analysis');
        }
        const buffer = Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
        const filename = `Audience_Overlap_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
        return { buffer, filename };
    }
    toDetailDto(report) {
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            status: report.status,
            totalFollowers: report.totalFollowers,
            uniqueFollowers: report.uniqueFollowers,
            overlappingFollowers: report.overlappingFollowers,
            overlapPercentage: report.overlapPercentage ? Number(report.overlapPercentage) : undefined,
            uniquePercentage: report.uniquePercentage ? Number(report.uniquePercentage) : undefined,
            influencers: (report.influencers || [])
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map(inf => ({
                id: inf.id,
                influencerName: inf.influencerName,
                influencerUsername: inf.influencerUsername,
                platform: inf.platform,
                profilePictureUrl: inf.profilePictureUrl,
                followerCount: inf.followerCount,
                uniqueFollowers: inf.uniqueFollowers,
                uniquePercentage: inf.uniquePercentage ? Number(inf.uniquePercentage) : undefined,
                overlappingFollowers: inf.overlappingFollowers,
                overlappingPercentage: inf.overlappingPercentage ? Number(inf.overlappingPercentage) : undefined,
            })),
            isPublic: report.isPublic,
            shareUrl: report.shareUrlToken ? `/audience-overlap/shared/${report.shareUrlToken}` : undefined,
            createdAt: report.createdAt,
            completedAt: report.completedAt,
            errorMessage: report.errorMessage,
            retryCount: report.retryCount,
            ownerId: report.ownerId,
            createdById: report.createdById,
        };
    }
};
exports.AudienceOverlapService = AudienceOverlapService;
exports.AudienceOverlapService = AudienceOverlapService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.AudienceOverlapReport)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.AudienceOverlapInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.AudienceOverlapShare)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService])
], AudienceOverlapService);
//# sourceMappingURL=audience-overlap.service.js.map