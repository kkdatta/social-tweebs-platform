import { Repository } from 'typeorm';
import { CollabCheckReport, CollabCheckInfluencer, CollabCheckPost, CollabCheckShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { CreateCollabCheckReportDto, UpdateCollabCheckReportDto, ShareCollabCheckReportDto, CollabCheckReportFilterDto, CollabCheckReportListResponseDto, CollabCheckReportDetailDto, DashboardStatsDto, PostsChartDataDto } from './dto';
export declare class CollabCheckService {
    private readonly reportRepo;
    private readonly influencerRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly creditsService;
    constructor(reportRepo: Repository<CollabCheckReport>, influencerRepo: Repository<CollabCheckInfluencer>, postRepo: Repository<CollabCheckPost>, shareRepo: Repository<CollabCheckShare>, userRepo: Repository<User>, creditsService: CreditsService);
    createReport(userId: string, dto: CreateCollabCheckReportDto): Promise<{
        success: boolean;
        report: CollabCheckReport;
        creditsUsed: number;
    }>;
    private processReport;
    private getDateRange;
    private getDaysFromPeriod;
    getReports(userId: string, filters: CollabCheckReportFilterDto): Promise<CollabCheckReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<CollabCheckReportDetailDto>;
    getReportByShareToken(token: string): Promise<CollabCheckReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateCollabCheckReportDto): Promise<{
        success: boolean;
        report: CollabCheckReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: CollabCheckReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareCollabCheckReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getChartData(userId: string, reportId: string): Promise<PostsChartDataDto[]>;
    searchInfluencers(platform: string, query: string, limit?: number): Promise<any[]>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
}
