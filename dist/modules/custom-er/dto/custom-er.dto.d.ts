import { CustomErReportStatus, SharePermission } from '../entities';
export declare class CreateCustomErReportDto {
    influencerProfileId: string;
    platform: string;
    dateRangeStart: string;
    dateRangeEnd: string;
}
export declare class UpdateCustomErReportDto {
    isPublic?: boolean;
}
export declare class ShareCustomErReportDto {
    sharedWithUserId?: string;
    permissionLevel?: SharePermission;
}
export declare class CustomErReportFilterDto {
    platform?: string;
    status?: CustomErReportStatus;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class PostSummaryDto {
    id: string;
    postId?: string;
    postUrl?: string;
    postType?: string;
    thumbnailUrl?: string;
    description?: string;
    hashtags?: string[];
    mentions?: string[];
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    engagementRate?: number;
    isSponsored: boolean;
    postDate: string;
}
export declare class EngagementMetricsDto {
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    avgEngagementRate?: number;
    engagementViewsRate?: number;
}
export declare class CustomErReportSummaryDto {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    influencerAvatarUrl?: string;
    platform: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    postsCount: number;
    status: CustomErReportStatus;
    createdAt: Date;
}
export declare class CustomErReportDetailDto {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    influencerAvatarUrl?: string;
    followerCount: number;
    platform: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    status: CustomErReportStatus;
    errorMessage?: string;
    allPostsMetrics: EngagementMetricsDto;
    sponsoredPostsMetrics?: EngagementMetricsDto;
    hasSponsoredPosts: boolean;
    posts: PostSummaryDto[];
    postsChartData: {
        date: string;
        regularPosts: number;
        sponsoredPosts: number;
    }[];
    isPublic: boolean;
    shareUrl?: string;
    createdAt: Date;
    completedAt?: Date;
}
export declare class CustomErReportListResponseDto {
    reports: CustomErReportSummaryDto[];
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
}
