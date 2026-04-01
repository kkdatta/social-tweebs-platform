import { User } from '../../users/entities/user.entity';
export declare enum CompetitionReportStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare enum InfluencerCategory {
    NANO = "NANO",
    MICRO = "MICRO",
    MACRO = "MACRO",
    MEGA = "MEGA"
}
export declare enum PostType {
    PHOTO = "PHOTO",
    VIDEO = "VIDEO",
    CAROUSEL = "CAROUSEL",
    REEL = "REEL"
}
export declare class CompetitionAnalysisReport {
    id: string;
    title: string;
    platforms: string[];
    status: CompetitionReportStatus;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    autoRefreshEnabled: boolean;
    nextRefreshDate?: Date;
    totalBrands: number;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    totalFollowers: number;
    errorMessage?: string;
    retryCount: number;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    creditsUsed: number;
    brands: CompetitionBrand[];
    influencers: CompetitionInfluencer[];
    posts: CompetitionPost[];
    shares: CompetitionShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class CompetitionBrand {
    id: string;
    reportId: string;
    report: CompetitionAnalysisReport;
    brandName: string;
    hashtags: string[];
    username?: string;
    keywords: string[];
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
    displayOrder: number;
    createdAt: Date;
}
export declare class CompetitionInfluencer {
    id: string;
    reportId: string;
    report: CompetitionAnalysisReport;
    brandId: string;
    brand: CompetitionBrand;
    influencerProfileId?: string;
    platformUserId?: string;
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
    displayOrder: number;
    createdAt: Date;
}
export declare class CompetitionPost {
    id: string;
    reportId: string;
    report: CompetitionAnalysisReport;
    brandId: string;
    brand: CompetitionBrand;
    influencerId?: string;
    influencer?: CompetitionInfluencer;
    platform: string;
    postId?: string;
    postUrl?: string;
    postType?: PostType;
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
    postDate?: Date;
    createdAt: Date;
}
export declare class CompetitionShare {
    id: string;
    reportId: string;
    report: CompetitionAnalysisReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
