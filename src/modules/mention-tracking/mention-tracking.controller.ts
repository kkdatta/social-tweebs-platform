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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { MentionTrackingService } from './mention-tracking.service';
import {
  CreateMentionTrackingReportDto,
  UpdateMentionTrackingReportDto,
  ShareMentionTrackingReportDto,
  MentionTrackingReportFilterDto,
  MentionTrackingReportListResponseDto,
  MentionTrackingReportDetailDto,
  DashboardStatsDto,
  ChartDataDto,
  PostsFilterDto,
  InfluencersFilterDto,
} from './dto';

@ApiTags('mention-tracking')
@Controller('mention-tracking')
export class MentionTrackingController {
  constructor(private readonly mentionTrackingService: MentionTrackingService) {}

  // =============== Public Routes ===============

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get shared report by token' })
  @ApiResponse({ status: 200, type: MentionTrackingReportDetailDto })
  async getSharedReport(
    @Param('token') token: string,
  ): Promise<MentionTrackingReportDetailDto> {
    return this.mentionTrackingService.getReportByShareToken(token);
  }

  // =============== Protected Routes ===============

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new mention tracking report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMentionTrackingReportDto,
  ) {
    return this.mentionTrackingService.createReport(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of mention tracking reports' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM', 'SHARED', 'PUBLIC'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: MentionTrackingReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: MentionTrackingReportFilterDto,
  ): Promise<MentionTrackingReportListResponseDto> {
    return this.mentionTrackingService.getReports(userId, filters);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
  ): Promise<DashboardStatsDto> {
    return this.mentionTrackingService.getDashboardStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, type: MentionTrackingReportDetailDto })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MentionTrackingReportDetailDto> {
    return this.mentionTrackingService.getReportById(userId, id);
  }

  @Get(':id/chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chart data for posts/influencers over time' })
  @ApiResponse({ status: 200, type: [ChartDataDto] })
  async getChartData(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChartDataDto[]> {
    return this.mentionTrackingService.getChartData(userId, id);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts with filters' })
  @ApiQuery({ name: 'sponsoredOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false, enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getPosts(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: PostsFilterDto,
  ) {
    return this.mentionTrackingService.getPosts(userId, id, filters);
  }

  @Get(':id/influencers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get influencers with filters' })
  @ApiQuery({ name: 'category', required: false, enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: InfluencersFilterDto,
  ) {
    return this.mentionTrackingService.getInfluencers(userId, id, filters);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMentionTrackingReportDto,
  ) {
    return this.mentionTrackingService.updateReport(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete report' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentionTrackingService.deleteReport(userId, id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete reports' })
  async bulkDeleteReports(
    @CurrentUser('id') userId: string,
    @Body() body: { reportIds: string[] },
  ) {
    return this.mentionTrackingService.bulkDeleteReports(userId, body.reportIds);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed report' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.mentionTrackingService.retryReport(userId, id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share report' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareMentionTrackingReportDto,
  ) {
    return this.mentionTrackingService.shareReport(userId, id, dto);
  }
}
