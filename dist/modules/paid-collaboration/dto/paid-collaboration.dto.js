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
exports.PostsChartDataDto = exports.PaidCollabDashboardStatsDto = exports.PaidCollabReportListResponseDto = exports.PaidCollabReportDetailDto = exports.PaidCollabReportSummaryDto = exports.PaidCollabCategorizationDto = exports.PaidCollabPostDto = exports.PaidCollabInfluencerDto = exports.PaidCollabReportFilterDto = exports.SharePaidCollabReportDto = exports.UpdatePaidCollabReportDto = exports.CreatePaidCollabReportDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const entities_1 = require("../entities");
class CreatePaidCollabReportDto {
}
exports.CreatePaidCollabReportDto = CreatePaidCollabReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Report title' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaidCollabReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platform', enum: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePaidCollabReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hashtags to search for', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePaidCollabReportDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Mentions (usernames) to search for', type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePaidCollabReportDto.prototype, "mentions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Query logic when both hashtags and mentions are provided', enum: entities_1.QueryLogic }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.QueryLogic),
    __metadata("design:type", String)
], CreatePaidCollabReportDto.prototype, "queryLogic", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date of the date range (max 3 months ago)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePaidCollabReportDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date of the date range' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePaidCollabReportDto.prototype, "dateRangeEnd", void 0);
class UpdatePaidCollabReportDto {
}
exports.UpdatePaidCollabReportDto = UpdatePaidCollabReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Report title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePaidCollabReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make report public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePaidCollabReportDto.prototype, "isPublic", void 0);
class SharePaidCollabReportDto {
}
exports.SharePaidCollabReportDto = SharePaidCollabReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SharePaidCollabReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email to share with (must be registered user)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SharePaidCollabReportDto.prototype, "sharedWithEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permission level', enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], SharePaidCollabReportDto.prototype, "permissionLevel", void 0);
class PaidCollabReportFilterDto {
}
exports.PaidCollabReportFilterDto = PaidCollabReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaidCollabReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status', enum: entities_1.PaidCollabReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.PaidCollabReportStatus),
    __metadata("design:type", String)
], PaidCollabReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by creator: ME, TEAM, SHARED' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaidCollabReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by title or keyword' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PaidCollabReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PaidCollabReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PaidCollabReportFilterDto.prototype, "limit", void 0);
class PaidCollabInfluencerDto {
}
exports.PaidCollabInfluencerDto = PaidCollabInfluencerDto;
class PaidCollabPostDto {
}
exports.PaidCollabPostDto = PaidCollabPostDto;
class PaidCollabCategorizationDto {
}
exports.PaidCollabCategorizationDto = PaidCollabCategorizationDto;
class PaidCollabReportSummaryDto {
}
exports.PaidCollabReportSummaryDto = PaidCollabReportSummaryDto;
class PaidCollabReportDetailDto {
}
exports.PaidCollabReportDetailDto = PaidCollabReportDetailDto;
class PaidCollabReportListResponseDto {
}
exports.PaidCollabReportListResponseDto = PaidCollabReportListResponseDto;
class PaidCollabDashboardStatsDto {
}
exports.PaidCollabDashboardStatsDto = PaidCollabDashboardStatsDto;
class PostsChartDataDto {
}
exports.PostsChartDataDto = PostsChartDataDto;
//# sourceMappingURL=paid-collaboration.dto.js.map