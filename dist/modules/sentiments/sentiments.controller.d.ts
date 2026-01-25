import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';
import { SentimentsService } from './sentiments.service';
import { CreateSentimentReportDto, UpdateSentimentReportDto, ShareSentimentReportDto, SentimentReportFilterDto, BulkDeleteDto, SentimentReportListResponseDto, SentimentReportDetailDto, DashboardStatsDto } from './dto';
export declare class SentimentsController {
    private readonly sentimentsService;
    constructor(sentimentsService: SentimentsService);
    createReport(userId: string, dto: CreateSentimentReportDto): Promise<{
        success: boolean;
        reports: import("./entities").SentimentReport[];
        creditsUsed: number;
    }>;
    getReports(userId: string, filters: SentimentReportFilterDto): Promise<SentimentReportListResponseDto>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    getReportById(userId: string, reportId: string): Promise<SentimentReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateSentimentReportDto): Promise<{
        success: boolean;
        report: import("./entities").SentimentReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    bulkDeleteReports(userId: string, dto: BulkDeleteDto): Promise<{
        success: boolean;
        deleted: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareSentimentReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    downloadPdf(userId: string, reportId: string, res: Response): Promise<StreamableFile>;
    getSharedReport(token: string): Promise<SentimentReportDetailDto>;
}
