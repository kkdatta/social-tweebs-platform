import { AudienceOverlapService } from './audience-overlap.service';
import { CreateOverlapReportDto, UpdateOverlapReportDto, ShareOverlapReportDto, OverlapReportFilterDto, OverlapReportListResponseDto, OverlapReportDetailDto, DashboardStatsDto } from './dto';
export declare class AudienceOverlapController {
    private readonly overlapService;
    constructor(overlapService: AudienceOverlapService);
    createReport(userId: string, dto: CreateOverlapReportDto): Promise<{
        success: boolean;
        report: import("./entities").AudienceOverlapReport;
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: OverlapReportFilterDto): Promise<OverlapReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, reportId: string): Promise<OverlapReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateOverlapReportDto): Promise<{
        success: boolean;
        report: import("./entities").AudienceOverlapReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: import("./entities").AudienceOverlapReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareOverlapReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getSharedReport(token: string): Promise<OverlapReportDetailDto>;
    searchInfluencers(platform: string, query: string, limit?: number): Promise<any[]>;
}
