import { CollabReportStatus, TimePeriod, SharePermission } from '../entities';
export declare class CreateCollabCheckReportDto {
    title?: string;
    platform: string;
    timePeriod: TimePeriod;
    queries: string[];
    influencers: string[];
    multipleInfluencers?: boolean;
}
export declare class UpdateCollabCheckReportDto {
    title?: string;
    isPublic?: boolean;
}
export declare class ShareCollabCheckReportDto {
    sharedWithUserId?: string;
    permissionLevel?: SharePermission;
}
export declare class CollabCheckReportFilterDto {
    platform?: string;
    status?: CollabReportStatus;
    createdBy?: 'ALL' | 'ME' | 'TEAM';
    search?: string;
    page?: number;
    limit?: number;
}
export declare class CollabCheckInfluencerDto {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    avgEngagementRate?: number;
}
export declare class CollabCheckPostDto {
    id: string;
    postUrl?: string;
    postType?: string;
    thumbnailUrl?: string;
    description?: string;
    matchedKeywords?: string[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    engagementRate?: number;
    postDate?: string;
    influencerName?: string;
    influencerUsername?: string;
}
export declare class CollabCheckReportSummaryDto {
    id: string;
    title: string;
    platform: string;
    status: CollabReportStatus;
    timePeriod: TimePeriod;
    queries: string[];
    totalPosts: number;
    totalFollowers: number;
    creditsUsed: number;
    createdAt: Date;
    influencers?: CollabCheckInfluencerDto[];
}
export declare class CollabCheckReportDetailDto {
    id: string;
    title: string;
    platform: string;
    status: CollabReportStatus;
    errorMessage?: string;
    timePeriod: TimePeriod;
    queries: string[];
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    totalFollowers: number;
    influencers: CollabCheckInfluencerDto[];
    posts: CollabCheckPostDto[];
    isPublic: boolean;
    shareUrl?: string;
    creditsUsed: number;
    createdAt: Date;
    completedAt?: Date;
}
export declare class CollabCheckReportListResponseDto {
    reports: CollabCheckReportSummaryDto[];
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
    totalPostsAnalyzed: number;
    avgEngagementRate: number;
}
export declare class PostsChartDataDto {
    date: string;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
}
