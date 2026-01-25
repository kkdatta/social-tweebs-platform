import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformType } from '../../../common/enums';
import { AudienceDataType } from '../entities/audience-data.entity';

// ============ UNBLUR DTOs ============
export class UnblurInfluencersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  profileIds: string[];

  @ApiProperty({ enum: PlatformType })
  @IsEnum(PlatformType)
  platform: PlatformType;
}

export class UnblurResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  unlockedCount: number;

  @ApiProperty()
  alreadyUnlockedCount: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiProperty({ type: [String] })
  unlockedProfileIds: string[];
}

// ============ INSIGHTS DTOs ============
export class AudienceDataDto {
  @ApiProperty({ enum: AudienceDataType })
  dataType: AudienceDataType;

  @ApiProperty()
  categoryKey: string;

  @ApiProperty()
  percentage: number;

  @ApiPropertyOptional()
  affinityScore?: number;
}

export class InfluencerInsightsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platformUserId: string;

  @ApiProperty({ enum: PlatformType })
  platform: PlatformType;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional()
  biography?: string;

  @ApiProperty()
  followerCount: number;

  @ApiProperty()
  followingCount: number;

  @ApiProperty()
  postCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiProperty()
  avgLikes: number;

  @ApiProperty()
  avgComments: number;

  @ApiProperty()
  avgViews: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty()
  isBusinessAccount: boolean;

  @ApiPropertyOptional()
  accountType?: string;

  @ApiPropertyOptional()
  locationCountry?: string;

  @ApiPropertyOptional()
  locationCity?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  audienceCredibility?: number;

  @ApiPropertyOptional()
  contactEmail?: string;

  @ApiPropertyOptional()
  websiteUrl?: string;

  @ApiProperty({ type: [AudienceDataDto] })
  audienceData: AudienceDataDto[];

  @ApiProperty()
  lastUpdatedAt: Date;

  @ApiProperty()
  modashFetchedAt: Date;
}

export class ViewInsightsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  isFirstAccess: boolean;

  @ApiProperty()
  creditsCharged: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiProperty({ type: InfluencerInsightsDto })
  insights: InfluencerInsightsDto;
}

export class RefreshInsightsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  creditsCharged: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiProperty({ type: InfluencerInsightsDto })
  insights: InfluencerInsightsDto;
}

// ============ PROFILE DTOs ============
export class InfluencerProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platformUserId: string;

  @ApiProperty({ enum: PlatformType })
  platform: PlatformType;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional()
  biography?: string;

  @ApiProperty()
  followerCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  avgLikes?: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  locationCountry?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiProperty()
  lastUpdatedAt: Date;
}

// ============ EXPORT DTOs ============
export class ExportInfluencersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  profileIds: string[];

  @ApiProperty({ enum: ['csv', 'xlsx', 'json'] })
  @IsString()
  format: 'csv' | 'xlsx' | 'json';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}

export class ExportResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  exportedCount: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  data?: any[];
}
