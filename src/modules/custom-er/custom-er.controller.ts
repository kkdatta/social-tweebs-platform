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
} from '@nestjs/common';
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
import { CustomErService } from './custom-er.service';
import {
  CreateCustomErReportDto,
  UpdateCustomErReportDto,
  ShareCustomErReportDto,
  CustomErReportFilterDto,
  CustomErReportListResponseDto,
  CustomErReportDetailDto,
  DashboardStatsDto,
  PostSummaryDto,
} from './dto';

@ApiTags('custom-er')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('custom-er')
export class CustomErController {
  constructor(private readonly customErService: CustomErService) {}

  // ==================== Report CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new custom ER report (FREE - no credits)' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomErReportDto,
  ) {
    return this.customErService.createReport(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of custom ER reports' })
  @ApiQuery({ name: 'platform', required: false, enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: CustomErReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: CustomErReportFilterDto,
  ): Promise<CustomErReportListResponseDto> {
    return this.customErService.getReports(userId, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(@CurrentUser('id') userId: string): Promise<DashboardStatsDto> {
    return this.customErService.getDashboardStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, type: CustomErReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<CustomErReportDetailDto> {
    return this.customErService.getReportById(userId, reportId);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts for a report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiQuery({ name: 'sponsoredOnly', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [PostSummaryDto] })
  async getReportPosts(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Query('sponsoredOnly') sponsoredOnly?: string,
  ): Promise<PostSummaryDto[]> {
    return this.customErService.getReportPosts(userId, reportId, sponsoredOnly === 'true');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report (visibility)' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report updated' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: UpdateCustomErReportDto,
  ) {
    return this.customErService.updateReport(userId, reportId, dto);
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
    return this.customErService.deleteReport(userId, reportId);
  }

  // ==================== Report Actions ====================

  @Post(':id/share')
  @ApiOperation({ summary: 'Share report with user or get shareable link' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiResponse({ status: 200, description: 'Report shared' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: ShareCustomErReportDto,
  ) {
    return this.customErService.shareReport(userId, reportId, dto);
  }

  // ==================== Public Access ====================

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared report by token' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  @ApiResponse({ status: 200, type: CustomErReportDetailDto })
  @ApiResponse({ status: 404, description: 'Report not found or not public' })
  async getSharedReport(@Param('token') token: string): Promise<CustomErReportDetailDto> {
    return this.customErService.getReportByShareToken(token);
  }
}
