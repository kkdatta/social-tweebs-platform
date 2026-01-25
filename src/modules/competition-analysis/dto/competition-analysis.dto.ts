import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  CompetitionReportStatus,
  SharePermission,
  InfluencerCategory,
} from '../entities';

// =============== Brand DTOs ===============

export class BrandInputDto {
  @ApiProperty({ description: 'Brand name', example: 'Nike' })
  @IsString()
  brandName: string;

  @ApiPropertyOptional({ description: 'Hashtags to track', example: ['#nike', '#justdoit'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ description: 'Username/mention to track', example: '@nike' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Keywords to track', example: ['nike shoes', 'air jordan'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}

// =============== Create/Update DTOs ===============

export class CreateCompetitionReportDto {
  @ApiPropertyOptional({ description: 'Report title', example: 'Nike vs Adidas Q1 2024' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Platforms to analyze', example: ['INSTAGRAM', 'TIKTOK'] })
  @IsArray()
  @IsString({ each: true })
  platforms: string[];

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsDateString()
  dateRangeStart: string;

  @ApiProperty({ description: 'End date', example: '2024-03-31' })
  @IsDateString()
  dateRangeEnd: string;

  @ApiProperty({
    description: 'Brands to compare (2-5)',
    type: [BrandInputDto],
    example: [
      { brandName: 'Nike', hashtags: ['#nike'], username: '@nike' },
      { brandName: 'Adidas', hashtags: ['#adidas'], username: '@adidas' }
    ]
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => BrandInputDto)
  brands: BrandInputDto[];

  @ApiPropertyOptional({ description: 'Enable auto-refresh', default: false })
  @IsOptional()
  @IsBoolean()
  autoRefreshEnabled?: boolean;
}

export class UpdateCompetitionReportDto {
  @ApiPropertyOptional({ description: 'Report title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Make report public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class ShareCompetitionReportDto {
  @ApiPropertyOptional({ description: 'User ID to share with' })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ description: 'Permission level', enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

// =============== Filter DTOs ===============

export class CompetitionReportFilterDto {
  @ApiPropertyOptional({ description: 'Filter by platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: CompetitionReportStatus })
  @IsOptional()
  @IsEnum(CompetitionReportStatus)
  status?: CompetitionReportStatus;

  @ApiPropertyOptional({ description: 'Filter by creator', enum: ['ALL', 'ME', 'TEAM', 'SHARED'] })
  @IsOptional()
  @IsString()
  createdBy?: 'ALL' | 'ME' | 'TEAM' | 'SHARED';

  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class PostsFilterDto {
  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class InfluencersFilterDto {
  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by category', enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Sort by field' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// =============== Response DTOs ===============

export class BrandSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  brandName: string;

  @ApiPropertyOptional()
  hashtags?: string[];

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  keywords?: string[];

  @ApiPropertyOptional()
  displayColor?: string;

  @ApiProperty()
  influencerCount: number;

  @ApiProperty()
  postsCount: number;

  @ApiProperty()
  totalLikes: number;

  @ApiProperty()
  totalViews: number;

  @ApiProperty()
  totalComments: number;

  @ApiProperty()
  totalShares: number;

  @ApiProperty()
  totalFollowers: number;

  @ApiPropertyOptional()
  avgEngagementRate?: number;

  @ApiProperty()
  photoCount: number;

  @ApiProperty()
  videoCount: number;

  @ApiProperty()
  carouselCount: number;

  @ApiProperty()
  reelCount: number;

  @ApiProperty()
  nanoCount: number;

  @ApiProperty()
  microCount: number;

  @ApiProperty()
  macroCount: number;

  @ApiProperty()
  megaCount: number;
}

export class CompetitionInfluencerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  brandId: string;

  @ApiProperty()
  brandName: string;

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

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  audienceCredibility?: number;

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

export class CompetitionPostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  brandId: string;

  @ApiProperty()
  brandName: string;

  @ApiProperty()
  platform: string;

  @ApiPropertyOptional()
  postUrl?: string;

  @ApiPropertyOptional()
  postType?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  matchedHashtags?: string[];

  @ApiPropertyOptional()
  matchedUsername?: string;

  @ApiPropertyOptional()
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

  @ApiProperty()
  isSponsored: boolean;

  @ApiPropertyOptional()
  postDate?: string;

  @ApiPropertyOptional()
  influencerName?: string;

  @ApiPropertyOptional()
  influencerUsername?: string;
}

export class CategoryStatsDto {
  @ApiProperty()
  category: string;

  @ApiProperty()
  label: string;

  @ApiProperty()
  accountsCount: number;

  @ApiProperty()
  followersCount: number;

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

  @ApiProperty()
  engagementRate: number;
}

export class PostTypeStatsDto {
  @ApiProperty()
  brandId: string;

  @ApiProperty()
  brandName: string;

  @ApiProperty()
  photoCount: number;

  @ApiProperty()
  videoCount: number;

  @ApiProperty()
  carouselCount: number;

  @ApiProperty()
  reelCount: number;

  @ApiProperty()
  photoPercentage: number;

  @ApiProperty()
  videoPercentage: number;

  @ApiProperty()
  carouselPercentage: number;

  @ApiProperty()
  reelPercentage: number;
}

export class ChartDataDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ description: 'Posts count per brand', type: 'object' })
  brandPosts: Record<string, number>;

  @ApiProperty()
  totalPosts: number;
}

export class DashboardStatsDto {
  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  completedReports: number;

  @ApiProperty()
  inProgressReports: number;

  @ApiProperty()
  pendingReports: number;

  @ApiProperty()
  failedReports: number;

  @ApiProperty()
  reportsThisMonth: number;

  @ApiProperty()
  totalBrandsAnalyzed: number;

  @ApiProperty()
  totalInfluencersAnalyzed: number;

  @ApiProperty()
  totalPostsAnalyzed: number;

  @ApiProperty()
  avgEngagementRate: number;
}

export class CompetitionReportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platforms: string[];

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  dateRangeStart?: string;

  @ApiPropertyOptional()
  dateRangeEnd?: string;

  @ApiProperty()
  totalBrands: number;

  @ApiProperty()
  totalPosts: number;

  @ApiProperty()
  totalInfluencers: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;
}

export class CompetitionReportDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platforms: string[];

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  dateRangeStart?: string;

  @ApiPropertyOptional()
  dateRangeEnd?: string;

  @ApiProperty()
  autoRefreshEnabled: boolean;

  @ApiProperty()
  totalBrands: number;

  @ApiProperty()
  totalInfluencers: number;

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

  @ApiProperty({ type: [BrandSummaryDto] })
  brands: BrandSummaryDto[];

  @ApiProperty({ type: [CompetitionInfluencerDto] })
  influencers: CompetitionInfluencerDto[];

  @ApiProperty({ type: [CompetitionPostDto] })
  posts: CompetitionPostDto[];

  @ApiProperty({ type: [CategoryStatsDto] })
  categorization: CategoryStatsDto[];

  @ApiProperty({ type: [PostTypeStatsDto] })
  postTypeBreakdown: PostTypeStatsDto[];

  @ApiProperty()
  isPublic: boolean;

  @ApiPropertyOptional()
  shareUrl?: string;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;
}

export class CompetitionReportListResponseDto {
  @ApiProperty({ type: [CompetitionReportSummaryDto] })
  reports: CompetitionReportSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}
