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
exports.CollabCheckController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
const collab_check_service_1 = require("./collab-check.service");
const dto_1 = require("./dto");
let CollabCheckController = class CollabCheckController {
    constructor(collabCheckService) {
        this.collabCheckService = collabCheckService;
    }
    async getSharedReport(token) {
        return this.collabCheckService.getReportByShareToken(token);
    }
    async createReport(userId, dto) {
        return this.collabCheckService.createReport(userId, dto);
    }
    async getReports(userId, filters) {
        return this.collabCheckService.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.collabCheckService.getDashboardStats(userId);
    }
    async searchInfluencers(platform, query, limit) {
        return this.collabCheckService.searchInfluencers(platform, query || '', limit ? parseInt(limit, 10) : 10);
    }
    async getReportById(userId, id) {
        return this.collabCheckService.getReportById(userId, id);
    }
    async getChartData(userId, id) {
        return this.collabCheckService.getChartData(userId, id);
    }
    async updateReport(userId, id, dto) {
        return this.collabCheckService.updateReport(userId, id, dto);
    }
    async deleteReport(userId, id) {
        return this.collabCheckService.deleteReport(userId, id);
    }
    async retryReport(userId, id) {
        return this.collabCheckService.retryReport(userId, id);
    }
    async shareReport(userId, id, dto) {
        return this.collabCheckService.shareReport(userId, id, dto);
    }
};
exports.CollabCheckController = CollabCheckController;
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get shared report by token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CollabCheckReportDetailDto }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "getSharedReport", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new collab check report' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Report created successfully' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCollabCheckReportDto]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of collab check reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CollabCheckReportListResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CollabCheckReportFilterDto]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "getReports", null);
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
], CollabCheckController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('search/influencers'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Search influencers for report creation' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('platform')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "searchInfluencers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get report by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CollabCheckReportDetailDto }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Get)(':id/chart-data'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get chart data for posts over time' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [dto_1.PostsChartDataDto] }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "getChartData", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateCollabCheckReportDto]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "updateReport", null);
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
], CollabCheckController.prototype, "deleteReport", null);
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
], CollabCheckController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share report' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareCollabCheckReportDto]),
    __metadata("design:returntype", Promise)
], CollabCheckController.prototype, "shareReport", null);
exports.CollabCheckController = CollabCheckController = __decorate([
    (0, swagger_1.ApiTags)('collab-check'),
    (0, common_1.Controller)('collab-check'),
    __metadata("design:paramtypes", [collab_check_service_1.CollabCheckService])
], CollabCheckController);
//# sourceMappingURL=collab-check.controller.js.map