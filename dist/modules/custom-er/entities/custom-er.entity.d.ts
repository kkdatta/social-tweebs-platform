import { User } from '../../users/entities/user.entity';
export declare enum CustomErReportStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum PostType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    REEL = "REEL",
    CAROUSEL = "CAROUSEL"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class CustomErReport {
    id: string;
    influencerProfileId?: string;
    influencerName: string;
    influencerUsername?: string;
    influencerProfileUrl?: string;
    influencerAvatarUrl?: string;
    followerCount: number;
    platform: string;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    status: CustomErReportStatus;
    errorMessage?: string;
    allPostsCount: number;
    allLikesCount: number;
    allViewsCount: number;
    allCommentsCount: number;
    allSharesCount: number;
    allAvgEngagementRate?: number;
    allEngagementViewsRate?: number;
    sponsoredPostsCount: number;
    sponsoredLikesCount: number;
    sponsoredViewsCount: number;
    sponsoredCommentsCount: number;
    sponsoredSharesCount: number;
    sponsoredAvgEngagementRate?: number;
    sponsoredEngagementViewsRate?: number;
    hasSponsoredPosts: boolean;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    posts: CustomErPost[];
    shares: CustomErShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class CustomErPost {
    id: string;
    reportId: string;
    report: CustomErReport;
    postId?: string;
    postUrl?: string;
    postType?: PostType;
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
    postDate: Date;
    createdAt: Date;
}
export declare class CustomErShare {
    id: string;
    reportId: string;
    report: CustomErReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
