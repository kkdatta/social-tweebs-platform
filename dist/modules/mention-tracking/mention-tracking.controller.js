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
exports.MentionTrackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
const mention_tracking_service_1 = require("./mention-tracking.service");
const dto_1 = require("./dto");
let MentionTrackingController = class MentionTrackingController {
    constructor(mentionTrackingService) {
        this.mentionTrackingService = mentionTrackingService;
    }
    async getSharedReport(token) {
        return this.mentionTrackingService.getReportByShareToken(token);
    }
    async createReport(userId, dto) {
        return this.mentionTrackingService.createReport(userId, dto);
    }
    async getReports(userId, filters) {
        return this.mentionTrackingService.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.mentionTrackingService.getDashboardStats(userId);
    }
    async getReportById(userId, id) {
        return this.mentionTrackingService.getReportById(userId, id);
    }
    async getChartData(userId, id) {
        return this.mentionTrackingService.getChartData(userId, id);
    }
    async getPosts(userId, id, filters) {
        return this.mentionTrackingService.getPosts(userId, id, filters);
    }
    async getInfluencers(userId, id, filters) {
        return this.mentionTrackingService.getInfluencers(userId, id, filters);
    }
    async updateReport(userId, id, dto) {
        return this.mentionTrackingService.updateReport(userId, id, dto);
    }
    async deleteReport(userId, id) {
        return this.mentionTrackingService.deleteReport(userId, id);
    }
    async bulkDeleteReports(userId, body) {
        return this.mentionTrackingService.bulkDeleteReports(userId, body.reportIds);
    }
    async retryReport(userId, id) {
        return this.mentionTrackingService.retryReport(userId, id);
    }
    async shareReport(userId, id, dto) {
        return this.mentionTrackingService.shareReport(userId, id, dto);
    }
};
exports.MentionTrackingController = MentionTrackingController;
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shared report by token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.MentionTrackingReportDetailDto }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getSharedReport", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new mention tracking report' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Report created successfully' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateMentionTrackingReportDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of mention tracking reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM', 'SHARED', 'PUBLIC'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.MentionTrackingReportListResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.MentionTrackingReportFilterDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardStatsDto }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get report by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.MentionTrackingReportDetailDto }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Get)(':id/chart-data'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get chart data for posts/influencers over time' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [dto_1.ChartDataDto] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getChartData", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get posts with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'sponsoredOnly', required: false, type: Boolean }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.PostsFilterDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getPosts", null);
__decorate([
    (0, common_1.Get)(':id/influencers'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get influencers with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false, enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.InfluencersFilterDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "getInfluencers", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateMentionTrackingReportDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)('bulk-delete'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk delete reports' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "bulkDeleteReports", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareMentionTrackingReportDto]),
    __metadata("design:returntype", Promise)
], MentionTrackingController.prototype, "shareReport", null);
exports.MentionTrackingController = MentionTrackingController = __decorate([
    (0, swagger_1.ApiTags)('mention-tracking'),
    (0, common_1.Controller)('mention-tracking'),
    __metadata("design:paramtypes", [mention_tracking_service_1.MentionTrackingService])
], MentionTrackingController);
//# sourceMappingURL=mention-tracking.controller.js.map