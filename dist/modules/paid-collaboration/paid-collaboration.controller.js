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
exports.PaidCollaborationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
const paid_collaboration_service_1 = require("./paid-collaboration.service");
const dto_1 = require("./dto");
const entities_1 = require("./entities");
let PaidCollaborationController = class PaidCollaborationController {
    constructor(service) {
        this.service = service;
    }
    async createReport(userId, dto) {
        return this.service.createReport(userId, dto);
    }
    async getReports(userId, filters) {
        return this.service.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.service.getDashboardStats(userId);
    }
    async getSharedReport(token) {
        return this.service.getReportByShareToken(token);
    }
    async getReportById(userId, reportId) {
        return this.service.getReportById(userId, reportId);
    }
    async getChartData(userId, reportId) {
        return this.service.getChartData(userId, reportId);
    }
    async getPosts(userId, reportId, sponsoredOnly, sortBy, sortOrder, category, page, limit) {
        return this.service.getPosts(userId, reportId, sponsoredOnly === 'true', sortBy || 'likesCount', sortOrder || 'DESC', category, parseInt(page || '1', 10), parseInt(limit || '20', 10));
    }
    async getInfluencers(userId, reportId, category, sortBy, sortOrder, page, limit) {
        return this.service.getInfluencers(userId, reportId, category, sortBy || 'likesCount', sortOrder || 'DESC', parseInt(page || '1', 10), parseInt(limit || '20', 10));
    }
    async updateReport(userId, reportId, dto) {
        return this.service.updateReport(userId, reportId, dto);
    }
    async deleteReport(userId, reportId) {
        return this.service.deleteReport(userId, reportId);
    }
    async retryReport(userId, reportId) {
        return this.service.retryReport(userId, reportId);
    }
    async shareReport(userId, reportId, dto) {
        return this.service.shareReport(userId, reportId, dto);
    }
};
exports.PaidCollaborationController = PaidCollaborationController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new paid collaboration report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreatePaidCollabReportDto]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of paid collaboration reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, description: 'Filter by platform' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: entities_1.PaidCollabReportStatus }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ME', 'TEAM', 'SHARED', 'ALL'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.PaidCollabReportFilterDto]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public shared report' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getSharedReport", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Get)(':id/chart-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Get chart data for posts over time' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getChartData", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, swagger_1.ApiOperation)({ summary: 'Get posts with filtering' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiQuery)({ name: 'sponsoredOnly', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, enum: entities_1.InfluencerCategory }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('sponsoredOnly')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __param(5, (0, common_1.Query)('category')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)(':id/influencers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get influencers with filtering and sorting' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, enum: entities_1.InfluencerCategory }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('sortBy')),
    __param(4, (0, common_1.Query)('sortOrder')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "getInfluencers", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdatePaidCollabReportDto]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.SharePaidCollabReportDto]),
    __metadata("design:returntype", Promise)
], PaidCollaborationController.prototype, "shareReport", null);
exports.PaidCollaborationController = PaidCollaborationController = __decorate([
    (0, swagger_1.ApiTags)('paid-collaboration'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, common_1.Controller)('paid-collaboration'),
    __metadata("design:paramtypes", [paid_collaboration_service_1.PaidCollaborationService])
], PaidCollaborationController);
//# sourceMappingURL=paid-collaboration.controller.js.map