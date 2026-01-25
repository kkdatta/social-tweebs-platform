import { PaidCollabReportStatus, InfluencerCategory, QueryLogic, SharePermission } from '../entities';
export declare class CreatePaidCollabReportDto {
    title: string;
    platform: string;
    hashtags?: string[];
    mentions?: string[];
    queryLogic?: QueryLogic;
    dateRangeStart: string;
    dateRangeEnd: string;
}
export declare class UpdatePaidCollabReportDto {
    title?: string;
    isPublic?: boolean;
}
export declare class SharePaidCollabReportDto {
    sharedWithUserId?: string;
    sharedWithEmail?: string;
    permissionLevel?: SharePermission;
}
export declare class PaidCollabReportFilterDto {
    platform?: string;
    status?: PaidCollabReportStatus;
    createdBy?: 'ME' | 'TEAM' | 'SHARED' | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
}
export declare class PaidCollabInfluencerDto {
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
    engagementRate?: number;
    category: InfluencerCategory;
    credibilityScore?: number;
}
export declare class PaidCollabPostDto {
    id: string;
    postUrl?: string;
    postType?: string;
    thumbnailUrl?: string;
    caption?: string;
    matchedHashtags?: string[];
    matchedMentions?: string[];
    isSponsored: boolean;
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    engagementRate?: number;
    postDate?: string;
    influencerName?: string;
    influencerUsername?: string;
}
export declare class PaidCollabCategorizationDto {
    category: InfluencerCategory;
    accountsCount: number;
    followersCount: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    engagementRate?: number;
}
export declare class PaidCollabReportSummaryDto {
    id: string;
    title: string;
    platform: string;
    status: PaidCollabReportStatus;
    hashtags: string[];
    mentions: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    totalInfluencers: number;
    totalPosts: number;
    creditsUsed: number;
    createdAt: Date;
}
export declare class PaidCollabReportDetailDto {
    id: string;
    title: string;
    platform: string;
    status: PaidCollabReportStatus;
    errorMessage?: string;
    hashtags: string[];
    mentions: string[];
    queryLogic: QueryLogic;
    dateRangeStart: string;
    dateRangeEnd: string;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    engagementViewsRate?: number;
    influencers: PaidCollabInfluencerDto[];
    posts: PaidCollabPostDto[];
    categorizations: PaidCollabCategorizationDto[];
    isPublic: boolean;
    shareUrl?: string;
    creditsUsed: number;
    createdAt: Date;
    completedAt?: Date;
}
export declare class PaidCollabReportListResponseDto {
    reports: PaidCollabReportSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class PaidCollabDashboardStatsDto {
    totalReports: number;
    completedReports: number;
    inProgressReports: number;
    pendingReports: number;
    failedReports: number;
    reportsThisMonth: number;
    totalInfluencersAnalyzed: number;
    totalPostsAnalyzed: number;
    avgEngagementRate: number;
}
export declare class PostsChartDataDto {
    date: string;
    postsCount: number;
    influencersCount: number;
    likesCount: number;
    viewsCount: number;
}
