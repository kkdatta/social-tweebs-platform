"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CampaignsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("./entities/campaign.entity");
const user_entity_1 = require("../users/entities/user.entity");
const mail_service_1 = require("../../common/services/mail.service");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const campaign_dto_1 = require("./dto/campaign.dto");
const CREDIT_PER_CAMPAIGN = 1;
const FREE_CAMPAIGN_QUOTA = 10;
let CampaignsService = CampaignsService_1 = class CampaignsService {
    constructor(campaignRepo, influencerRepo, deliverableRepo, metricRepo, postRepo, shareRepo, userRepo, creditsService, dataSource, mailService, configService) {
        this.campaignRepo = campaignRepo;
        this.influencerRepo = influencerRepo;
        this.deliverableRepo = deliverableRepo;
        this.metricRepo = metricRepo;
        this.postRepo = postRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
        this.dataSource = dataSource;
        this.mailService = mailService;
        this.configService = configService;
        this.logger = new common_1.Logger(CampaignsService_1.name);
    }
    async getClientAdminId(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            return userId;
        return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? userId : (user.parentId || userId);
    }
    async getClientCampaignCount(clientAdminId) {
        const children = await this.userRepo.find({
            where: { parentId: clientAdminId },
            select: ['id'],
        });
        const allUserIds = [clientAdminId, ...children.map((c) => c.id)];
        return this.campaignRepo.count({
            where: { ownerId: (0, typeorm_2.In)(allUserIds) },
        });
    }
    async createCampaign(userId, dto) {
        const balanceInfo = await this.creditsService.getBalance(userId);
        const userCredits = balanceInfo.totalBalance || 0;
        const clientAdminId = await this.getClientAdminId(userId);
        const campaignCount = await this.getClientCampaignCount(clientAdminId);
        const isFreeQuota = campaignCount < FREE_CAMPAIGN_QUOTA;
        if (userCredits < campaign_dto_1.MIN_CREDITS_FOR_CAMPAIGN) {
            throw new common_1.BadRequestException(`Minimum ${campaign_dto_1.MIN_CREDITS_FOR_CAMPAIGN} credits required in your account to create a campaign. Current balance: ${userCredits}`);
        }
        if (!isFreeQuota) {
            await this.creditsService.deductCredits(userId, {
                actionType: enums_1.ActionType.REPORT_GENERATION,
                quantity: CREDIT_PER_CAMPAIGN,
                module: enums_1.ModuleType.CAMPAIGN_TRACKING,
                resourceId: 'new-campaign',
                resourceType: 'campaign_creation',
            });
        }
        else {
            this.logger.log(`Campaign freemium: client has ${campaignCount}/${FREE_CAMPAIGN_QUOTA} free campaigns used — this one is FREE`);
        }
        const campaign = new campaign_entity_1.Campaign();
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
        campaign.status = campaign_entity_1.CampaignStatus.PENDING;
        const saved = await this.campaignRepo.save(campaign);
        this.logger.log(`Campaign created: ${saved.id} by user ${userId}`);
        return saved;
    }
    async getCampaigns(userId, filters) {
        const { status, platform, objective, search, tab, page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
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
        }
        else if (tab === 'created_by_team') {
            const teamUserIds = await this.getTeamUserIds(userId, user);
            queryBuilder.where('campaign.createdById IN (:...teamUserIds)', { teamUserIds })
                .andWhere('campaign.createdById != :userId', { userId });
        }
        else if (tab === 'shared_with_me') {
            queryBuilder.innerJoin('campaign.shares', 'share', 'share.sharedWithUserId = :userId', { userId });
        }
        else if (tab === 'sample_public') {
            queryBuilder.where('campaign.status = :completedStatus', { completedStatus: campaign_entity_1.CampaignStatus.COMPLETED });
        }
        else {
            const accessibleIds = await this.getAccessibleCampaignIds(userId, user);
            if (accessibleIds.length > 0) {
                queryBuilder.where('campaign.id IN (:...accessibleIds)', { accessibleIds });
            }
            else {
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
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase());
        const total = await queryBuilder.getCount();
        queryBuilder.skip(page * limit).take(limit);
        const campaigns = await queryBuilder.getRawAndEntities();
        const campaignSummaries = campaigns.entities.map((campaign, index) => {
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
    async getCampaignById(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({
            where: { id: campaignId },
            relations: ['owner', 'influencers', 'deliverables', 'posts', 'shares'],
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
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
    async updateCampaign(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const wasCompleted = campaign.status === campaign_entity_1.CampaignStatus.COMPLETED;
        Object.assign(campaign, {
            ...dto,
            startDate: dto.startDate ? new Date(dto.startDate) : campaign.startDate,
            endDate: dto.endDate ? new Date(dto.endDate) : campaign.endDate,
        });
        const updated = await this.campaignRepo.save(campaign);
        this.logger.log(`Campaign updated: ${campaignId}`);
        if (!wasCompleted && updated.status === campaign_entity_1.CampaignStatus.COMPLETED) {
            const owner = await this.userRepo.findOne({ where: { id: updated.ownerId } });
            if (owner?.email) {
                await this.mailService.sendReportCompleted(owner.email, owner.name, 'Campaign', updated.name);
            }
        }
        return updated;
    }
    async deleteCampaign(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'admin');
        await this.campaignRepo.remove(campaign);
        this.logger.log(`Campaign deleted: ${campaignId}`);
    }
    async addInfluencer(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const influencer = this.influencerRepo.create({
            ...dto,
            campaignId,
            status: campaign_entity_1.InfluencerStatus.INVITED,
        });
        const saved = await this.influencerRepo.save(influencer);
        this.logger.log(`Influencer added to campaign ${campaignId}: ${saved.id}`);
        return saved;
    }
    async getInfluencers(userId, campaignId, filters) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
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
        }
        else if (filters?.publishStatus === 'unpublished') {
            qb.andWhere('inf.postsCount = 0');
        }
        qb.orderBy('inf.addedAt', 'DESC');
        return qb.getMany();
    }
    async updateInfluencer(userId, campaignId, influencerId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const influencer = await this.influencerRepo.findOne({ where: { id: influencerId, campaignId } });
        if (!influencer)
            throw new common_1.NotFoundException('Influencer not found');
        if (dto.status === campaign_entity_1.InfluencerStatus.CONFIRMED && !influencer.confirmedAt) {
            influencer.confirmedAt = new Date();
        }
        if (dto.status === campaign_entity_1.InfluencerStatus.COMPLETED && !influencer.completedAt) {
            influencer.completedAt = new Date();
        }
        Object.assign(influencer, dto);
        return this.influencerRepo.save(influencer);
    }
    async removeInfluencer(userId, campaignId, influencerId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const influencer = await this.influencerRepo.findOne({ where: { id: influencerId, campaignId } });
        if (!influencer)
            throw new common_1.NotFoundException('Influencer not found');
        await this.influencerRepo.remove(influencer);
        this.logger.log(`Influencer removed from campaign ${campaignId}: ${influencerId}`);
    }
    async addPost(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
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
    async getPosts(userId, campaignId, filters) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
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
        }
        else if (filters?.publishStatus === 'unpublished') {
            qb.andWhere('post.isPublished = false');
        }
        if (filters?.search) {
            qb.andWhere('(post.influencerName ILIKE :search OR post.influencerUsername ILIKE :search OR post.description ILIKE :search)', {
                search: `%${filters.search}%`,
            });
        }
        const sortMap = {
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
    async removePost(userId, campaignId, postId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const post = await this.postRepo.findOne({ where: { id: postId, campaignId } });
        if (!post)
            throw new common_1.NotFoundException('Post not found');
        const influencerId = post.campaignInfluencerId;
        await this.postRepo.remove(post);
        if (influencerId) {
            await this.recalculateInfluencerMetrics(influencerId);
        }
    }
    async recalculateInfluencerMetrics(influencerId) {
        const posts = await this.postRepo.find({ where: { campaignInfluencerId: influencerId } });
        const influencer = await this.influencerRepo.findOne({ where: { id: influencerId } });
        if (!influencer)
            return;
        influencer.postsCount = posts.length;
        influencer.likesCount = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
        influencer.viewsCount = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
        influencer.commentsCount = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
        influencer.sharesCount = posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);
        await this.influencerRepo.save(influencer);
    }
    async createDeliverable(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const influencer = await this.influencerRepo.findOne({
            where: { id: dto.campaignInfluencerId, campaignId },
        });
        if (!influencer)
            throw new common_1.BadRequestException('Influencer not found in this campaign');
        const deliverable = new campaign_entity_1.CampaignDeliverable();
        deliverable.campaignId = campaignId;
        deliverable.campaignInfluencerId = dto.campaignInfluencerId;
        deliverable.deliverableType = dto.deliverableType;
        deliverable.title = dto.title;
        deliverable.description = dto.description;
        deliverable.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
        deliverable.status = campaign_entity_1.DeliverableStatus.PENDING;
        return this.deliverableRepo.save(deliverable);
    }
    async getDeliverables(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign);
        return this.deliverableRepo.find({
            where: { campaignId },
            relations: ['campaignInfluencer'],
            order: { dueDate: 'ASC' },
        });
    }
    async updateDeliverable(userId, campaignId, deliverableId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const deliverable = await this.deliverableRepo.findOne({ where: { id: deliverableId, campaignId } });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        if (dto.status === campaign_entity_1.DeliverableStatus.SUBMITTED && !deliverable.submittedAt) {
            deliverable.submittedAt = new Date();
        }
        if (dto.status === campaign_entity_1.DeliverableStatus.APPROVED && !deliverable.approvedAt) {
            deliverable.approvedAt = new Date();
        }
        if (dto.status === campaign_entity_1.DeliverableStatus.PUBLISHED && !deliverable.publishedAt) {
            deliverable.publishedAt = new Date();
        }
        Object.assign(deliverable, {
            ...dto,
            dueDate: dto.dueDate ? new Date(dto.dueDate) : deliverable.dueDate,
        });
        return this.deliverableRepo.save(deliverable);
    }
    async deleteDeliverable(userId, campaignId, deliverableId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const deliverable = await this.deliverableRepo.findOne({ where: { id: deliverableId, campaignId } });
        if (!deliverable)
            throw new common_1.NotFoundException('Deliverable not found');
        await this.deliverableRepo.remove(deliverable);
    }
    async recordMetrics(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        let engagementRate;
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
    async getCampaignMetrics(campaignId) {
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
    async getTimeline(campaignId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            return [];
        const posts = await this.postRepo.find({
            where: { campaignId },
            order: { postedDate: 'ASC' },
        });
        const startDate = campaign.startDate || campaign.createdAt;
        const endDate = campaign.endDate || new Date();
        const dateMap = {};
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
    async getAnalytics(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
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
    async getCreditNotification(userId) {
        const balanceInfo = await this.creditsService.getBalance(userId);
        const balance = balanceInfo.totalBalance || 0;
        if (balance < campaign_dto_1.MIN_CREDITS_FOR_CAMPAIGN) {
            return {
                showWarning: true,
                message: `Low credit balance! You need at least ${campaign_dto_1.MIN_CREDITS_FOR_CAMPAIGN} credits to create a campaign. Current balance: ${balance}`,
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
    async shareCampaign(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'admin');
        const existing = await this.shareRepo.findOne({
            where: { campaignId, sharedWithUserId: dto.sharedWithUserId },
        });
        if (existing) {
            existing.permissionLevel = dto.permissionLevel || campaign_entity_1.SharePermission.VIEW;
            return this.shareRepo.save(existing);
        }
        const share = this.shareRepo.create({
            campaignId,
            sharedWithUserId: dto.sharedWithUserId,
            sharedByUserId: userId,
            permissionLevel: dto.permissionLevel || campaign_entity_1.SharePermission.VIEW,
        });
        const saved = await this.shareRepo.save(share);
        const sharedWith = await this.userRepo.findOne({ where: { id: dto.sharedWithUserId } });
        const sharedBy = await this.userRepo.findOne({ where: { id: userId } });
        const frontendUrl = this.configService.get('app.frontendUrl') || 'http://localhost:5173';
        const shareUrl = `${frontendUrl.replace(/\/$/, '')}/campaigns/${campaignId}`;
        if (sharedWith?.email) {
            await this.mailService.sendReportShared(sharedWith.email, sharedBy?.name || 'Someone', 'Campaign', campaign.name, shareUrl);
        }
        return saved;
    }
    async removeCampaignShare(userId, campaignId, shareId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'admin');
        await this.shareRepo.delete({ id: shareId, campaignId });
    }
    async getDashboardStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const accessibleIds = await this.getAccessibleCampaignIds(userId, user);
        const statusCounts = await this.campaignRepo
            .createQueryBuilder('campaign')
            .select('campaign.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
            .groupBy('campaign.status')
            .getRawMany();
        const influencerStats = await this.influencerRepo
            .createQueryBuilder('inf')
            .select('inf.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('inf.campaign', 'campaign')
            .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
            .groupBy('inf.status')
            .getRawMany();
        const deliverableStats = await this.deliverableRepo
            .createQueryBuilder('del')
            .select('del.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .innerJoin('del.campaign', 'campaign')
            .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
            .groupBy('del.status')
            .getRawMany();
        const budgetStats = await this.campaignRepo
            .createQueryBuilder('campaign')
            .select('SUM(campaign.budget)', 'totalBudget')
            .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
            .getRawOne();
        const spentStats = await this.influencerRepo
            .createQueryBuilder('inf')
            .select('SUM(inf.paymentAmount)', 'totalSpent')
            .innerJoin('inf.campaign', 'campaign')
            .where(accessibleIds.length > 0 ? 'campaign.id IN (:...ids)' : 'campaign.ownerId = :userId', accessibleIds.length > 0 ? { ids: accessibleIds } : { userId })
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
    async getReportData(userId, campaignId, reportType = 'basic') {
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
    async checkCampaignAccess(userId, campaign, level = 'view') {
        if (campaign.ownerId === userId || campaign.createdById === userId)
            return;
        const share = await this.shareRepo.findOne({
            where: { campaignId: campaign.id, sharedWithUserId: userId },
        });
        if (!share) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            const owner = await this.userRepo.findOne({ where: { id: campaign.ownerId } });
            if (user?.parentId === owner?.id || owner?.parentId === user?.id || user?.parentId === owner?.parentId) {
                if (level !== 'view') {
                    throw new common_1.ForbiddenException('You do not have permission to modify this campaign');
                }
                return;
            }
            throw new common_1.ForbiddenException('You do not have access to this campaign');
        }
        if (level === 'admin' && share.permissionLevel !== campaign_entity_1.SharePermission.ADMIN) {
            throw new common_1.ForbiddenException('Admin access required');
        }
        if (level === 'edit' && share.permissionLevel === campaign_entity_1.SharePermission.VIEW) {
            throw new common_1.ForbiddenException('Edit access required');
        }
    }
    async getTeamUserIds(userId, user) {
        const ids = [userId];
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
    async getAccessibleCampaignIds(userId, user) {
        const ids = [];
        const owned = await this.campaignRepo.find({ where: { ownerId: userId }, select: ['id'] });
        ids.push(...owned.map(c => c.id));
        const created = await this.campaignRepo.find({ where: { createdById: userId }, select: ['id'] });
        ids.push(...created.map(c => c.id));
        const shared = await this.shareRepo.find({ where: { sharedWithUserId: userId }, select: ['campaignId'] });
        ids.push(...shared.map(s => s.campaignId));
        if (user.role !== 'SUPER_ADMIN') {
            const teamIds = await this.getTeamUserIds(userId, user);
            const teamCampaigns = await this.campaignRepo.find({
                where: { createdById: (0, typeorm_2.In)(teamIds) },
                select: ['id'],
            });
            ids.push(...teamCampaigns.map(c => c.id));
        }
        return [...new Set(ids)];
    }
};
exports.CampaignsService = CampaignsService;
exports.CampaignsService = CampaignsService = CampaignsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(campaign_entity_1.Campaign)),
    __param(1, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignInfluencer)),
    __param(2, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignDeliverable)),
    __param(3, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignMetric)),
    __param(4, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignPost)),
    __param(5, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignShare)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        typeorm_2.DataSource,
        mail_service_1.MailService,
        config_1.ConfigService])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map