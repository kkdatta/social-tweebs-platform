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
exports.ExportResponseDto = exports.ExportInfluencersDto = exports.InfluencerProfileDto = exports.RefreshInsightsResponseDto = exports.ViewInsightsResponseDto = exports.InfluencerInsightsDto = exports.AudienceDataDto = exports.UnblurResponseDto = exports.UnblurInfluencersDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../../common/enums");
const audience_data_entity_1 = require("../entities/audience-data.entity");
class UnblurInfluencersDto {
}
exports.UnblurInfluencersDto = UnblurInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], UnblurInfluencersDto.prototype, "profileIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType }),
    (0, class_validator_1.IsEnum)(enums_1.PlatformType),
    __metadata("design:type", String)
], UnblurInfluencersDto.prototype, "platform", void 0);
class UnblurResponseDto {
}
exports.UnblurResponseDto = UnblurResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UnblurResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurResponseDto.prototype, "unlockedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurResponseDto.prototype, "alreadyUnlockedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], UnblurResponseDto.prototype, "unlockedProfileIds", void 0);
class AudienceDataDto {
}
exports.AudienceDataDto = AudienceDataDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: audience_data_entity_1.AudienceDataType }),
    __metadata("design:type", String)
], AudienceDataDto.prototype, "dataType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], AudienceDataDto.prototype, "categoryKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], AudienceDataDto.prototype, "percentage", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], AudienceDataDto.prototype, "affinityScore", void 0);
class InfluencerInsightsDto {
}
exports.InfluencerInsightsDto = InfluencerInsightsDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "platformUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType }),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "followingCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "postCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "avgComments", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "avgViews", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerInsightsDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerInsightsDto.prototype, "isBusinessAccount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "accountType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "locationCountry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "locationCity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerInsightsDto.prototype, "audienceCredibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "contactEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerInsightsDto.prototype, "websiteUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AudienceDataDto] }),
    __metadata("design:type", Array)
], InfluencerInsightsDto.prototype, "audienceData", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InfluencerInsightsDto.prototype, "lastUpdatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InfluencerInsightsDto.prototype, "modashFetchedAt", void 0);
class ViewInsightsResponseDto {
}
exports.ViewInsightsResponseDto = ViewInsightsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ViewInsightsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ViewInsightsResponseDto.prototype, "isFirstAccess", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ViewInsightsResponseDto.prototype, "creditsCharged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ViewInsightsResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfluencerInsightsDto }),
    __metadata("design:type", InfluencerInsightsDto)
], ViewInsightsResponseDto.prototype, "insights", void 0);
class RefreshInsightsResponseDto {
}
exports.RefreshInsightsResponseDto = RefreshInsightsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], RefreshInsightsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RefreshInsightsResponseDto.prototype, "creditsCharged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], RefreshInsightsResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: InfluencerInsightsDto }),
    __metadata("design:type", InfluencerInsightsDto)
], RefreshInsightsResponseDto.prototype, "insights", void 0);
class InfluencerProfileDto {
}
exports.InfluencerProfileDto = InfluencerProfileDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "platformUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType }),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], InfluencerProfileDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerProfileDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Number)
], InfluencerProfileDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerProfileDto.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "locationCountry", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], InfluencerProfileDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], InfluencerProfileDto.prototype, "isUnlocked", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], InfluencerProfileDto.prototype, "lastUpdatedAt", void 0);
class ExportInfluencersDto {
}
exports.ExportInfluencersDto = ExportInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ExportInfluencersDto.prototype, "profileIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['csv', 'xlsx', 'json'] }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportInfluencersDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportInfluencersDto.prototype, "fields", void 0);
class ExportResponseDto {
}
exports.ExportResponseDto = ExportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ExportResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ExportResponseDto.prototype, "exportedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ExportResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], ExportResponseDto.prototype, "remainingBalance", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", String)
], ExportResponseDto.prototype, "downloadUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    __metadata("design:type", Array)
], ExportResponseDto.prototype, "data", void 0);
//# sourceMappingURL=influencer.dto.js.map