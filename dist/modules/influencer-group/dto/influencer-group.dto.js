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
exports.DashboardStatsDto = exports.ApplicationListResponseDto = exports.MemberListResponseDto = exports.GroupListResponseDto = exports.ApplicationSummaryDto = exports.InvitationSummaryDto = exports.ShareSummaryDto = exports.GroupMemberDto = exports.GroupDetailDto = exports.GroupSummaryDto = exports.BulkRejectApplicationsDto = exports.BulkApproveApplicationsDto = exports.ApplicationFilterDto = exports.SubmitApplicationDto = exports.UpdateInvitationDto = exports.CreateInvitationDto = exports.ShareGroupDto = exports.MemberFilterDto = exports.RemoveInfluencersDto = exports.CopyInfluencersDto = exports.ImportFromGroupDto = exports.BulkAddInfluencersDto = exports.AddInfluencerDto = exports.HasInfluencerNameOrIdConstraint = exports.GroupFilterDto = exports.UpdateGroupDto = exports.CreateGroupDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const influencer_group_entity_1 = require("../entities/influencer-group.entity");
class CreateGroupDto {
}
exports.CreateGroupDto = CreateGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Group name', example: 'Fashion Influencers Q1 2026' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Group description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGroupDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Platforms for this group',
        example: ['INSTAGRAM', 'YOUTUBE'],
        enum: influencer_group_entity_1.GroupPlatform,
        isArray: true,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform, { each: true }),
    __metadata("design:type", Array)
], CreateGroupDto.prototype, "platforms", void 0);
class UpdateGroupDto {
}
exports.UpdateGroupDto = UpdateGroupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Group name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Group description' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Platforms for this group',
        enum: influencer_group_entity_1.GroupPlatform,
        isArray: true,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(3),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform, { each: true }),
    __metadata("design:type", Array)
], UpdateGroupDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make group public' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateGroupDto.prototype, "isPublic", void 0);
class GroupFilterDto {
}
exports.GroupFilterDto = GroupFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tab filter', example: 'created_by_me' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GroupFilterDto.prototype, "tab", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platforms', isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform, { each: true }),
    __metadata("design:type", Array)
], GroupFilterDto.prototype, "platforms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by name or keyword' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GroupFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GroupFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 10 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GroupFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort field', default: 'createdAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GroupFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GroupFilterDto.prototype, "sortOrder", void 0);
let HasInfluencerNameOrIdConstraint = class HasInfluencerNameOrIdConstraint {
    validate(_, args) {
        const o = args.object;
        const name = o.influencerName?.trim();
        return !!(name && name.length > 0) || !!o.influencerProfileId || !!(o.platformUserId?.trim());
    }
    defaultMessage() {
        return 'Provide influencerName, influencerProfileId, or platformUserId';
    }
};
exports.HasInfluencerNameOrIdConstraint = HasInfluencerNameOrIdConstraint;
exports.HasInfluencerNameOrIdConstraint = HasInfluencerNameOrIdConstraint = __decorate([
    (0, class_validator_1.ValidatorConstraint)({ name: 'hasInfluencerNameOrId', async: false })
], HasInfluencerNameOrIdConstraint);
class AddInfluencerDto {
}
exports.AddInfluencerDto = AddInfluencerDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Influencer display name (optional if profile or platform user id is set)' }),
    (0, class_validator_1.Validate)(HasInfluencerNameOrIdConstraint),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Influencer username on platform' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "influencerUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Platform; when omitted, the group’s first platform is used',
        enum: influencer_group_entity_1.GroupPlatform,
    }),
    (0, class_validator_1.Validate)(HasInfluencerNameOrIdConstraint),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Profile ID from cached profiles' }),
    (0, class_validator_1.Validate)(HasInfluencerNameOrIdConstraint),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "influencerProfileId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Platform user ID' }),
    (0, class_validator_1.Validate)(HasInfluencerNameOrIdConstraint),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "platformUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Profile picture URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], AddInfluencerDto.prototype, "profilePictureUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Follower count', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AddInfluencerDto.prototype, "followerCount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Audience credibility percentage' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], AddInfluencerDto.prototype, "audienceCredibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Engagement rate' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddInfluencerDto.prototype, "engagementRate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Average likes' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddInfluencerDto.prototype, "avgLikes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Average views' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddInfluencerDto.prototype, "avgViews", void 0);
