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
import { AudienceOverlapService } from './audience-overlap.service';
import {
  CreateOverlapReportDto,
  UpdateOverlapReportDto,
  ShareOverlapReportDto,
  OverlapReportFilterDto,
  OverlapReportListResponseDto,
  OverlapReportDetailDto,
  DashboardStatsDto,
} from './dto';

@ApiTags('audience-overlap')
@Controller('audience-overlap')
export class AudienceOverlapController {
  constructor(private readonly overlapService: AudienceOverlapService) {}

  // ==================== Public Access (must be first to avoid :id param catch) ====================

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared report by token' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  @ApiResponse({ status: 200, type: OverlapReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found or not public' })
  async getSharedReport(@Param('token') token: string): Promise<OverlapReportDetailDto> {
    return this.overlapService.getReportByShareToken(token);
  }

  // ==================== Report CRUD ====================

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new audience overlap report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOverlapReportDto,
  ) {
    return this.overlapService.createReport(userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get list of audience overlap reports' })
  @ApiQuery({ name: 'platform', required: false, enum: ['INSTAGRAM', 'YOUTUBE', 'ALL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'IN_PROCESS', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: OverlapReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: OverlapReportFilterDto,
  ): Promise<OverlapReportListResponseDto> {
    return this.overlapService.getReports(userId, filters);
  }

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(@CurrentUser('id') userId: string): Promise<DashboardStatsDto> {
    return this.overlapService.getDashboardStats(userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: OverlapReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<OverlapReportDetailDto> {
    return this.overlapService.getReportById(userId, reportId);
  }

  @Get(':id/download')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download report as XLSX' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'XLSX file download' })
  async downloadReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.overlapService.downloadReportAsXlsx(userId, reportId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update report (title, visibility)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: UpdateOverlapReportDto,
  ) {
    return this.overlapService.updateReport(userId, reportId, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.overlapService.deleteReport(userId, reportId);
  }

  // ==================== Report Actions ====================

  @Post(':id/retry')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Retry failed report (costs 1 credit)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report retry initiated' })
  @ApiResponse({ status: 400, description: 'Only failed reports can be retried' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.overlapService.retryReport(userId, reportId);
  }

  @Post(':id/share')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Share report with user or get shareable link' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report shared' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: ShareOverlapReportDto,
  ) {
    return this.overlapService.shareReport(userId, reportId, dto);
  }

  // ==================== Search ====================

  @Get('search/influencers')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Search influencers to add to report' })
  @ApiQuery({ name: 'platform', required: true, enum: ['INSTAGRAM', 'YOUTUBE'] })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false })
  async searchInfluencers(
    @Query('platform') platform: string,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.overlapService.searchInfluencers(platform, query, limit || 10);
  }
}
