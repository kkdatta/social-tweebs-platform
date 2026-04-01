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
exports.AudienceOverlapController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const audience_overlap_service_1 = require("./audience-overlap.service");
const dto_1 = require("./dto");
let AudienceOverlapController = class AudienceOverlapController {
    constructor(overlapService) {
        this.overlapService = overlapService;
    }
    async createReport(userId, dto) {
        return this.overlapService.createReport(userId, dto);
    }
    async getReports(userId, filters) {
        return this.overlapService.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.overlapService.getDashboardStats(userId);
    }
    async getReportById(userId, reportId) {
        return this.overlapService.getReportById(userId, reportId);
    }
    async downloadReport(userId, reportId, res) {
        const { buffer, filename } = await this.overlapService.downloadReportAsXlsx(userId, reportId);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async updateReport(userId, reportId, dto) {
        return this.overlapService.updateReport(userId, reportId, dto);
    }
    async deleteReport(userId, reportId) {
        return this.overlapService.deleteReport(userId, reportId);
    }
    async retryReport(userId, reportId) {
        return this.overlapService.retryReport(userId, reportId);
    }
    async shareReport(userId, reportId, dto) {
        return this.overlapService.shareReport(userId, reportId, dto);
    }
    async getSharedReport(token) {
        return this.overlapService.getReportByShareToken(token);
    }
    async searchInfluencers(platform, query, limit) {
        return this.overlapService.searchInfluencers(platform, query, limit || 10);
    }
};
exports.AudienceOverlapController = AudienceOverlapController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new audience overlap report' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Report created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateOverlapReportDto]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of audience overlap reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, enum: ['INSTAGRAM', 'YOUTUBE', 'ALL'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'IN_PROCESS', 'COMPLETED', 'FAILED'] }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.OverlapReportListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.OverlapReportFilterDto]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardStatsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.OverlapReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download report as XLSX' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'XLSX file download' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update report (title, visibility)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateOverlapReportDto]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, swagger_1.ApiOperation)({ summary: 'Retry failed report (costs 1 credit)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report retry initiated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Only failed reports can be retried' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share report with user or get shareable link' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report shared' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareOverlapReportDto]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "shareReport", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get publicly shared report by token' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.OverlapReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or not public' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "getSharedReport", null);
__decorate([
    (0, common_1.Get)('search/influencers'),
    (0, swagger_1.ApiOperation)({ summary: 'Search influencers to add to report' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: true, enum: ['INSTAGRAM', 'YOUTUBE'] }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('platform')),
    __param(1, (0, common_1.Query)('q')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], AudienceOverlapController.prototype, "searchInfluencers", null);
exports.AudienceOverlapController = AudienceOverlapController = __decorate([
    (0, swagger_1.ApiTags)('audience-overlap'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('audience-overlap'),
    __metadata("design:paramtypes", [audience_overlap_service_1.AudienceOverlapService])
], AudienceOverlapController);
//# sourceMappingURL=audience-overlap.controller.js.map