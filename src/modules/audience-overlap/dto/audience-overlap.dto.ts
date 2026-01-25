import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, IsEnum, IsBoolean } from 'class-validator';
import { OverlapReportStatus, OverlapSharePermission } from '../entities';

// Create Report DTOs
export class CreateOverlapReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ['INSTAGRAM', 'YOUTUBE'] })
  @IsString()
  platform: string;

  @ApiProperty({ type: [String], description: 'Array of influencer profile IDs' })
  @IsArray()
  @IsUUID('4', { each: true })
  influencerIds: string[];
}

export class AddInfluencerToReportDto {
  @ApiProperty()
  @IsUUID()
  influencerProfileId: string;
}

// Update Report DTOs
export class UpdateOverlapReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// Share Report DTO
export class ShareOverlapReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ enum: OverlapSharePermission })
  @IsOptional()
  @IsEnum(OverlapSharePermission)
  permissionLevel?: OverlapSharePermission;
}

// Filter DTOs
export class OverlapReportFilterDto {
  @ApiPropertyOptional({ enum: ['INSTAGRAM', 'YOUTUBE', 'ALL'] })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: OverlapReportStatus })
  @IsOptional()
  @IsEnum(OverlapReportStatus)
  status?: OverlapReportStatus;

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
export class InfluencerSummaryDto {
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
  uniqueFollowers: number;

  @ApiPropertyOptional()
  uniquePercentage?: number;

  @ApiProperty()
  overlappingFollowers: number;

  @ApiPropertyOptional()
  overlappingPercentage?: number;
}

export class OverlapReportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: OverlapReportStatus })
  status: OverlapReportStatus;

  @ApiPropertyOptional()
  overlapPercentage?: number;

  @ApiProperty()
  influencerCount: number;

  @ApiProperty({ type: [InfluencerSummaryDto] })
  influencers: InfluencerSummaryDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  createdByName?: string;
}

export class OverlapReportDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: OverlapReportStatus })
  status: OverlapReportStatus;

  // Metrics
  @ApiProperty()
  totalFollowers: number;

  @ApiProperty()
  uniqueFollowers: number;

  @ApiProperty()
  overlappingFollowers: number;

  @ApiPropertyOptional()
  overlapPercentage?: number;

  @ApiPropertyOptional()
  uniquePercentage?: number;

  // Influencers
  @ApiProperty({ type: [InfluencerSummaryDto] })
  influencers: InfluencerSummaryDto[];

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

  // Error info
  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiProperty()
  retryCount: number;

  // Owner info
  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  createdById: string;
}

export class OverlapReportListResponseDto {
  @ApiProperty({ type: [OverlapReportSummaryDto] })
  reports: OverlapReportSummaryDto[];

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
  pendingReports: number;

  @ApiProperty()
  inProcessReports: number;

  @ApiProperty()
  failedReports: number;

  @ApiProperty()
  reportsThisMonth: number;

  @ApiProperty()
  remainingQuota: number;
}
