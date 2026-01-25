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
exports.GeneratedReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const discovery_export_entity_1 = require("./entities/discovery-export.entity");
const paid_collaboration_report_entity_1 = require("./entities/paid-collaboration-report.entity");
const user_entity_1 = require("../users/entities/user.entity");
const dto_1 = require("./dto");
let GeneratedReportsService = class GeneratedReportsService {
    constructor(discoveryExportRepo, paidCollabRepo, userRepo) {
        this.discoveryExportRepo = discoveryExportRepo;
        this.paidCollabRepo = paidCollabRepo;
        this.userRepo = userRepo;
    }
    async getReports(userId, userRole, filters) {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;
        const tab = filters.tab || dto_1.ReportTab.INFLUENCER_DISCOVERY;
        const userIds = await this.getFilterUserIds(userId, userRole, filters.createdBy);
        if (tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            return this.getDiscoveryExports(userIds, filters, skip, limit, page);
        }
        else {
            return this.getPaidCollaborationReports(userIds, filters, skip, limit, page);
        }
    }
    async getDiscoveryExports(userIds, filters, skip, limit, page) {
        const queryBuilder = this.discoveryExportRepo
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.createdBy', 'createdBy')
            .where('report.createdById IN (:...userIds)', { userIds });
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('LOWER(report.title) LIKE :search', {
                search: `%${filters.search.toLowerCase()}%`,
            });
        }
        queryBuilder.orderBy('report.createdAt', 'DESC').skip(skip).take(limit);
        const [reports, total] = await queryBuilder.getManyAndCount();
        return {
            discoveryExports: reports.map((r) => this.toDiscoveryExportDto(r)),
            total,
            page,
            limit,
            hasMore: skip + reports.length < total,
        };
    }
    async getPaidCollaborationReports(userIds, filters, skip, limit, page) {
        const queryBuilder = this.paidCollabRepo
            .createQueryBuilder('report')
            .leftJoinAndSelect('report.createdBy', 'createdBy')
            .where('report.createdById IN (:...userIds)', { userIds });
        if (filters.platform && filters.platform !== 'ALL') {
            queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
        }
        if (filters.status) {
            queryBuilder.andWhere('report.status = :status', { status: filters.status });
        }
        if (filters.search) {
            queryBuilder.andWhere('LOWER(report.title) LIKE :search', {
                search: `%${filters.search.toLowerCase()}%`,
            });
        }
        queryBuilder.orderBy('report.createdAt', 'DESC').skip(skip).take(limit);
        const [reports, total] = await queryBuilder.getManyAndCount();
        return {
            paidCollaborationReports: reports.map((r) => this.toPaidCollabReportDto(r)),
            total,
            page,
            limit,
            hasMore: skip + reports.length < total,
        };
    }
    async getReportById(userId, userRole, reportId, tab) {
        if (tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            const report = await this.discoveryExportRepo.findOne({
                where: { id: reportId },
                relations: ['createdBy'],
            });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);
            return this.toDiscoveryExportDto(report);
        }
        else {
            const report = await this.paidCollabRepo.findOne({
                where: { id: reportId },
                relations: ['createdBy'],
            });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);
            return this.toPaidCollabReportDto(report);
        }
    }
    async renameReport(userId, userRole, reportId, tab, dto) {
        if (tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
                throw new common_1.ForbiddenException('You can only rename your own reports');
            }
            report.title = dto.title;
            await this.discoveryExportRepo.save(report);
        }
        else {
            const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
                throw new common_1.ForbiddenException('You can only rename your own reports');
            }
            report.title = dto.title;
            await this.paidCollabRepo.save(report);
        }
        return { success: true, message: 'Report renamed successfully.' };
    }
    async deleteReport(userId, userRole, reportId, tab) {
        if (tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
                throw new common_1.ForbiddenException('You can only delete your own reports');
            }
            await this.discoveryExportRepo.remove(report);
        }
        else {
            const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
                throw new common_1.ForbiddenException('You can only delete your own reports');
            }
            await this.paidCollabRepo.remove(report);
        }
        return { success: true, message: 'Report deleted successfully.' };
    }
    async bulkDeleteReports(userId, userRole, dto) {
        let deletedCount = 0;
        if (dto.tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            const reports = await this.discoveryExportRepo.find({
                where: { id: (0, typeorm_2.In)(dto.reportIds) },
            });
            const toDelete = reports.filter((r) => r.createdById === userId || ['SUPER_ADMIN', 'ADMIN'].includes(userRole));
            if (toDelete.length > 0) {
                await this.discoveryExportRepo.remove(toDelete);
                deletedCount = toDelete.length;
            }
        }
        else {
            const reports = await this.paidCollabRepo.find({
                where: { id: (0, typeorm_2.In)(dto.reportIds) },
            });
            const toDelete = reports.filter((r) => r.createdById === userId || ['SUPER_ADMIN', 'ADMIN'].includes(userRole));
            if (toDelete.length > 0) {
                await this.paidCollabRepo.remove(toDelete);
                deletedCount = toDelete.length;
            }
        }
        return {
            success: true,
            deletedCount,
            message: `${deletedCount} report(s) deleted successfully.`,
        };
    }
    async downloadReport(userId, userRole, reportId, tab) {
        if (tab === dto_1.ReportTab.INFLUENCER_DISCOVERY) {
            const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);
            if (!report.fileUrl) {
                throw new common_1.BadRequestException('Report file is not available');
            }
            report.downloadedAt = new Date();
            await this.discoveryExportRepo.save(report);
            return {
                success: true,
                fileUrl: report.fileUrl,
                message: 'Your report has been downloaded.',
            };
        }
        else {
            const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });
            if (!report) {
                throw new common_1.NotFoundException('Report not found');
            }
            await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);
            if (!report.fileUrl) {
                throw new common_1.BadRequestException('Report file is not available');
            }
            report.downloadedAt = new Date();
            await this.paidCollabRepo.save(report);
            return {
                success: true,
                fileUrl: report.fileUrl,
                message: 'Your report has been downloaded.',
            };
        }
    }
    async getDashboardStats(userId, userRole) {
        const userIds = await this.getFilterUserIds(userId, userRole, dto_1.ReportCreatedBy.ALL);
        const [discoveryExports, paidCollabReports] = await Promise.all([
            this.discoveryExportRepo.find({
                where: { createdById: (0, typeorm_2.In)(userIds) },
            }),
            this.paidCollabRepo.find({
                where: { createdById: (0, typeorm_2.In)(userIds) },
            }),
        ]);
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const discoveryThisMonth = discoveryExports.filter((r) => r.createdAt >= startOfMonth).length;
        const paidCollabThisMonth = paidCollabReports.filter((r) => r.createdAt >= startOfMonth).length;
        const byPlatform = {};
        [...discoveryExports, ...paidCollabReports].forEach((report) => {
            byPlatform[report.platform] = (byPlatform[report.platform] || 0) + 1;
        });
        return {
            totalDiscoveryExports: discoveryExports.length,
            totalPaidCollaborationReports: paidCollabReports.length,
            totalReports: discoveryExports.length + paidCollabReports.length,
            reportsThisMonth: discoveryThisMonth + paidCollabThisMonth,
            byPlatform,
        };
    }
    async createDiscoveryExport(userId, data) {
        const export_ = new discovery_export_entity_1.DiscoveryExport();
        export_.title = data.title || `Discovery Export - ${new Date().toLocaleDateString()}`;
        export_.platform = data.platform;
        export_.exportFormat = data.exportFormat;
        export_.profileCount = data.profileCount;
        export_.fileUrl = data.fileUrl;
        export_.searchFilters = data.searchFilters;
        export_.exportedProfileIds = data.exportedProfileIds;
        export_.creditsUsed = data.creditsUsed || 0;
        export_.status = discovery_export_entity_1.ExportStatus.COMPLETED;
        export_.ownerId = userId;
        export_.createdById = userId;
        return this.discoveryExportRepo.save(export_);
    }
    async createPaidCollaborationReport(userId, data) {
        const report = new paid_collaboration_report_entity_1.PaidCollaborationReport();
        report.title = data.title || `Paid Collaboration Report - ${new Date().toLocaleDateString()}`;
        report.platform = data.platform;
        report.reportType = data.reportType;
        report.exportFormat = data.exportFormat;
        report.influencerCount = data.influencerCount;
        report.influencerIds = data.influencerIds;
        report.influencerData = data.influencerData;
        report.reportContent = data.reportContent;
        report.fileUrl = data.fileUrl;
        report.dateRangeStart = data.dateRangeStart;
        report.dateRangeEnd = data.dateRangeEnd;
        report.creditsUsed = data.creditsUsed || 0;
        report.status = paid_collaboration_report_entity_1.PaidReportStatus.COMPLETED;
        report.ownerId = userId;
        report.createdById = userId;
        return this.paidCollabRepo.save(report);
    }
    async getFilterUserIds(userId, userRole, createdBy) {
        if (['SUPER_ADMIN', 'ADMIN'].includes(userRole) && createdBy !== dto_1.ReportCreatedBy.ME) {
            if (createdBy === dto_1.ReportCreatedBy.TEAM) {
                return await this.getTeamUserIds(userId);
            }
            const allTeamIds = await this.getTeamUserIds(userId);
            return [userId, ...allTeamIds];
        }
        if (createdBy === dto_1.ReportCreatedBy.ME) {
            return [userId];
        }
        if (createdBy === dto_1.ReportCreatedBy.TEAM) {
            return await this.getTeamUserIds(userId);
        }
        return [userId];
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
        return teamMembers.map((m) => m.id).filter((id) => id !== userId);
    }
    async checkReportAccess(userId, userRole, createdById, ownerId) {
        if (createdById === userId || ownerId === userId)
            return;
        if (['SUPER_ADMIN', 'ADMIN'].includes(userRole))
            return;
        const teamUserIds = await this.getTeamUserIds(userId);
        if (teamUserIds.includes(createdById))
            return;
        throw new common_1.ForbiddenException('No access to this report');
    }
    toDiscoveryExportDto(report) {
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            exportFormat: report.exportFormat,
            profileCount: report.profileCount,
            fileUrl: report.fileUrl,
            status: report.status,
            creditsUsed: Number(report.creditsUsed),
            createdAt: report.createdAt,
            downloadedAt: report.downloadedAt,
            createdById: report.createdById,
            createdByName: report.createdBy?.name,
        };
    }
    toPaidCollabReportDto(report) {
        return {
            id: report.id,
            title: report.title,
            platform: report.platform,
            reportType: report.reportType,
            exportFormat: report.exportFormat,
            influencerCount: report.influencerCount,
            fileUrl: report.fileUrl,
            status: report.status,
            creditsUsed: Number(report.creditsUsed),
            createdAt: report.createdAt,
            downloadedAt: report.downloadedAt,
            createdById: report.createdById,
            createdByName: report.createdBy?.name,
        };
    }
};
exports.GeneratedReportsService = GeneratedReportsService;
exports.GeneratedReportsService = GeneratedReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(discovery_export_entity_1.DiscoveryExport)),
    __param(1, (0, typeorm_1.InjectRepository)(paid_collaboration_report_entity_1.PaidCollaborationReport)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], GeneratedReportsService);
//# sourceMappingURL=generated-reports.service.js.map