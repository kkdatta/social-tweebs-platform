import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Between } from 'typeorm';
import {
  Campaign,
  CampaignInfluencer,
  CampaignDeliverable,
  CampaignMetric,
  CampaignPost,
  CampaignShare,
  CampaignStatus,
  InfluencerStatus,
  DeliverableStatus,
  SharePermission,
  PostType,
} from './entities/campaign.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../../common/services/mail.service';
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
  AddPostDto,
  PostFilterDto,
  InfluencerFilterDto,
  TimelineDataPoint,
  MIN_CREDITS_FOR_CAMPAIGN,
} from './dto/campaign.dto';

const CREDIT_PER_CAMPAIGN = 1;
const FREE_CAMPAIGN_QUOTA = 10;

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
    @InjectRepository(CampaignPost)
    private postRepo: Repository<CampaignPost>,
    @InjectRepository(CampaignShare)
    private shareRepo: Repository<CampaignShare>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private creditsService: CreditsService,
    private dataSource: DataSource,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  // ============ CAMPAIGN CRUD ============

  /**
   * Get the client admin ID for a user (for client-level counters).
   */
  private async getClientAdminId(userId: string): Promise<string> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return userId;
    return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? userId : (user.parentId || userId);
  }

  /**
   * Get total campaign count for a client account (lifetime).
   */
  private async getClientCampaignCount(clientAdminId: string): Promise<number> {
    const children = await this.userRepo.find({
      where: { parentId: clientAdminId },
      select: ['id'],
    });
    const allUserIds = [clientAdminId, ...children.map((c) => c.id)];

    return this.campaignRepo.count({
      where: { ownerId: In(allUserIds) },
    });
  }

  async createCampaign(userId: string, dto: CreateCampaignDto): Promise<Campaign> {
    const balanceInfo = await this.creditsService.getBalance(userId);
    const userCredits = balanceInfo.totalBalance || 0;

    // Freemium: first 10 campaigns per client are free, 11+ cost 1 credit
    const clientAdminId = await this.getClientAdminId(userId);
    const campaignCount = await this.getClientCampaignCount(clientAdminId);
    const isFreeQuota = campaignCount < FREE_CAMPAIGN_QUOTA;

    if (userCredits < MIN_CREDITS_FOR_CAMPAIGN) {
      throw new BadRequestException(
        `Minimum ${MIN_CREDITS_FOR_CAMPAIGN} credits required in your account to create a campaign. Current balance: ${userCredits}`,
      );
    }

    if (!isFreeQuota) {
      await this.creditsService.deductCredits(userId, {
        actionType: ActionType.REPORT_GENERATION,
        quantity: CREDIT_PER_CAMPAIGN,
        module: ModuleType.CAMPAIGN_TRACKING,
        resourceId: 'new-campaign',
        resourceType: 'campaign_creation',
      });
    } else {
      this.logger.log(`Campaign freemium: client has ${campaignCount}/${FREE_CAMPAIGN_QUOTA} free campaigns used — this one is FREE`);
    }

    const campaign = new Campaign();
    campaign.name = dto.name;
    campaign.description = dto.description;
    campaign.logoUrl = dto.logoUrl;
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
    campaign.status = CampaignStatus.PENDING;

    const saved = await this.campaignRepo.save(campaign);
    this.logger.log(`Campaign created: ${saved.id} by user ${userId}`);

    return saved;
  }

  async getCampaigns(userId: string, filters: CampaignFilterDto): Promise<CampaignListResponseDto> {
    const { status, platform, objective, search, tab, page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const queryBuilder = this.campaignRepo.createQueryBuilder('campaign')
      .leftJoinAndSelect('campaign.owner', 'owner')
      .leftJoin('campaign.influencers', 'influencers')
      .leftJoin('campaign.posts', 'posts')
      .leftJoin('campaign.deliverables', 'deliverables')
      .addSelect('COUNT(DISTINCT influencers.id)', 'influencer_count')
      .addSelect('COUNT(DISTINCT posts.id)', 'posts_count')
      .addSelect('COUNT(DISTINCT deliverables.id)', 'deliverable_count')
      .groupBy('campaign.id')
      .addGroupBy('owner.id');

    if (tab === 'created_by_me') {
      queryBuilder.where('campaign.createdById = :userId', { userId });
    } else if (tab === 'created_by_team') {
      const teamUserIds = await this.getTeamUserIds(userId, user);
      queryBuilder.where('campaign.createdById IN (:...teamUserIds)', { teamUserIds })
        .andWhere('campaign.createdById != :userId', { userId });
    } else if (tab === 'shared_with_me') {
      queryBuilder.innerJoin('campaign.shares', 'share', 'share.sharedWithUserId = :userId', { userId });
    } else if (tab === 'sample_public') {
      queryBuilder.where('campaign.status = :completedStatus', { completedStatus: CampaignStatus.COMPLETED });
    } else {
      const accessibleIds = await this.getAccessibleCampaignIds(userId, user);
      if (accessibleIds.length > 0) {
        queryBuilder.where('campaign.id IN (:...accessibleIds)', { accessibleIds });
      } else {
        queryBuilder.where('campaign.ownerId = :userId', { userId });
      }
    }

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
        search: `%${search}%`,
      });
    }

    const sortField = ['createdAt', 'name', 'startDate', 'endDate', 'budget'].includes(sortBy)
      ? `campaign.${sortBy}`
      : 'campaign.createdAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(page * limit).take(limit);

    const campaigns = await queryBuilder.getRawAndEntities();

    const campaignSummaries: CampaignSummaryDto[] = campaigns.entities.map((campaign, index) => {
      const raw = campaigns.raw[index];
      return {
        id: campaign.id,
        name: campaign.name,
        logoUrl: campaign.logoUrl,
        platform: campaign.platform,
        status: campaign.status,
        objective: campaign.objective,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        budget: campaign.budget ? Number(campaign.budget) : undefined,
        currency: campaign.currency,
        hashtags: campaign.hashtags,
        influencerCount: parseInt(raw.influencer_count) || 0,
        postsCount: parseInt(raw.posts_count) || 0,
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
      relations: ['owner', 'influencers', 'deliverables', 'posts', 'shares'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.checkCampaignAccess(userId, campaign);

    const metrics = await this.getCampaignMetrics(campaignId);
    const timeline = await this.getTimeline(campaignId);

    const influencers = await this.influencerRepo.find({
      where: { campaignId },
      relations: ['deliverables', 'posts'],
    });

    const deliverables = await this.deliverableRepo.find({
      where: { campaignId },
      relations: ['campaignInfluencer'],
    });

    const posts = await this.postRepo.find({
      where: { campaignId },
      order: { postedDate: 'DESC' },
    });

    return {
      id: campaign.id,
      name: campaign.name,
      logoUrl: campaign.logoUrl,
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
      postsCount: posts.length,
      deliverableCount: deliverables.length,
      createdAt: campaign.createdAt,
      ownerName: campaign.owner?.name,
      influencers: influencers.map(inf => {
        const infPosts = posts.filter(p => p.campaignInfluencerId === inf.id);
        const liveLikes = infPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
        const liveViews = infPosts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
        const liveComments = infPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
        const liveShares = infPosts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);
        const latestPostUrl = infPosts.length > 0 ? infPosts[0]?.postUrl : null;

        return {
          id: inf.id,
          influencerName: inf.influencerName,
          influencerUsername: inf.influencerUsername,
          platform: inf.platform,
          followerCount: inf.followerCount,
          likesCount: liveLikes || inf.likesCount || 0,
          viewsCount: liveViews || inf.viewsCount || 0,
          commentsCount: liveComments || inf.commentsCount || 0,
          sharesCount: liveShares || inf.sharesCount || 0,
          postsCount: infPosts.length || inf.postsCount || 0,
          audienceCredibility: inf.audienceCredibility ? Number(inf.audienceCredibility) : null,
          latestPostUrl,
          status: inf.status,
          budgetAllocated: inf.budgetAllocated ? Number(inf.budgetAllocated) : undefined,
          paymentStatus: inf.paymentStatus,
          paymentAmount: inf.paymentAmount ? Number(inf.paymentAmount) : undefined,
          contractStatus: inf.contractStatus,
          deliverables: inf.deliverables?.length || 0,
          addedAt: inf.addedAt,
        };
      }),
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
      posts: posts.map(p => ({
        id: p.id,
        postUrl: p.postUrl,
        postType: p.postType,
        platform: p.platform,
        influencerName: p.influencerName,
        influencerUsername: p.influencerUsername,
        postImageUrl: p.postImageUrl,
        description: p.description,
        postedDate: p.postedDate,
        followerCount: p.followerCount,
        likesCount: p.likesCount,
        viewsCount: p.viewsCount,
        commentsCount: p.commentsCount,
        sharesCount: p.sharesCount,
        engagementRate: p.engagementRate ? Number(p.engagementRate) : null,
        audienceCredibility: p.audienceCredibility ? Number(p.audienceCredibility) : null,
        isPublished: p.isPublished,
      })),
      metrics,
      timeline,
    };
  }

  async updateCampaign(userId: string, campaignId: string, dto: UpdateCampaignDto): Promise<Campaign> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const wasCompleted = campaign.status === CampaignStatus.COMPLETED;

    Object.assign(campaign, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : campaign.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : campaign.endDate,
    });

    const updated = await this.campaignRepo.save(campaign);
    this.logger.log(`Campaign updated: ${campaignId}`);

    if (!wasCompleted && updated.status === CampaignStatus.COMPLETED) {
      const owner = await this.userRepo.findOne({ where: { id: updated.ownerId } });
      if (owner?.email) {
        await this.mailService.sendReportCompleted(
          owner.email,
          owner.name,
          'Campaign',
          updated.name,
        );
      }
    }

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

  async getInfluencers(userId: string, campaignId: string, filters?: InfluencerFilterDto): Promise<CampaignInfluencer[]> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign);

    const qb = this.influencerRepo.createQueryBuilder('inf')
      .where('inf.campaignId = :campaignId', { campaignId })
      .leftJoinAndSelect('inf.deliverables', 'deliverables')
      .leftJoinAndSelect('inf.posts', 'posts');

    if (filters?.platform) {
      qb.andWhere('inf.platform = :platform', { platform: filters.platform });
    }

    if (filters?.search) {
      qb.andWhere('(inf.influencerName ILIKE :search OR inf.influencerUsername ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.publishStatus === 'published') {
      qb.andWhere('inf.postsCount > 0');
    } else if (filters?.publishStatus === 'unpublished') {
      qb.andWhere('inf.postsCount = 0');
    }

    qb.orderBy('inf.addedAt', 'DESC');

    return qb.getMany();
  }

  async updateInfluencer(userId: string, campaignId: string, influencerId: string, dto: UpdateInfluencerDto): Promise<CampaignInfluencer> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const influencer = await this.influencerRepo.findOne({ where: { id: influencerId, campaignId } });
    if (!influencer) throw new NotFoundException('Influencer not found');

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

  // ============ POSTS MANAGEMENT ============

  async addPost(userId: string, campaignId: string, dto: AddPostDto): Promise<CampaignPost> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const post = this.postRepo.create({
      ...dto,
      campaignId,
      postedDate: dto.postedDate ? new Date(dto.postedDate) : new Date(),
      platform: dto.platform || campaign.platform,
    });

    const saved = await this.postRepo.save(post);

    if (dto.campaignInfluencerId) {
      await this.recalculateInfluencerMetrics(dto.campaignInfluencerId);
    }

    this.logger.log(`Post added to campaign ${campaignId}: ${saved.id}`);
    return saved;
  }

  async getPosts(userId: string, campaignId: string, filters?: PostFilterDto): Promise<{ posts: CampaignPost[]; total: number }> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign);

    const qb = this.postRepo.createQueryBuilder('post')
      .where('post.campaignId = :campaignId', { campaignId });

    if (filters?.platform) {
      qb.andWhere('post.platform = :platform', { platform: filters.platform });
    }

    if (filters?.postType) {
      qb.andWhere('post.postType = :postType', { postType: filters.postType });
    }

    if (filters?.publishStatus === 'published') {
      qb.andWhere('post.isPublished = true');
    } else if (filters?.publishStatus === 'unpublished') {
      qb.andWhere('post.isPublished = false');
    }

    if (filters?.search) {
      qb.andWhere('(post.influencerName ILIKE :search OR post.influencerUsername ILIKE :search OR post.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const sortMap: Record<string, string> = {
      most_liked: 'post.likesCount',
      least_liked: 'post.likesCount',
      most_commented: 'post.commentsCount',
      least_commented: 'post.commentsCount',
      recent: 'post.postedDate',
      oldest: 'post.postedDate',
    };

    const sortField = sortMap[filters?.sortBy || 'most_liked'] || 'post.likesCount';
    const sortDir = ['least_liked', 'least_commented', 'oldest'].includes(filters?.sortBy || '') ? 'ASC' : 'DESC';
    qb.orderBy(sortField, sortDir);

    const total = await qb.getCount();
    const page = filters?.page || 0;
    const limit = filters?.limit || 50;
    qb.skip(page * limit).take(limit);

    const posts = await qb.getMany();
    return { posts, total };
  }

  async removePost(userId: string, campaignId: string, postId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const post = await this.postRepo.findOne({ where: { id: postId, campaignId } });
    if (!post) throw new NotFoundException('Post not found');

    const influencerId = post.campaignInfluencerId;
    await this.postRepo.remove(post);

    if (influencerId) {
      await this.recalculateInfluencerMetrics(influencerId);
    }
  }

  private async recalculateInfluencerMetrics(influencerId: string): Promise<void> {
    const posts = await this.postRepo.find({ where: { campaignInfluencerId: influencerId } });
    const influencer = await this.influencerRepo.findOne({ where: { id: influencerId } });
    if (!influencer) return;

    influencer.postsCount = posts.length;
    influencer.likesCount = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    influencer.viewsCount = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    influencer.commentsCount = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
    influencer.sharesCount = posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);

    await this.influencerRepo.save(influencer);
  }

  // ============ DELIVERABLES MANAGEMENT ============

  async createDeliverable(userId: string, campaignId: string, dto: CreateDeliverableDto): Promise<CampaignDeliverable> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const influencer = await this.influencerRepo.findOne({
      where: { id: dto.campaignInfluencerId, campaignId },
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

  // ============ METRICS & TIMELINE ============

  async recordMetrics(userId: string, campaignId: string, dto: RecordMetricsDto): Promise<CampaignMetric> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

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
    const posts = await this.postRepo.find({ where: { campaignId } });

    const totalSpent = influencers.reduce((sum, inf) => sum + (Number(inf.paymentAmount) || 0), 0);
    const budget = campaign?.budget ? Number(campaign.budget) : 0;

    const totalLikes = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.likesCount || 0), 0)
      : metrics.reduce((sum, m) => sum + (m.likes || 0), 0);

    const totalComments = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0)
      : metrics.reduce((sum, m) => sum + (m.comments || 0), 0);

    const totalShares = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0)
      : metrics.reduce((sum, m) => sum + (m.shares || 0), 0);

    const totalViews = posts.length > 0
      ? posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0)
      : metrics.reduce((sum, m) => sum + (m.views || 0), 0);

    const totalEngagement = totalLikes + totalComments + totalShares;
    const avgEngagementRate = posts.length > 0 && totalViews > 0
      ? (totalEngagement / totalViews) * 100
      : metrics.length > 0
        ? metrics.reduce((sum, m) => sum + (Number(m.engagementRate) || 0), 0) / metrics.length
        : 0;

    const engagementToViewsRatio = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;

    return {
      totalInfluencers: influencers.length,
      totalPosts: posts.length,
      totalImpressions: metrics.reduce((sum, m) => sum + (m.impressions || 0), 0),
      totalReach: metrics.reduce((sum, m) => sum + (m.reach || 0), 0),
      totalLikes,
      totalComments,
      totalShares,
      totalViews,
      totalClicks: metrics.reduce((sum, m) => sum + (m.clicks || 0), 0),
      avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
      engagementToViewsRatio: Math.round(engagementToViewsRatio * 100) / 100,
      totalSpent,
      budgetUtilization: budget > 0 ? (totalSpent / budget) * 100 : 0,
    };
  }

  async getTimeline(campaignId: string): Promise<TimelineDataPoint[]> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) return [];

    const posts = await this.postRepo.find({
      where: { campaignId },
      order: { postedDate: 'ASC' },
    });

    const startDate = campaign.startDate || campaign.createdAt;
    const endDate = campaign.endDate || new Date();
    const dateMap: Record<string, { posts: number; likes: number; views: number; comments: number; shares: number; engagement: number }> = {};

    let current = new Date(startDate);
    while (current <= endDate) {
      const key = current.toISOString().split('T')[0];
      dateMap[key] = { posts: 0, likes: 0, views: 0, comments: 0, shares: 0, engagement: 0 };
      current.setDate(current.getDate() + 1);
    }

    for (const post of posts) {
      if (post.postedDate) {
        const key = new Date(post.postedDate).toISOString().split('T')[0];
        if (dateMap[key]) {
          dateMap[key].posts++;
          dateMap[key].likes += Number(post.likesCount) || 0;
          dateMap[key].views += Number(post.viewsCount) || 0;
          dateMap[key].comments += Number(post.commentsCount) || 0;
          dateMap[key].shares += Number(post.sharesCount) || 0;
          dateMap[key].engagement += Number(post.engagementRate) || 0;
        }
      }
    }

    return Object.entries(dateMap).map(([date, data]) => ({
      date,
      posts: data.posts,
      likes: data.likes,
      views: data.views,
      comments: data.comments,
      shares: data.shares,
      engagement: data.posts > 0 ? Math.round((data.engagement / data.posts) * 100) / 100 : 0,
    }));
  }

  async getAnalytics(userId: string, campaignId: string): Promise<any> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign);

    const influencers = await this.influencerRepo.find({
      where: { campaignId },
      relations: ['posts'],
    });
    const posts = await this.postRepo.find({ where: { campaignId } });
    const metrics = await this.getCampaignMetrics(campaignId);

    const influencerAnalytics = influencers.map(inf => {
      const infPosts = posts.filter(p => p.campaignInfluencerId === inf.id);
      const infLikes = infPosts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
      const infViews = infPosts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
      const infComments = infPosts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);

      return {
        influencerId: inf.id,
        influencerName: inf.influencerName,
        influencerUsername: inf.influencerUsername,
        platform: inf.platform,
        followerCount: inf.followerCount,
        postsCount: infPosts.length,
        avgLikesCampaign: metrics.totalPosts > 0 ? metrics.totalLikes / metrics.totalPosts : 0,
        avgLikesInfluencer: infPosts.length > 0 ? infLikes / infPosts.length : 0,
        avgViewsCampaign: metrics.totalPosts > 0 ? metrics.totalViews / metrics.totalPosts : 0,
        avgViewsInfluencer: infPosts.length > 0 ? infViews / infPosts.length : 0,
        avgCommentsCampaign: metrics.totalPosts > 0 ? metrics.totalComments / metrics.totalPosts : 0,
        avgCommentsInfluencer: infPosts.length > 0 ? infComments / infPosts.length : 0,
        likesPercentage: metrics.totalLikes > 0 ? (infLikes / metrics.totalLikes) * 100 : 0,
        viewsPercentage: metrics.totalViews > 0 ? (infViews / metrics.totalViews) * 100 : 0,
        commentsPercentage: metrics.totalComments > 0 ? (infComments / metrics.totalComments) * 100 : 0,
        audienceCredibility: inf.audienceCredibility ? Number(inf.audienceCredibility) : null,
        posts: infPosts.map(p => ({
          id: p.id,
          postUrl: p.postUrl,
          postType: p.postType,
          postedDate: p.postedDate,
          likesCount: p.likesCount,
          viewsCount: p.viewsCount,
          commentsCount: p.commentsCount,
          sharesCount: p.sharesCount,
          engagementRate: p.engagementRate ? Number(p.engagementRate) : null,
        })),
      };
    });

    return {
      campaignMetrics: metrics,
      audienceOverview: {
        genderDistribution: { male: 55, female: 42, other: 3 },
        ageDistribution: [
          { range: '13-17', male: 5, female: 8 },
          { range: '18-24', male: 25, female: 22 },
          { range: '25-34', male: 30, female: 28 },
          { range: '35-44', male: 18, female: 15 },
          { range: '45-54', male: 10, female: 8 },
          { range: '55+', male: 7, female: 5 },
        ],
        topCountries: [
          { country: 'India', audience: 45, likes: 40, views: 42 },
          { country: 'United States', audience: 15, likes: 18, views: 16 },
          { country: 'United Kingdom', audience: 8, likes: 10, views: 9 },
          { country: 'Canada', audience: 5, likes: 6, views: 5 },
          { country: 'Australia', audience: 4, likes: 5, views: 4 },
        ],
        topCities: [
          { city: 'Mumbai', audience: 12, likes: 11, views: 10 },
          { city: 'Delhi', audience: 10, likes: 9, views: 8 },
          { city: 'Bangalore', audience: 8, likes: 7, views: 7 },
          { city: 'New York', audience: 5, likes: 6, views: 5 },
          { city: 'London', audience: 4, likes: 5, views: 4 },
        ],
      },
      influencerAnalytics,
    };
  }

  async getCreditNotification(userId: string): Promise<{ showWarning: boolean; message: string; balance: number }> {
    const balanceInfo = await this.creditsService.getBalance(userId);
    const balance = balanceInfo.totalBalance || 0;
    if (balance < MIN_CREDITS_FOR_CAMPAIGN) {
      return {
        showWarning: true,
        message: `Low credit balance! You need at least ${MIN_CREDITS_FOR_CAMPAIGN} credits to create a campaign. Current balance: ${balance}`,
        balance,
      };
    }
    if (balance < 10) {
      return {
        showWarning: true,
        message: `Your credit balance is running low (${balance} credits remaining). Consider requesting more credits.`,
        balance,
      };
    }
    return { showWarning: false, message: '', balance };
  }

  // ============ SHARING ============

  async shareCampaign(userId: string, campaignId: string, dto: ShareCampaignDto): Promise<CampaignShare> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'admin');

    const existing = await this.shareRepo.findOne({
      where: { campaignId, sharedWithUserId: dto.sharedWithUserId },
    });

    if (existing) {
      existing.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
      return this.shareRepo.save(existing);
    }

    const share = this.shareRepo.create({
      campaignId,
      sharedWithUserId: dto.sharedWithUserId,
      sharedByUserId: userId,
      permissionLevel: dto.permissionLevel || SharePermission.VIEW,
    });

    const saved = await this.shareRepo.save(share);

    const sharedWith = await this.userRepo.findOne({ where: { id: dto.sharedWithUserId } });
    const sharedBy = await this.userRepo.findOne({ where: { id: userId } });
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'http://localhost:5173';
    const shareUrl = `${frontendUrl.replace(/\/$/, '')}/campaigns/${campaignId}`;

    if (sharedWith?.email) {
      await this.mailService.sendReportShared(
        sharedWith.email,
        sharedBy?.name || 'Someone',
        'Campaign',
        campaign.name,
        shareUrl,
      );
    }

    return saved;
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

    const statusCounts = await this.campaignRepo
      .createQueryBuilder('campaign')
      .select('campaign.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('campaign.status')
      .getRawMany();

    const influencerStats = await this.influencerRepo
      .createQueryBuilder('inf')
      .select('inf.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('inf.campaign', 'campaign')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('inf.status')
      .getRawMany();

    const deliverableStats = await this.deliverableRepo
      .createQueryBuilder('del')
      .select('del.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('del.campaign', 'campaign')
      .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId',
        accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
      .groupBy('del.status')
      .getRawMany();

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

  // ============ EXPORT ============

  async getReportData(userId: string, campaignId: string, reportType: 'basic' | 'advanced' = 'basic'): Promise<any> {
    const detail = await this.getCampaignById(userId, campaignId);
    const analytics = reportType === 'advanced' ? await this.getAnalytics(userId, campaignId) : null;

    return {
      campaign: {
        name: detail.name,
        platform: detail.platform,
        status: detail.status,
        startDate: detail.startDate,
        endDate: detail.endDate,
        hashtags: detail.hashtags,
      },
      metrics: detail.metrics,
      influencers: detail.influencers,
      posts: detail.posts,
      timeline: detail.timeline,
      analytics,
    };
  }

  // ============ HELPER METHODS ============

  private async checkCampaignAccess(userId: string, campaign: Campaign, level: 'view' | 'edit' | 'admin' = 'view'): Promise<void> {
    if (campaign.ownerId === userId || campaign.createdById === userId) return;

    const share = await this.shareRepo.findOne({
      where: { campaignId: campaign.id, sharedWithUserId: userId },
    });

    if (!share) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const owner = await this.userRepo.findOne({ where: { id: campaign.ownerId } });

      if (user?.parentId === owner?.id || owner?.parentId === user?.id || user?.parentId === owner?.parentId) {
        if (level !== 'view') {
          throw new ForbiddenException('You do not have permission to modify this campaign');
        }
        return;
      }

      throw new ForbiddenException('You do not have access to this campaign');
    }

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
      const allUsers = await this.userRepo.find({ select: ['id'] });
      return allUsers.map(u => u.id);
    }

    if (user.parentId) {
      const siblings = await this.userRepo.find({ where: { parentId: user.parentId }, select: ['id'] });
      ids.push(...siblings.map(s => s.id));
      ids.push(user.parentId);
    }

    const children = await this.userRepo.find({ where: { parentId: userId }, select: ['id'] });
    ids.push(...children.map(c => c.id));

    return [...new Set(ids)];
  }

  private async getAccessibleCampaignIds(userId: string, user: User): Promise<string[]> {
    const ids: string[] = [];

    const owned = await this.campaignRepo.find({ where: { ownerId: userId }, select: ['id'] });
    ids.push(...owned.map(c => c.id));

    const created = await this.campaignRepo.find({ where: { createdById: userId }, select: ['id'] });
    ids.push(...created.map(c => c.id));

    const shared = await this.shareRepo.find({ where: { sharedWithUserId: userId }, select: ['campaignId'] });
    ids.push(...shared.map(s => s.campaignId));

    if (user.role !== 'SUPER_ADMIN') {
      const teamIds = await this.getTeamUserIds(userId, user);
      const teamCampaigns = await this.campaignRepo.find({
        where: { createdById: In(teamIds) },
        select: ['id'],
      });
      ids.push(...teamCampaigns.map(c => c.id));
    }

    return [...new Set(ids)];
  }
}
