import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { MentionReportStatus, SharePermission, InfluencerCategory } from '../entities';

export class CreateMentionTrackingReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [String], example: ['INSTAGRAM', 'TIKTOK'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @IsString({ each: true })
  platforms: string[];

  @ApiProperty()
  @IsDateString()
  dateRangeStart: string;

  @ApiProperty()
  @IsDateString()
  dateRangeEnd: string;

  @ApiPropertyOptional({ type: [String], example: ['#brandname', '#sponsored'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['@brandname', '@influencer'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usernames?: string[];

  @ApiPropertyOptional({ type: [String], example: ['brand name', 'product'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  sponsoredOnly?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoRefreshEnabled?: boolean;
}

export class UpdateMentionTrackingReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sponsoredOnly?: boolean;
}

export class ShareMentionTrackingReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sharedWithEmail?: string;

  @ApiPropertyOptional({ enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

export class MentionTrackingReportFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: MentionReportStatus })
  @IsOptional()
  @IsEnum(MentionReportStatus)
  status?: MentionReportStatus;

  @ApiPropertyOptional({ enum: ['ALL', 'ME', 'TEAM', 'SHARED', 'PUBLIC'] })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class MentionTrackingReportListResponseDto {
  reports: MentionTrackingReportSummaryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class MentionTrackingReportSummaryDto {
  id: string;
  title: string;
  platforms: string[];
  status: MentionReportStatus;
  dateRangeStart: string;
  dateRangeEnd: string;
  hashtags: string[];
  usernames: string[];
  keywords: string[];
  totalPosts: number;
  totalInfluencers: number;
  creditsUsed: number;
  createdAt: Date;
}

export class MentionTrackingReportDetailDto {
  id: string;
  title: string;
  platforms: string[];
  status: MentionReportStatus;
  errorMessage?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  hashtags: string[];
  usernames: string[];
  keywords: string[];
  sponsoredOnly: boolean;
  autoRefreshEnabled: boolean;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  totalFollowers: number;
  influencers: MentionTrackingInfluencerDto[];
  posts: MentionTrackingPostDto[];
  categorization: CategoryStatsDto[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: Date;
  completedAt?: Date;
}

export class MentionTrackingInfluencerDto {
  id: string;
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
}

export class MentionTrackingPostDto {
  id: string;
  platform: string;
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
  postDate?: string;
  influencerName?: string;
  influencerUsername?: string;
}

export class CategoryStatsDto {
  category: string;
  label: string;
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
}

export class DashboardStatsDto {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  totalInfluencersAnalyzed: number;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
}

export class ChartDataDto {
  date: string;
  postsCount: number;
  influencersCount: number;
  likesCount: number;
  viewsCount: number;
}

export class PostsFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sponsoredOnly?: boolean;

  @ApiPropertyOptional({ enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class InfluencersFilterDto {
  @ApiPropertyOptional({ enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
