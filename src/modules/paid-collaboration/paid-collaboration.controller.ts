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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { PaidCollaborationService } from './paid-collaboration.service';
import {
  CreatePaidCollabReportDto,
  UpdatePaidCollabReportDto,
  SharePaidCollabReportDto,
  PaidCollabReportFilterDto,
  PaidCollabReportListResponseDto,
  PaidCollabReportDetailDto,
  PaidCollabDashboardStatsDto,
  PostsChartDataDto,
  PaidCollabPostDto,
  PaidCollabInfluencerDto,
} from './dto';
import { InfluencerCategory, PaidCollabReportStatus } from './entities';

@ApiTags('paid-collaboration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('paid-collaboration')
export class PaidCollaborationController {
  constructor(private readonly service: PaidCollaborationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new paid collaboration report' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaidCollabReportDto,
  ) {
    return this.service.createReport(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of paid collaboration reports' })
  @ApiQuery({ name: 'platform', required: false, description: 'Filter by platform' })
  @ApiQuery({ name: 'status', required: false, enum: PaidCollabReportStatus })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ME', 'TEAM', 'SHARED', 'ALL'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: PaidCollabReportFilterDto,
  ): Promise<PaidCollabReportListResponseDto> {
    return this.service.getReports(userId, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
  ): Promise<PaidCollabDashboardStatsDto> {
    return this.service.getDashboardStats(userId);
  }

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get public shared report' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  async getSharedReport(
    @Param('token') token: string,
  ): Promise<PaidCollabReportDetailDto> {
    return this.service.getReportByShareToken(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<PaidCollabReportDetailDto> {
    return this.service.getReportById(userId, reportId);
  }

  @Get(':id/chart-data')
  @ApiOperation({ summary: 'Get chart data for posts over time' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async getChartData(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ): Promise<PostsChartDataDto[]> {
    return this.service.getChartData(userId, reportId);
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts with filtering' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiQuery({ name: 'sponsoredOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'category', required: false, enum: InfluencerCategory })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPosts(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Query('sponsoredOnly') sponsoredOnly?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('category') category?: InfluencerCategory,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ posts: PaidCollabPostDto[]; total: number }> {
    return this.service.getPosts(
      userId,
      reportId,
      sponsoredOnly === 'true',
      sortBy || 'likesCount',
      sortOrder || 'DESC',
      category,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Get(':id/influencers')
  @ApiOperation({ summary: 'Get influencers with filtering and sorting' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  @ApiQuery({ name: 'category', required: false, enum: InfluencerCategory })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Query('category') category?: InfluencerCategory,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ influencers: PaidCollabInfluencerDto[]; total: number }> {
    return this.service.getInfluencers(
      userId,
      reportId,
      category,
      sortBy || 'likesCount',
      sortOrder || 'DESC',
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: UpdatePaidCollabReportDto,
  ) {
    return this.service.updateReport(userId, reportId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.service.deleteReport(userId, reportId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry failed report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
  ) {
    return this.service.retryReport(userId, reportId);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Share report' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id') reportId: string,
    @Body() dto: SharePaidCollabReportDto,
  ) {
    return this.service.shareReport(userId, reportId, dto);
  }
}
