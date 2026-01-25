import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto, AddInfluencerDto, UpdateInfluencerDto, CreateDeliverableDto, UpdateDeliverableDto, RecordMetricsDto, ShareCampaignDto, CampaignFilterDto, CampaignListResponseDto, CampaignDetailDto } from './dto/campaign.dto';
export declare class CampaignsController {
    private readonly campaignsService;
    constructor(campaignsService: CampaignsService);
    createCampaign(userId: string, dto: CreateCampaignDto): Promise<{
        success: boolean;
        message: string;
        campaign: import("./entities").Campaign;
    }>;
    getCampaigns(userId: string, filters: CampaignFilterDto): Promise<CampaignListResponseDto>;
    getDashboardStats(userId: string): Promise<any>;
    getCampaignById(userId: string, id: string): Promise<CampaignDetailDto>;
    updateCampaign(userId: string, id: string, dto: UpdateCampaignDto): Promise<{
        success: boolean;
        message: string;
        campaign: import("./entities").Campaign;
    }>;
    deleteCampaign(userId: string, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addInfluencer(userId: string, campaignId: string, dto: AddInfluencerDto): Promise<{
        success: boolean;
        message: string;
        influencer: import("./entities").CampaignInfluencer;
    }>;
    getInfluencers(userId: string, campaignId: string): Promise<{
        success: boolean;
        influencers: import("./entities").CampaignInfluencer[];
        count: number;
    }>;
    updateInfluencer(userId: string, campaignId: string, influencerId: string, dto: UpdateInfluencerDto): Promise<{
        success: boolean;
        message: string;
        influencer: import("./entities").CampaignInfluencer;
    }>;
    removeInfluencer(userId: string, campaignId: string, influencerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    createDeliverable(userId: string, campaignId: string, dto: CreateDeliverableDto): Promise<{
        success: boolean;
        message: string;
        deliverable: import("./entities").CampaignDeliverable;
    }>;
    getDeliverables(userId: string, campaignId: string): Promise<{
        success: boolean;
        deliverables: import("./entities").CampaignDeliverable[];
        count: number;
    }>;
    updateDeliverable(userId: string, campaignId: string, deliverableId: string, dto: UpdateDeliverableDto): Promise<{
        success: boolean;
        message: string;
        deliverable: import("./entities").CampaignDeliverable;
    }>;
    deleteDeliverable(userId: string, campaignId: string, deliverableId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    recordMetrics(userId: string, campaignId: string, dto: RecordMetricsDto): Promise<{
        success: boolean;
        message: string;
        metric: import("./entities").CampaignMetric;
    }>;
    getCampaignMetrics(userId: string, campaignId: string): Promise<{
        success: boolean;
        metrics: import("./dto/campaign.dto").CampaignMetricsSummary;
    }>;
    shareCampaign(userId: string, campaignId: string, dto: ShareCampaignDto): Promise<{
        success: boolean;
        message: string;
        share: import("./entities").CampaignShare;
    }>;
    removeCampaignShare(userId: string, campaignId: string, shareId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
