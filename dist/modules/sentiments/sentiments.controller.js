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
exports.SentimentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const sentiments_service_1 = require("./sentiments.service");
const dto_1 = require("./dto");
let SentimentsController = class SentimentsController {
    constructor(sentimentsService) {
        this.sentimentsService = sentimentsService;
    }
    async createReport(userId, dto) {
        return this.sentimentsService.createReport(userId, dto);
    }
    async getReports(userId, filters) {
        return this.sentimentsService.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.sentimentsService.getDashboardStats(userId);
    }
    async getReportById(userId, reportId) {
        return this.sentimentsService.getReportById(userId, reportId);
    }
    async updateReport(userId, reportId, dto) {
        return this.sentimentsService.updateReport(userId, reportId, dto);
    }
    async deleteReport(userId, reportId) {
        return this.sentimentsService.deleteReport(userId, reportId);
    }
    async bulkDeleteReports(userId, dto) {
        return this.sentimentsService.bulkDeleteReports(userId, dto.reportIds);
    }
    async retryReport(userId, reportId) {
        return this.sentimentsService.retryReport(userId, reportId);
    }
    async shareReport(userId, reportId, dto) {
        return this.sentimentsService.shareReport(userId, reportId, dto);
    }
    async downloadPdf(userId, reportId, res) {
        const { buffer, filename } = await this.sentimentsService.generatePdf(userId, reportId);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        return new common_1.StreamableFile(buffer);
    }
    async getSharedReport(token) {
        return this.sentimentsService.getReportByShareToken(token);
    }
};
exports.SentimentsController = SentimentsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create sentiment report(s) - 1 credit per URL' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Report(s) created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request or insufficient credits' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateSentimentReportDto]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of sentiment reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] }),
    (0, swagger_1.ApiQuery)({ name: 'reportType', required: false, enum: ['POST', 'PROFILE'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'AGGREGATING', 'IN_PROCESS', 'COMPLETED', 'FAILED'] }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.SentimentReportListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SentimentReportFilterDto]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardStatsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.SentimentReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "getReportById", null);
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
    __metadata("design:paramtypes", [String, String, dto_1.UpdateSentimentReportDto]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "updateReport", null);
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
], SentimentsController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)('bulk-delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk delete reports' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reports deleted' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.BulkDeleteDto]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "bulkDeleteReports", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, swagger_1.ApiOperation)({ summary: 'Retry a failed sentiment report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report retry initiated' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Report is not in FAILED status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share report with user or get shareable link' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report shared' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareSentimentReportDto]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "shareReport", null);
__decorate([
    (0, common_1.Get)(':id/download-pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Download report as PDF' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'PDF file stream' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "downloadPdf", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get publicly shared report by token' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.SentimentReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or not public' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SentimentsController.prototype, "getSharedReport", null);
exports.SentimentsController = SentimentsController = __decorate([
    (0, swagger_1.ApiTags)('sentiments'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sentiments'),
    __metadata("design:paramtypes", [sentiments_service_1.SentimentsService])
], SentimentsController);
//# sourceMappingURL=sentiments.controller.js.map