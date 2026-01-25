import { GeneratedReportsService } from './generated-reports.service';
import { GeneratedReportsFilterDto, RenameReportDto, BulkDeleteReportsDto, ReportTab } from './dto';
export declare class GeneratedReportsController {
    private readonly generatedReportsService;
    constructor(generatedReportsService: GeneratedReportsService);
    getReports(userId: string, userRole: string, filters: GeneratedReportsFilterDto): Promise<import("./dto").GeneratedReportsListResponseDto>;
    getDashboardStats(userId: string, userRole: string): Promise<import("./dto").DashboardStatsDto>;
    getReportById(userId: string, userRole: string, tab: ReportTab, reportId: string): Promise<import("./dto").DiscoveryExportDto | import("./dto").PaidCollaborationReportDto>;
    renameReport(userId: string, userRole: string, tab: ReportTab, reportId: string, dto: RenameReportDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteReport(userId: string, userRole: string, tab: ReportTab, reportId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    bulkDeleteReports(userId: string, userRole: string, dto: BulkDeleteReportsDto): Promise<{
        success: boolean;
        deletedCount: number;
        message: string;
    }>;
    downloadReport(userId: string, userRole: string, tab: ReportTab, reportId: string): Promise<{
        success: boolean;
        fileUrl: string;
        message: string;
    }>;
}
