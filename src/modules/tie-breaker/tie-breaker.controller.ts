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
import { TieBreakerService } from './tie-breaker.service';
import {
  CreateTieBreakerComparisonDto,
  UpdateTieBreakerComparisonDto,
  ShareTieBreakerComparisonDto,
  TieBreakerFilterDto,
  TieBreakerListResponseDto,
  TieBreakerComparisonDetailDto,
  TieBreakerDashboardStatsDto,
  SearchInfluencerResultDto,
} from './dto';

@ApiTags('tie-breaker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tie-breaker')
export class TieBreakerController {
  constructor(private readonly tieBreakerService: TieBreakerService) {}

  // ==================== Comparison CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Create a new influencer comparison' })
  @ApiResponse({ status: 201, description: 'Comparison created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request - must have 2-3 influencers' })
  @ApiResponse({ status: 402, description: 'Insufficient credits' })
  async createComparison(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTieBreakerComparisonDto,
  ) {
    return this.tieBreakerService.createComparison(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of comparisons' })
  @ApiQuery({ name: 'platform', required: false, enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'ALL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
  @ApiQuery({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, type: TieBreakerListResponseDto })
  async getComparisons(
    @CurrentUser('id') userId: string,
    @Query() filters: TieBreakerFilterDto,
  ): Promise<TieBreakerListResponseDto> {
    return this.tieBreakerService.getComparisons(userId, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, type: TieBreakerDashboardStatsDto })
  async getDashboardStats(
    @CurrentUser('id') userId: string,
  ): Promise<TieBreakerDashboardStatsDto> {
    return this.tieBreakerService.getDashboardStats(userId);
  }

  @Get('search/influencers')
  @ApiOperation({ summary: 'Search influencers for comparison' })
  @ApiQuery({ name: 'platform', required: true, enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (name, username, keyword)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results to return (default 20)' })
  @ApiResponse({ status: 200, type: [SearchInfluencerResultDto] })
  async searchInfluencers(
    @CurrentUser('id') userId: string,
    @Query('platform') platform: string,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ): Promise<SearchInfluencerResultDto[]> {
    return this.tieBreakerService.searchInfluencers(userId, platform, query, limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get comparison details by ID' })
  @ApiParam({ name: 'id', description: 'Comparison ID' })
  @ApiResponse({ status: 200, type: TieBreakerComparisonDetailDto })
  @ApiResponse({ status: 404, description: 'Comparison not found' })
  async getComparisonById(
    @CurrentUser('id') userId: string,
    @Param('id') comparisonId: string,
  ): Promise<TieBreakerComparisonDetailDto> {
    return this.tieBreakerService.getComparisonById(userId, comparisonId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get comparison data for PDF download' })
  @ApiParam({ name: 'id', description: 'Comparison ID' })
  @ApiResponse({ status: 200, type: TieBreakerComparisonDetailDto })
  async getComparisonForDownload(
    @CurrentUser('id') userId: string,
    @Param('id') comparisonId: string,
  ): Promise<TieBreakerComparisonDetailDto> {
    return this.tieBreakerService.getComparisonForDownload(userId, comparisonId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comparison (title, visibility)' })
  @ApiParam({ name: 'id', description: 'Comparison ID' })
  @ApiResponse({ status: 200, description: 'Comparison updated' })
  @ApiResponse({ status: 404, description: 'Comparison not found' })
  async updateComparison(
    @CurrentUser('id') userId: string,
    @Param('id') comparisonId: string,
    @Body() dto: UpdateTieBreakerComparisonDto,
  ) {
    return this.tieBreakerService.updateComparison(userId, comparisonId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete comparison' })
  @ApiParam({ name: 'id', description: 'Comparison ID' })
  @ApiResponse({ status: 200, description: 'Comparison deleted' })
  @ApiResponse({ status: 404, description: 'Comparison not found' })
  async deleteComparison(
    @CurrentUser('id') userId: string,
    @Param('id') comparisonId: string,
  ) {
    return this.tieBreakerService.deleteComparison(userId, comparisonId);
  }

  // ==================== Sharing ====================

  @Post(':id/share')
  @ApiOperation({ summary: 'Share comparison with user or get shareable link' })
  @ApiParam({ name: 'id', description: 'Comparison ID' })
  @ApiResponse({ status: 200, description: 'Comparison shared' })
  async shareComparison(
    @CurrentUser('id') userId: string,
    @Param('id') comparisonId: string,
    @Body() dto: ShareTieBreakerComparisonDto,
  ) {
    return this.tieBreakerService.shareComparison(userId, comparisonId, dto);
  }

  // ==================== Public Access ====================

  @Get('shared/:token')
  @ApiOperation({ summary: 'Get publicly shared comparison by token' })
  @ApiParam({ name: 'token', description: 'Share URL token' })
  @ApiResponse({ status: 200, type: TieBreakerComparisonDetailDto })
  @ApiResponse({ status: 404, description: 'Comparison not found or not public' })
  async getSharedComparison(
    @Param('token') token: string,
  ): Promise<TieBreakerComparisonDetailDto> {
    return this.tieBreakerService.getComparisonByShareToken(token);
  }
}
