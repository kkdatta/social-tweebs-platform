import { TieBreakerStatus, TieBreakerPlatform, TieBreakerSharePermission } from '../entities';
export declare class CreateTieBreakerComparisonDto {
    title?: string;
    platform: TieBreakerPlatform;
    influencerIds: string[];
    searchQuery?: string;
}
export declare class UpdateTieBreakerComparisonDto {
    title?: string;
    isPublic?: boolean;
}
export declare class ShareTieBreakerComparisonDto {
    sharedWithUserId?: string;
    permissionLevel?: TieBreakerSharePermission;
    makePublic?: boolean;
}
export declare class TieBreakerFilterDto {
    platform?: string;
    status?: TieBreakerStatus;
    createdBy?: 'ALL' | 'ME' | 'TEAM';
    search?: string;
    page?: number;
    limit?: number;
}
export declare class SearchInfluencerDto {
    platform: TieBreakerPlatform;
    query: string;
    limit?: number;
}
export declare class InfluencerAudienceDataDto {
    quality?: number;
    notablePct?: number;
    genderData?: {
        male: number;
        female: number;
    };
    ageData?: Array<{
        ageRange: string;
        male: number;
        female: number;
    }>;
    countries?: Array<{
        country: string;
        percentage: number;
    }>;
    cities?: Array<{
        city: string;
        percentage: number;
    }>;
    interests?: Array<{
        interest: string;
        percentage: number;
    }>;
}
export declare class TopPostDto {
    postId: string;
    postUrl?: string;
    thumbnailUrl?: string;
    caption?: string;
    likes: number;
    comments: number;
    views: number;
    engagementRate: number;
    isSponsored: boolean;
    postDate?: string;
}
export declare class TieBreakerInfluencerDto {
    id: string;
    influencerProfileId?: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    followingCount?: number;
    avgLikes: number;
    avgViews: number;
    avgComments: number;
    avgReelViews?: number;
    engagementRate: number;
    isVerified: boolean;
    followersAudience?: InfluencerAudienceDataDto;
    engagersAudience?: InfluencerAudienceDataDto;
    topPosts?: TopPostDto[];
    displayOrder: number;
    wasUnlocked: boolean;
}
export declare class TieBreakerComparisonSummaryDto {
    id: string;
    title: string;
    platform: string;
    status: TieBreakerStatus;
    influencerCount: number;
    influencers: Partial<TieBreakerInfluencerDto>[];
    createdAt: Date;
    createdById?: string;
    creditsUsed?: number;
}
export declare class TieBreakerComparisonDetailDto {
    id: string;
    title: string;
    platform: string;
    status: TieBreakerStatus;
    searchQuery?: string;
    influencers: TieBreakerInfluencerDto[];
    isPublic: boolean;
    shareUrl?: string;
    creditsUsed: number;
    createdAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    ownerId: string;
    createdById: string;
}
export declare class TieBreakerListResponseDto {
    comparisons: TieBreakerComparisonSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class TieBreakerDashboardStatsDto {
    totalComparisons: number;
    completedComparisons: number;
    pendingComparisons: number;
    processingComparisons: number;
    failedComparisons: number;
    comparisonsThisMonth: number;
    totalInfluencersCompared: number;
    totalCreditsUsed: number;
}
export declare class SearchInfluencerResultDto {
    id: string;
    platform: string;
    platformUserId: string;
    username: string;
    fullName?: string;
    profilePictureUrl?: string;
    followerCount: number;
    engagementRate?: number;
    isVerified: boolean;
    isUnlocked: boolean;
    locationCountry?: string;
}
