import { IsString, IsOptional, IsArray, IsEnum, IsDateString, IsBoolean, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaidCollabReportStatus, InfluencerCategory, QueryLogic, SharePermission } from '../entities';

export class CreatePaidCollabReportDto {
  @ApiProperty({ description: 'Report title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Platform', enum: ['INSTAGRAM', 'TIKTOK'] })
  @IsString()
  platform: string;

  @ApiPropertyOptional({ description: 'Hashtags to search for', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Mentions (usernames) to search for', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiPropertyOptional({ description: 'Query logic when both hashtags and mentions are provided', enum: QueryLogic })
  @IsOptional()
  @IsEnum(QueryLogic)
  queryLogic?: QueryLogic;

  @ApiProperty({ description: 'Start date of the date range (max 3 months ago)' })
  @IsDateString()
  dateRangeStart: string;

  @ApiProperty({ description: 'End date of the date range' })
  @IsDateString()
  dateRangeEnd: string;
}

export class UpdatePaidCollabReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Make report public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class SharePaidCollabReportDto {
  @ApiPropertyOptional({ description: 'User ID to share with' })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ description: 'Email to share with (must be registered user)' })
  @IsOptional()
  @IsString()
  sharedWithEmail?: string;

  @ApiPropertyOptional({ description: 'Permission level', enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

export class PaidCollabReportFilterDto {
  @ApiPropertyOptional({ description: 'Filter by platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: PaidCollabReportStatus })
  @IsOptional()
  @IsEnum(PaidCollabReportStatus)
  status?: PaidCollabReportStatus;

  @ApiPropertyOptional({ description: 'Filter by creator: ME, TEAM, SHARED' })
  @IsOptional()
  @IsString()
  createdBy?: 'ME' | 'TEAM' | 'SHARED' | 'ALL';

  @ApiPropertyOptional({ description: 'Search by title or keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Response DTOs
export class PaidCollabInfluencerDto {
  id: string;
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
}

export class PaidCollabPostDto {
  id: string;
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
  postDate?: string;
  influencerName?: string;
  influencerUsername?: string;
}

export class PaidCollabCategorizationDto {
  category: InfluencerCategory;
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate?: number;
}

export class PaidCollabReportSummaryDto {
  id: string;
  title: string;
  platform: string;
  status: PaidCollabReportStatus;
  hashtags: string[];
  mentions: string[];
  dateRangeStart: string;
  dateRangeEnd: string;
  totalInfluencers: number;
  totalPosts: number;
  creditsUsed: number;
  createdAt: Date;
}

export class PaidCollabReportDetailDto {
  id: string;
  title: string;
  platform: string;
  status: PaidCollabReportStatus;
  errorMessage?: string;
  hashtags: string[];
  mentions: string[];
  queryLogic: QueryLogic;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  influencers: PaidCollabInfluencerDto[];
  posts: PaidCollabPostDto[];
  categorizations: PaidCollabCategorizationDto[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: Date;
  completedAt?: Date;
}

export class PaidCollabReportListResponseDto {
  reports: PaidCollabReportSummaryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class PaidCollabDashboardStatsDto {
  totalReports: number;
  completedReports: number;
  inProgressReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  totalInfluencersAnalyzed: number;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
}

export class PostsChartDataDto {
  date: string;
  postsCount: number;
  influencersCount: number;
  likesCount: number;
  viewsCount: number;
}
