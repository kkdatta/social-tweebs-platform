import { CustomErService } from './custom-er.service';
import { CreateCustomErReportDto, UpdateCustomErReportDto, ShareCustomErReportDto, CustomErReportFilterDto, CustomErReportListResponseDto, CustomErReportDetailDto, DashboardStatsDto, PostSummaryDto } from './dto';
export declare class CustomErController {
    private readonly customErService;
    constructor(customErService: CustomErService);
    createReport(userId: string, dto: CreateCustomErReportDto): Promise<{
        success: boolean;
        report: import("./entities").CustomErReport;
    }>;
    getReports(userId: string, filters: CustomErReportFilterDto): Promise<CustomErReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, reportId: string): Promise<CustomErReportDetailDto>;
    getReportPosts(userId: string, reportId: string, sponsoredOnly?: string): Promise<PostSummaryDto[]>;
    updateReport(userId: string, reportId: string, dto: UpdateCustomErReportDto): Promise<{
        success: boolean;
        report: import("./entities").CustomErReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareCustomErReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getSharedReport(token: string): Promise<CustomErReportDetailDto>;
}
