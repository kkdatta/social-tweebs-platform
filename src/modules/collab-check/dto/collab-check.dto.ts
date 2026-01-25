import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CollabReportStatus, TimePeriod, SharePermission } from '../entities';

// =============== Request DTOs ===============

export class CreateCollabCheckReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Platform', enum: ['INSTAGRAM', 'TIKTOK'] })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Time period for analysis', enum: TimePeriod })
  @IsEnum(TimePeriod)
  timePeriod: TimePeriod;

  @ApiProperty({ description: 'Search queries (hashtags, mentions, keywords)', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one query is required' })
  @IsString({ each: true })
  queries: string[];

  @ApiProperty({ description: 'Influencer profile IDs or usernames', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one influencer is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 influencers allowed' })
  @IsString({ each: true })
  influencers: string[];

  @ApiPropertyOptional({ description: 'Enable multiple influencer analysis' })
  @IsOptional()
  @IsBoolean()
  multipleInfluencers?: boolean;
}

export class UpdateCollabCheckReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Make report public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class ShareCollabCheckReportDto {
  @ApiPropertyOptional({ description: 'User ID to share with' })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ description: 'Permission level', enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

export class CollabCheckReportFilterDto {
  @ApiPropertyOptional({ description: 'Filter by platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CollabReportStatus })
  @IsOptional()
  @IsEnum(CollabReportStatus)
  status?: CollabReportStatus;

  @ApiPropertyOptional({ description: 'Filter by creator', enum: ['ALL', 'ME', 'TEAM'] })
  @IsOptional()
  @IsString()
  createdBy?: 'ALL' | 'ME' | 'TEAM';

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// =============== Response DTOs ===============

export class CollabCheckInfluencerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  influencerName: string;

  @ApiPropertyOptional()
  influencerUsername?: string;

  @ApiProperty()
  platform: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  postsCount: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  sharesCount: number;

  @ApiPropertyOptional()
  avgEngagementRate?: number;
}

export class CollabCheckPostDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  postUrl?: string;

  @ApiPropertyOptional()
  postType?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  matchedKeywords?: string[];

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  sharesCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  postDate?: string;

  @ApiPropertyOptional()
  influencerName?: string;

  @ApiPropertyOptional()
  influencerUsername?: string;
}

export class CollabCheckReportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: CollabReportStatus })
  status: CollabReportStatus;

  @ApiProperty({ enum: TimePeriod })
  timePeriod: TimePeriod;

  @ApiProperty({ type: [String] })
  queries: string[];

  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  totalFollowers: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ type: [CollabCheckInfluencerDto] })
  influencers?: CollabCheckInfluencerDto[];
}

export class CollabCheckReportDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: CollabReportStatus })
  status: CollabReportStatus;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty({ enum: TimePeriod })
  timePeriod: TimePeriod;

  @ApiProperty({ type: [String] })
  queries: string[];

  // Metrics
  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  totalLikes: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalShares: number;

  @ApiPropertyOptional()
  avgEngagementRate?: number;

  @ApiProperty()
  totalFollowers: number;

  // Influencers
  @ApiProperty({ type: [CollabCheckInfluencerDto] })
  influencers: CollabCheckInfluencerDto[];

  // Posts
  @ApiProperty({ type: [CollabCheckPostDto] })
  posts: CollabCheckPostDto[];

  // Sharing
  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  shareUrl?: string;

  // Timestamps
  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class CollabCheckReportListResponseDto {
  @ApiProperty({ type: [CollabCheckReportSummaryDto] })
  reports: CollabCheckReportSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}

export class DashboardStatsDto {
  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  completedReports: number;

  @ApiProperty()
  processingReports: number;

  @ApiProperty()
  pendingReports: number;

  @ApiProperty()
  failedReports: number;

  @ApiProperty()
  reportsThisMonth: number;

  @ApiProperty()
  totalPostsAnalyzed: number;

  @ApiProperty()
  avgEngagementRate: number;
}

// Chart data for posts over time
export class PostsChartDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  postsCount: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  viewsCount: number;
}
