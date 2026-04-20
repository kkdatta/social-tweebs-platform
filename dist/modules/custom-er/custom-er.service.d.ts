import { Repository } from 'typeorm';
import { CustomErReport, CustomErPost, CustomErShare } from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { CreateCustomErReportDto, UpdateCustomErReportDto, ShareCustomErReportDto, CustomErReportFilterDto, CustomErReportListResponseDto, CustomErReportDetailDto, DashboardStatsDto, PostSummaryDto } from './dto';
import { ModashService } from '../discovery/services/modash.service';
import { ModashRawService } from '../discovery/services/modash-raw.service';
export declare class CustomErService {
    private readonly reportRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly profileRepo;
    private readonly modashService;
    private readonly modashRawService;
    private readonly logger;
    constructor(reportRepo: Repository<CustomErReport>, postRepo: Repository<CustomErPost>, shareRepo: Repository<CustomErShare>, userRepo: Repository<User>, profileRepo: Repository<InfluencerProfile>, modashService: ModashService, modashRawService: ModashRawService);
    createReport(userId: string, dto: CreateCustomErReportDto): Promise<{
        success: boolean;
        report: CustomErReport;
    }>;
    private processReport;
    private processReportWithRawApi;
    private processReportSimulated;
    private updateReportMetrics;
    getReports(userId: string, filters: CustomErReportFilterDto): Promise<CustomErReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<CustomErReportDetailDto>;
    getReportByShareToken(token: string): Promise<CustomErReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateCustomErReportDto): Promise<{
        success: boolean;
        report: CustomErReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareCustomErReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportPosts(userId: string, reportId: string, sponsoredOnly?: boolean): Promise<PostSummaryDto[]>;
    createReportsFromExcel(userId: string, file: Express.Multer.File, platform: string, dateRangeStart: string, dateRangeEnd: string): Promise<{
        success: boolean;
        reportsCreated: number;
        errors: string[];
    }>;
    generateSampleExcel(): Buffer;
    downloadReportAsXlsx(userId: string, reportId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
    private toPostDto;
    private generateChartData;
}
