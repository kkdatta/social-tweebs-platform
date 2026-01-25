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
exports.GeneratedReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const decorators_1 = require("../../common/decorators");
const generated_reports_service_1 = require("./generated-reports.service");
const dto_1 = require("./dto");
let GeneratedReportsController = class GeneratedReportsController {
    constructor(generatedReportsService) {
        this.generatedReportsService = generatedReportsService;
    }
    async getReports(userId, userRole, filters) {
        return this.generatedReportsService.getReports(userId, userRole, filters);
    }
    async getDashboardStats(userId, userRole) {
        return this.generatedReportsService.getDashboardStats(userId, userRole);
    }
    async getReportById(userId, userRole, tab, reportId) {
        return this.generatedReportsService.getReportById(userId, userRole, reportId, tab);
    }
    async renameReport(userId, userRole, tab, reportId, dto) {
        return this.generatedReportsService.renameReport(userId, userRole, reportId, tab, dto);
    }
    async deleteReport(userId, userRole, tab, reportId) {
        return this.generatedReportsService.deleteReport(userId, userRole, reportId, tab);
    }
    async bulkDeleteReports(userId, userRole, dto) {
        return this.generatedReportsService.bulkDeleteReports(userId, userRole, dto);
    }
    async downloadReport(userId, userRole, tab, reportId) {
        return this.generatedReportsService.downloadReport(userId, userRole, reportId, tab);
    }
};
exports.GeneratedReportsController = GeneratedReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of generated reports' }),
    (0, swagger_1.ApiQuery)({ name: 'tab', enum: dto_1.ReportTab, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.GeneratedReportsFilterDto]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)(':tab/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get report by ID' }),
    (0, swagger_1.ApiParam)({ name: 'tab', enum: dto_1.ReportTab }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('tab')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "getReportById", null);
__decorate([
    (0, common_1.Patch)(':tab/:id/rename'),
    (0, swagger_1.ApiOperation)({ summary: 'Rename a report' }),
    (0, swagger_1.ApiParam)({ name: 'tab', enum: dto_1.ReportTab }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('tab')),
    __param(3, (0, common_1.Param)('id')),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, dto_1.RenameReportDto]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "renameReport", null);
__decorate([
    (0, common_1.Delete)(':tab/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a report' }),
    (0, swagger_1.ApiParam)({ name: 'tab', enum: dto_1.ReportTab }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('tab')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "deleteReport", null);
__decorate([
    (0, common_1.Post)('bulk-delete'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk delete reports' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.BulkDeleteReportsDto]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "bulkDeleteReports", null);
__decorate([
    (0, common_1.Post)(':tab/:id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Re-download a report' }),
    (0, swagger_1.ApiParam)({ name: 'tab', enum: dto_1.ReportTab }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, decorators_1.CurrentUser)('role')),
    __param(2, (0, common_1.Param)('tab')),
    __param(3, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GeneratedReportsController.prototype, "downloadReport", null);
exports.GeneratedReportsController = GeneratedReportsController = __decorate([
    (0, swagger_1.ApiTags)('generated-reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('generated-reports'),
    __metadata("design:paramtypes", [generated_reports_service_1.GeneratedReportsService])
], GeneratedReportsController);
//# sourceMappingURL=generated-reports.controller.js.map