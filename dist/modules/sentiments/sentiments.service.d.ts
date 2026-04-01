import { Repository } from 'typeorm';
import { SentimentReport, SentimentPost, SentimentEmotion, SentimentWordCloud, SentimentShare } from './entities';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { CreateSentimentReportDto, UpdateSentimentReportDto, ShareSentimentReportDto, SentimentReportFilterDto, SentimentReportListResponseDto, SentimentReportDetailDto, DashboardStatsDto } from './dto';
export declare class SentimentsService {
    private readonly reportRepo;
    private readonly postRepo;
    private readonly emotionRepo;
    private readonly wordCloudRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly creditsService;
    constructor(reportRepo: Repository<SentimentReport>, postRepo: Repository<SentimentPost>, emotionRepo: Repository<SentimentEmotion>, wordCloudRepo: Repository<SentimentWordCloud>, shareRepo: Repository<SentimentShare>, userRepo: Repository<User>, creditsService: CreditsService);
    createReport(userId: string, dto: CreateSentimentReportDto): Promise<{
        success: boolean;
        reports: SentimentReport[];
        creditsUsed: number;
    }>;
    private extractUsernameFromUrl;
    private processReport;
    private simulateSinglePostProcessing;
    private simulateProfileProcessing;
    private saveEmotionsForPost;
    private saveWordCloudForPost;
    private saveAggregatedEmotions;
    private saveAggregatedWordCloud;
    getReports(userId: string, filters: SentimentReportFilterDto): Promise<SentimentReportListResponseDto>;
    getReportById(userId: string, reportId: string): Promise<SentimentReportDetailDto>;
    getReportByShareToken(token: string): Promise<SentimentReportDetailDto>;
    updateReport(userId: string, reportId: string, dto: UpdateSentimentReportDto): Promise<{
        success: boolean;
        report: SentimentReport;
    }>;
    deleteReport(userId: string, reportId: string): Promise<{
        success: boolean;
    }>;
    bulkDeleteReports(userId: string, reportIds: string[]): Promise<{
        success: boolean;
        deleted: number;
    }>;
    shareReport(userId: string, reportId: string, dto: ShareSentimentReportDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    generatePdf(userId: string, reportId: string): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    private getTeamUserIds;
    private checkReportAccess;
    private toSummaryDto;
    private toDetailDto;
}
