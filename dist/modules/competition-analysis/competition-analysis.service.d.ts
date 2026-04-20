import { Repository } from 'typeorm';
import { CompetitionAnalysisReport, CompetitionBrand, CompetitionInfluencer, CompetitionPost, CompetitionShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { CreateCompetitionReportDto, UpdateCompetitionReportDto, ShareCompetitionReportDto, CompetitionReportFilterDto, CompetitionReportListResponseDto, CompetitionReportDetailDto, CompetitionInfluencerDto, CompetitionPostDto, DashboardStatsDto, ChartDataDto, EnhancedChartDataDto, PostsFilterDto, InfluencersFilterDto } from './dto';
import { ModashService } from '../discovery/services/modash.service';
export declare class CompetitionAnalysisService {
    private readonly reportRepo;
    private readonly brandRepo;
    private readonly influencerRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly creditsService;
    private readonly modashService;
    private readonly logger;
    constructor(reportRepo: Repository<CompetitionAnalysisReport>, brandRepo: Repository<CompetitionBrand>, influencerRepo: Repository<CompetitionInfluencer>, postRepo: Repository<CompetitionPost>, shareRepo: Repository<CompetitionShare>, userRepo: Repository<User>, creditsService: CreditsService, modashService: ModashService);
    createReport(userId: string, dto: CreateCompetitionReportDto): Promise<{
        success: boolean;
        report: CompetitionAnalysisReport;
        creditsUsed: number;
    }>;
    private processReport;
    private processBrandWithModash;
    private processBrand;
    private getRandomPostType;
    private generateFollowerCount;
    private categorizeInfluencer;
    private generateInfluencerName;
    getReports(userId: string, filters: CompetitionReportFilterDto): Promise<CompetitionReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<CompetitionReportDetailDto>;
    getReportByShareToken(token: string): Promise<CompetitionReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateCompetitionReportDto): Promise<{
        success: boolean;
        report: CompetitionAnalysisReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    bulkDeleteReports(userId: string, reportIds: string[]): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: CompetitionAnalysisReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareCompetitionReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getChartData(userId: string, reportId: string): Promise<ChartDataDto[]>;
    getEnhancedChartData(userId: string, reportId: string): Promise<EnhancedChartDataDto>;
    getPosts(userId: string, reportId: string, filters: PostsFilterDto): Promise<{
        posts: CompetitionPostDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getInfluencers(userId: string, reportId: string, filters: InfluencersFilterDto): Promise<{
        influencers: CompetitionInfluencerDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
    private toBrandSummaryDto;
    private toInfluencerDto;
    private toPostDto;
    private calculateCategorization;
    private calculatePostTypeBreakdown;
}
