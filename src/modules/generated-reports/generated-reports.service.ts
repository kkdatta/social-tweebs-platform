import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { DiscoveryExport, ExportStatus } from './entities/discovery-export.entity';
import { PaidCollaborationReport, PaidReportStatus } from './entities/paid-collaboration-report.entity';
import { User } from '../users/entities/user.entity';
import {
  GeneratedReportsFilterDto,
  RenameReportDto,
  BulkDeleteReportsDto,
  GeneratedReportsListResponseDto,
  DashboardStatsDto,
  DiscoveryExportDto,
  PaidCollaborationReportDto,
  ReportTab,
  ReportCreatedBy,
} from './dto';

@Injectable()
export class GeneratedReportsService {
  constructor(
    @InjectRepository(DiscoveryExport)
    private readonly discoveryExportRepo: Repository<DiscoveryExport>,
    @InjectRepository(PaidCollaborationReport)
    private readonly paidCollabRepo: Repository<PaidCollaborationReport>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Get list of generated reports
   */
  async getReports(
    userId: string,
    userRole: string,
    filters: GeneratedReportsFilterDto,
  ): Promise<GeneratedReportsListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const tab = filters.tab || ReportTab.INFLUENCER_DISCOVERY;

    // Get user IDs based on createdBy filter
    const userIds = await this.getFilterUserIds(userId, userRole, filters.createdBy);

    if (tab === ReportTab.INFLUENCER_DISCOVERY) {
      return this.getDiscoveryExports(userIds, filters, skip, limit, page);
    } else {
      return this.getPaidCollaborationReports(userIds, filters, skip, limit, page);
    }
  }

  /**
   * Get discovery exports
   */
  private async getDiscoveryExports(
    userIds: string[],
    filters: GeneratedReportsFilterDto,
    skip: number,
    limit: number,
    page: number,
  ): Promise<GeneratedReportsListResponseDto> {
    const queryBuilder = this.discoveryExportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.createdBy', 'createdBy')
      .where('report.createdById IN (:...userIds)', { userIds });

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search by title
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

  /**
   * Get paid collaboration reports
   */
  private async getPaidCollaborationReports(
    userIds: string[],
    filters: GeneratedReportsFilterDto,
    skip: number,
    limit: number,
    page: number,
  ): Promise<GeneratedReportsListResponseDto> {
    const queryBuilder = this.paidCollabRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.createdBy', 'createdBy')
      .where('report.createdById IN (:...userIds)', { userIds });

    // Filter by platform
    if (filters.platform && filters.platform !== 'ALL') {
      queryBuilder.andWhere('report.platform = :platform', { platform: filters.platform });
    }

    // Filter by status
    if (filters.status) {
      queryBuilder.andWhere('report.status = :status', { status: filters.status });
    }

    // Search by title
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

  /**
   * Get report by ID
   */
  async getReportById(
    userId: string,
    userRole: string,
    reportId: string,
    tab: ReportTab,
  ): Promise<DiscoveryExportDto | PaidCollaborationReportDto> {
    if (tab === ReportTab.INFLUENCER_DISCOVERY) {
      const report = await this.discoveryExportRepo.findOne({
        where: { id: reportId },
        relations: ['createdBy'],
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);

      return this.toDiscoveryExportDto(report);
    } else {
      const report = await this.paidCollabRepo.findOne({
        where: { id: reportId },
        relations: ['createdBy'],
      });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);

      return this.toPaidCollabReportDto(report);
    }
  }

  /**
   * Rename a report
   */
  async renameReport(
    userId: string,
    userRole: string,
    reportId: string,
    tab: ReportTab,
    dto: RenameReportDto,
  ): Promise<{ success: boolean; message: string }> {
    if (tab === ReportTab.INFLUENCER_DISCOVERY) {
      const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      // Only owner can rename (unless super admin/admin)
      if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        throw new ForbiddenException('You can only rename your own reports');
      }

      report.title = dto.title;
      await this.discoveryExportRepo.save(report);
    } else {
      const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        throw new ForbiddenException('You can only rename your own reports');
      }

      report.title = dto.title;
      await this.paidCollabRepo.save(report);
    }

    return { success: true, message: 'Report renamed successfully.' };
  }

