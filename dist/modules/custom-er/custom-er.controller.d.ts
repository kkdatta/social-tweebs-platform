import { Response } from 'express';
import { CustomErService } from './custom-er.service';
import { CreateCustomErReportDto, UpdateCustomErReportDto, ShareCustomErReportDto, CustomErReportFilterDto, CustomErReportListResponseDto, CustomErReportDetailDto, DashboardStatsDto, PostSummaryDto } from './dto';
export declare class CustomErController {
    private readonly customErService;
    constructor(customErService: CustomErService);
    createReport(userId: string, dto: CreateCustomErReportDto): Promise<{
        success: boolean;
        report: import("./entities").CustomErReport;
    }>;
    uploadExcel(userId: string, file: Express.Multer.File, platform: string, dateRangeStart: string, dateRangeEnd: string): Promise<{
        success: boolean;
        reportsCreated: number;
        errors: string[];
    }>;
    downloadSampleFile(res: Response): Promise<void>;
    getReports(userId: string, filters: CustomErReportFilterDto): Promise<CustomErReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, reportId: string): Promise<CustomErReportDetailDto>;
    getReportPosts(userId: string, reportId: string, sponsoredOnly?: string): Promise<PostSummaryDto[]>;
    downloadReport(userId: string, reportId: string, res: Response): Promise<void>;
    updateReport(userId: string, reportId: string, dto: UpdateCustomErReportDto): Promise<{
        success: boolean;
        report: import("./entities").CustomErReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareCustomErReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getSharedReport(token: string): Promise<CustomErReportDetailDto>;
}
