import { SentimentReportStatus, ReportType, SharePermission } from '../entities';
export declare class CreateSentimentReportDto {
    title?: string;
    reportType: ReportType;
    platform: string;
    urls: string[];
    deepBrandAnalysis?: boolean;
    brandName?: string;
    brandUsername?: string;
    productName?: string;
}
export declare class UpdateSentimentReportDto {
    title?: string;
    isPublic?: boolean;
}
export declare class ShareSentimentReportDto {
    sharedWithUserId?: string;
    permissionLevel?: SharePermission;
}
export declare class SentimentReportFilterDto {
    platform?: string;
    reportType?: ReportType;
    status?: SentimentReportStatus;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class BulkDeleteDto {
    reportIds: string[];
}
export declare class PostSentimentDto {
    id: string;
    postUrl?: string;
    thumbnailUrl?: string;
    description?: string;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    engagementRate?: number;
    sentimentScore?: number;
    positivePercentage?: number;
    neutralPercentage?: number;
    negativePercentage?: number;
    commentsAnalyzed: number;
    postDate?: string;
}
export declare class EmotionDto {
    emotion: string;
    percentage: number;
    count: number;
}
export declare class WordCloudItemDto {
    word: string;
    frequency: number;
    sentiment?: string;
}
export declare class SentimentReportSummaryDto {
    id: string;
    title: string;
    platform: string;
    reportType: ReportType;
    influencerName?: string;
    influencerAvatarUrl?: string;
    overallSentimentScore?: number;
    status: SentimentReportStatus;
    creditsUsed: number;
    createdAt: Date;
}
export declare class SentimentReportDetailDto {
    id: string;
    title: string;
    platform: string;
    reportType: ReportType;
    targetUrl: string;
    influencerName?: string;
    influencerUsername?: string;
    influencerAvatarUrl?: string;
    status: SentimentReportStatus;
    errorMessage?: string;
    overallSentimentScore?: number;
    positivePercentage?: number;
    neutralPercentage?: number;
    negativePercentage?: number;
    deepBrandAnalysis: boolean;
    brandName?: string;
    brandUsername?: string;
    productName?: string;
    posts: PostSentimentDto[];
    emotions: EmotionDto[];
    wordCloud: WordCloudItemDto[];
    isPublic: boolean;
    shareUrl?: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare class SentimentReportListResponseDto {
    reports: SentimentReportSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class DashboardStatsDto {
    totalReports: number;
    completedReports: number;
    processingReports: number;
    pendingReports: number;
    failedReports: number;
    reportsThisMonth: number;
    avgSentimentScore: number;
}
