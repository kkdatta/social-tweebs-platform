import { User } from '../../users/entities/user.entity';
export declare enum CollabReportStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum TimePeriod {
    ONE_MONTH = "1_MONTH",
    THREE_MONTHS = "3_MONTHS",
    SIX_MONTHS = "6_MONTHS",
    ONE_YEAR = "1_YEAR"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class CollabCheckReport {
    id: string;
    title: string;
    platform: string;
    status: CollabReportStatus;
    timePeriod: TimePeriod;
    queries: string[];
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
    influencers: CollabCheckInfluencer[];
    posts: CollabCheckPost[];
    shares: CollabCheckShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class CollabCheckInfluencer {
    id: string;
    reportId: string;
    report: CollabCheckReport;
    influencerProfileId?: string;
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
    displayOrder: number;
    createdAt: Date;
}
export declare class CollabCheckPost {
    id: string;
    reportId: string;
    report: CollabCheckReport;
    influencerId?: string;
    influencer?: CollabCheckInfluencer;
    postId?: string;
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
    postDate?: Date;
    createdAt: Date;
}
export declare class CollabCheckShare {
    id: string;
    reportId: string;
    report: CollabCheckReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
