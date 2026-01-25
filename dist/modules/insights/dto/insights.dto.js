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
exports.ExportInsightResponseDto = exports.ExportInsightDto = exports.RefreshInsightResponseDto = exports.SearchInsightResponseDto = exports.FullInsightResponseDto = exports.PostDto = exports.LookalikesDataDto = exports.GrowthDataDto = exports.EngagementDataDto = exports.AudienceDemographicsDto = exports.InsightStatsDto = exports.InsightListResponseDto = exports.InsightListItemDto = exports.ListInsightsQueryDto = exports.SearchInsightDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../../common/enums");
class SearchInsightDto {
}
exports.SearchInsightDto = SearchInsightDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType, description: 'Platform to search on' }),
    (0, class_validator_1.IsEnum)(enums_1.PlatformType),
    __metadata("design:type", String)
], SearchInsightDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Influencer username or handle' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchInsightDto.prototype, "username", void 0);
class ListInsightsQueryDto {
    constructor() {
        this.page = 1;
        this.limit = 20;
    }
}
exports.ListInsightsQueryDto = ListInsightsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.PlatformType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.PlatformType),
    __metadata("design:type", String)
], ListInsightsQueryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by username or full name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListInsightsQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListInsightsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ListInsightsQueryDto.prototype, "limit", void 0);
class InsightListItemDto {
}
exports.InsightListItemDto = InsightListItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InsightListItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InsightListItemDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InsightListItemDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InsightListItemDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InsightListItemDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightListItemDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightListItemDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InsightListItemDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InsightListItemDto.prototype, "unlockedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InsightListItemDto.prototype, "lastRefreshedAt", void 0);
class InsightListResponseDto {
}
exports.InsightListResponseDto = InsightListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [InsightListItemDto] }),
    __metadata("design:type", Array)
], InsightListResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightListResponseDto.prototype, "limit", void 0);
class InsightStatsDto {
}
exports.InsightStatsDto = InsightStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "followingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "postCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgViews", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgReelViews", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgReelLikes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "avgReelComments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "brandPostER", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InsightStatsDto.prototype, "postsWithHiddenLikesPct", void 0);
class AudienceDemographicsDto {
}
exports.AudienceDemographicsDto = AudienceDemographicsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], AudienceDemographicsDto.prototype, "credibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], AudienceDemographicsDto.prototype, "notableFollowersPct", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AudienceDemographicsDto.prototype, "genderSplit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "ageGroups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "topCountries", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "topCities", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "languages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "interests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], AudienceDemographicsDto.prototype, "brandAffinity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], AudienceDemographicsDto.prototype, "reachability", void 0);
class EngagementDataDto {
}
exports.EngagementDataDto = EngagementDataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], EngagementDataDto.prototype, "rateDistribution", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], EngagementDataDto.prototype, "likesSpread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], EngagementDataDto.prototype, "commentsSpread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], EngagementDataDto.prototype, "topHashtags", void 0);
class GrowthDataDto {
}
exports.GrowthDataDto = GrowthDataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], GrowthDataDto.prototype, "last6Months", void 0);
class LookalikesDataDto {
}
exports.LookalikesDataDto = LookalikesDataDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], LookalikesDataDto.prototype, "influencer", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], LookalikesDataDto.prototype, "audience", void 0);
class PostDto {
}
exports.PostDto = PostDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostDto.prototype, "caption", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostDto.prototype, "likes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostDto.prototype, "comments", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostDto.prototype, "views", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostDto.prototype, "postedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostDto.prototype, "url", void 0);
class FullInsightResponseDto {
}
exports.FullInsightResponseDto = FullInsightResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "bio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], FullInsightResponseDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "locationCountry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", InsightStatsDto)
], FullInsightResponseDto.prototype, "stats", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", AudienceDemographicsDto)
], FullInsightResponseDto.prototype, "audience", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", EngagementDataDto)
], FullInsightResponseDto.prototype, "engagement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", GrowthDataDto)
], FullInsightResponseDto.prototype, "growth", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", LookalikesDataDto)
], FullInsightResponseDto.prototype, "lookalikes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], FullInsightResponseDto.prototype, "brandAffinity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], FullInsightResponseDto.prototype, "interests", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], FullInsightResponseDto.prototype, "wordCloud", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], FullInsightResponseDto.prototype, "posts", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Object)
], FullInsightResponseDto.prototype, "reels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], FullInsightResponseDto.prototype, "lastRefreshedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['FRESH', 'STALE'] }),
    __metadata("design:type", String)
], FullInsightResponseDto.prototype, "dataFreshnessStatus", void 0);
class SearchInsightResponseDto {
}
exports.SearchInsightResponseDto = SearchInsightResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchInsightResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SearchInsightResponseDto.prototype, "isNew", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SearchInsightResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SearchInsightResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: FullInsightResponseDto }),
    __metadata("design:type", FullInsightResponseDto)
], SearchInsightResponseDto.prototype, "insight", void 0);
class RefreshInsightResponseDto {
}
exports.RefreshInsightResponseDto = RefreshInsightResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RefreshInsightResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RefreshInsightResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RefreshInsightResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: FullInsightResponseDto }),
    __metadata("design:type", FullInsightResponseDto)
], RefreshInsightResponseDto.prototype, "insight", void 0);
class ExportInsightDto {
}
exports.ExportInsightDto = ExportInsightDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ExportInsightDto.prototype, "insightId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['pdf', 'excel'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportInsightDto.prototype, "format", void 0);
class ExportInsightResponseDto {
}
exports.ExportInsightResponseDto = ExportInsightResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ExportInsightResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ExportInsightResponseDto.prototype, "downloadUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ExportInsightResponseDto.prototype, "creditsUsed", void 0);
//# sourceMappingURL=insights.dto.js.map