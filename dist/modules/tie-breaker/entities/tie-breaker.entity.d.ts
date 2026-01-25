import { User } from '../../users/entities/user.entity';
export declare enum TieBreakerStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum TieBreakerPlatform {
    INSTAGRAM = "INSTAGRAM",
    YOUTUBE = "YOUTUBE",
    TIKTOK = "TIKTOK"
}
export declare enum TieBreakerSharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class TieBreakerComparison {
    id: string;
    title: string;
    platform: TieBreakerPlatform;
    status: TieBreakerStatus;
    searchQuery?: string;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    creditsUsed: number;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    influencers: TieBreakerInfluencer[];
    shares: TieBreakerShare[];
}
export declare class TieBreakerInfluencer {
    id: string;
    comparisonId: string;
    comparison: TieBreakerComparison;
    influencerProfileId?: string;
    platformUserId?: string;
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
    audienceQuality?: number;
    notableFollowersPct?: number;
    followersGenderData?: {
        male: number;
        female: number;
    };
    followersAgeData?: Array<{
        ageRange: string;
        male: number;
        female: number;
    }>;
    followersCountries?: Array<{
        country: string;
        percentage: number;
    }>;
    followersCities?: Array<{
        city: string;
        percentage: number;
    }>;
    followersInterests?: Array<{
        interest: string;
        percentage: number;
    }>;
    engagersQuality?: number;
    notableEngagersPct?: number;
    engagersGenderData?: {
        male: number;
        female: number;
    };
    engagersAgeData?: Array<{
        ageRange: string;
        male: number;
        female: number;
    }>;
    engagersCountries?: Array<{
        country: string;
        percentage: number;
    }>;
    engagersCities?: Array<{
        city: string;
        percentage: number;
    }>;
    engagersInterests?: Array<{
        interest: string;
        percentage: number;
    }>;
    topPosts?: Array<{
        postId: string;
        postUrl: string;
        thumbnailUrl: string;
        caption: string;
        likes: number;
        comments: number;
        views: number;
        engagementRate: number;
        isSponsored: boolean;
        postDate: string;
    }>;
    displayOrder: number;
    wasUnlocked: boolean;
    createdAt: Date;
}
export declare class TieBreakerShare {
    id: string;
    comparisonId: string;
    comparison: TieBreakerComparison;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: TieBreakerSharePermission;
    sharedAt: Date;
}
