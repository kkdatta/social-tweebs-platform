import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Like, Or } from 'typeorm';
import {
  Campaign,
  CampaignInfluencer,
  CampaignDeliverable,
  CampaignMetric,
  CampaignShare,
  CampaignStatus,
  InfluencerStatus,
  DeliverableStatus,
  SharePermission,
} from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { ModuleType, ActionType } from '../../common/enums';
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
  CampaignSummaryDto,
  CampaignDetailDto,
  CampaignMetricsSummary,
  CampaignListResponseDto,
} from './dto/campaign.dto';

const CREDIT_PER_CAMPAIGN = 1; // 1 credit to create a campaign

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @InjectRepository(Campaign)
    private campaignRepo: Repository<Campaign>,
    @InjectRepository(CampaignInfluencer)
    private influencerRepo: Repository<CampaignInfluencer>,
    @InjectRepository(CampaignDeliverable)
    private deliverableRepo: Repository<CampaignDeliverable>,
    @InjectRepository(CampaignMetric)
    private metricRepo: Repository<CampaignMetric>,
    @InjectRepository(CampaignShare)
    private shareRepo: Repository<CampaignShare>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private creditsService: CreditsService,
    private dataSource: DataSource,
  ) {}

  // ============ CAMPAIGN CRUD ============

  async createCampaign(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
    // Deduct credits
    await this.creditsService.deductCredits(userId, {
      actionType: ActionType.REPORT_GENERATION,
      quantity: CREDIT_PER_CAMPAIGN,
      module: ModuleType.CAMPAIGN_TRACKING,
      resourceId: 'new-campaign',
      resourceType: 'campaign_creation',
    });

    const campaign = new Campaign();
    campaign.name = dto.name;
    campaign.description = dto.description;
    campaign.platform = dto.platform;
    campaign.objective = dto.objective;
    campaign.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    campaign.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    campaign.budget = dto.budget;
    campaign.currency = dto.currency || 'INR';
    campaign.hashtags = dto.hashtags;
    campaign.mentions = dto.mentions;
    campaign.targetAudience = dto.targetAudience;
    campaign.ownerId = userId;
    campaign.createdById = userId;
    campaign.status = CampaignStatus.DRAFT;

    const saved = await this.campaignRepo.save(campaign);
    this.logger.log(`Campaign created: ${saved.id} by user ${userId}`);
    return saved;
  }

  async getCampaigns(userId: string, filters: CampaignFilterDto): Promise<CampaignListResponseDto> {
    const { status, platform, objective, search, tab, page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Get user info to determine parent hierarchy
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const queryBuilder = this.campaignRepo.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.owner', 'owner')
      .leftJoin('campaign.influencers', 'influencers')
      .leftJoin('campaign.deliverables', 'deliverables')
      .addSelect('COUNT(DISTINCT influencers.id)', 'influencer_count')
      .addSelect('COUNT(DISTINCT deliverables.id)', 'deliverable_count')
      .groupBy('campaign.id')
      .addGroupBy('owner.id');

    // Tab-based filtering
    if (tab === 'created_by_me') {
      queryBuilder.where('campaign.createdById = :userId', { userId });
    } else if (tab === 'created_by_team') {
      // Get team members (users under same parent or created by same admin)
      const teamUserIds = await this.getTeamUserIds(userId, user);
      queryBuilder.where('campaign.createdById IN (:...teamUserIds)', { teamUserIds })
        .andWhere('campaign.createdById != :userId', { userId });
    } else if (tab === 'shared_with_me') {
      queryBuilder.innerJoin('campaign.shares', 'share', 'share.sharedWithUserId = :userId', { userId });
    } else {
      // Default: show all accessible campaigns
      const accessibleIds = await this.getAccessibleCampaignIds(userId, user);
      if (accessibleIds.length > 0) {
        queryBuilder.where('campaign.id IN (:...accessibleIds)', { accessibleIds });
      } else {
        queryBuilder.where('campaign.ownerId = :userId', { userId });
      }
    }

    // Apply filters
    if (status) {
      queryBuilder.andWhere('campaign.status = :status', { status });
    }
    if (platform) {
      queryBuilder.andWhere('campaign.platform = :platform', { platform });
    }
    if (objective) {
      queryBuilder.andWhere('campaign.objective = :objective', { objective });
    }
    if (search) {
      queryBuilder.andWhere('(campaign.name ILIKE :search OR campaign.description ILIKE :search)', { 
        search: `%${search}%` 
      });
    }

    // Sorting
    const sortField = ['createdAt', 'name', 'startDate', 'endDate', 'budget'].includes(sortBy) 
      ? `campaign.${sortBy}` 
      : 'campaign.createdAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Pagination
    queryBuilder.skip(page * limit).take(limit);

    const campaigns = await queryBuilder.getRawAndEntities();

    // Map to summary DTOs
    const campaignSummaries: CampaignSummaryDto[] = campaigns.entities.map((campaign, index) => {
      const raw = campaigns.raw[index];
      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        status: campaign.status,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget ? Number(campaign.budget) : undefined,
        currency: campaign.currency,
        influencerCount: parseInt(raw.influencer_count) || 0,
        deliverableCount: parseInt(raw.deliverable_count) || 0,
        createdAt: campaign.createdAt,
        ownerName: campaign.owner?.name,
      };
    });

    return {
      campaigns: campaignSummaries,
      total,
      page,
      limit,
      hasMore: (page + 1) * limit < total,
    };
  }

  async getCampaignById(userId: string, campaignId: string): Promise<CampaignDetailDto> {
    const campaign = await this.campaignRepo.findOne({
      where: { id: campaignId },
      relations: ['owner', 'influencers', 'deliverables', 'shares'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    // Check access
    await this.checkCampaignAccess(userId, campaign);

    // Get metrics
    const metrics = await this.getCampaignMetrics(campaignId);

    // Get detailed influencers with their deliverables
    const influencers = await this.influencerRepo.find({
      where: { campaignId },
      relations: ['deliverables'],
    });

    // Get all deliverables
    const deliverables = await this.deliverableRepo.find({
      where: { campaignId },
      relations: ['campaignInfluencer'],
    });

    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      platform: campaign.platform,
      status: campaign.status,
      objective: campaign.objective,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget ? Number(campaign.budget) : undefined,
      currency: campaign.currency,
      hashtags: campaign.hashtags,
      mentions: campaign.mentions,
      targetAudience: campaign.targetAudience,
      influencerCount: influencers.length,
      deliverableCount: deliverables.length,
      createdAt: campaign.createdAt,
      ownerName: campaign.owner?.name,
      influencers: influencers.map(inf => ({
        id: inf.id,
        influencerName: inf.influencerName,
        influencerUsername: inf.influencerUsername,
        platform: inf.platform,
        followerCount: inf.followerCount,
        status: inf.status,
        budgetAllocated: inf.budgetAllocated ? Number(inf.budgetAllocated) : undefined,
        paymentStatus: inf.paymentStatus,
        paymentAmount: inf.paymentAmount ? Number(inf.paymentAmount) : undefined,
        contractStatus: inf.contractStatus,
        deliverables: inf.deliverables?.length || 0,
        addedAt: inf.addedAt,
      })),
      deliverables: deliverables.map(del => ({
        id: del.id,
        deliverableType: del.deliverableType,
        title: del.title,
        description: del.description,
        dueDate: del.dueDate,
        status: del.status,
        contentUrl: del.contentUrl,
        influencerName: del.campaignInfluencer?.influencerName,
        publishedAt: del.publishedAt,
      })),
      metrics,
    };
  }

  async updateCampaign(userId: string, campaignId: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    Object.assign(campaign, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : campaign.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : campaign.endDate,
    });

    const updated = await this.campaignRepo.save(campaign);
    this.logger.log(`Campaign updated: ${campaignId}`);
    return updated;
  }

  async deleteCampaign(userId: string, campaignId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'admin');

    await this.campaignRepo.remove(campaign);
    this.logger.log(`Campaign deleted: ${campaignId}`);
  }

  // ============ INFLUENCER MANAGEMENT ============

  async addInfluencer(userId: string, campaignId: string, dto: AddInfluencerDto): Promise<CampaignInfluencer> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const influencer = this.influencerRepo.create({
      ...dto,
      campaignId,
      status: InfluencerStatus.INVITED,
    });

    const saved = await this.influencerRepo.save(influencer);
    this.logger.log(`Influencer added to campaign ${campaignId}: ${saved.id}`);
    return saved;
  }

  async getInfluencers(userId: string, campaignId: string): Promise<CampaignInfluencer[]> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign);

    return this.influencerRepo.find({
      where: { campaignId },
      relations: ['deliverables'],
      order: { addedAt: 'DESC' },
    });
  }

  async updateInfluencer(userId: string, campaignId: string, influencerId: string, dto: UpdateInfluencerDto): Promise<CampaignInfluencer> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const influencer = await this.influencerRepo.findOne({ where: { id: influencerId, campaignId } });
    if (!influencer) throw new NotFoundException('Influencer not found');

    // Update status timestamps
    if (dto.status === InfluencerStatus.CONFIRMED && !influencer.confirmedAt) {
      influencer.confirmedAt = new Date();
    }
    if (dto.status === InfluencerStatus.COMPLETED && !influencer.completedAt) {
      influencer.completedAt = new Date();
    }

    Object.assign(influencer, dto);
    return this.influencerRepo.save(influencer);
  }

  async removeInfluencer(userId: string, campaignId: string, influencerId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const influencer = await this.influencerRepo.findOne({ where: { id: influencerId, campaignId } });
    if (!influencer) throw new NotFoundException('Influencer not found');

    await this.influencerRepo.remove(influencer);
    this.logger.log(`Influencer removed from campaign ${campaignId}: ${influencerId}`);
  }

  // ============ DELIVERABLES MANAGEMENT ============

  async createDeliverable(userId: string, campaignId: string, dto: CreateDeliverableDto): Promise<CampaignDeliverable> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    // Verify influencer belongs to this campaign
    const influencer = await this.influencerRepo.findOne({ 
      where: { id: dto.campaignInfluencerId, campaignId } 
    });
    if (!influencer) throw new BadRequestException('Influencer not found in this campaign');

    const deliverable = new CampaignDeliverable();
    deliverable.campaignId = campaignId;
    deliverable.campaignInfluencerId = dto.campaignInfluencerId;
    deliverable.deliverableType = dto.deliverableType;
    deliverable.title = dto.title;
    deliverable.description = dto.description;
    deliverable.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    deliverable.status = DeliverableStatus.PENDING;

    return this.deliverableRepo.save(deliverable);
  }

  async getDeliverables(userId: string, campaignId: string): Promise<CampaignDeliverable[]> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign);

    return this.deliverableRepo.find({
      where: { campaignId },
      relations: ['campaignInfluencer'],
      order: { dueDate: 'ASC' },
    });
  }

  async updateDeliverable(userId: string, campaignId: string, deliverableId: string, dto: UpdateDeliverableDto): Promise<CampaignDeliverable> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const deliverable = await this.deliverableRepo.findOne({ where: { id: deliverableId, campaignId } });
    if (!deliverable) throw new NotFoundException('Deliverable not found');

    // Update status timestamps
    if (dto.status === DeliverableStatus.SUBMITTED && !deliverable.submittedAt) {
      deliverable.submittedAt = new Date();
    }
    if (dto.status === DeliverableStatus.APPROVED && !deliverable.approvedAt) {
      deliverable.approvedAt = new Date();
    }
    if (dto.status === DeliverableStatus.PUBLISHED && !deliverable.publishedAt) {
      deliverable.publishedAt = new Date();
    }

    Object.assign(deliverable, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : deliverable.dueDate,
    });

    return this.deliverableRepo.save(deliverable);
  }

  async deleteDeliverable(userId: string, campaignId: string, deliverableId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const deliverable = await this.deliverableRepo.findOne({ where: { id: deliverableId, campaignId } });
    if (!deliverable) throw new NotFoundException('Deliverable not found');

    await this.deliverableRepo.remove(deliverable);
  }

  // ============ METRICS ============

  async recordMetrics(userId: string, campaignId: string, dto: RecordMetricsDto): Promise<CampaignMetric> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    // Calculate engagement rate if we have the data
    let engagementRate: number | undefined;
    if (dto.impressions && dto.impressions > 0) {
      const totalEngagement = (dto.likes || 0) + (dto.comments || 0) + (dto.shares || 0) + (dto.saves || 0);
      engagementRate = (totalEngagement / dto.impressions) * 100;
    }

    const metric = this.metricRepo.create({
      ...dto,
      campaignId,
      engagementRate,
    });

    return this.metricRepo.save(metric);
  }

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetricsSummary> {
    const metrics = await this.metricRepo.find({ where: { campaignId } });
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    const influencers = await this.influencerRepo.find({ where: { campaignId } });

    const totalSpent = influencers.reduce((sum, inf) => sum + (Number(inf.paymentAmount) || 0), 0);
    const budget = campaign?.budget ? Number(campaign.budget) : 0;

    return {
      totalImpressions: metrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
      totalReach: metrics.reduce((sum, m) => sum + (m.reach || 0), 0),
      totalLikes: metrics.reduce((sum, m) => sum + (m.likes || 0), 0),
      totalComments: metrics.reduce((sum, m) => sum + (m.comments || 0), 0),
      totalShares: metrics.reduce((sum, m) => sum + (m.shares || 0), 0),
      totalViews: metrics.reduce((sum, m) => sum + (m.views || 0), 0),
      totalClicks: metrics.reduce((sum, m) => sum + (m.clicks || 0), 0),
      avgEngagementRate: metrics.length > 0 
        ? metrics.reduce((sum, m) => sum + (Number(m.engagementRate) || 0), 0) / metrics.length 
        : 0,
      totalSpent,
      budgetUtilization: budget > 0 ? (totalSpent / budget) * 100 : 0,
    };
  }

  // ============ SHARING ============

  async shareCampaign(userId: string, campaignId: string, dto: ShareCampaignDto): Promise<CampaignShare> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'admin');

    // Check if already shared
    const existing = await this.shareRepo.findOne({
      where: { campaignId, sharedWithUserId: dto.sharedWithUserId },
    });

    if (existing) {
      // Update permission
      existing.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
      return this.shareRepo.save(existing);
    }

    const share = this.shareRepo.create({
      campaignId,
      sharedWithUserId: dto.sharedWithUserId,
      sharedByUserId: userId,
      permissionLevel: dto.permissionLevel || SharePermission.VIEW,
    });

    return this.shareRepo.save(share);
  }

  async removeCampaignShare(userId: string, campaignId: string, shareId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'admin');

    await this.shareRepo.delete({ id: shareId, campaignId });
  }

  // ============ DASHBOARD / ANALYTICS ============

  async getDashboardStats(userId: string): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const accessibleIds = await this.getAccessibleCampaignIds(userId, user);

    // Get campaign counts by status
    const statusCounts = await this.campaignRepo
      .createQueryBuilder('campaign')
      .select('campaign.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', 
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('campaign.status')
      .getRawMany();

    // Get total influencers across campaigns
    const influencerStats = await this.influencerRepo
      .createQueryBuilder('inf')
      .select('inf.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('inf.campaign', 'campaign')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('inf.status')
      .getRawMany();

    // Get deliverable stats
    const deliverableStats = await this.deliverableRepo
      .createQueryBuilder('del')
      .select('del.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('del.campaign', 'campaign')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('del.status')
      .getRawMany();

    // Get total budget and spent
    const budgetStats = await this.campaignRepo
      .createQueryBuilder('campaign')
      .select('SUM(campaign.budget)', 'totalBudget')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .getRawOne();

    const spentStats = await this.influencerRepo
      .createQueryBuilder('inf')
      .select('SUM(inf.paymentAmount)', 'totalSpent')
      .innerJoin('inf.campaign', 'campaign')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .getRawOne();

    return {
      campaigns: {
        total: statusCounts.reduce((sum, s) => sum + parseInt(s.count), 0),
        byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
      },
      influencers: {
        total: influencerStats.reduce((sum, s) => sum + parseInt(s.count), 0),
        byStatus: influencerStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
      },
      deliverables: {
        total: deliverableStats.reduce((sum, s) => sum + parseInt(s.count), 0),
        byStatus: deliverableStats.reduce((acc, s) => ({ ...acc, [s.status]: parseInt(s.count) }), {}),
      },
      budget: {
        total: Number(budgetStats?.totalBudget) || 0,
        spent: Number(spentStats?.totalSpent) || 0,
        utilization: budgetStats?.totalBudget > 0 
          ? ((Number(spentStats?.totalSpent) || 0) / Number(budgetStats.totalBudget)) * 100 
          : 0,
      },
    };
  }

  // ============ HELPER METHODS ============

  private async checkCampaignAccess(userId: string, campaign: Campaign, level: 'view' | 'edit' | 'admin' = 'view'): Promise<void> {
    // Owner has full access
    if (campaign.ownerId === userId || campaign.createdById === userId) return;

    // Check share permissions
    const share = await this.shareRepo.findOne({
      where: { campaignId: campaign.id, sharedWithUserId: userId },
    });

    if (!share) {
      // Check if user is in same organization (parent hierarchy)
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const owner = await this.userRepo.findOne({ where: { id: campaign.ownerId } });
      
      if (user?.parentId === owner?.id || owner?.parentId === user?.id || user?.parentId === owner?.parentId) {
        // Same organization - allow view
        if (level !== 'view') {
          throw new ForbiddenException('You do not have permission to modify this campaign');
        }
        return;
      }

      throw new ForbiddenException('You do not have access to this campaign');
    }

    // Check permission level
    if (level === 'admin' && share.permissionLevel !== SharePermission.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    if (level === 'edit' && share.permissionLevel === SharePermission.VIEW) {
      throw new ForbiddenException('Edit access required');
    }
  }

  private async getTeamUserIds(userId: string, user: User): Promise<string[]> {
    const ids: string[] = [userId];

    if (user.role === 'SUPER_ADMIN') {
      // Super admin sees all users
      const allUsers = await this.userRepo.find({ select: ['id'] });
      return allUsers.map(u => u.id);
    }

    if (user.parentId) {
      // Get sibling users (same parent)
      const siblings = await this.userRepo.find({ where: { parentId: user.parentId }, select: ['id'] });
      ids.push(...siblings.map(s => s.id));
      ids.push(user.parentId);
    }

    // Get child users
    const children = await this.userRepo.find({ where: { parentId: userId }, select: ['id'] });
    ids.push(...children.map(c => c.id));

    return [...new Set(ids)];
  }

  private async getAccessibleCampaignIds(userId: string, user: User): Promise<string[]> {
    const ids: string[] = [];

    // Owned campaigns
    const owned = await this.campaignRepo.find({ where: { ownerId: userId }, select: ['id'] });
    ids.push(...owned.map(c => c.id));

    // Created campaigns
    const created = await this.campaignRepo.find({ where: { createdById: userId }, select: ['id'] });
    ids.push(...created.map(c => c.id));

    // Shared campaigns
    const shared = await this.shareRepo.find({ where: { sharedWithUserId: userId }, select: ['campaignId'] });
    ids.push(...shared.map(s => s.campaignId));

    // Team campaigns (if not super admin - they see through created_by_team tab)
    if (user.role !== 'SUPER_ADMIN') {
      const teamIds = await this.getTeamUserIds(userId, user);
      const teamCampaigns = await this.campaignRepo.find({ 
        where: { createdById: In(teamIds) }, 
        select: ['id'] 
      });
      ids.push(...teamCampaigns.map(c => c.id));
    }

    return [...new Set(ids)];
  }
}
