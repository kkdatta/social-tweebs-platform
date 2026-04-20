import { Repository } from 'typeorm';
import { PaidCollabReport, PaidCollabInfluencer, PaidCollabPost, PaidCollabShare, PaidCollabCategorization, InfluencerCategory } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService } from '../discovery/services/modash.service';
import { CreatePaidCollabReportDto, UpdatePaidCollabReportDto, SharePaidCollabReportDto, PaidCollabReportFilterDto, PaidCollabReportListResponseDto, PaidCollabReportDetailDto, PaidCollabInfluencerDto, PaidCollabPostDto, PaidCollabDashboardStatsDto, PostsChartDataDto } from './dto';
export declare class PaidCollaborationService {
    private readonly reportRepo;
    private readonly influencerRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly categorizationRepo;
    private readonly userRepo;
    private readonly creditsService;
    private readonly modashService;
    private readonly logger;
    constructor(reportRepo: Repository<PaidCollabReport>, influencerRepo: Repository<PaidCollabInfluencer>, postRepo: Repository<PaidCollabPost>, shareRepo: Repository<PaidCollabShare>, categorizationRepo: Repository<PaidCollabCategorization>, userRepo: Repository<User>, creditsService: CreditsService, modashService: ModashService);
    createReport(userId: string, dto: CreatePaidCollabReportDto): Promise<{
        success: boolean;
        report: PaidCollabReport;
        creditsUsed: number;
    }>;
    private processReport;
    private processReportWithModash;
    private processReportSimulated;
    private generateDummyInfluencers;
    private generateDummyPost;
    private getInfluencerCategory;
    getReports(userId: string, filters: PaidCollabReportFilterDto): Promise<PaidCollabReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<PaidCollabReportDetailDto>;
    getReportByShareToken(token: string): Promise<PaidCollabReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdatePaidCollabReportDto): Promise<{
        success: boolean;
        report: PaidCollabReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: PaidCollabReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: SharePaidCollabReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<PaidCollabDashboardStatsDto>;
    getChartData(userId: string, reportId: string): Promise<PostsChartDataDto[]>;
    getPosts(userId: string, reportId: string, sponsoredOnly?: boolean, sortBy?: string, sortOrder?: 'ASC' | 'DESC', category?: InfluencerCategory, page?: number, limit?: number): Promise<{
        posts: PaidCollabPostDto[];
        total: number;
    }>;
    getInfluencers(userId: string, reportId: string, category?: InfluencerCategory, sortBy?: string, sortOrder?: 'ASC' | 'DESC', page?: number, limit?: number): Promise<{
        influencers: PaidCollabInfluencerDto[];
        total: number;
    }>;
    private getTeamUserIds;
    private getSharedReportIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
    private toInfluencerDto;
    private toPostDto;
    private toCategorizationDto;
}
