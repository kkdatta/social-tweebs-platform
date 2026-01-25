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
exports.DashboardStatsDto = exports.SentimentReportListResponseDto = exports.SentimentReportDetailDto = exports.SentimentReportSummaryDto = exports.WordCloudItemDto = exports.EmotionDto = exports.PostSentimentDto = exports.BulkDeleteDto = exports.SentimentReportFilterDto = exports.ShareSentimentReportDto = exports.UpdateSentimentReportDto = exports.CreateSentimentReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const entities_1 = require("../entities");
class CreateSentimentReportDto {
}
exports.CreateSentimentReportDto = CreateSentimentReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ReportType }),
    (0, class_validator_1.IsEnum)(entities_1.ReportType),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target URL(s) for analysis' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateSentimentReportDto.prototype, "urls", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Enable deep brand analysis' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateSentimentReportDto.prototype, "deepBrandAnalysis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "brandUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSentimentReportDto.prototype, "productName", void 0);
class UpdateSentimentReportDto {
}
exports.UpdateSentimentReportDto = UpdateSentimentReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateSentimentReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSentimentReportDto.prototype, "isPublic", void 0);
class ShareSentimentReportDto {
}
exports.ShareSentimentReportDto = ShareSentimentReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareSentimentReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], ShareSentimentReportDto.prototype, "permissionLevel", void 0);
class SentimentReportFilterDto {
}
exports.SentimentReportFilterDto = SentimentReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['INSTAGRAM', 'TIKTOK', 'ALL'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SentimentReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.ReportType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.ReportType),
    __metadata("design:type", String)
], SentimentReportFilterDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.SentimentReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SentimentReportStatus),
    __metadata("design:type", String)
], SentimentReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'ME', 'TEAM'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SentimentReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SentimentReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SentimentReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SentimentReportFilterDto.prototype, "limit", void 0);
class BulkDeleteDto {
}
exports.BulkDeleteDto = BulkDeleteDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkDeleteDto.prototype, "reportIds", void 0);
class PostSentimentDto {
}
exports.PostSentimentDto = PostSentimentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], PostSentimentDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSentimentDto.prototype, "postUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSentimentDto.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSentimentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "likesCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "commentsCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "viewsCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "sentimentScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "positivePercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "neutralPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "negativePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], PostSentimentDto.prototype, "commentsAnalyzed", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], PostSentimentDto.prototype, "postDate", void 0);
class EmotionDto {
}
exports.EmotionDto = EmotionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EmotionDto.prototype, "emotion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EmotionDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EmotionDto.prototype, "count", void 0);
class WordCloudItemDto {
}
exports.WordCloudItemDto = WordCloudItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], WordCloudItemDto.prototype, "word", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], WordCloudItemDto.prototype, "frequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], WordCloudItemDto.prototype, "sentiment", void 0);
class SentimentReportSummaryDto {
}
exports.SentimentReportSummaryDto = SentimentReportSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ReportType }),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SentimentReportSummaryDto.prototype, "overallSentimentScore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.SentimentReportStatus }),
    __metadata("design:type", String)
], SentimentReportSummaryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SentimentReportSummaryDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SentimentReportSummaryDto.prototype, "createdAt", void 0);
class SentimentReportDetailDto {
}
exports.SentimentReportDetailDto = SentimentReportDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.ReportType }),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "reportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "targetUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "influencerAvatarUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: entities_1.SentimentReportStatus }),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "errorMessage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SentimentReportDetailDto.prototype, "overallSentimentScore", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SentimentReportDetailDto.prototype, "positivePercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SentimentReportDetailDto.prototype, "neutralPercentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], SentimentReportDetailDto.prototype, "negativePercentage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SentimentReportDetailDto.prototype, "deepBrandAnalysis", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "brandName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "brandUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "productName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PostSentimentDto] }),
    __metadata("design:type", Array)
], SentimentReportDetailDto.prototype, "posts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [EmotionDto] }),
    __metadata("design:type", Array)
], SentimentReportDetailDto.prototype, "emotions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [WordCloudItemDto] }),
    __metadata("design:type", Array)
], SentimentReportDetailDto.prototype, "wordCloud", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SentimentReportDetailDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], SentimentReportDetailDto.prototype, "shareUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], SentimentReportDetailDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Date)
], SentimentReportDetailDto.prototype, "completedAt", void 0);
class SentimentReportListResponseDto {
}
exports.SentimentReportListResponseDto = SentimentReportListResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SentimentReportSummaryDto] }),
    __metadata("design:type", Array)
], SentimentReportListResponseDto.prototype, "reports", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SentimentReportListResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SentimentReportListResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], SentimentReportListResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], SentimentReportListResponseDto.prototype, "hasMore", void 0);
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
], DashboardStatsDto.prototype, "avgSentimentScore", void 0);
//# sourceMappingURL=sentiment.dto.js.map