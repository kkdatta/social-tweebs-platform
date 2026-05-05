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
import { InfluencerInsight } from '../insights/entities/influencer-insight.entity';
import { ModashService } from '../discovery/services/modash.service';
import { ModashRawService } from '../discovery/services/modash-raw.service';
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
    @InjectRepository(InfluencerInsight)
    private insightRepo: Repository<InfluencerInsight>,
    private modashService: ModashService,
    private modashRawService: ModashRawService,
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

    if (saved.hashtags?.length || saved.mentions?.length) {
      setTimeout(() => this.processCampaign(saved.id).catch(err =>
        this.logger.error(`Campaign processing failed for ${saved.id}: ${err.message}`),
      ), 2000);
    }

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

    const staleIds: string[] = [];
    const campaignSummaries: CampaignSummaryDto[] = campaigns.entities.map((campaign, index) => {
      const raw = campaigns.raw[index];
      const liveStatus = this.computeCampaignStatus(campaign);
      if (liveStatus !== campaign.status) staleIds.push(campaign.id);
      return {
        id: campaign.id,
        name: campaign.name,
        logoUrl: campaign.logoUrl,
        platform: campaign.platform,
        status: liveStatus,
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

    if (staleIds.length > 0) {
      for (const c of campaigns.entities) {
        const live = this.computeCampaignStatus(c);
        if (live !== c.status) {
          c.status = live;
          await this.campaignRepo.save(c);
        }
      }
    }

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

    const liveStatus = this.computeCampaignStatus(campaign);
    if (liveStatus !== campaign.status) {
      campaign.status = liveStatus;
      await this.campaignRepo.save(campaign);
    }

    return {
      id: campaign.id,
      name: campaign.name,
      logoUrl: campaign.logoUrl,
      description: campaign.description,
      platform: campaign.platform,
      status: liveStatus,
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
          profilePictureUrl: inf.profilePictureUrl || null,
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

    let cleanUsername = (dto.influencerUsername || dto.influencerName || '').replace(/^@/, '').trim();
    const urlMatch = cleanUsername.match(/(?:instagram\.com|tiktok\.com\/@?|youtube\.com\/@?)([^/?#\s]+)/i);
    if (urlMatch) cleanUsername = urlMatch[1];

    const influencer = this.influencerRepo.create({
      ...dto,
      influencerName: cleanUsername,
      influencerUsername: cleanUsername,
      campaignId,
      status: InfluencerStatus.INVITED,
    });

    const saved = await this.influencerRepo.save(influencer);
    this.logger.log(`Influencer added to campaign ${campaignId}: ${saved.id}`);

    setTimeout(() => this.enrichInfluencer(saved, campaign.platform, userId).catch(err =>
      this.logger.warn(`Influencer enrichment failed for ${saved.id}: ${err.message}`),
    ), 500);

    return saved;
  }

  private async enrichInfluencer(influencer: CampaignInfluencer, platform: string, userId: string): Promise<void> {
    const username = (influencer.influencerUsername || '').replace(/^@/, '');
    if (!username) return;

    let enriched = false;
    try {
      const insight = await this.insightRepo.findOne({ where: { username } });
      if (insight && Number(insight.followerCount) > 0) {
        influencer.influencerName = insight.fullName || insight.username || username;
        influencer.followerCount = Number(insight.followerCount);
        influencer.audienceCredibility = insight.audienceCredibility
          ? Number(insight.audienceCredibility) : (undefined as any);
        enriched = true;
      }
    } catch { /* fall through to Modash */ }

    if (!enriched && this.modashService.isModashEnabled()) {
      try {
        const platformType = (platform?.toUpperCase() || 'INSTAGRAM') as any;
        const report = await this.modashService.getInfluencerReport(platformType, username, userId);
        if (report) {
          const rpt = report as any;
          const profile = rpt.profile || rpt;
          influencer.influencerName = profile.fullname || profile.username || username;
          influencer.followerCount = Number(profile.followers) || 0;
          influencer.profilePictureUrl = profile.picture || profile.profilePicture || '';
          const aud = rpt.audience;
          const rawCred = aud?.credibility != null ? Number(aud.credibility) : NaN;
          influencer.audienceCredibility = !isNaN(rawCred) && rawCred > 0
            ? Math.round((rawCred <= 1 ? rawCred * 100 : rawCred) * 10) / 10
            : (undefined as any);
        }
      } catch (err) {
        this.logger.warn(`Modash profile fetch failed for "${username}": ${err.message}`);
      }
    }

    if (!influencer.profilePictureUrl && this.modashRawService.isRawApiEnabled()) {
      try {
        const userInfo: any = await this.modashRawService.getIgUserInfo(username);
        if (userInfo?.profile_pic_url) {
          influencer.profilePictureUrl = userInfo.profile_pic_url_hd || userInfo.profile_pic_url;
        }
        if (!influencer.influencerName || influencer.influencerName === username) {
          influencer.influencerName = userInfo?.full_name || username;
        }
      } catch { /* best effort */ }
    }

    await this.influencerRepo.save(influencer);

    // Link any orphan posts in this campaign that match the influencer username
    await this.postRepo.createQueryBuilder().update(CampaignPost)
      .set({ campaignInfluencerId: influencer.id })
      .where('campaignId = :cid AND LOWER(influencerUsername) = LOWER(:uname) AND campaignInfluencerId IS NULL',
        { cid: influencer.campaignId, uname: username })
      .execute();

    await this.recalculateInfluencerMetrics(influencer.id);
    this.logger.log(`Influencer "${username}" enriched: followers=${influencer.followerCount}`);
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

  async addPost(userId: string, campaignId: string, dto: AddPostDto): Promise<{ post: CampaignPost; warning?: string }> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    await this.checkCampaignAccess(userId, campaign, 'edit');

    const parsed = this.parsePostUrl(dto.postUrl);
    const normalizedUrl = this.normalizePostUrl(dto.postUrl, parsed);

    const existingPost = await this.postRepo.findOne({ where: { campaignId, postUrl: normalizedUrl } });
    if (existingPost) {
      return { post: existingPost, warning: 'This post has already been added to the campaign.' };
    }

    let linkedInfluencerId = dto.campaignInfluencerId || null;

    if (!linkedInfluencerId && parsed.username) {
      const matchingInf = await this.influencerRepo.findOne({
        where: { campaignId, influencerUsername: parsed.username },
      });
      if (matchingInf) linkedInfluencerId = matchingInf.id;
    }

    const post = this.postRepo.create({
      ...dto,
      postUrl: normalizedUrl,
      campaignId,
      campaignInfluencerId: linkedInfluencerId,
      influencerUsername: dto.influencerUsername || parsed.username || null,
      influencerName: dto.influencerName || parsed.username || null,
      postedDate: dto.postedDate ? new Date(dto.postedDate) : new Date(),
      platform: dto.platform || campaign.platform,
    } as any);

    const saved = await this.postRepo.save(post) as unknown as CampaignPost;

    if (linkedInfluencerId) {
      await this.recalculateInfluencerMetrics(linkedInfluencerId);
    }

    this.logger.log(`Post added to campaign ${campaignId}: ${saved.id}`);

    let warning: string | undefined;

    const searchTerms = [...(campaign.hashtags || []), ...(campaign.mentions || [])];
    if (searchTerms.length > 0) {
      const enrichedPost = await this.enrichAndValidatePost(saved, campaign, userId);
      if (enrichedPost?.mismatch) {
        warning = `This post may not be related to the campaign. Campaign tracks: ${searchTerms.join(', ')}. No matching hashtags or mentions found in the post content.`;
        this.logger.warn(`Post ${saved.id} does not match campaign keywords: ${searchTerms.join(', ')}`);
      }
    } else {
      setTimeout(() => this.enrichPost(saved, campaign.platform, userId).catch(err =>
        this.logger.warn(`Post enrichment failed for ${saved.id}: ${err.message}`),
      ), 500);
    }

    return { post: saved, warning };
  }

  private async enrichAndValidatePost(
    post: CampaignPost,
    campaign: Campaign,
    userId: string,
  ): Promise<{ mismatch: boolean } | null> {
    try {
      await this.enrichPost(post, campaign.platform, userId);
    } catch { /* enrichment is best-effort */ }

    const searchTerms = [...(campaign.hashtags || []), ...(campaign.mentions || [])];
    if (searchTerms.length === 0) return null;

    const keywords = searchTerms.map(t => t.replace(/^[@#]/, '').toLowerCase());
    const description = (post.description || '').toLowerCase();

    const matches = keywords.some(kw => description.includes(kw));
    return { mismatch: !matches };
  }

  private parsePostUrl(url: string): { postId: string | null; username: string | null; platform: string | null } {
    if (!url) return { postId: null, username: null, platform: null };
    try {
      const u = new URL(url);
      if (u.hostname.includes('instagram.com')) {
        const match = url.match(/instagram\.com\/(?:p|reel)\/([^/?]+)/);
        const userMatch = url.match(/instagram\.com\/([^/?]+)/);
        return { postId: match?.[1] || null, username: null, platform: 'INSTAGRAM' };
      }
      if (u.hostname.includes('tiktok.com')) {
        const match = url.match(/tiktok\.com\/@([^/?]+)\/video\/(\d+)/);
        return { postId: match?.[2] || null, username: match?.[1] || null, platform: 'TIKTOK' };
      }
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        const match = url.match(/(?:v=|youtu\.be\/)([^&?]+)/);
        return { postId: match?.[1] || null, username: null, platform: 'YOUTUBE' };
      }
    } catch { /* invalid URL */ }
    return { postId: null, username: null, platform: null };
  }

  private async enrichPost(post: CampaignPost, campaignPlatform: string, userId: string): Promise<void> {
    if (!post.postUrl || !this.modashService.isModashEnabled()) return;

    const parsed = this.parsePostUrl(post.postUrl);
    if (!parsed.postId) return;

    let username: string | null = post.influencerUsername || parsed.username;

    // If no username, try Raw API to get post data directly by shortcode
    const shortcode = parsed.postId;
    if (!username && shortcode && this.modashRawService.isRawApiEnabled()) {
      try {
        const rawMedia: any = await this.modashRawService.getIgMediaInfo(shortcode);
        const item = rawMedia?.items?.[0] || rawMedia;
        if (item?.user?.username) {
          username = item.user.username as string;
          post.influencerUsername = username!;
          post.influencerName = item.user?.full_name || username;
          post.likesCount = item.like_count || 0;
          post.commentsCount = item.comment_count || 0;
          post.viewsCount = item.play_count || item.video_view_count || item.view_count || 0;
          post.description = item.caption?.text || post.description;
          post.postImageUrl = item.display_url || item.image_versions2?.candidates?.[0]?.url || post.postImageUrl;
          if (item.taken_at) {
            post.postedDate = new Date(item.taken_at * 1000);
          }
          post.postType = item.media_type === 2 ? PostType.POST : PostType.POST;

          // Get follower count via user-info
          try {
            const userInfo: any = await this.modashRawService.getIgUserInfo(username!);
            if (userInfo?.follower_count) {
              post.followerCount = userInfo.follower_count;
            }
          } catch { /* fallback below */ }

          const fc = post.followerCount || 0;
          if (fc > 0 && (post.likesCount || post.commentsCount)) {
            post.engagementRate = Math.min(((post.likesCount + post.commentsCount) / fc) * 100, 100);
          }

          // Link to campaign influencer if matching username exists
          if (!post.campaignInfluencerId && username) {
            const matchingInf = await this.influencerRepo.findOne({
              where: { campaignId: post.campaignId, influencerUsername: username! },
            });
            if (matchingInf) {
              post.campaignInfluencerId = matchingInf.id;
            }
          }

          await this.postRepo.save(post);
          if (post.campaignInfluencerId) {
            await this.recalculateInfluencerMetrics(post.campaignInfluencerId);
          }
          this.logger.log(`Post ${post.id} enriched via Raw API: likes=${post.likesCount}, views=${post.viewsCount}, user=${username}`);
          return;
        }
      } catch (rawErr) {
        this.logger.warn(`Raw API media-info failed for ${post.id}: ${rawErr.message}`);
      }
    }

    if (!username) {
      this.logger.warn(`Cannot enrich post ${post.id}: no username`);
      return;
    }

    try {
      const platformType = (campaignPlatform?.toUpperCase() || 'INSTAGRAM') as any;
      const report = await this.modashService.getInfluencerReport(platformType, username, userId);
      if (!report) return;

      const rpt = report as any;
      const profile = rpt.profile || rpt;
      const allPosts = [
        ...(profile.recentPosts || rpt.recentPosts || []),
        ...(profile.topPosts || rpt.topPosts || []),
        ...(profile.popularPosts || rpt.popularPosts || []),
      ];

      const matchedPost = allPosts.find((p: any) => {
        const pid = p.postId || p.id || p.url || '';
        return pid.includes(parsed.postId) || (p.url && p.url.includes(parsed.postId));
      });

      if (matchedPost) {
        post.likesCount = matchedPost.likes || matchedPost.stat?.likes || 0;
        post.commentsCount = matchedPost.comments || matchedPost.stat?.comments || 0;
        post.viewsCount = matchedPost.views || matchedPost.plays || matchedPost.stat?.views || 0;
        post.sharesCount = matchedPost.shares || matchedPost.stat?.shares || 0;
        post.description = matchedPost.text || matchedPost.title || matchedPost.description || post.description;
        post.postImageUrl = matchedPost.thumbnail || matchedPost.image || post.postImageUrl;
        if (matchedPost.created) {
          post.postedDate = new Date(matchedPost.created > 1e12 ? matchedPost.created : matchedPost.created * 1000);
        }
      }

      post.influencerName = profile.fullname || profile.username || username;
      post.influencerUsername = username;
      post.followerCount = Number(profile.followers) || 0;

      const fc = post.followerCount || 0;
      if (fc > 0 && (post.likesCount || post.commentsCount)) {
        post.engagementRate = Math.min(((post.likesCount + post.commentsCount) / fc) * 100, 100);
      }

      await this.postRepo.save(post);

      if (post.campaignInfluencerId) {
        await this.recalculateInfluencerMetrics(post.campaignInfluencerId);
      }

      this.logger.log(`Post ${post.id} enriched: likes=${post.likesCount}, views=${post.viewsCount}`);
    } catch (err) {
      this.logger.warn(`Post enrichment via Modash failed for ${post.id}: ${err.message}`);
    }
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

    if ((!influencer.followerCount || influencer.followerCount === 0) && posts.length > 0) {
      const maxFc = Math.max(...posts.map(p => p.followerCount || 0));
      if (maxFc > 0) influencer.followerCount = maxFc;
    }

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

    const startDate = new Date(campaign.startDate || campaign.createdAt);
    const endDate = new Date(campaign.endDate || new Date());
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

  // ============ CAMPAIGN PROCESSING (Modash Integration) ============

  async processCampaign(campaignId: string): Promise<void> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) return;

    try {
      campaign.status = CampaignStatus.ACTIVE;
      await this.campaignRepo.save(campaign);
      this.logger.log(`Processing campaign ${campaignId}: "${campaign.name}"`);

      const platformType = (campaign.platform?.toUpperCase() || 'INSTAGRAM') as any;
      const searchTerms = [...(campaign.hashtags || []), ...(campaign.mentions || [])];
      const searchKeywords = searchTerms.map(t => t.replace(/^[@#]/, '').toLowerCase());
      const startMs = campaign.startDate ? new Date(campaign.startDate).getTime() : 0;
      const endMs = campaign.endDate ? new Date(campaign.endDate).getTime() : Date.now();

      const existingInfluencers = await this.influencerRepo.find({ where: { campaignId } });
      const existingPostUrls = new Set(
        (await this.postRepo.find({ where: { campaignId }, select: ['postUrl'] })).map(p => p.postUrl),
      );

      for (const inf of existingInfluencers) {
        const username = (inf.influencerUsername || '').replace(/^@/, '');
        if (!username) continue;

        this.logger.log(`Campaign ${campaignId}: processing influencer "${username}"`);

        let report: any = null;
        try {
          const insight = await this.insightRepo.findOne({ where: { username } });
          if (insight && Number(insight.followerCount) > 0) {
            inf.influencerName = insight.fullName || insight.username || username;
            inf.followerCount = Number(insight.followerCount);
            inf.audienceCredibility = insight.audienceCredibility
              ? Number(insight.audienceCredibility) : (undefined as any);
          }
        } catch { /* fall through */ }

        if (this.modashService.isModashEnabled()) {
          try {
            report = await this.modashService.getInfluencerReport(platformType, username, campaign.ownerId);
            if (report) {
              const profile = report.profile || report;
              inf.influencerName = profile.fullname || profile.username || inf.influencerName || username;
              inf.followerCount = Number(profile.followers) || inf.followerCount || 0;
              const aud = report.audience;
              const rawCred = aud?.credibility != null ? Number(aud.credibility) : NaN;
              if (!isNaN(rawCred) && rawCred > 0) {
                inf.audienceCredibility = Math.round((rawCred <= 1 ? rawCred * 100 : rawCred) * 10) / 10;
              }
            }
          } catch (err) {
            this.logger.warn(`Campaign ${campaignId}: report fetch failed for "${username}": ${err.message}`);
          }
        }

        const allPosts: any[] = [];
        if (report) {
          const profile = report.profile || report;
          allPosts.push(
            ...(profile.recentPosts || report.recentPosts || []),
            ...(profile.topPosts || report.topPosts || []),
            ...(profile.popularPosts || report.popularPosts || []),
          );
        }

        const seenIds = new Set<string>();
        let addedPosts = 0;
        let totalLikes = 0, totalViews = 0, totalComments = 0, totalShares = 0;

        for (const post of allPosts) {
          const postId = post.postId || post.id || post.code || '';
          if (!postId || seenIds.has(postId)) continue;
          seenIds.add(postId);

          const postUrl = this.constructPostUrl(postId, username, campaign.platform);
          if (existingPostUrls.has(postUrl)) continue;

          const text = (post.text || post.title || post.description || '').toLowerCase();
          const hashtags = (post.hashtags || []).map((h: string) => h.toLowerCase().replace(/^#/, ''));
          const mentions = (post.mentions || []).map((m: string) => m.toLowerCase().replace(/^@/, ''));

          const matchesSearch = searchKeywords.length === 0 || searchKeywords.some(kw =>
            text.includes(kw) || hashtags.includes(kw) || mentions.includes(kw),
          );

          const postCreated = post.created
            ? (post.created > 1e12 ? post.created : post.created * 1000)
            : 0;
          const withinDateRange = !postCreated || (postCreated >= startMs && postCreated <= endMs);

          if (!matchesSearch || !withinDateRange) continue;

          const likes = post.likes || post.stat?.likes || 0;
          const comments = post.comments || post.stat?.comments || 0;
          const views = post.views || post.plays || post.stat?.views || 0;
          const shares = post.shares || post.stat?.shares || 0;

          try {
            const alreadyExists = await this.postRepo.findOne({ where: { campaignId, postUrl } });
            if (alreadyExists) { existingPostUrls.add(postUrl); continue; }

            const dbPost = this.postRepo.create({
              campaignId,
              campaignInfluencerId: inf.id,
              postUrl,
              postType: PostType.POST,
              platform: campaign.platform,
              influencerName: inf.influencerName || username,
              influencerUsername: username,
              postImageUrl: post.thumbnail || post.image || '',
              description: post.text || post.title || post.description || '',
              postedDate: postCreated ? new Date(postCreated) : new Date(),
              followerCount: inf.followerCount || 0,
              likesCount: likes,
              viewsCount: views,
              commentsCount: comments,
              sharesCount: shares,
              engagementRate: undefined as any,
              isPublished: true,
            } as any);
            await this.postRepo.save(dbPost);
            existingPostUrls.add(postUrl);
            addedPosts++;
            totalLikes += likes;
            totalViews += views;
            totalComments += comments;
            totalShares += shares;
          } catch (postErr) {
            this.logger.warn(`Failed to save post ${postId}: ${postErr.message}`);
          }
        }

        inf.postsCount = (inf.postsCount || 0) + addedPosts;
        inf.likesCount = (inf.likesCount || 0) + totalLikes;
        inf.viewsCount = (inf.viewsCount || 0) + totalViews;
        inf.commentsCount = (inf.commentsCount || 0) + totalComments;
        inf.sharesCount = (inf.sharesCount || 0) + totalShares;
        inf.status = InfluencerStatus.ACTIVE;

        await this.influencerRepo.save(inf);
        this.logger.log(`Campaign ${campaignId}: "${username}" — ${addedPosts} new posts, followers=${inf.followerCount}`);

        const fc = inf.followerCount || 0;
        if (fc > 0 && inf.postsCount > 0) {
          const infER = Math.min(((inf.likesCount + inf.commentsCount) / (inf.postsCount * fc)) * 100, 999.99);
          await this.postRepo
            .createQueryBuilder()
            .update(CampaignPost)
            .set({ followerCount: fc, engagementRate: infER })
            .where('campaignInfluencerId = :infId', { infId: inf.id })
            .execute();
        }
      }

      // Auto-discover posts via hashtag feed (Raw API)
      if (this.modashRawService.isRawApiEnabled() && searchTerms.length > 0) {
        this.logger.log(`Campaign ${campaignId}: auto-discovering posts via hashtag feed`);
        const discoveredPosts: Array<{ username: string; postId: string; likes: number; comments: number; views: number; shares: number; text: string; thumbnail: string; timestamp: number }> = [];

        for (const term of searchTerms) {
          try {
            if (term.startsWith('#')) {
              const tag = term.replace(/^#/, '');
              if (platformType === 'INSTAGRAM' || platformType === 'MULTI') {
                const feed = await this.modashRawService.getIgHashtagFeed(tag);
                for (const p of (feed.data || (feed as any).items || [])) {
                  const ts = (p.taken_at || 0) * 1000;
                  if (ts >= startMs && ts <= endMs) {
                    const code = (p as any).code || '';
                    const postUrl = `https://www.instagram.com/p/${code}/`;
                    if (!existingPostUrls.has(postUrl) && code) {
                      discoveredPosts.push({
                        username: (p as any).user?.username || '',
                        postId: code,
                        likes: (p as any).like_count || 0,
                        comments: (p as any).comment_count || 0,
                        views: (p as any).play_count || (p as any).video_view_count || 0,
                        shares: 0,
                        text: (p as any).caption?.text || '',
                        thumbnail: (p as any).display_url || (p as any).image_versions2?.candidates?.[0]?.url || '',
                        timestamp: ts,
                      });
                      existingPostUrls.add(postUrl);
                    }
                  }
                }
              }
            }
          } catch (termErr) {
            this.logger.warn(`Campaign ${campaignId}: hashtag feed failed for "${term}": ${termErr.message}`);
          }
        }

        const infMap = new Map<string, CampaignInfluencer>();
        for (const inf of existingInfluencers) {
          infMap.set(inf.influencerUsername?.toLowerCase() || '', inf);
        }

        for (const dp of discoveredPosts) {
          if (!dp.username) continue;
          const key = dp.username.toLowerCase();
          let inf = infMap.get(key);

          if (!inf) {
            const existingDbInf = await this.influencerRepo.findOne({
              where: { campaignId, influencerUsername: dp.username },
            });
            if (existingDbInf) {
              inf = existingDbInf;
              infMap.set(key, inf);
            } else {
              let followerCount = 0;
              let profilePicUrl = '';
              let displayName = dp.username;
              try {
                const userInfo: any = await this.modashRawService.getIgUserInfo(dp.username);
                if (userInfo?.follower_count) followerCount = userInfo.follower_count;
                if (userInfo?.profile_pic_url) profilePicUrl = userInfo.profile_pic_url;
                if (userInfo?.profile_pic_url_hd) profilePicUrl = userInfo.profile_pic_url_hd;
                if (userInfo?.full_name) displayName = userInfo.full_name;
              } catch { /* best effort */ }

              const newInf = this.influencerRepo.create({
                campaignId,
                influencerName: displayName,
                influencerUsername: dp.username,
                platform: 'INSTAGRAM',
                status: InfluencerStatus.ACTIVE,
                followerCount,
                profilePictureUrl: profilePicUrl,
                likesCount: 0, viewsCount: 0, commentsCount: 0, sharesCount: 0, postsCount: 0,
              } as any);
              inf = await this.influencerRepo.save(newInf) as unknown as CampaignInfluencer;
              infMap.set(key, inf);
            }
          }

          const postUrl = `https://www.instagram.com/p/${dp.postId}/`;
          try {
            const alreadyExists = await this.postRepo.findOne({ where: { campaignId, postUrl } });
            if (alreadyExists) continue;

            const dbPost = this.postRepo.create({
              campaignId,
              campaignInfluencerId: inf.id,
              postUrl,
              postType: PostType.POST,
              platform: campaign.platform,
              influencerName: inf.influencerName || dp.username,
              influencerUsername: dp.username,
              postImageUrl: dp.thumbnail,
              description: dp.text,
              postedDate: dp.timestamp ? new Date(dp.timestamp) : new Date(),
              followerCount: inf.followerCount || 0,
              likesCount: dp.likes,
              viewsCount: dp.views,
              commentsCount: dp.comments,
              sharesCount: dp.shares,
              isPublished: true,
            } as any);
            await this.postRepo.save(dbPost);

            inf.postsCount = (inf.postsCount || 0) + 1;
            inf.likesCount = (inf.likesCount || 0) + dp.likes;
            inf.viewsCount = (inf.viewsCount || 0) + dp.views;
            inf.commentsCount = (inf.commentsCount || 0) + dp.comments;
            inf.sharesCount = (inf.sharesCount || 0) + dp.shares;
            await this.influencerRepo.save(inf);
          } catch (postErr) {
            this.logger.warn(`Campaign ${campaignId}: failed to save discovered post ${dp.postId}: ${postErr.message}`);
          }
        }

        // Compute ER for discovered influencers
        for (const [, inf] of infMap) {
          const fc = Number(inf.followerCount) || 0;
          if (fc > 0 && inf.postsCount > 0) {
            const infER = Math.min(((inf.likesCount + inf.commentsCount) / (inf.postsCount * fc)) * 100, 100);
            await this.postRepo.createQueryBuilder().update(CampaignPost)
              .set({ followerCount: fc, engagementRate: infER })
              .where('campaignInfluencerId = :infId AND engagementRate IS NULL', { infId: inf.id })
              .execute();
          }
        }

        this.logger.log(`Campaign ${campaignId}: auto-discovered ${discoveredPosts.length} posts from hashtag feeds`);
      }

      campaign.status = this.computeCampaignStatus(campaign);
      await this.campaignRepo.save(campaign);

      const totalInf = await this.influencerRepo.count({ where: { campaignId } });
      const totalPosts = await this.postRepo.count({ where: { campaignId } });
      this.logger.log(`Campaign ${campaignId} processed: ${totalInf} influencers, ${totalPosts} posts — status: ${campaign.status}`);

      const owner = await this.userRepo.findOne({ where: { id: campaign.ownerId } });
      if (owner?.email) {
        await this.mailService.sendReportCompleted(owner.email, owner.name, 'Campaign', campaign.name);
      }
    } catch (err) {
      this.logger.error(`Campaign processing failed for ${campaignId}: ${err.message}`, err.stack);
      campaign.status = CampaignStatus.ACTIVE;
      await this.campaignRepo.save(campaign);
    }
  }

  private normalizePostUrl(rawUrl: string, parsed?: { postId: string | null; username: string | null; platform: string | null }): string {
    const p = parsed || this.parsePostUrl(rawUrl);
    if (p.postId && p.platform) {
      return this.constructPostUrl(p.postId, p.username || '', p.platform);
    }
    return rawUrl.replace(/\/+$/, '') + '/';
  }

  private constructPostUrl(postId: string, username: string, platform: string): string {
    const p = (platform || 'INSTAGRAM').toUpperCase();
    if (p === 'YOUTUBE') return `https://www.youtube.com/watch?v=${postId}`;
    if (p === 'TIKTOK') return `https://www.tiktok.com/@${username}/video/${postId}`;
    return `https://www.instagram.com/p/${postId}/`;
  }

  private computeCampaignStatus(campaign: Campaign): CampaignStatus {
    if (campaign.status === CampaignStatus.CANCELLED || campaign.status === CampaignStatus.PAUSED) {
      return campaign.status;
    }
    const now = new Date();
    const start = campaign.startDate ? new Date(campaign.startDate) : null;
    const end = campaign.endDate ? new Date(campaign.endDate) : null;

    if (end && now > end) return CampaignStatus.COMPLETED;
    if (start && now < start) return CampaignStatus.PENDING;
    return CampaignStatus.ACTIVE;
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

    const audienceOverview = await this.buildAudienceOverview(influencers);

    return {
      campaignMetrics: metrics,
      audienceOverview,
      influencerAnalytics,
    };
  }

  private async buildAudienceOverview(influencers: CampaignInfluencer[]): Promise<any> {
    const genderAgg = { male: 0, female: 0, other: 0, count: 0 };
    const ageAgg = new Map<string, { male: number; female: number; total: number }>();
    const countryAgg = new Map<string, number>();
    const cityAgg = new Map<string, number>();

    for (const inf of influencers) {
      if (!inf.influencerUsername) continue;
      try {
        const insight = await this.insightRepo.findOne({
          where: { username: inf.influencerUsername },
        });
        if (!insight?.audienceData) continue;

        const aud = insight.audienceData as any;
        const genders = aud.genders || aud.genderSplit;
        if (genders) {
          if (Array.isArray(genders)) {
            const male = genders.find((g: any) => /^male$/i.test(g.code))?.weight || 0;
            const female = genders.find((g: any) => /^female$/i.test(g.code))?.weight || 0;
            genderAgg.male += male * 100;
            genderAgg.female += female * 100;
          } else if (genders.male != null) {
            genderAgg.male += Number(genders.male) || 0;
            genderAgg.female += Number(genders.female) || 0;
          }
          genderAgg.count++;
        }

        const ages = aud.ages || aud.gendersPerAge;
        if (Array.isArray(ages)) {
          for (const a of ages) {
            const range = a.code || a.range || 'unknown';
            if (!ageAgg.has(range)) ageAgg.set(range, { male: 0, female: 0, total: 0 });
            const entry = ageAgg.get(range)!;
            entry.male += (a.male || a.weight * 50 || 0);
            entry.female += (a.female || a.weight * 50 || 0);
            entry.total++;
          }
        }

        const countries = aud.geoCountries;
        if (Array.isArray(countries)) {
          for (const c of countries) {
            const name = c.name || c.code || 'Unknown';
            countryAgg.set(name, (countryAgg.get(name) || 0) + ((c.weight || 0) * 100));
          }
        }

        const cities = aud.geoCities;
        if (Array.isArray(cities)) {
          for (const c of cities) {
            const name = c.name || c.code || 'Unknown';
            cityAgg.set(name, (cityAgg.get(name) || 0) + ((c.weight || 0) * 100));
          }
        }
      } catch { /* skip */ }
    }

    const n = genderAgg.count || 1;
    return {
      genderDistribution: {
        male: Math.round(genderAgg.male / n),
        female: Math.round(genderAgg.female / n),
        other: Math.max(0, 100 - Math.round(genderAgg.male / n) - Math.round(genderAgg.female / n)),
      },
      ageDistribution: [...ageAgg.entries()]
        .map(([range, v]) => ({
          range,
          male: Math.round(v.male / (v.total || 1)),
          female: Math.round(v.female / (v.total || 1)),
        }))
        .sort((a, b) => {
          const num = (s: string) => parseInt(s.replace(/[^0-9]/g, '')) || 0;
          return num(a.range) - num(b.range);
        }),
      topCountries: [...countryAgg.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, pct]) => ({ country, audience: Math.round(pct / n) })),
      topCities: [...cityAgg.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([city, pct]) => ({ city, audience: Math.round(pct / n) })),
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
