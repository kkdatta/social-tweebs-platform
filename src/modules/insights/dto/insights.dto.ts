import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformType } from '../../../common/enums';

// ============ SEARCH INSIGHT DTO ============
export class SearchInsightDto {
  @ApiProperty({ enum: PlatformType, description: 'Platform to search on' })
  @IsEnum(PlatformType)
  platform: PlatformType;

  @ApiProperty({ description: 'Influencer username or handle' })
  @IsString()
  @IsNotEmpty()
  username: string;
}

// ============ LIST INSIGHTS QUERY DTO ============
export class ListInsightsQueryDto {
  @ApiPropertyOptional({ enum: PlatformType })
  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @ApiPropertyOptional({ description: 'Search by username or full name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;
}

// ============ INSIGHT RESPONSE DTOs ============
export class InsightListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

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

  @ApiProperty()
  unlockedAt: Date;

  @ApiProperty()
  lastRefreshedAt: Date;
}

export class InsightListResponseDto {
  @ApiProperty({ type: [InsightListItemDto] })
  data: InsightListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

// ============ FULL INSIGHT RESPONSE ============
export class InsightStatsDto {
  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  postCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  avgLikes?: number;

  @ApiPropertyOptional()
  avgComments?: number;

  @ApiPropertyOptional()
  avgViews?: number;

  @ApiPropertyOptional()
  avgReelViews?: number;

  @ApiPropertyOptional()
  avgReelLikes?: number;

  @ApiPropertyOptional()
  avgReelComments?: number;

  @ApiPropertyOptional()
  brandPostER?: number;

  @ApiPropertyOptional()
  postsWithHiddenLikesPct?: number;
}

export class AudienceDemographicsDto {
  @ApiPropertyOptional()
  credibility?: number;

  @ApiPropertyOptional()
  notableFollowersPct?: number;

  @ApiPropertyOptional()
  genderSplit?: { male: number; female: number };

  @ApiPropertyOptional()
  ageGroups?: Array<{
    range: string;
    percentage: number;
    male: number;
    female: number;
  }>;

  @ApiPropertyOptional()
  topCountries?: Array<{
    country: string;
    percentage: number;
    followers: number;
  }>;

  @ApiPropertyOptional()
  topStates?: Array<{
    state: string;
    percentage: number;
    followers: number;
  }>;

  @ApiPropertyOptional()
  topCities?: Array<{
    city: string;
    percentage: number;
    followers: number;
  }>;

  @ApiPropertyOptional()
  languages?: Array<{ language: string; percentage: number }>;

  @ApiPropertyOptional()
  interests?: Array<{ category: string; percentage: number }>;

  @ApiPropertyOptional()
  brandAffinity?: Array<{ brand: string; percentage: number }>;

  @ApiPropertyOptional()
  reachability?: {
    below500: number;
    '500to1000': number;
    '1000to1500': number;
    above1500: number;
  };
}

export class EngagementDataDto {
  @ApiPropertyOptional()
  rateDistribution?: Array<{ range: string; count: number }>;

  @ApiPropertyOptional()
  likesSpread?: Array<{ date: string; likes: number }>;

  @ApiPropertyOptional()
  commentsSpread?: Array<{ date: string; comments: number }>;

  @ApiPropertyOptional()
  topHashtags?: Array<{
    tag: string;
    usagePercentage: number;
    count: number;
  }>;
}

export class GrowthDataDto {
  @ApiPropertyOptional()
  last6Months?: Array<{
    month: string;
    followers: number;
    following: number;
  }>;
}

export class LookalikesDataDto {
  @ApiPropertyOptional()
  influencer?: Array<{
    username: string;
    followers: number;
    similarity: number;
  }>;

  @ApiPropertyOptional()
  audience?: Array<{
    username: string;
    followers: number;
    overlap: number;
  }>;
}

export class PostDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  caption?: string;

  @ApiPropertyOptional()
  likes?: number;

  @ApiPropertyOptional()
  comments?: number;

  @ApiPropertyOptional()
  views?: number;

  @ApiPropertyOptional()
  postedAt?: string;

  @ApiPropertyOptional()
  url?: string;
}

export class FullInsightResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional()
  bio?: string;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  locationCountry?: string;

  @ApiProperty()
  stats: InsightStatsDto;

  @ApiProperty()
  audience: AudienceDemographicsDto;

  @ApiProperty()
  engagement: EngagementDataDto;

  @ApiProperty()
  growth: GrowthDataDto;

  @ApiProperty()
  lookalikes: LookalikesDataDto;

  @ApiPropertyOptional()
  brandAffinity?: any[];

  @ApiPropertyOptional()
  interests?: any[];

  @ApiPropertyOptional()
  wordCloud?: any[];

  @ApiPropertyOptional()
  posts?: {
    recent: PostDto[];
    popular: PostDto[];
    sponsored: PostDto[];
  };

  @ApiPropertyOptional()
  reels?: {
    recent: PostDto[];
    popular: PostDto[];
    sponsored: PostDto[];
  };

  @ApiProperty()
  lastRefreshedAt: Date;

  @ApiProperty({ enum: ['FRESH', 'STALE'] })
  dataFreshnessStatus: 'FRESH' | 'STALE';
}

// ============ SEARCH/UNLOCK RESPONSE ============
export class SearchInsightResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  isNew: boolean;

  @ApiProperty()
  creditsUsed: number;

  @ApiPropertyOptional()
  remainingBalance?: number;

  @ApiProperty({ type: FullInsightResponseDto })
  insight: FullInsightResponseDto;
}

// ============ REFRESH RESPONSE ============
export class RefreshInsightResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiProperty({ type: FullInsightResponseDto })
  insight: FullInsightResponseDto;
}

// ============ EXPORT DTO ============
export class ExportInsightDto {
  @ApiProperty()
  @IsUUID()
  insightId: string;

  @ApiProperty({ enum: ['pdf', 'excel'] })
  @IsString()
  format: 'pdf' | 'excel';
}

export class ExportInsightResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty()
  creditsUsed: number;
}
