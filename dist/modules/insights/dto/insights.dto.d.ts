import { PlatformType } from '../../../common/enums';
export declare class SearchInsightDto {
    platform: PlatformType;
    username: string;
}
export declare class ListInsightsQueryDto {
    platform?: PlatformType;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class InsightListItemDto {
    id: string;
    platform: string;
    username: string;
    fullName?: string;
    profilePictureUrl?: string;
    followerCount: number;
    engagementRate?: number;
    isVerified: boolean;
    unlockedAt: Date;
    lastRefreshedAt: Date;
}
export declare class InsightListResponseDto {
    data: InsightListItemDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class InsightStatsDto {
    followerCount: number;
    followingCount: number;
    postCount: number;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgViews?: number;
    avgReelViews?: number;
    avgReelLikes?: number;
    avgReelComments?: number;
    brandPostER?: number;
    postsWithHiddenLikesPct?: number;
}
export declare class AudienceDemographicsDto {
    credibility?: number;
    notableFollowersPct?: number;
    genderSplit?: {
        male: number;
        female: number;
    };
    ageGroups?: Array<{
        range: string;
        percentage: number;
        male: number;
        female: number;
    }>;
    topCountries?: Array<{
        country: string;
        percentage: number;
        followers: number;
    }>;
    topStates?: Array<{
        state: string;
        percentage: number;
        followers: number;
    }>;
    topCities?: Array<{
        city: string;
        percentage: number;
        followers: number;
    }>;
    languages?: Array<{
        language: string;
        percentage: number;
    }>;
    interests?: Array<{
        category: string;
        percentage: number;
    }>;
    brandAffinity?: Array<{
        brand: string;
        percentage: number;
    }>;
    reachability?: {
        below500: number;
        '500to1000': number;
        '1000to1500': number;
        above1500: number;
    };
}
export declare class EngagementDataDto {
    rateDistribution?: Array<{
        range: string;
        count: number;
    }>;
    likesSpread?: Array<{
        date: string;
        likes: number;
    }>;
    commentsSpread?: Array<{
        date: string;
        comments: number;
    }>;
    topHashtags?: Array<{
        tag: string;
        usagePercentage: number;
        count: number;
    }>;
}
export declare class GrowthDataDto {
    last6Months?: Array<{
        month: string;
        followers: number;
        following: number;
    }>;
}
export declare class LookalikesDataDto {
    influencer?: Array<{
        username: string;
        followers: number;
        similarity: number;
    }>;
    audience?: Array<{
        username: string;
        followers: number;
        overlap: number;
    }>;
}
export declare class PostDto {
    id: string;
    imageUrl?: string;
    caption?: string;
    likes?: number;
    comments?: number;
    views?: number;
    postedAt?: string;
    url?: string;
}
export declare class FullInsightResponseDto {
    id: string;
    platform: string;
    username: string;
    fullName?: string;
    profilePictureUrl?: string;
    bio?: string;
    isVerified: boolean;
    locationCountry?: string;
    stats: InsightStatsDto;
    audience: AudienceDemographicsDto;
    engagement: EngagementDataDto;
    growth: GrowthDataDto;
    lookalikes: LookalikesDataDto;
    brandAffinity?: any[];
    interests?: any[];
    wordCloud?: any[];
    posts?: {
        recent: PostDto[];
        popular: PostDto[];
        sponsored: PostDto[];
    };
    reels?: {
        recent: PostDto[];
        popular: PostDto[];
        sponsored: PostDto[];
    };
    lastRefreshedAt: Date;
    dataFreshnessStatus: 'FRESH' | 'STALE';
}
export declare class SearchInsightResponseDto {
    success: boolean;
    isNew: boolean;
    creditsUsed: number;
    remainingBalance?: number;
    insight: FullInsightResponseDto;
}
export declare class RefreshInsightResponseDto {
    success: boolean;
    creditsUsed: number;
    remainingBalance: number;
    insight: FullInsightResponseDto;
}
export declare class ExportInsightDto {
    insightId: string;
    format: 'pdf' | 'excel';
}
export declare class ExportInsightResponseDto {
    success: boolean;
    downloadUrl: string;
    creditsUsed: number;
}
