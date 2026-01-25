import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TieBreakerStatus, TieBreakerPlatform, TieBreakerSharePermission } from '../entities';

// ==================== Create Comparison ====================

export class CreateTieBreakerComparisonDto {
  @ApiPropertyOptional({ description: 'Comparison title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: TieBreakerPlatform, description: 'Platform for comparison' })
  @IsEnum(TieBreakerPlatform)
  platform: TieBreakerPlatform;

  @ApiProperty({ description: 'Array of influencer profile IDs (2-3 influencers)', type: [String] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(3)
  @IsUUID('4', { each: true })
  influencerIds: string[];

  @ApiPropertyOptional({ description: 'Search query used to find influencers' })
  @IsOptional()
  @IsString()
  searchQuery?: string;
}

// ==================== Update Comparison ====================

export class UpdateTieBreakerComparisonDto {
  @ApiPropertyOptional({ description: 'New title for the comparison' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Whether the comparison is publicly accessible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// ==================== Share Comparison ====================

export class ShareTieBreakerComparisonDto {
  @ApiPropertyOptional({ description: 'User ID to share with' })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ enum: TieBreakerSharePermission, description: 'Permission level' })
  @IsOptional()
  @IsEnum(TieBreakerSharePermission)
  permissionLevel?: TieBreakerSharePermission;

  @ApiPropertyOptional({ description: 'Make publicly shareable via link' })
  @IsOptional()
  @IsBoolean()
  makePublic?: boolean;
}

// ==================== Filter DTOs ====================

export class TieBreakerFilterDto {
  @ApiPropertyOptional({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'ALL'], description: 'Filter by platform' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: TieBreakerStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TieBreakerStatus)
  status?: TieBreakerStatus;

  @ApiPropertyOptional({ enum: ['ALL', 'ME', 'TEAM'], description: 'Filter by creator' })
  @IsOptional()
  @IsString()
  createdBy?: 'ALL' | 'ME' | 'TEAM';

  @ApiPropertyOptional({ description: 'Search by title' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class SearchInfluencerDto {
  @ApiProperty({ enum: TieBreakerPlatform, description: 'Platform to search' })
  @IsEnum(TieBreakerPlatform)
  platform: TieBreakerPlatform;

  @ApiProperty({ description: 'Search query (username, name, or keyword)' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Maximum results to return' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

// ==================== Response DTOs ====================

export class InfluencerAudienceDataDto {
  @ApiPropertyOptional()
  quality?: number;

  @ApiPropertyOptional()
  notablePct?: number;

  @ApiPropertyOptional()
  genderData?: { male: number; female: number };

  @ApiPropertyOptional()
  ageData?: Array<{ ageRange: string; male: number; female: number }>;

  @ApiPropertyOptional()
  countries?: Array<{ country: string; percentage: number }>;

  @ApiPropertyOptional()
  cities?: Array<{ city: string; percentage: number }>;

  @ApiPropertyOptional()
  interests?: Array<{ interest: string; percentage: number }>;
}

export class TopPostDto {
  @ApiProperty()
  postId: string;

  @ApiPropertyOptional()
  postUrl?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  caption?: string;

  @ApiProperty()
  likes: number;

  @ApiProperty()
  comments: number;

  @ApiProperty()
  views: number;

  @ApiProperty()
  engagementRate: number;

  @ApiProperty()
  isSponsored: boolean;

  @ApiPropertyOptional()
  postDate?: string;
}

export class TieBreakerInfluencerDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  influencerProfileId?: string;

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
  followingCount?: number;

  @ApiProperty()
  avgLikes: number;

  @ApiProperty()
  avgViews: number;

  @ApiProperty()
  avgComments: number;

  @ApiPropertyOptional()
  avgReelViews?: number;

  @ApiProperty()
  engagementRate: number;

  @ApiProperty()
  isVerified: boolean;

  // Followers' Audience
  @ApiPropertyOptional()
  followersAudience?: InfluencerAudienceDataDto;

  // Engagers' Audience
  @ApiPropertyOptional()
  engagersAudience?: InfluencerAudienceDataDto;

  // Top Posts
  @ApiPropertyOptional({ type: [TopPostDto] })
  topPosts?: TopPostDto[];

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  wasUnlocked: boolean;
}

export class TieBreakerComparisonSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  status: TieBreakerStatus;

  @ApiProperty()
  influencerCount: number;

  @ApiProperty({ type: [TieBreakerInfluencerDto] })
  influencers: Partial<TieBreakerInfluencerDto>[];

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  createdById?: string;

  @ApiPropertyOptional()
  creditsUsed?: number;
}

export class TieBreakerComparisonDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  status: TieBreakerStatus;

  @ApiPropertyOptional()
  searchQuery?: string;

  @ApiProperty({ type: [TieBreakerInfluencerDto] })
  influencers: TieBreakerInfluencerDto[];

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

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdById: string;
}

export class TieBreakerListResponseDto {
  @ApiProperty({ type: [TieBreakerComparisonSummaryDto] })
  comparisons: TieBreakerComparisonSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}

export class TieBreakerDashboardStatsDto {
  @ApiProperty()
  totalComparisons: number;

  @ApiProperty()
  completedComparisons: number;

  @ApiProperty()
  pendingComparisons: number;

  @ApiProperty()
  processingComparisons: number;

  @ApiProperty()
  failedComparisons: number;

  @ApiProperty()
  comparisonsThisMonth: number;

  @ApiProperty()
  totalInfluencersCompared: number;

  @ApiProperty()
  totalCreditsUsed: number;
}

export class SearchInfluencerResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  platformUserId: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiProperty()
  followerCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ description: 'Whether this influencer is already unlocked by the user' })
  isUnlocked: boolean;

  @ApiPropertyOptional()
  locationCountry?: string;
}
