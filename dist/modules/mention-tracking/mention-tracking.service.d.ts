import { Repository } from 'typeorm';
import { MentionTrackingReport, MentionTrackingInfluencer, MentionTrackingPost, MentionTrackingShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashRawService } from '../discovery/services/modash-raw.service';
import { CreateMentionTrackingReportDto, UpdateMentionTrackingReportDto, ShareMentionTrackingReportDto, MentionTrackingReportFilterDto, MentionTrackingReportListResponseDto, MentionTrackingReportDetailDto, MentionTrackingInfluencerDto, MentionTrackingPostDto, DashboardStatsDto, ChartDataDto, PostsFilterDto, InfluencersFilterDto } from './dto';
export declare class MentionTrackingService {
    private readonly reportRepo;
    private readonly influencerRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly creditsService;
    private readonly modashRawService;
    private readonly logger;
    constructor(reportRepo: Repository<MentionTrackingReport>, influencerRepo: Repository<MentionTrackingInfluencer>, postRepo: Repository<MentionTrackingPost>, shareRepo: Repository<MentionTrackingShare>, userRepo: Repository<User>, creditsService: CreditsService, modashRawService: ModashRawService);
    createReport(userId: string, dto: CreateMentionTrackingReportDto): Promise<{
        success: boolean;
        report: MentionTrackingReport;
        creditsUsed: number;
    }>;
    private processReport;
    private processReportWithRawApi;
    private processReportSimulated;
    private generateFollowerCount;
    private categorizeInfluencer;
    private generateInfluencerName;
    getReports(userId: string, filters: MentionTrackingReportFilterDto): Promise<MentionTrackingReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<MentionTrackingReportDetailDto>;
    getReportByShareToken(token: string): Promise<MentionTrackingReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateMentionTrackingReportDto): Promise<{
        success: boolean;
        report: MentionTrackingReport;
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
        report: MentionTrackingReport;
        creditsUsed: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareMentionTrackingReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getChartData(userId: string, reportId: string): Promise<ChartDataDto[]>;
    getPosts(userId: string, reportId: string, filters: PostsFilterDto): Promise<{
        posts: MentionTrackingPostDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    getInfluencers(userId: string, reportId: string, filters: InfluencersFilterDto): Promise<{
        influencers: MentionTrackingInfluencerDto[];
        total: number;
        page: number;
        limit: number;
    }>;
    autoRefreshReport(reportId: string): Promise<void>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
    private toInfluencerDto;
    private toPostDto;
    private calculateCategorization;
}
