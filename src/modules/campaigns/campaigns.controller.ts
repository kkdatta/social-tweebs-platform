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
  HttpCode,
  HttpStatus,
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
import { CampaignsService } from './campaigns.service';
import {
  CreateCampaignDto,
  UpdateCampaignDto,
  AddInfluencerDto,
  UpdateInfluencerDto,
  CreateDeliverableDto,
  UpdateDeliverableDto,
  RecordMetricsDto,
  ShareCampaignDto,
  CampaignFilterDto,
  CampaignListResponseDto,
  CampaignDetailDto,
} from './dto/campaign.dto';

@ApiTags('campaigns')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  // ============ CAMPAIGN CRUD ============

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  async createCampaign(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCampaignDto,
  ) {
    const campaign = await this.campaignsService.createCampaign(userId, dto);
    return {
      success: true,
      message: 'Campaign created successfully',
      campaign,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get campaigns list with filters' })
  @ApiQuery({ name: 'tab', required: false, enum: ['created_by_me', 'created_by_team', 'shared_with_me'] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCampaigns(
    @CurrentUser('id') userId: string,
    @Query() filters: CampaignFilterDto,
  ): Promise<CampaignListResponseDto> {
    return this.campaignsService.getCampaigns(userId, filters);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get campaign dashboard statistics' })
  async getDashboardStats(@CurrentUser('id') userId: string) {
    return this.campaignsService.getDashboardStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getCampaignById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<CampaignDetailDto> {
    return this.campaignsService.getCampaignById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async updateCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    const campaign = await this.campaignsService.updateCampaign(userId, id, dto);
    return {
      success: true,
      message: 'Campaign updated successfully',
      campaign,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async deleteCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.campaignsService.deleteCampaign(userId, id);
    return {
      success: true,
      message: 'Campaign deleted successfully',
    };
  }

  // ============ INFLUENCER MANAGEMENT ============

  @Post(':id/influencers')
  @ApiOperation({ summary: 'Add influencer to campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async addInfluencer(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Body() dto: AddInfluencerDto,
  ) {
    const influencer = await this.campaignsService.addInfluencer(userId, campaignId, dto);
    return {
      success: true,
      message: 'Influencer added to campaign',
      influencer,
    };
  }

  @Get(':id/influencers')
  @ApiOperation({ summary: 'Get campaign influencers' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
  ) {
    const influencers = await this.campaignsService.getInfluencers(userId, campaignId);
    return {
      success: true,
      influencers,
      count: influencers.length,
    };
  }

  @Patch(':id/influencers/:influencerId')
  @ApiOperation({ summary: 'Update influencer in campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'influencerId', description: 'Influencer ID' })
  async updateInfluencer(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('influencerId') influencerId: string,
    @Body() dto: UpdateInfluencerDto,
  ) {
    const influencer = await this.campaignsService.updateInfluencer(
      userId,
      campaignId,
      influencerId,
      dto,
    );
    return {
      success: true,
      message: 'Influencer updated',
      influencer,
    };
  }

  @Delete(':id/influencers/:influencerId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove influencer from campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'influencerId', description: 'Influencer ID' })
  async removeInfluencer(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('influencerId') influencerId: string,
  ) {
    await this.campaignsService.removeInfluencer(userId, campaignId, influencerId);
    return {
      success: true,
      message: 'Influencer removed from campaign',
    };
  }

  // ============ DELIVERABLES ============

  @Post(':id/deliverables')
  @ApiOperation({ summary: 'Create deliverable for campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async createDeliverable(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    const deliverable = await this.campaignsService.createDeliverable(userId, campaignId, dto);
    return {
      success: true,
      message: 'Deliverable created',
      deliverable,
    };
  }

  @Get(':id/deliverables')
  @ApiOperation({ summary: 'Get campaign deliverables' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getDeliverables(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
  ) {
    const deliverables = await this.campaignsService.getDeliverables(userId, campaignId);
    return {
      success: true,
      deliverables,
      count: deliverables.length,
    };
  }

  @Patch(':id/deliverables/:deliverableId')
  @ApiOperation({ summary: 'Update deliverable' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'deliverableId', description: 'Deliverable ID' })
  async updateDeliverable(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('deliverableId') deliverableId: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    const deliverable = await this.campaignsService.updateDeliverable(
      userId,
      campaignId,
      deliverableId,
      dto,
    );
    return {
      success: true,
      message: 'Deliverable updated',
      deliverable,
    };
  }

  @Delete(':id/deliverables/:deliverableId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete deliverable' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'deliverableId', description: 'Deliverable ID' })
  async deleteDeliverable(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    await this.campaignsService.deleteDeliverable(userId, campaignId, deliverableId);
    return {
      success: true,
      message: 'Deliverable deleted',
    };
  }

  // ============ METRICS ============

  @Post(':id/metrics')
  @ApiOperation({ summary: 'Record campaign metrics' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async recordMetrics(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Body() dto: RecordMetricsDto,
  ) {
    const metric = await this.campaignsService.recordMetrics(userId, campaignId, dto);
    return {
      success: true,
      message: 'Metrics recorded',
      metric,
    };
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get campaign metrics summary' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getCampaignMetrics(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
  ) {
    // First check access
    await this.campaignsService.getCampaignById(userId, campaignId);
    const metrics = await this.campaignsService.getCampaignMetrics(campaignId);
    return {
      success: true,
      metrics,
    };
  }

  // ============ SHARING ============

  @Post(':id/share')
  @ApiOperation({ summary: 'Share campaign with user' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async shareCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Body() dto: ShareCampaignDto,
  ) {
    const share = await this.campaignsService.shareCampaign(userId, campaignId, dto);
    return {
      success: true,
      message: 'Campaign shared successfully',
      share,
    };
  }

  @Delete(':id/share/:shareId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove campaign share' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  async removeCampaignShare(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('shareId') shareId: string,
  ) {
    await this.campaignsService.removeCampaignShare(userId, campaignId, shareId);
    return {
      success: true,
      message: 'Share removed',
    };
  }
}