  /**
   * Delete a report
   */
  async deleteReport(
    userId: string,
    userRole: string,
    reportId: string,
    tab: ReportTab,
  ): Promise<{ success: boolean; message: string }> {
    if (tab === ReportTab.INFLUENCER_DISCOVERY) {
      const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        throw new ForbiddenException('You can only delete your own reports');
      }

      await this.discoveryExportRepo.remove(report);
    } else {
      const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      if (report.createdById !== userId && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
        throw new ForbiddenException('You can only delete your own reports');
      }

      await this.paidCollabRepo.remove(report);
    }

    return { success: true, message: 'Report deleted successfully.' };
  }

  /**
   * Bulk delete reports
   */
  async bulkDeleteReports(
    userId: string,
    userRole: string,
    dto: BulkDeleteReportsDto,
  ): Promise<{ success: boolean; deletedCount: number; message: string }> {
    let deletedCount = 0;

    if (dto.tab === ReportTab.INFLUENCER_DISCOVERY) {
      const reports = await this.discoveryExportRepo.find({
        where: { id: In(dto.reportIds) },
      });

      // Filter to only user's own reports (unless admin)
      const toDelete = reports.filter(
        (r) => r.createdById === userId || ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
      );

      if (toDelete.length > 0) {
        await this.discoveryExportRepo.remove(toDelete);
        deletedCount = toDelete.length;
      }
    } else {
      const reports = await this.paidCollabRepo.find({
        where: { id: In(dto.reportIds) },
      });

      const toDelete = reports.filter(
        (r) => r.createdById === userId || ['SUPER_ADMIN', 'ADMIN'].includes(userRole),
      );

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

  /**
   * Re-download a report (update downloaded_at timestamp and return file URL)
   */
  async downloadReport(
    userId: string,
    userRole: string,
    reportId: string,
    tab: ReportTab,
  ): Promise<{ success: boolean; fileUrl: string; message: string }> {
    if (tab === ReportTab.INFLUENCER_DISCOVERY) {
      const report = await this.discoveryExportRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);

      const fileUrl = report.fileUrl || `/api/v1/discovery/export-download/${reportId}`;

      report.downloadedAt = new Date();
      if (!report.fileUrl) {
        report.fileUrl = fileUrl;
      }
      await this.discoveryExportRepo.save(report);

      return {
        success: true,
        fileUrl,
        message: 'Your report has been downloaded.',
      };
    } else {
      const report = await this.paidCollabRepo.findOne({ where: { id: reportId } });

      if (!report) {
        throw new NotFoundException('Report not found');
      }

      await this.checkReportAccess(userId, userRole, report.createdById, report.ownerId);

      const fileUrl = report.fileUrl || `/api/v1/paid-collaboration/${reportId}/download`;

      report.downloadedAt = new Date();
      if (!report.fileUrl) {
        report.fileUrl = fileUrl;
      }
      await this.paidCollabRepo.save(report);

      return {
        success: true,
        fileUrl,
        message: 'Your report has been downloaded.',
      };
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(userId: string, userRole: string): Promise<DashboardStatsDto> {
    const userIds = await this.getFilterUserIds(userId, userRole, ReportCreatedBy.ALL);

    const [discoveryExports, paidCollabReports] = await Promise.all([
      this.discoveryExportRepo.find({
        where: { createdById: In(userIds) },
      }),
      this.paidCollabRepo.find({
        where: { createdById: In(userIds) },
      }),
    ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const discoveryThisMonth = discoveryExports.filter((r) => r.createdAt >= startOfMonth).length;
    const paidCollabThisMonth = paidCollabReports.filter((r) => r.createdAt >= startOfMonth).length;

    // Count by platform
    const byPlatform: Record<string, number> = {};
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

  /**
   * Create a discovery export record (called from Discovery module when exporting)
   */
  async createDiscoveryExport(
    userId: string,
    data: {
      title?: string;
      platform: string;
      exportFormat: string;
      profileCount: number;
      fileUrl?: string;
      searchFilters?: Record<string, any>;
      exportedProfileIds?: string[];
      creditsUsed?: number;
    },
  ): Promise<DiscoveryExport> {
    const export_ = new DiscoveryExport();
    export_.title = data.title || `Discovery Export - ${new Date().toLocaleDateString()}`;
    export_.platform = data.platform;
    export_.exportFormat = data.exportFormat as any;
    export_.profileCount = data.profileCount;
    export_.fileUrl = data.fileUrl;
    export_.searchFilters = data.searchFilters;
    export_.exportedProfileIds = data.exportedProfileIds;
    export_.creditsUsed = data.creditsUsed || 0;
    export_.status = ExportStatus.COMPLETED;
    export_.ownerId = userId;
    export_.createdById = userId;

    return this.discoveryExportRepo.save(export_);
  }

  /**
   * Create a paid collaboration report record (called from relevant modules)
   */
  async createPaidCollaborationReport(
    userId: string,
    data: {
      title?: string;
      platform: string;
      reportType: string;
      exportFormat: string;
      influencerCount: number;
      influencerIds?: string[];
      influencerData?: Record<string, any>;
      reportContent?: Record<string, any>;
      fileUrl?: string;
      dateRangeStart?: Date;
      dateRangeEnd?: Date;
      creditsUsed?: number;
    },
  ): Promise<PaidCollaborationReport> {
    const report = new PaidCollaborationReport();
    report.title = data.title || `Paid Collaboration Report - ${new Date().toLocaleDateString()}`;
    report.platform = data.platform;
    report.reportType = data.reportType as any;
    report.exportFormat = data.exportFormat as any;
    report.influencerCount = data.influencerCount;
    report.influencerIds = data.influencerIds;
    report.influencerData = data.influencerData;
    report.reportContent = data.reportContent;
    report.fileUrl = data.fileUrl;
    report.dateRangeStart = data.dateRangeStart;
    report.dateRangeEnd = data.dateRangeEnd;
    report.creditsUsed = data.creditsUsed || 0;
    report.status = PaidReportStatus.COMPLETED;
    report.ownerId = userId;
    report.createdById = userId;

    return this.paidCollabRepo.save(report);
  }

  // Helper methods
  private async getFilterUserIds(
    userId: string,
    userRole: string,
    createdBy?: ReportCreatedBy,
  ): Promise<string[]> {
    // Super Admin and Admin can see all reports
    if (['SUPER_ADMIN', 'ADMIN'].includes(userRole) && createdBy !== ReportCreatedBy.ME) {
      if (createdBy === ReportCreatedBy.TEAM) {
        return await this.getTeamUserIds(userId);
      }
      // For ALL, get all users under this admin
      const allTeamIds = await this.getTeamUserIds(userId);
      return [userId, ...allTeamIds];
    }

    // Regular users only see their own reports
    if (createdBy === ReportCreatedBy.ME) {
      return [userId];
    }

    if (createdBy === ReportCreatedBy.TEAM) {
      return await this.getTeamUserIds(userId);
    }

    // Default: user's own reports
    return [userId];
  }

  private async getTeamUserIds(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return [userId];

    // Get parent's ID and siblings
    const teamMembers = await this.userRepo.find({
      where: [
        { id: user.parentId || undefined },
        { parentId: userId },
        { parentId: user.parentId || undefined },
      ],
    });

    return teamMembers.map((m) => m.id).filter((id) => id !== userId);
  }

  private async checkReportAccess(
    userId: string,
    userRole: string,
    createdById: string,
    ownerId: string,
  ): Promise<void> {
    // Owner has access
    if (createdById === userId || ownerId === userId) return;

    // Admin/Super Admin have access
    if (['SUPER_ADMIN', 'ADMIN'].includes(userRole)) return;

    // Check team
    const teamUserIds = await this.getTeamUserIds(userId);
    if (teamUserIds.includes(createdById)) return;

    throw new ForbiddenException('No access to this report');
  }

  private toDiscoveryExportDto(report: DiscoveryExport): DiscoveryExportDto {
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

  private toPaidCollabReportDto(report: PaidCollaborationReport): PaidCollaborationReportDto {
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
}
