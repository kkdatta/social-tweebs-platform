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
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const campaign_entity_1 = require("./entities/campaign.entity");
const user_entity_1 = require("../users/entities/user.entity");
const credits_service_1 = require("../credits/credits.service");
const enums_1 = require("../../common/enums");
const CREDIT_PER_CAMPAIGN = 1;
let CampaignsService = CampaignsService_1 = class CampaignsService {
    constructor(campaignRepo, influencerRepo, deliverableRepo, metricRepo, shareRepo, userRepo, creditsService, dataSource) {
        this.campaignRepo = campaignRepo;
        this.influencerRepo = influencerRepo;
        this.deliverableRepo = deliverableRepo;
        this.metricRepo = metricRepo;
        this.shareRepo = shareRepo;
        this.userRepo = userRepo;
        this.creditsService = creditsService;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(CampaignsService_1.name);
    }
    async createCampaign(userId, dto) {
        await this.creditsService.deductCredits(userId, {
            actionType: enums_1.ActionType.REPORT_GENERATION,
            quantity: CREDIT_PER_CAMPAIGN,
            module: enums_1.ModuleType.CAMPAIGN_TRACKING,
            resourceId: 'new-campaign',
            resourceType: 'campaign_creation',
        });
        const campaign = new campaign_entity_1.Campaign();
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
        campaign.status = campaign_entity_1.CampaignStatus.DRAFT;
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
            .leftJoin('campaign.deliverables', 'deliverables')
            .addSelect('COUNT(DISTINCT influencers.id)', 'influencer_count')
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
                search: `%${search}%`
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
    async getCampaignById(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({
            where: { id: campaignId },
            relations: ['owner', 'influencers', 'deliverables', 'shares'],
        });
        if (!campaign) {
            throw new common_1.NotFoundException('Campaign not found');
        }
        await this.checkCampaignAccess(userId, campaign);
        const metrics = await this.getCampaignMetrics(campaignId);
        const influencers = await this.influencerRepo.find({
            where: { campaignId },
            relations: ['deliverables'],
        });
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
    async updateCampaign(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
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
    async getInfluencers(userId, campaignId) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign);
        return this.influencerRepo.find({
            where: { campaignId },
            relations: ['deliverables'],
            order: { addedAt: 'DESC' },
        });
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
    async createDeliverable(userId, campaignId, dto) {
        const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
        if (!campaign)
            throw new common_1.NotFoundException('Campaign not found');
        await this.checkCampaignAccess(userId, campaign, 'edit');
        const influencer = await this.influencerRepo.findOne({
            where: { id: dto.campaignInfluencerId, campaignId }
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
        return this.shareRepo.save(share);
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
                select: ['id']
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
    __param(4, (0, typeorm_1.InjectRepository)(campaign_entity_1.CampaignShare)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        credits_service_1.CreditsService,
        typeorm_2.DataSource])
], CampaignsService);
//# sourceMappingURL=campaigns.service.js.map