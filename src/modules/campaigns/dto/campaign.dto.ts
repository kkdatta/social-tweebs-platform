import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CampaignStatus,
  CampaignObjective,
  InfluencerStatus,
  PaymentStatus,
  ContractStatus,
  DeliverableType,
  DeliverableStatus,
  SharePermission,
} from '../entities/campaign.entity';

// ============ CREATE CAMPAIGN ============
export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Platform: INSTAGRAM, YOUTUBE, TIKTOK, MULTI' })
  @IsString()
  platform: string;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Campaign budget' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ type: [String], description: 'Campaign hashtags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Campaign mentions' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiPropertyOptional({ description: 'Target audience demographics' })
  @IsOptional()
  targetAudience?: Record<string, any>;
}

export class UpdateCampaignDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  targetAudience?: Record<string, any>;
}

// ============ CAMPAIGN INFLUENCER ============
export class AddInfluencerDto {
  @ApiPropertyOptional({ description: 'Influencer profile ID from discovery' })
  @IsOptional()
  @IsUUID()
  influencerProfileId?: string;

  @ApiProperty({ description: 'Influencer display name' })
  @IsString()
  influencerName: string;

  @ApiPropertyOptional({ description: 'Influencer username/handle' })
  @IsOptional()
  @IsString()
  influencerUsername?: string;

  @ApiProperty({ description: 'Platform' })
  @IsString()
  platform: string;

  @ApiPropertyOptional({ description: 'Follower count' })
  @IsOptional()
  @IsNumber()
  followerCount?: number;

  @ApiPropertyOptional({ description: 'Budget allocated to this influencer' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAllocated?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateInfluencerDto {
  @ApiPropertyOptional({ enum: InfluencerStatus })
  @IsOptional()
  @IsEnum(InfluencerStatus)
  status?: InfluencerStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetAllocated?: number;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @ApiPropertyOptional({ enum: ContractStatus })
  @IsOptional()
  @IsEnum(ContractStatus)
  contractStatus?: ContractStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============ DELIVERABLES ============
export class CreateDeliverableDto {
  @ApiProperty({ description: 'Campaign influencer ID' })
  @IsUUID()
  campaignInfluencerId: string;

  @ApiProperty({ enum: DeliverableType })
  @IsEnum(DeliverableType)
  deliverableType: DeliverableType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateDeliverableDto {
  @ApiPropertyOptional({ enum: DeliverableStatus })
  @IsOptional()
  @IsEnum(DeliverableStatus)
  status?: DeliverableStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postId?: string;
}

// ============ METRICS ============
export class RecordMetricsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  deliverableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  campaignInfluencerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  impressions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  reach?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  likes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  comments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  shares?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  saves?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  views?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  clicks?: number;
}

// ============ SHARING ============
export class ShareCampaignDto {
  @ApiProperty({ description: 'User ID to share with' })
  @IsUUID()
  sharedWithUserId: string;

  @ApiPropertyOptional({ enum: SharePermission, default: SharePermission.VIEW })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

// ============ FILTER / QUERY ============
export class CampaignFilterDto {
  @ApiPropertyOptional({ enum: CampaignStatus })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: CampaignObjective })
  @IsOptional()
  @IsEnum(CampaignObjective)
  objective?: CampaignObjective;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tab: created_by_me, created_by_team, shared_with_me' })
  @IsOptional()
  @IsString()
  tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me';

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// ============ RESPONSE DTOs ============

export class CampaignMetricsSummary {
  @ApiProperty()
  totalImpressions: number;

  @ApiProperty()
  totalReach: number;

  @ApiProperty()
  totalLikes: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalShares: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalClicks: number;

  @ApiProperty()
  avgEngagementRate: number;

  @ApiProperty()
  totalSpent: number;

  @ApiProperty()
  budgetUtilization: number;
}

export class CampaignSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  status: CampaignStatus;

  @ApiPropertyOptional()
  objective?: CampaignObjective;

  @ApiPropertyOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  budget?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  influencerCount: number;

  @ApiProperty()
  deliverableCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  ownerName?: string;
}

export class CampaignDetailDto extends CampaignSummaryDto {
  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  hashtags?: string[];

  @ApiPropertyOptional()
  mentions?: string[];

  @ApiPropertyOptional()
  targetAudience?: Record<string, any>;

  @ApiProperty()
  influencers: any[];

  @ApiProperty()
  deliverables: any[];

  @ApiProperty()
  metrics: CampaignMetricsSummary;
}

export class CampaignListResponseDto {
  @ApiProperty({ type: [CampaignSummaryDto] })
  campaigns: CampaignSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}
