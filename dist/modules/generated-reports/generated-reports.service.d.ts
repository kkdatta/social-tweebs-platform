import { Repository } from 'typeorm';
import { DiscoveryExport } from './entities/discovery-export.entity';
import { PaidCollaborationReport } from './entities/paid-collaboration-report.entity';
import { User } from '../users/entities/user.entity';
import { GeneratedReportsFilterDto, RenameReportDto, BulkDeleteReportsDto, GeneratedReportsListResponseDto, DashboardStatsDto, DiscoveryExportDto, PaidCollaborationReportDto, ReportTab } from './dto';
export declare class GeneratedReportsService {
    private readonly discoveryExportRepo;
    private readonly paidCollabRepo;
    private readonly userRepo;
    constructor(discoveryExportRepo: Repository<DiscoveryExport>, paidCollabRepo: Repository<PaidCollaborationReport>, userRepo: Repository<User>);
    getReports(userId: string, userRole: string, filters: GeneratedReportsFilterDto): Promise<GeneratedReportsListResponseDto>;
    private getDiscoveryExports;
    private getPaidCollaborationReports;
    getReportById(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<DiscoveryExportDto | PaidCollaborationReportDto>;
    renameReport(userId: string, userRole: string, reportId: string, tab: ReportTab, dto: RenameReportDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteReport(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteReports(userId: string, userRole: string, dto: BulkDeleteReportsDto): Promise<{
        success: boolean;
        deletedCount: number;
        message: string;
    }>;
    downloadReport(userId: string, userRole: string, reportId: string, tab: ReportTab): Promise<{
        success: boolean;
        fileUrl: string;
        message: string;
    }>;
    getDashboardStats(userId: string, userRole: string): Promise<DashboardStatsDto>;
    createDiscoveryExport(userId: string, data: {
        title?: string;
        platform: string;
        exportFormat: string;
        profileCount: number;
        fileUrl?: string;
        searchFilters?: Record<string, any>;
        exportedProfileIds?: string[];
        creditsUsed?: number;
    }): Promise<DiscoveryExport>;
    createPaidCollaborationReport(userId: string, data: {
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
    }): Promise<PaidCollaborationReport>;
    private getFilterUserIds;
    private getTeamUserIds;
    private checkReportAccess;
    private toDiscoveryExportDto;
    private toPaidCollabReportDto;
}
