import { CampaignStatus, CampaignObjective, InfluencerStatus, PaymentStatus, ContractStatus, DeliverableType, DeliverableStatus, SharePermission, PostType } from '../entities/campaign.entity';
export declare const MIN_CREDITS_FOR_CAMPAIGN = 5;
export declare class CreateCampaignDto {
    name: string;
    description?: string;
    logoUrl?: string;
    platform: string;
    objective?: CampaignObjective;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency?: string;
    hashtags?: string[];
    mentions?: string[];
    targetAudience?: Record<string, any>;
}
export declare class UpdateCampaignDto {
    name?: string;
    description?: string;
    platform?: string;
    status?: CampaignStatus;
    objective?: CampaignObjective;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency?: string;
    hashtags?: string[];
    mentions?: string[];
    targetAudience?: Record<string, any>;
}
export declare class AddInfluencerDto {
    influencerProfileId?: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    followerCount?: number;
    budgetAllocated?: number;
    notes?: string;
}
export declare class UpdateInfluencerDto {
    status?: InfluencerStatus;
    budgetAllocated?: number;
    paymentStatus?: PaymentStatus;
    paymentAmount?: number;
    contractStatus?: ContractStatus;
    notes?: string;
}
export declare class CreateDeliverableDto {
    campaignInfluencerId: string;
    deliverableType: DeliverableType;
    title?: string;
    description?: string;
    dueDate?: string;
}
export declare class UpdateDeliverableDto {
    status?: DeliverableStatus;
    title?: string;
    description?: string;
    dueDate?: string;
    contentUrl?: string;
    postId?: string;
}
export declare class RecordMetricsDto {
    deliverableId?: string;
    campaignInfluencerId?: string;
    impressions?: number;
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    views?: number;
    clicks?: number;
}
export declare class AddPostDto {
    postUrl: string;
    postType?: PostType;
    campaignInfluencerId?: string;
    platform?: string;
    influencerName?: string;
    influencerUsername?: string;
    postImageUrl?: string;
    description?: string;
    postedDate?: string;
    followerCount?: number;
    likesCount?: number;
    viewsCount?: number;
    commentsCount?: number;
    sharesCount?: number;
    engagementRate?: number;
    audienceCredibility?: number;
}
export declare class PostFilterDto {
    platform?: string;
    search?: string;
    postType?: PostType;
    publishStatus?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}
export declare class InfluencerFilterDto {
    platform?: string;
    publishStatus?: string;
    search?: string;
}
export declare class ShareCampaignDto {
    sharedWithUserId: string;
    permissionLevel?: SharePermission;
}
export declare class CampaignFilterDto {
    status?: CampaignStatus;
    platform?: string;
    objective?: CampaignObjective;
    search?: string;
    tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class CampaignMetricsSummary {
    totalInfluencers: number;
    totalPosts: number;
    totalImpressions: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    totalClicks: number;
    avgEngagementRate: number;
    engagementToViewsRatio: number;
    totalSpent: number;
    budgetUtilization: number;
}
export declare class TimelineDataPoint {
    date: string;
    posts: number;
    likes: number;
    views: number;
    comments: number;
    shares: number;
    engagement: number;
}
export declare class CampaignSummaryDto {
    id: string;
    name: string;
    logoUrl?: string;
    platform: string;
    status: CampaignStatus;
    objective?: CampaignObjective;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    currency: string;
    hashtags?: string[];
    influencerCount: number;
    postsCount: number;
    deliverableCount: number;
    createdAt: Date;
    ownerName?: string;
}
export declare class CampaignDetailDto extends CampaignSummaryDto {
    description?: string;
    mentions?: string[];
    targetAudience?: Record<string, any>;
    influencers: any[];
    deliverables: any[];
    posts: any[];
    metrics: CampaignMetricsSummary;
    timeline: TimelineDataPoint[];
}
export declare class CampaignListResponseDto {
    campaigns: CampaignSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
