import { CompetitionAnalysisService } from './competition-analysis.service';
import { CreateCompetitionReportDto, UpdateCompetitionReportDto, ShareCompetitionReportDto, CompetitionReportFilterDto, CompetitionReportListResponseDto, CompetitionReportDetailDto, DashboardStatsDto, ChartDataDto, EnhancedChartDataDto, PostsFilterDto, InfluencersFilterDto } from './dto';
export declare class CompetitionAnalysisController {
    private readonly competitionAnalysisService;
    constructor(competitionAnalysisService: CompetitionAnalysisService);
    getSharedReport(token: string): Promise<CompetitionReportDetailDto>;
    createReport(userId: string, dto: CreateCompetitionReportDto): Promise<{
        success: boolean;
        report: import("./entities").CompetitionAnalysisReport;
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: CompetitionReportFilterDto): Promise<CompetitionReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, id: string): Promise<CompetitionReportDetailDto>;
    getChartData(userId: string, id: string): Promise<ChartDataDto[]>;
    getEnhancedChartData(userId: string, id: string): Promise<EnhancedChartDataDto>;
    getPosts(userId: string, id: string, filters: PostsFilterDto): Promise<{
        posts: import("./dto").CompetitionPostDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getInfluencers(userId: string, id: string, filters: InfluencersFilterDto): Promise<{
        influencers: import("./dto").CompetitionInfluencerDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    updateReport(userId: string, id: string, dto: UpdateCompetitionReportDto): Promise<{
        success: boolean;
        report: import("./entities").CompetitionAnalysisReport;
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
        report: import("./entities").CompetitionAnalysisReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, id: string, dto: ShareCompetitionReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
}
