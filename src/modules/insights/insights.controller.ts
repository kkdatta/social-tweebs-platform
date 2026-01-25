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
} from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import {
  SearchInsightDto,
  ListInsightsQueryDto,
  InsightListResponseDto,
  SearchInsightResponseDto,
  RefreshInsightResponseDto,
  FullInsightResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators';

@ApiTags('Insights')
@Controller('insights')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({ summary: 'List user\'s unlocked insights' })
  @ApiResponse({ status: 200, description: 'Insights list retrieved', type: InsightListResponseDto })
  async listInsights(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ListInsightsQueryDto,
  ): Promise<InsightListResponseDto> {
    return this.insightsService.listInsights(user.sub, query);
  }

  @Post('search')
  @ApiOperation({ summary: 'Search and unlock influencer insight' })
  @ApiResponse({ status: 200, description: 'Insight retrieved (cached)', type: SearchInsightResponseDto })
  @ApiResponse({ status: 201, description: 'New insight unlocked', type: SearchInsightResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 404, description: 'Influencer not found' })
  async searchAndUnlock(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SearchInsightDto,
  ): Promise<SearchInsightResponseDto> {
    return this.insightsService.searchAndUnlock(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full insight details by ID' })
  @ApiResponse({ status: 200, description: 'Insight details retrieved', type: FullInsightResponseDto })
  @ApiResponse({ status: 404, description: 'Insight not found' })
  async getInsight(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FullInsightResponseDto> {
    return this.insightsService.getInsight(user.sub, id);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Force refresh insight data (costs 1 credit)' })
  @ApiResponse({ status: 200, description: 'Insight refreshed', type: RefreshInsightResponseDto })
  @ApiResponse({ status: 400, description: 'Insufficient credits' })
  @ApiResponse({ status: 404, description: 'Insight not found' })
  async refreshInsight(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RefreshInsightResponseDto> {
    return this.insightsService.forceRefresh(user.sub, id);
  }

  @Get('config/cache-ttl')
  @ApiOperation({ summary: 'Get current cache TTL configuration' })
  @ApiResponse({ status: 200, description: 'Cache TTL in days' })
  async getCacheTTL(): Promise<{ ttlDays: number }> {
    const ttlDays = await this.insightsService.getCacheTTLDays();
    return { ttlDays };
  }
}
