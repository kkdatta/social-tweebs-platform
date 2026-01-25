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
exports.DashboardStatsDto = exports.CustomErReportListResponseDto = exports.CustomErReportDetailDto = exports.CustomErReportSummaryDto = exports.EngagementMetricsDto = exports.PostSummaryDto = exports.CustomErReportFilterDto = exports.ShareCustomErReportDto = exports.UpdateCustomErReportDto = exports.CreateCustomErReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const entities_1 = require("../entities");
class CreateCustomErReportDto {
}
exports.CreateCustomErReportDto = CreateCustomErReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Influencer profile ID from cached profiles' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCustomErReportDto.prototype, "influencerProfileId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCustomErReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date for analysis (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCustomErReportDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date for analysis (YYYY-MM-DD)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCustomErReportDto.prototype, "dateRangeEnd", void 0);
class UpdateCustomErReportDto {
}
exports.UpdateCustomErReportDto = UpdateCustomErReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCustomErReportDto.prototype, "isPublic", void 0);
class ShareCustomErReportDto {
}
exports.ShareCustomErReportDto = ShareCustomErReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareCustomErReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], ShareCustomErReportDto.prototype, "permissionLevel", void 0);
class CustomErReportFilterDto {
}
exports.CustomErReportFilterDto = CustomErReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomErReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.CustomErReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.CustomErReportStatus),
    __metadata("design:type", String)
], CustomErReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'ME', 'TEAM'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomErReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CustomErReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CustomErReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CustomErReportFilterDto.prototype, "limit", void 0);
class PostSummaryDto {
}
exports.PostSummaryDto = PostSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "postUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "postType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], PostSummaryDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], PostSummaryDto.prototype, "mentions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSummaryDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSummaryDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSummaryDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSummaryDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSummaryDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], PostSummaryDto.prototype, "isSponsored", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostSummaryDto.prototype, "postDate", void 0);
class EngagementMetricsDto {
}
exports.EngagementMetricsDto = EngagementMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], EngagementMetricsDto.prototype, "engagementViewsRate", void 0);
class CustomErReportSummaryDto {
}
exports.CustomErReportSummaryDto = CustomErReportSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CustomErReportSummaryDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.CustomErReportStatus }),
    __metadata("design:type", String)
], CustomErReportSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CustomErReportSummaryDto.prototype, "createdAt", void 0);
class CustomErReportDetailDto {
}
exports.CustomErReportDetailDto = CustomErReportDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CustomErReportDetailDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.CustomErReportStatus }),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: EngagementMetricsDto }),
    __metadata("design:type", EngagementMetricsDto)
], CustomErReportDetailDto.prototype, "allPostsMetrics", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: EngagementMetricsDto }),
    __metadata("design:type", EngagementMetricsDto)
], CustomErReportDetailDto.prototype, "sponsoredPostsMetrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CustomErReportDetailDto.prototype, "hasSponsoredPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PostSummaryDto] }),
    __metadata("design:type", Array)
], CustomErReportDetailDto.prototype, "posts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CustomErReportDetailDto.prototype, "postsChartData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CustomErReportDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CustomErReportDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CustomErReportDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CustomErReportDetailDto.prototype, "completedAt", void 0);
class CustomErReportListResponseDto {
}
exports.CustomErReportListResponseDto = CustomErReportListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CustomErReportSummaryDto] }),
    __metadata("design:type", Array)
], CustomErReportListResponseDto.prototype, "reports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CustomErReportListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CustomErReportListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CustomErReportListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CustomErReportListResponseDto.prototype, "hasMore", void 0);
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
], DashboardStatsDto.prototype, "processingReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "pendingReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "failedReports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "reportsThisMonth", void 0);
//# sourceMappingURL=custom-er.dto.js.map