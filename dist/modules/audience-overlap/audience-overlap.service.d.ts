import { Repository } from 'typeorm';
import { AudienceOverlapReport, AudienceOverlapInfluencer, AudienceOverlapShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { CreateOverlapReportDto, UpdateOverlapReportDto, ShareOverlapReportDto, OverlapReportFilterDto, OverlapReportListResponseDto, OverlapReportDetailDto, DashboardStatsDto } from './dto';
export declare class AudienceOverlapService {
    private readonly reportRepo;
    private readonly influencerRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly creditsService;
    constructor(reportRepo: Repository<AudienceOverlapReport>, influencerRepo: Repository<AudienceOverlapInfluencer>, shareRepo: Repository<AudienceOverlapShare>, userRepo: Repository<User>, creditsService: CreditsService);
    createReport(userId: string, dto: CreateOverlapReportDto): Promise<{
        success: boolean;
        report: AudienceOverlapReport;
        creditsUsed: number;
    }>;
    private addInfluencersToReport;
    private processReport;
    private processPendingReports;
    getReports(userId: string, filters: OverlapReportFilterDto): Promise<OverlapReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<OverlapReportDetailDto>;
    getReportByShareToken(token: string): Promise<OverlapReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateOverlapReportDto): Promise<{
        success: boolean;
        report: AudienceOverlapReport;
    }>;
    retryReport(userId: string, reportId: string): Promise<{
        success: boolean;
        report: AudienceOverlapReport;
        creditsUsed: number;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareOverlapReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    searchInfluencers(platform: string, query: string, limit?: number): Promise<any[]>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    downloadReportAsXlsx(userId: string, reportId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private toDetailDto;
}