class BulkAddInfluencersDto {
}
exports.BulkAddInfluencersDto = BulkAddInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'List of influencers to add', type: [AddInfluencerDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AddInfluencerDto),
    __metadata("design:type", Array)
], BulkAddInfluencersDto.prototype, "influencers", void 0);
class ImportFromGroupDto {
}
exports.ImportFromGroupDto = ImportFromGroupDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source group ID to import from' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ImportFromGroupDto.prototype, "sourceGroupId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Specific influencer IDs to import (if empty, imports all)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ImportFromGroupDto.prototype, "influencerIds", void 0);
class CopyInfluencersDto {
}
exports.CopyInfluencersDto = CopyInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Influencer member IDs to copy' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CopyInfluencersDto.prototype, "memberIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target group ID to copy to' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CopyInfluencersDto.prototype, "targetGroupId", void 0);
class RemoveInfluencersDto {
}
exports.RemoveInfluencersDto = RemoveInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Influencer member IDs to remove' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], RemoveInfluencersDto.prototype, "memberIds", void 0);
class MemberFilterDto {
}
exports.MemberFilterDto = MemberFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by platform', enum: influencer_group_entity_1.GroupPlatform }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform),
    __metadata("design:type", String)
], MemberFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Search by name or username' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number', default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MemberFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Items per page', default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MemberFilterDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort field', default: 'addedAt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberFilterDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', default: 'desc' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MemberFilterDto.prototype, "sortOrder", void 0);
class ShareGroupDto {
}
exports.ShareGroupDto = ShareGroupDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to share with' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareGroupDto.prototype, "sharedWithUserId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Email of user to share with (must be registered)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ShareGroupDto.prototype, "shareWithEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Permission level',
        enum: influencer_group_entity_1.SharePermission,
        default: influencer_group_entity_1.SharePermission.VIEW,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.SharePermission),
    __metadata("design:type", String)
], ShareGroupDto.prototype, "permissionLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Make group public (accessible via URL)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ShareGroupDto.prototype, "makePublic", void 0);
class CreateInvitationDto {
}
exports.CreateInvitationDto = CreateInvitationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invitation name for reference' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "invitationName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invitation type', enum: influencer_group_entity_1.InvitationType }),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.InvitationType),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "invitationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Custom URL slug (permanent)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "urlSlug", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "landingHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "landingContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "landingButtonText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    __metadata("design:type", Array)
], CreateInvitationDto.prototype, "landingImages", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "landingVideoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "formHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "formContent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platforms for application form', enum: influencer_group_entity_1.GroupPlatform, isArray: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform, { each: true }),
    __metadata("design:type", Array)
], CreateInvitationDto.prototype, "formPlatforms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInvitationDto.prototype, "collectPhone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInvitationDto.prototype, "collectEmail", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInvitationDto.prototype, "collectAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pricing options', example: ['PHOTO', 'VIDEO'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateInvitationDto.prototype, "pricingOptions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: influencer_group_entity_1.CurrencyType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.CurrencyType),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "pricingCurrency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "formButtonText", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "thankyouHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "thankyouContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "logoUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '#ffffff' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "backgroundColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '#000000' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "titleColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '#333333' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "textColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '#6366f1' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "buttonBgColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: '#ffffff' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInvitationDto.prototype, "buttonTextColor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateInvitationDto.prototype, "notifyOnSubmission", void 0);
class UpdateInvitationDto {
}
exports.UpdateInvitationDto = UpdateInvitationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInvitationDto.prototype, "invitationName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateInvitationDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInvitationDto.prototype, "landingHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInvitationDto.prototype, "landingContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInvitationDto.prototype, "formHeader", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateInvitationDto.prototype, "formContent", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateInvitationDto.prototype, "notifyOnSubmission", void 0);
class SubmitApplicationDto {
}
exports.SubmitApplicationDto = SubmitApplicationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platform', enum: influencer_group_entity_1.GroupPlatform }),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Platform username' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "platformUsername", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Platform profile URL' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)(),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "platformUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Influencer name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "influencerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitApplicationDto.prototype, "photoPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitApplicationDto.prototype, "videoPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitApplicationDto.prototype, "storyPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SubmitApplicationDto.prototype, "carouselPrice", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: influencer_group_entity_1.CurrencyType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.CurrencyType),
    __metadata("design:type", String)
], SubmitApplicationDto.prototype, "pricingCurrency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], SubmitApplicationDto.prototype, "additionalData", void 0);
class ApplicationFilterDto {
}
exports.ApplicationFilterDto = ApplicationFilterDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: influencer_group_entity_1.GroupPlatform }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.GroupPlatform),
    __metadata("design:type", String)
], ApplicationFilterDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: influencer_group_entity_1.ApplicationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(influencer_group_entity_1.ApplicationStatus),
    __metadata("design:type", String)
], ApplicationFilterDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplicationFilterDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ApplicationFilterDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ApplicationFilterDto.prototype, "limit", void 0);
class BulkApproveApplicationsDto {
}
exports.BulkApproveApplicationsDto = BulkApproveApplicationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Application IDs to approve' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkApproveApplicationsDto.prototype, "applicationIds", void 0);
class BulkRejectApplicationsDto {
}
exports.BulkRejectApplicationsDto = BulkRejectApplicationsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Application IDs to reject' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], BulkRejectApplicationsDto.prototype, "applicationIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Rejection reason' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkRejectApplicationsDto.prototype, "rejectionReason", void 0);
class GroupSummaryDto {
}
exports.GroupSummaryDto = GroupSummaryDto;
class GroupDetailDto extends GroupSummaryDto {
}
exports.GroupDetailDto = GroupDetailDto;
class GroupMemberDto {
}
exports.GroupMemberDto = GroupMemberDto;
class ShareSummaryDto {
}
exports.ShareSummaryDto = ShareSummaryDto;
class InvitationSummaryDto {
}
exports.InvitationSummaryDto = InvitationSummaryDto;
class ApplicationSummaryDto {
}
exports.ApplicationSummaryDto = ApplicationSummaryDto;
class GroupListResponseDto {
}
exports.GroupListResponseDto = GroupListResponseDto;
class MemberListResponseDto {
}
exports.MemberListResponseDto = MemberListResponseDto;
class ApplicationListResponseDto {
}
exports.ApplicationListResponseDto = ApplicationListResponseDto;
class DashboardStatsDto {
}
exports.DashboardStatsDto = DashboardStatsDto;
//# sourceMappingURL=influencer-group.dto.js.map