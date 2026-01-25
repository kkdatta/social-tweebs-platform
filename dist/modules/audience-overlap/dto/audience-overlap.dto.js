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
exports.DashboardStatsDto = exports.OverlapReportListResponseDto = exports.OverlapReportDetailDto = exports.OverlapReportSummaryDto = exports.InfluencerSummaryDto = exports.OverlapReportFilterDto = exports.ShareOverlapReportDto = exports.UpdateOverlapReportDto = exports.AddInfluencerToReportDto = exports.CreateOverlapReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const entities_1 = require("../entities");
class CreateOverlapReportDto {
}
exports.CreateOverlapReportDto = CreateOverlapReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOverlapReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INSTAGRAM', 'YOUTUBE'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateOverlapReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Array of influencer profile IDs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateOverlapReportDto.prototype, "influencerIds", void 0);
class AddInfluencerToReportDto {
}
exports.AddInfluencerToReportDto = AddInfluencerToReportDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddInfluencerToReportDto.prototype, "influencerProfileId", void 0);
class UpdateOverlapReportDto {
}
exports.UpdateOverlapReportDto = UpdateOverlapReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateOverlapReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOverlapReportDto.prototype, "isPublic", void 0);
class ShareOverlapReportDto {
}
exports.ShareOverlapReportDto = ShareOverlapReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareOverlapReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.OverlapSharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.OverlapSharePermission),
    __metadata("design:type", String)
], ShareOverlapReportDto.prototype, "permissionLevel", void 0);
class OverlapReportFilterDto {
}
exports.OverlapReportFilterDto = OverlapReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['INSTAGRAM', 'YOUTUBE', 'ALL'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OverlapReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.OverlapReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.OverlapReportStatus),
    __metadata("design:type", String)
], OverlapReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'ME', 'TEAM'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OverlapReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OverlapReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OverlapReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], OverlapReportFilterDto.prototype, "limit", void 0);
class InfluencerSummaryDto {
}
exports.InfluencerSummaryDto = InfluencerSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerSummaryDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerSummaryDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerSummaryDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerSummaryDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerSummaryDto.prototype, "uniqueFollowers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerSummaryDto.prototype, "uniquePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerSummaryDto.prototype, "overlappingFollowers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerSummaryDto.prototype, "overlappingPercentage", void 0);
class OverlapReportSummaryDto {
}
exports.OverlapReportSummaryDto = OverlapReportSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.OverlapReportStatus }),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], OverlapReportSummaryDto.prototype, "overlapPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportSummaryDto.prototype, "influencerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InfluencerSummaryDto] }),
    __metadata("design:type", Array)
], OverlapReportSummaryDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], OverlapReportSummaryDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "createdById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OverlapReportSummaryDto.prototype, "createdByName", void 0);
class OverlapReportDetailDto {
}
exports.OverlapReportDetailDto = OverlapReportDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.OverlapReportStatus }),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "totalFollowers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "uniqueFollowers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "overlappingFollowers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "overlapPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "uniquePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InfluencerSummaryDto] }),
    __metadata("design:type", Array)
], OverlapReportDetailDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], OverlapReportDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], OverlapReportDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], OverlapReportDetailDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportDetailDto.prototype, "retryCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], OverlapReportDetailDto.prototype, "createdById", void 0);
class OverlapReportListResponseDto {
}
exports.OverlapReportListResponseDto = OverlapReportListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [OverlapReportSummaryDto] }),
    __metadata("design:type", Array)
], OverlapReportListResponseDto.prototype, "reports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], OverlapReportListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], OverlapReportListResponseDto.prototype, "hasMore", void 0);
class DashboardStatsDto {
}
exports.DashboardStatsDto = DashboardStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "completedReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "pendingReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "inProcessReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "failedReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "reportsThisMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "remainingQuota", void 0);
//# sourceMappingURL=audience-overlap.dto.js.map