import { User } from '../../users/entities/user.entity';
export declare enum PaidCollabReportStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum InfluencerCategory {
    ALL = "ALL",
    NANO = "NANO",
    MICRO = "MICRO",
    MACRO = "MACRO",
    MEGA = "MEGA"
}
export declare enum QueryLogic {
    AND = "AND",
    OR = "OR"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class PaidCollabReport {
    id: string;
    title: string;
    platform: string;
    status: PaidCollabReportStatus;
    hashtags: string[];
    mentions: string[];
    queryLogic: QueryLogic;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    engagementViewsRate?: number;
    errorMessage?: string;
    retryCount: number;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    creditsUsed: number;
    influencers: PaidCollabInfluencer[];
    posts: PaidCollabPost[];
    shares: PaidCollabShare[];
    categorizations: PaidCollabCategorization[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class PaidCollabInfluencer {
    id: string;
    reportId: string;
    report: PaidCollabReport;
    influencerProfileId?: string;
    platformUserId?: string;
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
    displayOrder: number;
    createdAt: Date;
}
export declare class PaidCollabPost {
    id: string;
    reportId: string;
    report: PaidCollabReport;
    influencerId?: string;
    influencer?: PaidCollabInfluencer;
    postId?: string;
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
    postDate?: Date;
    createdAt: Date;
}
export declare class PaidCollabCategorization {
    id: string;
    reportId: string;
    report: PaidCollabReport;
    category: InfluencerCategory;
    accountsCount: number;
    followersCount: number;
    postsCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    engagementRate?: number;
    createdAt: Date;
}
export declare class PaidCollabShare {
    id: string;
    reportId: string;
    report: PaidCollabReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
