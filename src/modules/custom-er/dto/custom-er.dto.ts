import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { CustomErReportStatus, SharePermission } from '../entities';

// Create Report DTOs
export class CreateCustomErReportDto {
  @ApiProperty({ description: 'Influencer profile ID from cached profiles' })
  @IsUUID()
  influencerProfileId: string;

  @ApiProperty({ enum: ['INSTAGRAM', 'TIKTOK'] })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Start date for analysis (YYYY-MM-DD)' })
  @IsDateString()
  dateRangeStart: string;

  @ApiProperty({ description: 'End date for analysis (YYYY-MM-DD)' })
  @IsDateString()
  dateRangeEnd: string;
}

// Update Report DTOs
export class UpdateCustomErReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// Share Report DTO
export class ShareCustomErReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

// Filter DTOs
export class CustomErReportFilterDto {
  @ApiPropertyOptional({ enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: CustomErReportStatus })
  @IsOptional()
  @IsEnum(CustomErReportStatus)
  status?: CustomErReportStatus;

  @ApiPropertyOptional({ enum: ['ALL', 'ME', 'TEAM'] })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  limit?: number;
}

// Response DTOs
export class PostSummaryDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  postId?: string;

  @ApiPropertyOptional()
  postUrl?: string;

  @ApiPropertyOptional()
  postType?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String] })
  mentions?: string[];

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  viewsCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  sharesCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiProperty()
  isSponsored: boolean;

  @ApiProperty()
  postDate: string;
}

export class EngagementMetricsDto {
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

  @ApiPropertyOptional()
  engagementViewsRate?: number;
}

export class CustomErReportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  influencerName: string;

  @ApiPropertyOptional()
  influencerUsername?: string;

  @ApiPropertyOptional()
  influencerAvatarUrl?: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  dateRangeStart: string;

  @ApiProperty()
  dateRangeEnd: string;

  @ApiProperty()
  postsCount: number;

  @ApiProperty({ enum: CustomErReportStatus })
  status: CustomErReportStatus;

  @ApiProperty()
  createdAt: Date;
}

export class CustomErReportDetailDto {
  @ApiProperty()
  id: string;

  // Influencer info
  @ApiProperty()
  influencerName: string;

  @ApiPropertyOptional()
  influencerUsername?: string;

  @ApiPropertyOptional()
  influencerAvatarUrl?: string;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  platform: string;

  // Report parameters
  @ApiProperty()
  dateRangeStart: string;

  @ApiProperty()
  dateRangeEnd: string;

  // Status
  @ApiProperty({ enum: CustomErReportStatus })
  status: CustomErReportStatus;

  @ApiPropertyOptional()
  errorMessage?: string;

  // All Posts Metrics
  @ApiProperty({ type: EngagementMetricsDto })
  allPostsMetrics: EngagementMetricsDto;

  // Sponsored Posts Metrics
  @ApiPropertyOptional({ type: EngagementMetricsDto })
  sponsoredPostsMetrics?: EngagementMetricsDto;

  @ApiProperty()
  hasSponsoredPosts: boolean;

  // Posts
  @ApiProperty({ type: [PostSummaryDto] })
  posts: PostSummaryDto[];

  // Chart data (posts per day)
  @ApiProperty()
  postsChartData: { date: string; regularPosts: number; sponsoredPosts: number }[];

  // Sharing
  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  shareUrl?: string;

  // Timestamps
  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class CustomErReportListResponseDto {
  @ApiProperty({ type: [CustomErReportSummaryDto] })
  reports: CustomErReportSummaryDto[];

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
}
