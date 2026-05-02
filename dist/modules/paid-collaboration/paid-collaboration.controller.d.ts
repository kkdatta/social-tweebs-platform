import { PaidCollaborationService } from './paid-collaboration.service';
import { CreatePaidCollabReportDto, UpdatePaidCollabReportDto, SharePaidCollabReportDto, PaidCollabReportFilterDto, PaidCollabReportListResponseDto, PaidCollabReportDetailDto, PaidCollabDashboardStatsDto, PostsChartDataDto, PaidCollabPostDto, PaidCollabInfluencerDto } from './dto';
import { InfluencerCategory } from './entities';
export declare class PaidCollaborationController {
    private readonly service;
    constructor(service: PaidCollaborationService);
    getSharedReport(token: string): Promise<PaidCollabReportDetailDto>;
    createReport(userId: string, dto: CreatePaidCollabReportDto): Promise<{
        success: boolean;
        report: import("./entities").PaidCollabReport;
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: PaidCollabReportFilterDto): Promise<PaidCollabReportListResponseDto>;
    getDashboardStats(userId: string): Promise<PaidCollabDashboardStatsDto>;
    getReportById(userId: string, reportId: string): Promise<PaidCollabReportDetailDto>;
    getChartData(userId: string, reportId: string): Promise<PostsChartDataDto[]>;
    getPosts(userId: string, reportId: string, sponsoredOnly?: string, sortBy?: string, sortOrder?: 'ASC' | 'DESC', category?: InfluencerCategory, page?: string, limit?: string): Promise<{
        posts: PaidCollabPostDto[];
        total: number;
    }>;
    getInfluencers(userId: string, reportId: string, category?: InfluencerCategory, sortBy?: string, sortOrder?: 'ASC' | 'DESC', page?: string, limit?: string): Promise<{
        influencers: PaidCollabInfluencerDto[];
        total: number;
    }>;
    updateReport(userId: string, reportId: string, dto: UpdatePaidCollabReportDto): Promise<{
        success: boolean;
        report: import("./entities").PaidCollabReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: import("./entities").PaidCollabReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: SharePaidCollabReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
}
