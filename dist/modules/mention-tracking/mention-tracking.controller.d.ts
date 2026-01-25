import { MentionTrackingService } from './mention-tracking.service';
import { CreateMentionTrackingReportDto, UpdateMentionTrackingReportDto, ShareMentionTrackingReportDto, MentionTrackingReportFilterDto, MentionTrackingReportListResponseDto, MentionTrackingReportDetailDto, DashboardStatsDto, ChartDataDto, PostsFilterDto, InfluencersFilterDto } from './dto';
export declare class MentionTrackingController {
    private readonly mentionTrackingService;
    constructor(mentionTrackingService: MentionTrackingService);
    getSharedReport(token: string): Promise<MentionTrackingReportDetailDto>;
    createReport(userId: string, dto: CreateMentionTrackingReportDto): Promise<{
        success: boolean;
        report: import("./entities").MentionTrackingReport;
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: MentionTrackingReportFilterDto): Promise<MentionTrackingReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, id: string): Promise<MentionTrackingReportDetailDto>;
    getChartData(userId: string, id: string): Promise<ChartDataDto[]>;
    getPosts(userId: string, id: string, filters: PostsFilterDto): Promise<{
        posts: import("./dto").MentionTrackingPostDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getInfluencers(userId: string, id: string, filters: InfluencersFilterDto): Promise<{
        influencers: import("./dto").MentionTrackingInfluencerDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateReport(userId: string, id: string, dto: UpdateMentionTrackingReportDto): Promise<{
        success: boolean;
        report: import("./entities").MentionTrackingReport;
    }>;
    deleteReport(userId: string, id: string): Promise<{
        success: boolean;
    }>;
    bulkDeleteReports(userId: string, body: {
        reportIds: string[];
    }): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    retryReport(userId: string, id: string): Promise<{
        success: boolean;
        report: import("./entities").MentionTrackingReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, id: string, dto: ShareMentionTrackingReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
}
