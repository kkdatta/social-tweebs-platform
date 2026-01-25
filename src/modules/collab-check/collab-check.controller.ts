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
import { CollabCheckService } from './collab-check.service';
import {
  CreateCollabCheckReportDto,
  UpdateCollabCheckReportDto,
  ShareCollabCheckReportDto,
  CollabCheckReportFilterDto,
  CollabCheckReportListResponseDto,
  CollabCheckReportDetailDto,
  DashboardStatsDto,
  PostsChartDataDto,
} from './dto';

@ApiTags('collab-check')
@Controller('collab-check')
export class CollabCheckController {
  constructor(private readonly collabCheckService: CollabCheckService) {}

  // =============== Public Routes ===============

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get shared report by token' })
  @ApiResponse({ status: 200, type: CollabCheckReportDetailDto })
  async getSharedReport(
    @Param('token') token: string,
  ): Promise<CollabCheckReportDetailDto> {
    return this.collabCheckService.getReportByShareToken(token);
  }

  // =============== Protected Routes ===============

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new collab check report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCollabCheckReportDto,
  ) {
    return this.collabCheckService.createReport(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of collab check reports' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: CollabCheckReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: CollabCheckReportFilterDto,
  ): Promise<CollabCheckReportListResponseDto> {
    return this.collabCheckService.getReports(userId, filters);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
  ): Promise<DashboardStatsDto> {
    return this.collabCheckService.getDashboardStats(userId);
  }

  @Get('search/influencers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search influencers for report creation' })
  @ApiQuery({ name: 'platform', required: true })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async searchInfluencers(
    @Query('platform') platform: string,
    @Query('q') query: string,
    @Query('limit') limit: string,
  ) {
    return this.collabCheckService.searchInfluencers(
      platform,
      query || '',
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, type: CollabCheckReportDetailDto })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CollabCheckReportDetailDto> {
    return this.collabCheckService.getReportById(userId, id);
  }

  @Get(':id/chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chart data for posts over time' })
  @ApiResponse({ status: 200, type: [PostsChartDataDto] })
  async getChartData(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostsChartDataDto[]> {
    return this.collabCheckService.getChartData(userId, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCollabCheckReportDto,
  ) {
    return this.collabCheckService.updateReport(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete report' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collabCheckService.deleteReport(userId, id);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed report' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.collabCheckService.retryReport(userId, id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share report' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareCollabCheckReportDto,
  ) {
    return this.collabCheckService.shareReport(userId, id, dto);
  }
}
