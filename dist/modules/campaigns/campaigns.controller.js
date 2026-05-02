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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs = require("fs");
const uuid_1 = require("uuid");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const campaigns_service_1 = require("./campaigns.service");
const campaign_dto_1 = require("./dto/campaign.dto");
let CampaignsController = class CampaignsController {
    constructor(campaignsService) {
        this.campaignsService = campaignsService;
    }
    async createCampaign(userId, dto) {
        const campaign = await this.campaignsService.createCampaign(userId, dto);
        return {
            success: true,
            message: 'Campaign created successfully',
            campaign,
        };
    }
    async getCampaigns(userId, filters) {
        return this.campaignsService.getCampaigns(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.campaignsService.getDashboardStats(userId);
    }
    async getCreditNotification(userId) {
        return this.campaignsService.getCreditNotification(userId);
    }
    async uploadCampaignLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const relativePath = `/uploads/campaigns/${file.filename}`;
        return {
            success: true,
            path: relativePath,
            logoUrl: relativePath,
        };
    }
    async getCampaignById(userId, id) {
        return this.campaignsService.getCampaignById(userId, id);
    }
    async processCampaign(userId, id) {
        const campaign = await this.campaignsService.getCampaignById(userId, id);
        if (!campaign)
            throw new common_1.BadRequestException('Campaign not found');
        setTimeout(() => this.campaignsService.processCampaign(id).catch(err => console.error(`Campaign processing failed: ${err.message}`)), 500);
        return {
            success: true,
            message: 'Campaign processing started. Data will be populated shortly.',
        };
    }
    async updateCampaign(userId, id, dto) {
        const campaign = await this.campaignsService.updateCampaign(userId, id, dto);
        return {
            success: true,
            message: 'Campaign updated successfully',
            campaign,
        };
    }
    async deleteCampaign(userId, id) {
        await this.campaignsService.deleteCampaign(userId, id);
        return {
            success: true,
            message: 'Campaign deleted successfully',
        };
    }
    async addInfluencer(userId, campaignId, dto) {
        const influencer = await this.campaignsService.addInfluencer(userId, campaignId, dto);
        return {
            success: true,
            message: 'Influencer added to campaign',
            influencer,
        };
    }
    async getInfluencers(userId, campaignId, filters) {
        const influencers = await this.campaignsService.getInfluencers(userId, campaignId, filters);
        return {
            success: true,
            influencers,
            count: influencers.length,
        };
    }
    async updateInfluencer(userId, campaignId, influencerId, dto) {
        const influencer = await this.campaignsService.updateInfluencer(userId, campaignId, influencerId, dto);
        return {
            success: true,
            message: 'Influencer updated',
            influencer,
        };
    }
    async removeInfluencer(userId, campaignId, influencerId) {
        await this.campaignsService.removeInfluencer(userId, campaignId, influencerId);
        return {
            success: true,
            message: 'Influencer removed from campaign',
        };
    }
    async addPost(userId, campaignId, dto) {
        const { post, warning } = await this.campaignsService.addPost(userId, campaignId, dto);
        return {
            success: true,
            message: warning || 'Post added to campaign',
            warning,
            post,
        };
    }
    async getPosts(userId, campaignId, filters) {
        const result = await this.campaignsService.getPosts(userId, campaignId, filters);
        return {
            success: true,
            ...result,
        };
    }
    async removePost(userId, campaignId, postId) {
        await this.campaignsService.removePost(userId, campaignId, postId);
        return {
            success: true,
            message: 'Post removed from campaign',
        };
    }
    async createDeliverable(userId, campaignId, dto) {
        const deliverable = await this.campaignsService.createDeliverable(userId, campaignId, dto);
        return {
            success: true,
            message: 'Deliverable created',
            deliverable,
        };
    }
    async getDeliverables(userId, campaignId) {
        const deliverables = await this.campaignsService.getDeliverables(userId, campaignId);
        return {
            success: true,
            deliverables,
            count: deliverables.length,
        };
    }
    async updateDeliverable(userId, campaignId, deliverableId, dto) {
        const deliverable = await this.campaignsService.updateDeliverable(userId, campaignId, deliverableId, dto);
        return {
            success: true,
            message: 'Deliverable updated',
            deliverable,
        };
    }
    async deleteDeliverable(userId, campaignId, deliverableId) {
        await this.campaignsService.deleteDeliverable(userId, campaignId, deliverableId);
        return {
            success: true,
            message: 'Deliverable deleted',
        };
    }
    async recordMetrics(userId, campaignId, dto) {
        const metric = await this.campaignsService.recordMetrics(userId, campaignId, dto);
        return {
            success: true,
            message: 'Metrics recorded',
            metric,
        };
    }
    async getCampaignMetrics(userId, campaignId) {
        await this.campaignsService.getCampaignById(userId, campaignId);
        const metrics = await this.campaignsService.getCampaignMetrics(campaignId);
        return {
            success: true,
            metrics,
        };
    }
    async getAnalytics(userId, campaignId) {
        const analytics = await this.campaignsService.getAnalytics(userId, campaignId);
        return {
            success: true,
            ...analytics,
        };
    }
    async exportReport(userId, campaignId, reportType = 'basic') {
        const data = await this.campaignsService.getReportData(userId, campaignId, reportType);
        return {
            success: true,
            ...data,
        };
    }
    async shareCampaign(userId, campaignId, dto) {
        const share = await this.campaignsService.shareCampaign(userId, campaignId, dto);
        return {
            success: true,
            message: 'Campaign shared successfully',
            share,
        };
    }
    async removeCampaignShare(userId, campaignId, shareId) {
        await this.campaignsService.removeCampaignShare(userId, campaignId, shareId);
        return {
            success: true,
            message: 'Share removed',
        };
    }
};
exports.CampaignsController = CampaignsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new campaign' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Campaign created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, campaign_dto_1.CreateCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "createCampaign", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaigns list with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'tab', required: false, enum: ['created_by_me', 'created_by_team', 'shared_with_me', 'sample_public'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, campaign_dto_1.CampaignFilterDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign dashboard statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('credit-notification'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit usage notification' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getCreditNotification", null);
__decorate([
    (0, common_1.Post)('upload/logo'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload campaign logo image' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File saved; returns public path for logoUrl' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        storage: (0, multer_1.diskStorage)({
            destination: (_req, _file, cb) => {
                const dest = (0, path_1.join)(process.cwd(), 'uploads', 'campaigns');
                fs.mkdirSync(dest, { recursive: true });
                cb(null, dest);
            },
            filename: (_req, file, cb) => {
                const ext = (0, path_1.extname)(file.originalname || '').toLowerCase();
                const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.png';
                cb(null, `${(0, uuid_1.v4)()}${safeExt}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
                return cb(new common_1.BadRequestException('Only JPEG, PNG, GIF, or WebP images are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "uploadCampaignLogo", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getCampaignById", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger campaign processing (fetch posts via Modash)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "processCampaign", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.UpdateCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "updateCampaign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "deleteCampaign", null);
__decorate([
    (0, common_1.Post)(':id/influencers'),
    (0, swagger_1.ApiOperation)({ summary: 'Add influencer to campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.AddInfluencerDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "addInfluencer", null);
__decorate([
    (0, common_1.Get)(':id/influencers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign influencers with filters' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'publishStatus', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.InfluencerFilterDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getInfluencers", null);
__decorate([
    (0, common_1.Patch)(':id/influencers/:influencerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update influencer in campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'influencerId', description: 'Influencer ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('influencerId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, campaign_dto_1.UpdateInfluencerDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "updateInfluencer", null);
__decorate([
    (0, common_1.Delete)(':id/influencers/:influencerId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove influencer from campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'influencerId', description: 'Influencer ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('influencerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "removeInfluencer", null);
__decorate([
    (0, common_1.Post)(':id/posts'),
    (0, swagger_1.ApiOperation)({ summary: 'Add post to campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.AddPostDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "addPost", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign posts with filters' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.PostFilterDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Delete)(':id/posts/:postId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove post from campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'postId', description: 'Post ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('postId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "removePost", null);
__decorate([
    (0, common_1.Post)(':id/deliverables'),
    (0, swagger_1.ApiOperation)({ summary: 'Create deliverable for campaign' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.CreateDeliverableDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "createDeliverable", null);
__decorate([
    (0, common_1.Get)(':id/deliverables'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign deliverables' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getDeliverables", null);
__decorate([
    (0, common_1.Patch)(':id/deliverables/:deliverableId'),
    (0, swagger_1.ApiOperation)({ summary: 'Update deliverable' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'deliverableId', description: 'Deliverable ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('deliverableId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, campaign_dto_1.UpdateDeliverableDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "updateDeliverable", null);
__decorate([
    (0, common_1.Delete)(':id/deliverables/:deliverableId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete deliverable' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'deliverableId', description: 'Deliverable ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('deliverableId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "deleteDeliverable", null);
__decorate([
    (0, common_1.Post)(':id/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Record campaign metrics' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.RecordMetricsDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "recordMetrics", null);
__decorate([
    (0, common_1.Get)(':id/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign metrics summary' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getCampaignMetrics", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign analytics' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(':id/export'),
    (0, swagger_1.ApiOperation)({ summary: 'Get campaign report data for export' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: ['basic', 'advanced'] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "exportReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share campaign with user' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, campaign_dto_1.ShareCampaignDto]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "shareCampaign", null);
__decorate([
    (0, common_1.Delete)(':id/share/:shareId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove campaign share' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Campaign ID' }),
    (0, swagger_1.ApiParam)({ name: 'shareId', description: 'Share ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('shareId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CampaignsController.prototype, "removeCampaignShare", null);
exports.CampaignsController = CampaignsController = __decorate([
    (0, swagger_1.ApiTags)('campaigns'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('campaigns'),
    __metadata("design:paramtypes", [campaigns_service_1.CampaignsService])
], CampaignsController);
//# sourceMappingURL=campaigns.controller.js.map