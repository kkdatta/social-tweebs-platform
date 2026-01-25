import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { SentimentReportStatus, ReportType, SharePermission } from '../entities';

// Create Report DTO
export class CreateSentimentReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ enum: ['INSTAGRAM', 'TIKTOK'] })
  @IsString()
  platform: string;

  @ApiProperty({ description: 'Target URL(s) for analysis' })
  @IsArray()
  @IsString({ each: true })
  urls: string[];

  @ApiPropertyOptional({ description: 'Enable deep brand analysis' })
  @IsOptional()
  @IsBoolean()
  deepBrandAnalysis?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandUsername?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;
}

// Update Report DTO
export class UpdateSentimentReportDto {
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
export class ShareSentimentReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ enum: SharePermission })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;
}

// Filter DTO
export class SentimentReportFilterDto {
  @ApiPropertyOptional({ enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiPropertyOptional({ enum: SentimentReportStatus })
  @IsOptional()
  @IsEnum(SentimentReportStatus)
  status?: SentimentReportStatus;

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

// Bulk Delete DTO
export class BulkDeleteDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  reportIds: string[];
}

// Response DTOs
export class PostSentimentDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  postUrl?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  commentsCount: number;

  @ApiProperty()
  viewsCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  sentimentScore?: number;

  @ApiPropertyOptional()
  positivePercentage?: number;

  @ApiPropertyOptional()
  neutralPercentage?: number;

  @ApiPropertyOptional()
  negativePercentage?: number;

  @ApiProperty()
  commentsAnalyzed: number;

  @ApiPropertyOptional()
  postDate?: string;
}

export class EmotionDto {
  @ApiProperty()
  emotion: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty()
  count: number;
}

export class WordCloudItemDto {
  @ApiProperty()
  word: string;

  @ApiProperty()
  frequency: number;

  @ApiPropertyOptional()
  sentiment?: string;
}

export class SentimentReportSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiPropertyOptional()
  influencerName?: string;

  @ApiPropertyOptional()
  influencerAvatarUrl?: string;

  @ApiPropertyOptional()
  overallSentimentScore?: number;

  @ApiProperty({ enum: SentimentReportStatus })
  status: SentimentReportStatus;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;
}

export class SentimentReportDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  platform: string;

  @ApiProperty({ enum: ReportType })
  reportType: ReportType;

  @ApiProperty()
  targetUrl: string;

  // Influencer info
  @ApiPropertyOptional()
  influencerName?: string;

  @ApiPropertyOptional()
  influencerUsername?: string;

  @ApiPropertyOptional()
  influencerAvatarUrl?: string;

  // Status
  @ApiProperty({ enum: SentimentReportStatus })
  status: SentimentReportStatus;

  @ApiPropertyOptional()
  errorMessage?: string;

  // Sentiment scores
  @ApiPropertyOptional()
  overallSentimentScore?: number;

  @ApiPropertyOptional()
  positivePercentage?: number;

  @ApiPropertyOptional()
  neutralPercentage?: number;

  @ApiPropertyOptional()
  negativePercentage?: number;

  // Deep brand analysis
  @ApiProperty()
  deepBrandAnalysis: boolean;

  @ApiPropertyOptional()
  brandName?: string;

  @ApiPropertyOptional()
  brandUsername?: string;

  @ApiPropertyOptional()
  productName?: string;

  // Posts
  @ApiProperty({ type: [PostSentimentDto] })
  posts: PostSentimentDto[];

  // Emotions distribution
  @ApiProperty({ type: [EmotionDto] })
  emotions: EmotionDto[];

  // Word cloud
  @ApiProperty({ type: [WordCloudItemDto] })
  wordCloud: WordCloudItemDto[];

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

export class SentimentReportListResponseDto {
  @ApiProperty({ type: [SentimentReportSummaryDto] })
  reports: SentimentReportSummaryDto[];

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
  avgSentimentScore: number;
}
