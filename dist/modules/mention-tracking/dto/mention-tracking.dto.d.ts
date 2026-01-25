import { MentionReportStatus, SharePermission, InfluencerCategory } from '../entities';
export declare class CreateMentionTrackingReportDto {
    title?: string;
    platforms: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    hashtags?: string[];
    usernames?: string[];
    keywords?: string[];
    sponsoredOnly?: boolean;
    autoRefreshEnabled?: boolean;
}
export declare class UpdateMentionTrackingReportDto {
    title?: string;
    isPublic?: boolean;
    sponsoredOnly?: boolean;
}
export declare class ShareMentionTrackingReportDto {
    sharedWithUserId?: string;
    sharedWithEmail?: string;
    permissionLevel?: SharePermission;
}
export declare class MentionTrackingReportFilterDto {
    platform?: string;
    status?: MentionReportStatus;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class MentionTrackingReportListResponseDto {
    reports: MentionTrackingReportSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class MentionTrackingReportSummaryDto {
    id: string;
    title: string;
    platforms: string[];
    status: MentionReportStatus;
    dateRangeStart: string;
    dateRangeEnd: string;
    hashtags: string[];
    usernames: string[];
    keywords: string[];
    totalPosts: number;
    totalInfluencers: number;
    creditsUsed: number;
    createdAt: Date;
}
export declare class MentionTrackingReportDetailDto {
    id: string;
    title: string;
    platforms: string[];
    status: MentionReportStatus;
    errorMessage?: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    hashtags: string[];
    usernames: string[];
    keywords: string[];
    sponsoredOnly: boolean;
    autoRefreshEnabled: boolean;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    engagementViewsRate?: number;
    totalFollowers: number;
    influencers: MentionTrackingInfluencerDto[];
    posts: MentionTrackingPostDto[];
    categorization: CategoryStatsDto[];
    isPublic: boolean;
    shareUrl?: string;
    creditsUsed: number;
    createdAt: Date;
    completedAt?: Date;
}
export declare class MentionTrackingInfluencerDto {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    category?: InfluencerCategory;
    audienceCredibility?: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    avgEngagementRate?: number;
}
export declare class MentionTrackingPostDto {
    id: string;
    platform: string;
    postUrl?: string;
    postType?: string;
    thumbnailUrl?: string;
    description?: string;
    matchedHashtags?: string[];
    matchedUsernames?: string[];
    matchedKeywords?: string[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    engagementRate?: number;
    isSponsored: boolean;
    postDate?: string;
    influencerName?: string;
    influencerUsername?: string;
}
export declare class CategoryStatsDto {
    category: string;
    label: string;
    accountsCount: number;
    followersCount: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    engagementRate: number;
}
export declare class DashboardStatsDto {
    totalReports: number;
    completedReports: number;
    processingReports: number;
    pendingReports: number;
    failedReports: number;
    reportsThisMonth: number;
    totalInfluencersAnalyzed: number;
    totalPostsAnalyzed: number;
    avgEngagementRate: number;
}
export declare class ChartDataDto {
    date: string;
    postsCount: number;
    influencersCount: number;
    likesCount: number;
    viewsCount: number;
}
export declare class PostsFilterDto {
    sponsoredOnly?: boolean;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class InfluencersFilterDto {
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
