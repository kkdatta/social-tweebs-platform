import { CompetitionReportStatus, SharePermission } from '../entities';
export declare class BrandInputDto {
    brandName: string;
    hashtags?: string[];
    username?: string;
    keywords?: string[];
    platform?: string;
}
export declare class CreateCompetitionReportDto {
    title?: string;
    platforms: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    brands: BrandInputDto[];
    autoRefreshEnabled?: boolean;
}
export declare class UpdateCompetitionReportDto {
    title?: string;
    isPublic?: boolean;
}
export declare class ShareCompetitionReportDto {
    sharedWithUserId?: string;
    permissionLevel?: SharePermission;
}
export declare class CompetitionReportFilterDto {
    platform?: string;
    status?: CompetitionReportStatus;
    createdBy?: 'ALL' | 'ME' | 'TEAM' | 'SHARED';
    search?: string;
    page?: number;
    limit?: number;
}
export declare class PostsFilterDto {
    brandId?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class InfluencersFilterDto {
    brandId?: string;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class BrandSummaryDto {
    id: string;
    brandName: string;
    hashtags?: string[];
    username?: string;
    keywords?: string[];
    platform?: string;
    displayColor?: string;
    influencerCount: number;
    postsCount: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    totalFollowers: number;
    avgEngagementRate?: number;
    photoCount: number;
    videoCount: number;
    carouselCount: number;
    reelCount: number;
    nanoCount: number;
    microCount: number;
    macroCount: number;
    megaCount: number;
}
export declare class CompetitionInfluencerDto {
    id: string;
    brandId: string;
    brandName: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    category?: string;
    audienceCredibility?: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    avgEngagementRate?: number;
}
export declare class CompetitionPostDto {
    id: string;
    brandId: string;
    brandName: string;
    platform: string;
    postUrl?: string;
    postType?: string;
    thumbnailUrl?: string;
    description?: string;
    matchedHashtags?: string[];
    matchedUsername?: string;
    matchedKeywords?: string[];
    likesCount: number;
    commentsCount: number;
    viewsCount: number;
    sharesCount: number;
    engagementRate?: number;
    isSponsored: boolean;
    postDate?: string;
    influencerId?: string;
    influencerName?: string;
    influencerUsername?: string;
    influencerFollowerCount?: number;
    influencerCredibility?: number;
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
export declare class PostTypeStatsDto {
    brandId: string;
    brandName: string;
    photoCount: number;
    videoCount: number;
    carouselCount: number;
    reelCount: number;
    photoPercentage: number;
    videoPercentage: number;
    carouselPercentage: number;
    reelPercentage: number;
}
export declare class TimelineDataPointDto {
    date: string;
    brands: Record<string, number>;
    total: number;
}
export declare class BrandShareDto {
    brandName: string;
    value: number;
    color: string;
}
export declare class EnhancedChartDataDto {
    postsOverTime: TimelineDataPointDto[];
    influencersOverTime: TimelineDataPointDto[];
    postsShare: BrandShareDto[];
    influencersShare: BrandShareDto[];
    engagementShare: BrandShareDto[];
}
export declare class ChartDataDto {
    date: string;
    brandPosts: Record<string, number>;
    totalPosts: number;
}
export declare class DashboardStatsDto {
    totalReports: number;
    completedReports: number;
    inProgressReports: number;
    pendingReports: number;
    failedReports: number;
    reportsThisMonth: number;
    totalBrandsAnalyzed: number;
    totalInfluencersAnalyzed: number;
    totalPostsAnalyzed: number;
    avgEngagementRate: number;
}
export declare class CompetitionReportSummaryDto {
    id: string;
    title: string;
    platforms: string[];
    status: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    totalBrands: number;
    totalPosts: number;
    totalInfluencers: number;
    creditsUsed: number;
    createdAt: Date;
}
export declare class CompetitionReportDetailDto {
    id: string;
    title: string;
    platforms: string[];
    status: string;
    errorMessage?: string;
    dateRangeStart?: string;
    dateRangeEnd?: string;
    autoRefreshEnabled: boolean;
    totalBrands: number;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    totalFollowers: number;
    brands: BrandSummaryDto[];
    influencers: CompetitionInfluencerDto[];
    posts: CompetitionPostDto[];
    categorization: CategoryStatsDto[];
    postTypeBreakdown: PostTypeStatsDto[];
    isPublic: boolean;
    shareUrl?: string;
    creditsUsed: number;
    createdAt: Date;
    completedAt?: Date;
}
export declare class CompetitionReportListResponseDto {
    reports: CompetitionReportSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
