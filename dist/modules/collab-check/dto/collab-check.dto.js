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
exports.PostsChartDataDto = exports.DashboardStatsDto = exports.CollabCheckReportListResponseDto = exports.CollabCheckReportDetailDto = exports.CollabCheckReportSummaryDto = exports.CollabCheckPostDto = exports.CollabCheckInfluencerDto = exports.CollabCheckReportFilterDto = exports.ShareCollabCheckReportDto = exports.UpdateCollabCheckReportDto = exports.CreateCollabCheckReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const entities_1 = require("../entities");
class CreateCollabCheckReportDto {
}
exports.CreateCollabCheckReportDto = CreateCollabCheckReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Report title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCollabCheckReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platform', enum: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCollabCheckReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Time period for analysis', enum: entities_1.TimePeriod }),
    (0, class_validator_1.IsEnum)(entities_1.TimePeriod),
    __metadata("design:type", String)
], CreateCollabCheckReportDto.prototype, "timePeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search queries (hashtags, mentions, keywords)', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one query is required' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCollabCheckReportDto.prototype, "queries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Influencer profile IDs or usernames', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'At least one influencer is required' }),
    (0, class_validator_1.ArrayMaxSize)(10, { message: 'Maximum 10 influencers allowed' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCollabCheckReportDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable multiple influencer analysis' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCollabCheckReportDto.prototype, "multipleInfluencers", void 0);
class UpdateCollabCheckReportDto {
}
exports.UpdateCollabCheckReportDto = UpdateCollabCheckReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Report title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCollabCheckReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make report public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCollabCheckReportDto.prototype, "isPublic", void 0);
class ShareCollabCheckReportDto {
}
exports.ShareCollabCheckReportDto = ShareCollabCheckReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareCollabCheckReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permission level', enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], ShareCollabCheckReportDto.prototype, "permissionLevel", void 0);
class CollabCheckReportFilterDto {
}
exports.CollabCheckReportFilterDto = CollabCheckReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollabCheckReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status', enum: entities_1.CollabReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.CollabReportStatus),
    __metadata("design:type", String)
], CollabCheckReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by creator', enum: ['ALL', 'ME', 'TEAM'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollabCheckReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search query' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CollabCheckReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CollabCheckReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value, 10)),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CollabCheckReportFilterDto.prototype, "limit", void 0);
class CollabCheckInfluencerDto {
}
exports.CollabCheckInfluencerDto = CollabCheckInfluencerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckInfluencerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckInfluencerDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckInfluencerDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckInfluencerDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckInfluencerDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CollabCheckInfluencerDto.prototype, "avgEngagementRate", void 0);
class CollabCheckPostDto {
}
exports.CollabCheckPostDto = CollabCheckPostDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "postUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "postType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    __metadata("design:type", Array)
], CollabCheckPostDto.prototype, "matchedKeywords", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckPostDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckPostDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckPostDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckPostDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CollabCheckPostDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "postDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckPostDto.prototype, "influencerUsername", void 0);
class CollabCheckReportSummaryDto {
}
exports.CollabCheckReportSummaryDto = CollabCheckReportSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.CollabReportStatus }),
    __metadata("design:type", String)
], CollabCheckReportSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.TimePeriod }),
    __metadata("design:type", String)
], CollabCheckReportSummaryDto.prototype, "timePeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], CollabCheckReportSummaryDto.prototype, "queries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportSummaryDto.prototype, "totalPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportSummaryDto.prototype, "totalFollowers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportSummaryDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CollabCheckReportSummaryDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [CollabCheckInfluencerDto] }),
    __metadata("design:type", Array)
], CollabCheckReportSummaryDto.prototype, "influencers", void 0);
class CollabCheckReportDetailDto {
}
exports.CollabCheckReportDetailDto = CollabCheckReportDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.CollabReportStatus }),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.TimePeriod }),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "timePeriod", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], CollabCheckReportDetailDto.prototype, "queries", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalShares", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "totalFollowers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CollabCheckInfluencerDto] }),
    __metadata("design:type", Array)
], CollabCheckReportDetailDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CollabCheckPostDto] }),
    __metadata("design:type", Array)
], CollabCheckReportDetailDto.prototype, "posts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CollabCheckReportDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CollabCheckReportDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportDetailDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CollabCheckReportDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CollabCheckReportDetailDto.prototype, "completedAt", void 0);
class CollabCheckReportListResponseDto {
}
exports.CollabCheckReportListResponseDto = CollabCheckReportListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CollabCheckReportSummaryDto] }),
    __metadata("design:type", Array)
], CollabCheckReportListResponseDto.prototype, "reports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CollabCheckReportListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CollabCheckReportListResponseDto.prototype, "hasMore", void 0);
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
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalPostsAnalyzed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "avgEngagementRate", void 0);
class PostsChartDataDto {
}
exports.PostsChartDataDto = PostsChartDataDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostsChartDataDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostsChartDataDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostsChartDataDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostsChartDataDto.prototype, "viewsCount", void 0);
//# sourceMappingURL=collab-check.dto.js.map