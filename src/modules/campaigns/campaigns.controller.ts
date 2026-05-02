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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
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
  AddPostDto,
  PostFilterDto,
  InfluencerFilterDto,
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
  @ApiQuery({ name: 'tab', required: false, enum: ['created_by_me', 'created_by_team', 'shared_with_me', 'sample_public'] })
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

  @Get('credit-notification')
  @ApiOperation({ summary: 'Get credit usage notification' })
  async getCreditNotification(@CurrentUser('id') userId: string) {
    return this.campaignsService.getCreditNotification(userId);
  }

  @Post('upload/logo')
  @ApiOperation({ summary: 'Upload campaign logo image' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'File saved; returns public path for logoUrl' })
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dest = join(process.cwd(), 'uploads', 'campaigns');
          fs.mkdirSync(dest, { recursive: true });
          cb(null, dest);
        },
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || '').toLowerCase();
          const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.png';
          cb(null, `${uuidv4()}${safeExt}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
          return cb(
            new BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadCampaignLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const relativePath = `/uploads/campaigns/${file.filename}`;
    return {
      success: true,
      path: relativePath,
      logoUrl: relativePath,
    };
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

  @Post(':id/process')
  @ApiOperation({ summary: 'Trigger campaign processing (fetch posts via Modash)' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async processCampaign(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const campaign = await this.campaignsService.getCampaignById(userId, id);
    if (!campaign) throw new BadRequestException('Campaign not found');

    setTimeout(() => this.campaignsService.processCampaign(id).catch(err =>
      console.error(`Campaign processing failed: ${err.message}`),
    ), 500);

    return {
      success: true,
      message: 'Campaign processing started. Data will be populated shortly.',
    };
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
  @ApiOperation({ summary: 'Get campaign influencers with filters' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'publishStatus', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getInfluencers(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Query() filters: InfluencerFilterDto,
  ) {
    const influencers = await this.campaignsService.getInfluencers(userId, campaignId, filters);
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

  // ============ POSTS ============

  @Post(':id/posts')
  @ApiOperation({ summary: 'Add post to campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async addPost(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Body() dto: AddPostDto,
  ) {
    const { post, warning } = await this.campaignsService.addPost(userId, campaignId, dto);
    return {
      success: true,
      message: warning || 'Post added to campaign',
      warning,
      post,
    };
  }

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get campaign posts with filters' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getPosts(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Query() filters: PostFilterDto,
  ) {
    const result = await this.campaignsService.getPosts(userId, campaignId, filters);
    return {
      success: true,
      ...result,
    };
  }

  @Delete(':id/posts/:postId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove post from campaign' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiParam({ name: 'postId', description: 'Post ID' })
  async removePost(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Param('postId') postId: string,
  ) {
    await this.campaignsService.removePost(userId, campaignId, postId);
    return {
      success: true,
      message: 'Post removed from campaign',
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
    await this.campaignsService.getCampaignById(userId, campaignId);
    const metrics = await this.campaignsService.getCampaignMetrics(campaignId);
    return {
      success: true,
      metrics,
    };
  }

  // ============ ANALYTICS ============

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Get campaign analytics' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  async getAnalytics(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
  ) {
    const analytics = await this.campaignsService.getAnalytics(userId, campaignId);
    return {
      success: true,
      ...analytics,
    };
  }

  // ============ EXPORT ============

  @Get(':id/export')
  @ApiOperation({ summary: 'Get campaign report data for export' })
  @ApiParam({ name: 'id', description: 'Campaign ID' })
  @ApiQuery({ name: 'type', required: false, enum: ['basic', 'advanced'] })
  async exportReport(
    @CurrentUser('id') userId: string,
    @Param('id') campaignId: string,
    @Query('type') reportType: 'basic' | 'advanced' = 'basic',
  ) {
    const data = await this.campaignsService.getReportData(userId, campaignId, reportType);
    return {
      success: true,
      ...data,
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
