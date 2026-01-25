import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enums
export enum ReportTab {
  INFLUENCER_DISCOVERY = 'INFLUENCER_DISCOVERY',
  PAID_COLLABORATION = 'PAID_COLLABORATION',
}

export enum ReportCreatedBy {
  ALL = 'ALL',
  ME = 'ME',
  TEAM = 'TEAM',
}

// Filter DTO
export class GeneratedReportsFilterDto {
  @ApiPropertyOptional({ enum: ReportTab })
  @IsOptional()
  @IsEnum(ReportTab)
  tab?: ReportTab;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: ReportCreatedBy })
  @IsOptional()
  @IsEnum(ReportCreatedBy)
  createdBy?: ReportCreatedBy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Rename DTO
export class RenameReportDto {
  @ApiProperty()
  @IsString()
  title: string;
}

// Bulk Delete DTO
export class BulkDeleteReportsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  reportIds: string[];

  @ApiProperty({ enum: ReportTab })
  @IsEnum(ReportTab)
  tab: ReportTab;
}

// Response DTOs
export class DiscoveryExportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  exportFormat: string;

  @ApiProperty()
  profileCount: number;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  downloadedAt?: Date;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  createdByName?: string;
}

export class PaidCollaborationReportDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty()
  reportType: string;

  @ApiProperty()
  exportFormat: string;

  @ApiProperty()
  influencerCount: number;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  downloadedAt?: Date;

  @ApiProperty()
  createdById: string;

  @ApiPropertyOptional()
  createdByName?: string;
}

export class GeneratedReportsListResponseDto {
  @ApiProperty({ type: [DiscoveryExportDto] })
  discoveryExports?: DiscoveryExportDto[];

  @ApiProperty({ type: [PaidCollaborationReportDto] })
  paidCollaborationReports?: PaidCollaborationReportDto[];

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
  totalDiscoveryExports: number;

  @ApiProperty()
  totalPaidCollaborationReports: number;

  @ApiProperty()
  totalReports: number;

  @ApiProperty()
  reportsThisMonth: number;

  @ApiProperty()
  byPlatform: Record<string, number>;
}
