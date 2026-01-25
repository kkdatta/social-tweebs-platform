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
import { CompetitionAnalysisService } from './competition-analysis.service';
import {
  CreateCompetitionReportDto,
  UpdateCompetitionReportDto,
  ShareCompetitionReportDto,
  CompetitionReportFilterDto,
  CompetitionReportListResponseDto,
  CompetitionReportDetailDto,
  DashboardStatsDto,
  ChartDataDto,
  PostsFilterDto,
  InfluencersFilterDto,
} from './dto';

@ApiTags('competition-analysis')
@Controller('competition-analysis')
export class CompetitionAnalysisController {
  constructor(private readonly competitionAnalysisService: CompetitionAnalysisService) {}

  // =============== Public Routes ===============

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get shared report by token' })
  @ApiResponse({ status: 200, type: CompetitionReportDetailDto })
  async getSharedReport(
    @Param('token') token: string,
  ): Promise<CompetitionReportDetailDto> {
    return this.competitionAnalysisService.getReportByShareToken(token);
  }

  // =============== Protected Routes ===============

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new competition analysis report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async createReport(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCompetitionReportDto,
  ) {
    return this.competitionAnalysisService.createReport(userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get list of competition analysis reports' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM', 'SHARED'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: CompetitionReportListResponseDto })
  async getReports(
    @CurrentUser('id') userId: string,
    @Query() filters: CompetitionReportFilterDto,
  ): Promise<CompetitionReportListResponseDto> {
    return this.competitionAnalysisService.getReports(userId, filters);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
  ): Promise<DashboardStatsDto> {
    return this.competitionAnalysisService.getDashboardStats(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiResponse({ status: 200, type: CompetitionReportDetailDto })
  async getReportById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompetitionReportDetailDto> {
    return this.competitionAnalysisService.getReportById(userId, id);
  }

  @Get(':id/chart-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get chart data for posts over time per brand' })
  @ApiResponse({ status: 200, type: [ChartDataDto] })
  async getChartData(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChartDataDto[]> {
    return this.competitionAnalysisService.getChartData(userId, id);
  }

  @Get(':id/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts with filters' })
  @ApiQuery({ name: 'brandId', required: false })
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
    return this.competitionAnalysisService.getPosts(userId, id, filters);
  }

  @Get(':id/influencers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get influencers with filters' })
  @ApiQuery({ name: 'brandId', required: false })
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
    return this.competitionAnalysisService.getInfluencers(userId, id, filters);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report' })
  async updateReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompetitionReportDto,
  ) {
    return this.competitionAnalysisService.updateReport(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete report' })
  async deleteReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competitionAnalysisService.deleteReport(userId, id);
  }

  @Post('bulk-delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete reports' })
  async bulkDeleteReports(
    @CurrentUser('id') userId: string,
    @Body() body: { reportIds: string[] },
  ) {
    return this.competitionAnalysisService.bulkDeleteReports(userId, body.reportIds);
  }

  @Post(':id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retry failed report' })
  async retryReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.competitionAnalysisService.retryReport(userId, id);
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share report' })
  async shareReport(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ShareCompetitionReportDto,
  ) {
    return this.competitionAnalysisService.shareReport(userId, id, dto);
  }
}
