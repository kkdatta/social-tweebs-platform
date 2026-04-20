import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SentimentsService } from './sentiments.service';
import {
  CreateSentimentReportDto,
  UpdateSentimentReportDto,
  ShareSentimentReportDto,
  SentimentReportFilterDto,
  BulkDeleteDto,
  SentimentReportListResponseDto,
  SentimentReportDetailDto,
  DashboardStatsDto,
} from './dto';

@ApiTags('sentiments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sentiments')
export class SentimentsController {
  constructor(private readonly sentimentsService: SentimentsService) {}

  // ==================== Report CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create sentiment report(s) - 1 credit per URL' })
  @ApiResponse({ status: 201, description: 'Report(s) created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or insufficient credits' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSentimentReportDto,
  ) {
    return this.sentimentsService.createReport(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of sentiment reports' })
  @ApiQuery({ name: 'platform', required: false, enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] })
  @ApiQuery({ name: 'reportType', required: false, enum: ['POST', 'PROFILE'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'AGGREGATING', 'IN_PROCESS', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: SentimentReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: SentimentReportFilterDto,
  ): Promise<SentimentReportListResponseDto> {
    return this.sentimentsService.getReports(userId, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(@CurrentUser('id') userId: string): Promise<DashboardStatsDto> {
    return this.sentimentsService.getDashboardStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: SentimentReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<SentimentReportDetailDto> {
    return this.sentimentsService.getReportById(userId, reportId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report (title, visibility)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: UpdateSentimentReportDto,
  ) {
    return this.sentimentsService.updateReport(userId, reportId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.sentimentsService.deleteReport(userId, reportId);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Bulk delete reports' })
  @ApiResponse({ status: 200, description: 'Reports deleted' })
  async bulkDeleteReports(
    @CurrentUser('id') userId: string,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.sentimentsService.bulkDeleteReports(userId, dto.reportIds);
  }

  // ==================== Report Actions ====================

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a failed sentiment report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retry initiated' })
  @ApiResponse({ status: 400, description: 'Report is not in FAILED status' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.sentimentsService.retryReport(userId, reportId);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share report with user or get shareable link' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report shared' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: ShareSentimentReportDto,
  ) {
    return this.sentimentsService.shareReport(userId, reportId, dto);
  }

  @Get(':id/download-pdf')
  @ApiOperation({ summary: 'Download report as PDF' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async downloadPdf(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } = await this.sentimentsService.generatePdf(userId, reportId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(buffer);
  }

  // ==================== Public Access ====================

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared report by token' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  @ApiResponse({ status: 200, type: SentimentReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found or not public' })
  async getSharedReport(@Param('token') token: string): Promise<SentimentReportDetailDto> {
    return this.sentimentsService.getReportByShareToken(token);
  }
}
