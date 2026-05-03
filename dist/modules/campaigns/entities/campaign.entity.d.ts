import { User } from '../../users/entities/user.entity';
export declare enum CampaignStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    PAUSED = "PAUSED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum CampaignObjective {
    BRAND_AWARENESS = "BRAND_AWARENESS",
    ENGAGEMENT = "ENGAGEMENT",
    CONVERSIONS = "CONVERSIONS",
    REACH = "REACH",
    TRAFFIC = "TRAFFIC",
    SALES = "SALES"
}
export declare class Campaign {
    id: string;
    name: string;
    description?: string;
    logoUrl?: string;
    platform: string;
    status: CampaignStatus;
    objective?: CampaignObjective;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    currency: string;
    hashtags?: string[];
    mentions?: string[];
    targetAudience?: Record<string, any>;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    createdAt: Date;
    updatedAt: Date;
    influencers: CampaignInfluencer[];
    deliverables: CampaignDeliverable[];
    posts: CampaignPost[];
    shares: CampaignShare[];
}
export declare enum InfluencerStatus {
    INVITED = "INVITED",
    CONFIRMED = "CONFIRMED",
    DECLINED = "DECLINED",
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    PARTIAL = "PARTIAL",
    PAID = "PAID"
}
export declare enum ContractStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    SIGNED = "SIGNED",
    REJECTED = "REJECTED"
}
export declare class CampaignInfluencer {
    id: string;
    campaignId: string;
    campaign: Campaign;
    influencerProfileId: string;
    influencerName: string;
    influencerUsername: string;
    platform: string;
    followerCount: number;
    status: InfluencerStatus;
    budgetAllocated: number;
    paymentStatus: PaymentStatus;
    paymentAmount: number;
    contractStatus: ContractStatus;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    postsCount: number;
    audienceCredibility: number;
    profilePictureUrl: string;
    notes: string;
    addedAt: Date;
    confirmedAt: Date;
    completedAt: Date;
    deliverables: CampaignDeliverable[];
    posts: CampaignPost[];
    metrics: CampaignMetric[];
}
export declare enum DeliverableType {
    POST = "POST",
    STORY = "STORY",
    REEL = "REEL",
    VIDEO = "VIDEO",
    CAROUSEL = "CAROUSEL",
    TWEET = "TWEET",
    THREAD = "THREAD"
}
export declare enum DeliverableStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    SUBMITTED = "SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PUBLISHED = "PUBLISHED"
}
export declare class CampaignDeliverable {
    id: string;
    campaignId: string;
    campaign: Campaign;
    campaignInfluencerId: string;
    campaignInfluencer: CampaignInfluencer;
    deliverableType: DeliverableType;
    title?: string;
    description?: string;
    dueDate?: Date;
    status: DeliverableStatus;
    contentUrl: string;
    postId: string;
    submittedAt: Date;
    approvedAt: Date;
    publishedAt: Date;
    createdAt: Date;
    metrics: CampaignMetric[];
}
export declare class CampaignMetric {
    id: string;
    campaignId: string;
    campaign: Campaign;
    deliverableId: string;
    deliverable: CampaignDeliverable;
    campaignInfluencerId: string;
    campaignInfluencer: CampaignInfluencer;
    recordedAt: Date;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    views: number;
    clicks: number;
    engagementRate: number;
    costPerEngagement: number;
    costPerClick: number;
    costPerImpression: number;
}
export declare enum PostType {
    POST = "POST",
    STORY = "STORY",
    REEL = "REEL",
    VIDEO = "VIDEO"
}
export declare class CampaignPost {
    id: string;
    campaignId: string;
    campaign: Campaign;
    campaignInfluencerId: string;
    campaignInfluencer: CampaignInfluencer;
    postUrl: string;
    postType: PostType;
    platform: string;
    influencerName: string;
    influencerUsername: string;
    postImageUrl: string;
    description: string;
    postedDate: Date;
    followerCount: number;
    likesCount: number;
    viewsCount: number;
    commentsCount: number;
    sharesCount: number;
    engagementRate: number;
    audienceCredibility: number;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT",
    ADMIN = "ADMIN"
}
export declare class CampaignShare {
    id: string;
    campaignId: string;
    campaign: Campaign;
    sharedWithUserId: string;
    sharedWithUser: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
