import { CampaignStatus, CampaignObjective, InfluencerStatus, PaymentStatus, ContractStatus, DeliverableType, DeliverableStatus, SharePermission } from '../entities/campaign.entity';
export declare class CreateCampaignDto {
    name: string;
    description?: string;
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
    totalImpressions: number;
    totalReach: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    totalClicks: number;
    avgEngagementRate: number;
    totalSpent: number;
    budgetUtilization: number;
}
export declare class CampaignSummaryDto {
    id: string;
    name: string;
    platform: string;
    status: CampaignStatus;
    objective?: CampaignObjective;
    startDate?: Date;
    endDate?: Date;
    budget?: number;
    currency: string;
    influencerCount: number;
    deliverableCount: number;
    createdAt: Date;
    ownerName?: string;
}
export declare class CampaignDetailDto extends CampaignSummaryDto {
    description?: string;
    hashtags?: string[];
    mentions?: string[];
    targetAudience?: Record<string, any>;
    influencers: any[];
    deliverables: any[];
    metrics: CampaignMetricsSummary;
}
export declare class CampaignListResponseDto {
    campaigns: CampaignSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
