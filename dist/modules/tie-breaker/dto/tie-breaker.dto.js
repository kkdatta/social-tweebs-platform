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
exports.SearchInfluencerResultDto = exports.TieBreakerDashboardStatsDto = exports.TieBreakerListResponseDto = exports.TieBreakerComparisonDetailDto = exports.TieBreakerComparisonSummaryDto = exports.TieBreakerInfluencerDto = exports.TopPostDto = exports.InfluencerAudienceDataDto = exports.SearchInfluencerDto = exports.TieBreakerFilterDto = exports.ShareTieBreakerComparisonDto = exports.UpdateTieBreakerComparisonDto = exports.CreateTieBreakerComparisonDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const entities_1 = require("../entities");
class CreateTieBreakerComparisonDto {
}
exports.CreateTieBreakerComparisonDto = CreateTieBreakerComparisonDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Comparison title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTieBreakerComparisonDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.TieBreakerPlatform, description: 'Platform for comparison' }),
    (0, class_validator_1.IsEnum)(entities_1.TieBreakerPlatform),
    __metadata("design:type", String)
], CreateTieBreakerComparisonDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Array of influencer profile IDs (2-3 influencers)', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateTieBreakerComparisonDto.prototype, "influencerIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search query used to find influencers' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTieBreakerComparisonDto.prototype, "searchQuery", void 0);
class UpdateTieBreakerComparisonDto {
}
exports.UpdateTieBreakerComparisonDto = UpdateTieBreakerComparisonDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'New title for the comparison' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTieBreakerComparisonDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the comparison is publicly accessible' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTieBreakerComparisonDto.prototype, "isPublic", void 0);
class ShareTieBreakerComparisonDto {
}
exports.ShareTieBreakerComparisonDto = ShareTieBreakerComparisonDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareTieBreakerComparisonDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.TieBreakerSharePermission, description: 'Permission level' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.TieBreakerSharePermission),
    __metadata("design:type", String)
], ShareTieBreakerComparisonDto.prototype, "permissionLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make publicly shareable via link' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ShareTieBreakerComparisonDto.prototype, "makePublic", void 0);
class TieBreakerFilterDto {
}
exports.TieBreakerFilterDto = TieBreakerFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'ALL'], description: 'Filter by platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TieBreakerFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.TieBreakerStatus, description: 'Filter by status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.TieBreakerStatus),
    __metadata("design:type", String)
], TieBreakerFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'ME', 'TEAM'], description: 'Filter by creator' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TieBreakerFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TieBreakerFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TieBreakerFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TieBreakerFilterDto.prototype, "limit", void 0);
class SearchInfluencerDto {
}
exports.SearchInfluencerDto = SearchInfluencerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.TieBreakerPlatform, description: 'Platform to search' }),
    (0, class_validator_1.IsEnum)(entities_1.TieBreakerPlatform),
    __metadata("design:type", String)
], SearchInfluencerDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search query (username, name, or keyword)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchInfluencerDto.prototype, "query", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Maximum results to return' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SearchInfluencerDto.prototype, "limit", void 0);
class InfluencerAudienceDataDto {
}
exports.InfluencerAudienceDataDto = InfluencerAudienceDataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerAudienceDataDto.prototype, "quality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerAudienceDataDto.prototype, "notablePct", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], InfluencerAudienceDataDto.prototype, "genderData", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], InfluencerAudienceDataDto.prototype, "ageData", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], InfluencerAudienceDataDto.prototype, "countries", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], InfluencerAudienceDataDto.prototype, "cities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], InfluencerAudienceDataDto.prototype, "interests", void 0);
class TopPostDto {
}
exports.TopPostDto = TopPostDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TopPostDto.prototype, "postId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TopPostDto.prototype, "postUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TopPostDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TopPostDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TopPostDto.prototype, "likes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TopPostDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TopPostDto.prototype, "views", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TopPostDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TopPostDto.prototype, "isSponsored", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TopPostDto.prototype, "postDate", void 0);
class TieBreakerInfluencerDto {
}
exports.TieBreakerInfluencerDto = TieBreakerInfluencerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "influencerProfileId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerInfluencerDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "followingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "avgViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "avgComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "avgReelViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TieBreakerInfluencerDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", InfluencerAudienceDataDto)
], TieBreakerInfluencerDto.prototype, "followersAudience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", InfluencerAudienceDataDto)
], TieBreakerInfluencerDto.prototype, "engagersAudience", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [TopPostDto] }),
    __metadata("design:type", Array)
], TieBreakerInfluencerDto.prototype, "topPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerInfluencerDto.prototype, "displayOrder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TieBreakerInfluencerDto.prototype, "wasUnlocked", void 0);
class TieBreakerComparisonSummaryDto {
}
exports.TieBreakerComparisonSummaryDto = TieBreakerComparisonSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerComparisonSummaryDto.prototype, "influencerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TieBreakerInfluencerDto] }),
    __metadata("design:type", Array)
], TieBreakerComparisonSummaryDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TieBreakerComparisonSummaryDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerComparisonSummaryDto.prototype, "createdById", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], TieBreakerComparisonSummaryDto.prototype, "creditsUsed", void 0);
class TieBreakerComparisonDetailDto {
}
exports.TieBreakerComparisonDetailDto = TieBreakerComparisonDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "searchQuery", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TieBreakerInfluencerDto] }),
    __metadata("design:type", Array)
], TieBreakerComparisonDetailDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TieBreakerComparisonDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerComparisonDetailDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TieBreakerComparisonDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], TieBreakerComparisonDetailDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TieBreakerComparisonDetailDto.prototype, "createdById", void 0);
class TieBreakerListResponseDto {
}
exports.TieBreakerListResponseDto = TieBreakerListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TieBreakerComparisonSummaryDto] }),
    __metadata("design:type", Array)
], TieBreakerListResponseDto.prototype, "comparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], TieBreakerListResponseDto.prototype, "hasMore", void 0);
class TieBreakerDashboardStatsDto {
}
exports.TieBreakerDashboardStatsDto = TieBreakerDashboardStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "totalComparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "completedComparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "pendingComparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "processingComparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "failedComparisons", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "comparisonsThisMonth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "totalInfluencersCompared", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TieBreakerDashboardStatsDto.prototype, "totalCreditsUsed", void 0);
class SearchInfluencerResultDto {
}
exports.SearchInfluencerResultDto = SearchInfluencerResultDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "platformUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchInfluencerResultDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SearchInfluencerResultDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchInfluencerResultDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether this influencer is already unlocked by the user' }),
    __metadata("design:type", Boolean)
], SearchInfluencerResultDto.prototype, "isUnlocked", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SearchInfluencerResultDto.prototype, "locationCountry", void 0);
//# sourceMappingURL=tie-breaker.dto.js.map