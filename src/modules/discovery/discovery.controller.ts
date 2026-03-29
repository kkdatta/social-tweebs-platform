import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlatformType } from '../../common/enums';
import { DiscoveryService } from './services/discovery.service';
import {
  SearchInfluencersDto,
  SearchResponseDto,
  SearchHistoryResponseDto,
} from './dto/search.dto';
import {
  UnblurInfluencersDto,
  UnblurResponseDto,
  ViewInsightsResponseDto,
  RefreshInsightsResponseDto,
  InfluencerProfileDto,
  ExportInfluencersDto,
  ExportResponseDto,
  ExportHistoryResponseDto,
  InsightsCheckResponseDto,
  ExportCostEstimateDto,
} from './dto/influencer.dto';

@ApiTags('Discovery')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  // ============ SEARCH ENDPOINTS ============

  @Post('search')
  @ApiOperation({
    summary: 'Search influencers',
    description:
      'Search for influencers using filters. Every call hits Modash API directly (no caching). Results are stored in DB and returned to user.',
  })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits or invalid filters' })
  async searchInfluencers(
    @CurrentUser('id') userId: string,
    @Body() dto: SearchInfluencersDto,
  ): Promise<SearchResponseDto> {
    console.log('Search request received:', JSON.stringify(dto, null, 2));
    return this.discoveryService.searchInfluencers(userId, dto);
  }

  @Get('search/history')
  @ApiOperation({ summary: 'Get search history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: SearchHistoryResponseDto })
  async getSearchHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchHistoryResponseDto> {
    return this.discoveryService.getSearchHistory(userId, page || 1, limit || 20);
  }

  // ============ INFLUENCER ENDPOINTS ============

  @Get('influencer/:id')
  @ApiOperation({ summary: 'Get influencer profile' })
  @ApiResponse({ status: 200, type: InfluencerProfileDto })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getInfluencerProfile(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) profileId: string,
  ): Promise<InfluencerProfileDto> {
    return this.discoveryService.getProfile(userId, profileId);
  }

  @Get('insights/:id')
  @ApiOperation({
    summary: 'View influencer insights',
    description:
      'Get full insights for an influencer. First access costs 1 credit, subsequent views are free.',
  })
  @ApiResponse({ status: 200, type: ViewInsightsResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async viewInsights(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) profileId: string,
  ): Promise<ViewInsightsResponseDto> {
    return this.discoveryService.viewInsights(userId, profileId);
  }

  @Post('influencer/:id/refresh')
  @ApiOperation({
    summary: 'Refresh influencer insights',
    description: 'Refresh insights from Modash. Costs 1 credit.',
  })
  @ApiResponse({ status: 200, type: RefreshInsightsResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 403, description: 'Must view insights first' })
  async refreshInsights(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) profileId: string,
  ): Promise<RefreshInsightsResponseDto> {
    return this.discoveryService.refreshInsights(userId, profileId);
  }

  // ============ ACTION ENDPOINTS ============

  @Post('unblur')
  @ApiOperation({
    summary: 'Unblur influencer profiles',
    description: 'Unblur multiple profiles. Costs 0.04 credits per profile.',
  })
  @ApiResponse({ status: 200, type: UnblurResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  async unblurInfluencers(
    @CurrentUser('id') userId: string,
    @Body() dto: UnblurInfluencersDto,
  ): Promise<UnblurResponseDto> {
    return this.discoveryService.unblurInfluencers(userId, dto);
  }

  @Post('export')
  @ApiOperation({
    summary: 'Export influencer data',
    description: 'Export unlocked influencer data. 1 credit per 25 influencers (0.04 per profile).',
  })
  @ApiResponse({ status: 200, type: ExportResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 403, description: 'Some profiles not unlocked' })
  async exportInfluencers(
    @CurrentUser('id') userId: string,
    @Body() dto: ExportInfluencersDto,
  ): Promise<ExportResponseDto> {
    return this.discoveryService.exportInfluencers(userId, dto);
  }

  @Get('export-history')
  @ApiOperation({ summary: 'Get export history and previously exported profile IDs' })
  @ApiResponse({ status: 200, type: ExportHistoryResponseDto })
  async getExportHistory(
    @CurrentUser('id') userId: string,
  ): Promise<ExportHistoryResponseDto> {
    return this.discoveryService.getExportHistory(userId);
  }

  @Post('export-cost-estimate')
  @ApiOperation({ summary: 'Get export credit cost estimate' })
  @ApiResponse({ status: 200, type: ExportCostEstimateDto })
  async getExportCostEstimate(
    @CurrentUser('id') userId: string,
    @Body() body: { profileIds: string[]; excludePreviouslyExported?: boolean },
  ): Promise<ExportCostEstimateDto> {
    return this.discoveryService.getExportCostEstimate(
      userId,
      body.profileIds,
      body.excludePreviouslyExported || false,
    );
  }

  @Get('insights-check/:id')
  @ApiOperation({
    summary: 'Check if user has insights access for a profile',
    description: 'Returns whether the user already has access and the credit cost if not.',
  })
  @ApiResponse({ status: 200, type: InsightsCheckResponseDto })
  async checkInsightsAccess(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) profileId: string,
  ): Promise<InsightsCheckResponseDto> {
    return this.discoveryService.checkInsightsAccess(userId, profileId);
  }

  // ============ DICTIONARY ENDPOINTS (Passthrough to Modash) ============

  @Get('locations')
  @ApiOperation({ summary: 'Get location dictionary' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  async getLocations(@Query('query') query?: string) {
    return this.discoveryService.getLocations(query);
  }

  @Get('interests/:platform')
  @ApiOperation({ summary: 'Get interests dictionary for a platform' })
  async getInterests(
    @Param('platform') platform: PlatformType,
  ) {
    return this.discoveryService.getInterests(platform);
  }

  @Get('languages')
  @ApiOperation({ summary: 'Get languages dictionary' })
  async getLanguages() {
    return this.discoveryService.getLanguages();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get brands dictionary' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  async getBrands(@Query('query') query?: string) {
    return this.discoveryService.getBrands(query);
  }
}
