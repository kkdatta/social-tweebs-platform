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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardStatsDto = exports.GeneratedReportsListResponseDto = exports.PaidCollaborationReportDto = exports.DiscoveryExportDto = exports.BulkDeleteReportsDto = exports.RenameReportDto = exports.GeneratedReportsFilterDto = exports.ReportCreatedBy = exports.ReportTab = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ReportTab;
(function (ReportTab) {
    ReportTab["INFLUENCER_DISCOVERY"] = "INFLUENCER_DISCOVERY";
    ReportTab["PAID_COLLABORATION"] = "PAID_COLLABORATION";
})(ReportTab || (exports.ReportTab = ReportTab = {}));
var ReportCreatedBy;
(function (ReportCreatedBy) {
    ReportCreatedBy["ALL"] = "ALL";
    ReportCreatedBy["ME"] = "ME";
    ReportCreatedBy["TEAM"] = "TEAM";
})(ReportCreatedBy || (exports.ReportCreatedBy = ReportCreatedBy = {}));
class GeneratedReportsFilterDto {
}
exports.GeneratedReportsFilterDto = GeneratedReportsFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ReportTab }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReportTab),
    __metadata("design:type", String)
], GeneratedReportsFilterDto.prototype, "tab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GeneratedReportsFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GeneratedReportsFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ReportCreatedBy }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ReportCreatedBy),
    __metadata("design:type", String)
], GeneratedReportsFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GeneratedReportsFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GeneratedReportsFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GeneratedReportsFilterDto.prototype, "limit", void 0);
class RenameReportDto {
}
exports.RenameReportDto = RenameReportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RenameReportDto.prototype, "title", void 0);
class BulkDeleteReportsDto {
}
exports.BulkDeleteReportsDto = BulkDeleteReportsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkDeleteReportsDto.prototype, "reportIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ReportTab }),
    (0, class_validator_1.IsEnum)(ReportTab),
    __metadata("design:type", String)
], BulkDeleteReportsDto.prototype, "tab", void 0);
class DiscoveryExportDto {
}
exports.DiscoveryExportDto = DiscoveryExportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "exportFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DiscoveryExportDto.prototype, "profileCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DiscoveryExportDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], DiscoveryExportDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], DiscoveryExportDto.prototype, "downloadedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "createdById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], DiscoveryExportDto.prototype, "createdByName", void 0);
class PaidCollaborationReportDto {
}
exports.PaidCollaborationReportDto = PaidCollaborationReportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "exportFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaidCollaborationReportDto.prototype, "influencerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "fileUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PaidCollaborationReportDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], PaidCollaborationReportDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], PaidCollaborationReportDto.prototype, "downloadedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "createdById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PaidCollaborationReportDto.prototype, "createdByName", void 0);
class GeneratedReportsListResponseDto {
}
exports.GeneratedReportsListResponseDto = GeneratedReportsListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DiscoveryExportDto] }),
    __metadata("design:type", Array)
], GeneratedReportsListResponseDto.prototype, "discoveryExports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PaidCollaborationReportDto] }),
    __metadata("design:type", Array)
], GeneratedReportsListResponseDto.prototype, "paidCollaborationReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GeneratedReportsListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GeneratedReportsListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GeneratedReportsListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GeneratedReportsListResponseDto.prototype, "hasMore", void 0);
class DashboardStatsDto {
}
exports.DashboardStatsDto = DashboardStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalDiscoveryExports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalPaidCollaborationReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "reportsThisMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], DashboardStatsDto.prototype, "byPlatform", void 0);
//# sourceMappingURL=generated-reports.dto.js.map