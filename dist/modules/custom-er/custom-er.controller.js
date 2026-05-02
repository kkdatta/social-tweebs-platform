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
exports.CustomErController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const custom_er_service_1 = require("./custom-er.service");
const dto_1 = require("./dto");
let CustomErController = class CustomErController {
    constructor(customErService) {
        this.customErService = customErService;
    }
    async getSharedReport(token) {
        return this.customErService.getReportByShareToken(token);
    }
    async createReport(userId, dto) {
        return this.customErService.createReport(userId, dto);
    }
    async uploadExcel(userId, file, platform, dateRangeStart, dateRangeEnd) {
        return this.customErService.createReportsFromExcel(userId, file, platform, dateRangeStart, dateRangeEnd);
    }
    async downloadSampleFile(res) {
        const buffer = this.customErService.generateSampleExcel();
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="custom_er_sample.xlsx"',
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async getReports(userId, filters) {
        return this.customErService.getReports(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.customErService.getDashboardStats(userId);
    }
    async getReportById(userId, reportId) {
        return this.customErService.getReportById(userId, reportId);
    }
    async getReportPosts(userId, reportId, sponsoredOnly) {
        return this.customErService.getReportPosts(userId, reportId, sponsoredOnly === 'true');
    }
    async downloadReport(userId, reportId, res) {
        const { buffer, filename } = await this.customErService.downloadReportAsXlsx(userId, reportId);
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async updateReport(userId, reportId, dto) {
        return this.customErService.updateReport(userId, reportId, dto);
    }
    async deleteReport(userId, reportId) {
        return this.customErService.deleteReport(userId, reportId);
    }
    async retryReport(userId, reportId) {
        return this.customErService.retryReport(userId, reportId);
    }
    async shareReport(userId, reportId, dto) {
        return this.customErService.shareReport(userId, reportId, dto);
    }
};
exports.CustomErController = CustomErController;
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get publicly shared report by token' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CustomErReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found or not public' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "getSharedReport", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new custom ER report (FREE - no credits)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Report created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateCustomErReportDto]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "createReport", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create reports by uploading Excel file with influencer URLs' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                platform: { type: 'string', enum: ['INSTAGRAM', 'TIKTOK'] },
                dateRangeStart: { type: 'string', format: 'date' },
                dateRangeEnd: { type: 'string', format: 'date' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Reports created from uploaded file' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file or data' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('platform')),
    __param(3, (0, common_1.Body)('dateRangeStart')),
    __param(4, (0, common_1.Body)('dateRangeEnd')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "uploadExcel", null);
__decorate([
    (0, common_1.Get)('sample-file'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download sample Excel file for bulk upload' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sample Excel file' }),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "downloadSampleFile", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of custom ER reports' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CustomErReportListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CustomErReportFilterDto]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.DashboardStatsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get report details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.CustomErReportDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Get)(':id/posts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get posts for a report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiQuery)({ name: 'sponsoredOnly', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [dto_1.PostSummaryDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('sponsoredOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "getReportPosts", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download report as XLSX' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'XLSX file download' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "downloadReport", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update report (visibility)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateCustomErReportDto]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "updateReport", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)(':id/retry'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retry a failed report' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report retry triggered' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Report is not in FAILED status' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Report not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "retryReport", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share report with user or get shareable link' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report shared' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareCustomErReportDto]),
    __metadata("design:returntype", Promise)
], CustomErController.prototype, "shareReport", null);
exports.CustomErController = CustomErController = __decorate([
    (0, swagger_1.ApiTags)('custom-er'),
    (0, common_1.Controller)('custom-er'),
    __metadata("design:paramtypes", [custom_er_service_1.CustomErService])
], CustomErController);
//# sourceMappingURL=custom-er.controller.js.map