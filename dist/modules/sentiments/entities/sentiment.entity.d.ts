import { User } from '../../users/entities/user.entity';
export declare enum SentimentReportStatus {
    PENDING = "PENDING",
    AGGREGATING = "AGGREGATING",
    IN_PROCESS = "IN_PROCESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum ReportType {
    POST = "POST",
    PROFILE = "PROFILE"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class SentimentReport {
    id: string;
    title: string;
    reportType: ReportType;
    platform: string;
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
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    creditsUsed: number;
    posts: SentimentPost[];
    emotions: SentimentEmotion[];
    wordCloud: SentimentWordCloud[];
    shares: SentimentShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class SentimentPost {
    id: string;
    reportId: string;
    report: SentimentReport;
    postId?: string;
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
    postDate?: Date;
    createdAt: Date;
}
export declare class SentimentEmotion {
    id: string;
    reportId: string;
    report: SentimentReport;
    postId?: string;
    post?: SentimentPost;
    emotion: string;
    percentage: number;
    count: number;
}
export declare class SentimentWordCloud {
    id: string;
    reportId: string;
    report: SentimentReport;
    postId?: string;
    post?: SentimentPost;
    word: string;
    frequency: number;
    sentiment?: string;
}
export declare class SentimentShare {
    id: string;
    reportId: string;
    report: SentimentReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
