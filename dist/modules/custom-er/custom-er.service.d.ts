import { Repository } from 'typeorm';
import { CustomErReport, CustomErPost, CustomErShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreateCustomErReportDto, UpdateCustomErReportDto, ShareCustomErReportDto, CustomErReportFilterDto, CustomErReportListResponseDto, CustomErReportDetailDto, DashboardStatsDto, PostSummaryDto } from './dto';
export declare class CustomErService {
    private readonly reportRepo;
    private readonly postRepo;
    private readonly shareRepo;
    private readonly userRepo;
    constructor(reportRepo: Repository<CustomErReport>, postRepo: Repository<CustomErPost>, shareRepo: Repository<CustomErShare>, userRepo: Repository<User>);
    createReport(userId: string, dto: CreateCustomErReportDto): Promise<{
        success: boolean;
        report: CustomErReport;
    }>;
    private processReport;
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
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
    private toPostDto;
    private generateChartData;
}
