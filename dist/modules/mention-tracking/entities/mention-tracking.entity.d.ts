import { User } from '../../users/entities/user.entity';
export declare enum MentionReportStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
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
export declare class MentionTrackingReport {
    id: string;
    title: string;
    platforms: string[];
    status: MentionReportStatus;
    dateRangeStart: Date;
    dateRangeEnd: Date;
    hashtags: string[];
    usernames: string[];
    keywords: string[];
    sponsoredOnly: boolean;
    autoRefreshEnabled: boolean;
    nextRefreshDate?: Date;
    totalInfluencers: number;
    totalPosts: number;
    totalLikes: number;
    totalViews: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate?: number;
    engagementViewsRate?: number;
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
    influencers: MentionTrackingInfluencer[];
    posts: MentionTrackingPost[];
    shares: MentionTrackingShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}
export declare class MentionTrackingInfluencer {
    id: string;
    reportId: string;
    report: MentionTrackingReport;
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
export declare class MentionTrackingPost {
    id: string;
    reportId: string;
    report: MentionTrackingReport;
    influencerId?: string;
    influencer?: MentionTrackingInfluencer;
    platform: string;
    postId?: string;
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
    postDate?: Date;
    createdAt: Date;
}
export declare class MentionTrackingShare {
    id: string;
    reportId: string;
    report: MentionTrackingReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
