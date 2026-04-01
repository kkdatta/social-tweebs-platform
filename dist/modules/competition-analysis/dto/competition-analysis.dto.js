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
exports.CompetitionReportListResponseDto = exports.CompetitionReportDetailDto = exports.CompetitionReportSummaryDto = exports.DashboardStatsDto = exports.ChartDataDto = exports.EnhancedChartDataDto = exports.BrandShareDto = exports.TimelineDataPointDto = exports.PostTypeStatsDto = exports.CategoryStatsDto = exports.CompetitionPostDto = exports.CompetitionInfluencerDto = exports.BrandSummaryDto = exports.InfluencersFilterDto = exports.PostsFilterDto = exports.CompetitionReportFilterDto = exports.ShareCompetitionReportDto = exports.UpdateCompetitionReportDto = exports.CreateCompetitionReportDto = exports.BrandInputDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const entities_1 = require("../entities");
class BrandInputDto {
}
exports.BrandInputDto = BrandInputDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Brand name', example: 'Nike' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BrandInputDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Hashtags to track', example: ['#nike', '#justdoit'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BrandInputDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Username/mention to track', example: '@nike' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BrandInputDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Keywords to track', example: ['nike shoes', 'air jordan'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BrandInputDto.prototype, "keywords", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Platform for this brand', example: 'INSTAGRAM' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BrandInputDto.prototype, "platform", void 0);
class CreateCompetitionReportDto {
}
exports.CreateCompetitionReportDto = CreateCompetitionReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Report title', example: 'Nike vs Adidas Q1 2024' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompetitionReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platforms to analyze', example: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateCompetitionReportDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start date', example: '2024-01-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompetitionReportDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'End date', example: '2024-03-31' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompetitionReportDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Brands to compare (2-5)',
        type: [BrandInputDto],
        example: [
            { brandName: 'Nike', hashtags: ['#nike'], username: '@nike' },
            { brandName: 'Adidas', hashtags: ['#adidas'], username: '@adidas' }
        ]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2),
    (0, class_validator_1.ArrayMaxSize)(5),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BrandInputDto),
    __metadata("design:type", Array)
], CreateCompetitionReportDto.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable auto-refresh', default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateCompetitionReportDto.prototype, "autoRefreshEnabled", void 0);
class UpdateCompetitionReportDto {
}
exports.UpdateCompetitionReportDto = UpdateCompetitionReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Report title' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompetitionReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make report public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateCompetitionReportDto.prototype, "isPublic", void 0);
class ShareCompetitionReportDto {
}
exports.ShareCompetitionReportDto = ShareCompetitionReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareCompetitionReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Permission level', enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], ShareCompetitionReportDto.prototype, "permissionLevel", void 0);
class CompetitionReportFilterDto {
}
exports.CompetitionReportFilterDto = CompetitionReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompetitionReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by status', enum: entities_1.CompetitionReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.CompetitionReportStatus),
    __metadata("design:type", String)
], CompetitionReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by creator', enum: ['ALL', 'ME', 'TEAM', 'SHARED'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompetitionReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search query' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompetitionReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CompetitionReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], CompetitionReportFilterDto.prototype, "limit", void 0);
class PostsFilterDto {
}
exports.PostsFilterDto = PostsFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by brand ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by category', enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort by field' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PostsFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], PostsFilterDto.prototype, "limit", void 0);
class InfluencersFilterDto {
}
exports.InfluencersFilterDto = InfluencersFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by brand ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by category', enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort by field' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], InfluencersFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value)),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], InfluencersFilterDto.prototype, "limit", void 0);
class BrandSummaryDto {
}
exports.BrandSummaryDto = BrandSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BrandSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BrandSummaryDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], BrandSummaryDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BrandSummaryDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], BrandSummaryDto.prototype, "keywords", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BrandSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], BrandSummaryDto.prototype, "displayColor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "influencerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "totalLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "totalViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "totalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "totalShares", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "totalFollowers", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "photoCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "videoCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "carouselCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "reelCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "nanoCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "microCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "macroCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandSummaryDto.prototype, "megaCount", void 0);
class CompetitionInfluencerDto {
}
exports.CompetitionInfluencerDto = CompetitionInfluencerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionInfluencerDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "audienceCredibility", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionInfluencerDto.prototype, "avgEngagementRate", void 0);
class CompetitionPostDto {
}
exports.CompetitionPostDto = CompetitionPostDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "postUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "postType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], CompetitionPostDto.prototype, "matchedHashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "matchedUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], CompetitionPostDto.prototype, "matchedKeywords", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompetitionPostDto.prototype, "isSponsored", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "postDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "influencerId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionPostDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "influencerFollowerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionPostDto.prototype, "influencerCredibility", void 0);
class CategoryStatsDto {
}
exports.CategoryStatsDto = CategoryStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CategoryStatsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CategoryStatsDto.prototype, "label", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "accountsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "followersCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "postsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "sharesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CategoryStatsDto.prototype, "engagementRate", void 0);
class PostTypeStatsDto {
}
exports.PostTypeStatsDto = PostTypeStatsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostTypeStatsDto.prototype, "brandId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostTypeStatsDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "photoCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "videoCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "carouselCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "reelCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "photoPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "videoPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "carouselPercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostTypeStatsDto.prototype, "reelPercentage", void 0);
class TimelineDataPointDto {
}
exports.TimelineDataPointDto = TimelineDataPointDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TimelineDataPointDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Count per brand', type: 'object' }),
    __metadata("design:type", Object)
], TimelineDataPointDto.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TimelineDataPointDto.prototype, "total", void 0);
class BrandShareDto {
}
exports.BrandShareDto = BrandShareDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BrandShareDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], BrandShareDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], BrandShareDto.prototype, "color", void 0);
class EnhancedChartDataDto {
}
exports.EnhancedChartDataDto = EnhancedChartDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TimelineDataPointDto] }),
    __metadata("design:type", Array)
], EnhancedChartDataDto.prototype, "postsOverTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TimelineDataPointDto] }),
    __metadata("design:type", Array)
], EnhancedChartDataDto.prototype, "influencersOverTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BrandShareDto] }),
    __metadata("design:type", Array)
], EnhancedChartDataDto.prototype, "postsShare", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BrandShareDto] }),
    __metadata("design:type", Array)
], EnhancedChartDataDto.prototype, "influencersShare", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BrandShareDto] }),
    __metadata("design:type", Array)
], EnhancedChartDataDto.prototype, "engagementShare", void 0);
class ChartDataDto {
}
exports.ChartDataDto = ChartDataDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ChartDataDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Posts count per brand', type: 'object' }),
    __metadata("design:type", Object)
], ChartDataDto.prototype, "brandPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ChartDataDto.prototype, "totalPosts", void 0);
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
], DashboardStatsDto.prototype, "inProgressReports", void 0);
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
], DashboardStatsDto.prototype, "totalBrandsAnalyzed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalInfluencersAnalyzed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalPostsAnalyzed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DashboardStatsDto.prototype, "avgEngagementRate", void 0);
class CompetitionReportSummaryDto {
}
exports.CompetitionReportSummaryDto = CompetitionReportSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CompetitionReportSummaryDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportSummaryDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportSummaryDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportSummaryDto.prototype, "totalBrands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportSummaryDto.prototype, "totalPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportSummaryDto.prototype, "totalInfluencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportSummaryDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CompetitionReportSummaryDto.prototype, "createdAt", void 0);
class CompetitionReportDetailDto {
}
exports.CompetitionReportDetailDto = CompetitionReportDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompetitionReportDetailDto.prototype, "autoRefreshEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalBrands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalInfluencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalPosts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalShares", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "avgEngagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "totalFollowers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [BrandSummaryDto] }),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "brands", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CompetitionInfluencerDto] }),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "influencers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CompetitionPostDto] }),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "posts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CategoryStatsDto] }),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "categorization", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PostTypeStatsDto] }),
    __metadata("design:type", Array)
], CompetitionReportDetailDto.prototype, "postTypeBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompetitionReportDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], CompetitionReportDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportDetailDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CompetitionReportDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], CompetitionReportDetailDto.prototype, "completedAt", void 0);
class CompetitionReportListResponseDto {
}
exports.CompetitionReportListResponseDto = CompetitionReportListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CompetitionReportSummaryDto] }),
    __metadata("design:type", Array)
], CompetitionReportListResponseDto.prototype, "reports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CompetitionReportListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CompetitionReportListResponseDto.prototype, "hasMore", void 0);
//# sourceMappingURL=competition-analysis.dto.js.map