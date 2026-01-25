import { CollabCheckService } from './collab-check.service';
import { CreateCollabCheckReportDto, UpdateCollabCheckReportDto, ShareCollabCheckReportDto, CollabCheckReportFilterDto, CollabCheckReportListResponseDto, CollabCheckReportDetailDto, DashboardStatsDto, PostsChartDataDto } from './dto';
export declare class CollabCheckController {
    private readonly collabCheckService;
    constructor(collabCheckService: CollabCheckService);
    getSharedReport(token: string): Promise<CollabCheckReportDetailDto>;
    createReport(userId: string, dto: CreateCollabCheckReportDto): Promise<{
        success: boolean;
        report: import("./entities").CollabCheckReport;
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: CollabCheckReportFilterDto): Promise<CollabCheckReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    searchInfluencers(platform: string, query: string, limit: string): Promise<any[]>;
    getReportById(userId: string, id: string): Promise<CollabCheckReportDetailDto>;
    getChartData(userId: string, id: string): Promise<PostsChartDataDto[]>;
    updateReport(userId: string, id: string, dto: UpdateCollabCheckReportDto): Promise<{
        success: boolean;
        report: import("./entities").CollabCheckReport;
    }>;
    deleteReport(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    retryReport(userId: string, id: string): Promise<{
        success: boolean;
        report: import("./entities").CollabCheckReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, id: string, dto: ShareCollabCheckReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
}
