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
exports.InfluencersFilterDto = exports.PostsFilterDto = exports.ChartDataDto = exports.DashboardStatsDto = exports.CategoryStatsDto = exports.MentionTrackingPostDto = exports.MentionTrackingInfluencerDto = exports.MentionTrackingReportDetailDto = exports.MentionTrackingReportSummaryDto = exports.MentionTrackingReportListResponseDto = exports.MentionTrackingReportFilterDto = exports.ShareMentionTrackingReportDto = exports.UpdateMentionTrackingReportDto = exports.CreateMentionTrackingReportDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const entities_1 = require("../entities");
class CreateMentionTrackingReportDto {
}
exports.CreateMentionTrackingReportDto = CreateMentionTrackingReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMentionTrackingReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], example: ['INSTAGRAM', 'TIKTOK'] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(2),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMentionTrackingReportDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMentionTrackingReportDto.prototype, "dateRangeStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMentionTrackingReportDto.prototype, "dateRangeEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['#brandname', '#sponsored'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMentionTrackingReportDto.prototype, "hashtags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['@brandname', '@influencer'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMentionTrackingReportDto.prototype, "usernames", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], example: ['brand name', 'product'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateMentionTrackingReportDto.prototype, "keywords", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMentionTrackingReportDto.prototype, "sponsoredOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMentionTrackingReportDto.prototype, "autoRefreshEnabled", void 0);
class UpdateMentionTrackingReportDto {
}
exports.UpdateMentionTrackingReportDto = UpdateMentionTrackingReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMentionTrackingReportDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMentionTrackingReportDto.prototype, "isPublic", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMentionTrackingReportDto.prototype, "sponsoredOnly", void 0);
class ShareMentionTrackingReportDto {
}
exports.ShareMentionTrackingReportDto = ShareMentionTrackingReportDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareMentionTrackingReportDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShareMentionTrackingReportDto.prototype, "sharedWithEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.SharePermission }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.SharePermission),
    __metadata("design:type", String)
], ShareMentionTrackingReportDto.prototype, "permissionLevel", void 0);
class MentionTrackingReportFilterDto {
}
exports.MentionTrackingReportFilterDto = MentionTrackingReportFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MentionTrackingReportFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: entities_1.MentionReportStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(entities_1.MentionReportStatus),
    __metadata("design:type", String)
], MentionTrackingReportFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'ME', 'TEAM', 'SHARED', 'PUBLIC'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MentionTrackingReportFilterDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MentionTrackingReportFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MentionTrackingReportFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MentionTrackingReportFilterDto.prototype, "limit", void 0);
class MentionTrackingReportListResponseDto {
}
exports.MentionTrackingReportListResponseDto = MentionTrackingReportListResponseDto;
class MentionTrackingReportSummaryDto {
}
exports.MentionTrackingReportSummaryDto = MentionTrackingReportSummaryDto;
class MentionTrackingReportDetailDto {
}
exports.MentionTrackingReportDetailDto = MentionTrackingReportDetailDto;
class MentionTrackingInfluencerDto {
}
exports.MentionTrackingInfluencerDto = MentionTrackingInfluencerDto;
class MentionTrackingPostDto {
}
exports.MentionTrackingPostDto = MentionTrackingPostDto;
class CategoryStatsDto {
}
exports.CategoryStatsDto = CategoryStatsDto;
class DashboardStatsDto {
}
exports.DashboardStatsDto = DashboardStatsDto;
class ChartDataDto {
}
exports.ChartDataDto = ChartDataDto;
class PostsFilterDto {
}
exports.PostsFilterDto = PostsFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PostsFilterDto.prototype, "sponsoredOnly", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PostsFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PostsFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], PostsFilterDto.prototype, "limit", void 0);
class InfluencersFilterDto {
}
exports.InfluencersFilterDto = InfluencersFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ALL', 'NANO', 'MICRO', 'MACRO', 'MEGA'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InfluencersFilterDto.prototype, "sortOrder", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InfluencersFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InfluencersFilterDto.prototype, "limit", void 0);
//# sourceMappingURL=mention-tracking.dto.js.map