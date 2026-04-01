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
exports.ImpersonationResponseDto = exports.CreditDetailQueryDto = exports.CreditLogQueryDto = exports.TeamMemberQueryDto = exports.CreditUsageDetailDto = exports.CreditUsageLogDto = exports.TeamMemberResponseDto = exports.AllocateTeamCreditsDto = exports.UpdateActionsDto = exports.ActionToggleDto = exports.UpdateFeaturesDto = exports.FeatureToggleDto = exports.UpdateTeamMemberDto = exports.CreateTeamMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const enums_1 = require("../../../common/enums");
class CreateTeamMemberDto {
}
exports.CreateTeamMemberDto = CreateTeamMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'John Doe' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'john@example.com' }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'SecurePass123!' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '1234567890' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'United States' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.InternalRoleType, example: enums_1.InternalRoleType.CLIENT }),
    (0, class_validator_1.IsEnum)(enums_1.InternalRoleType),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "roleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-01-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "validityStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-12-31' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "validityEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTeamMemberDto.prototype, "validityNotificationEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], enum: enums_1.FeatureName }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(enums_1.FeatureName, { each: true }),
    __metadata("design:type", Array)
], CreateTeamMemberDto.prototype, "enabledFeatures", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], enum: enums_1.ActionName }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(enums_1.ActionName, { each: true }),
    __metadata("design:type", Array)
], CreateTeamMemberDto.prototype, "enabledActions", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateTeamMemberDto.prototype, "initialCredits", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Initial credit allocation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTeamMemberDto.prototype, "creditComment", void 0);
class UpdateTeamMemberDto {
}
exports.UpdateTeamMemberDto = UpdateTeamMemberDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe Updated' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '9876543210' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Canada' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.InternalRoleType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.InternalRoleType),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "roleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-02-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "validityStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2027-01-31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "validityEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateTeamMemberDto.prototype, "validityNotificationEnabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.UserStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.UserStatus),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'NewSecurePass123!' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], UpdateTeamMemberDto.prototype, "password", void 0);
class FeatureToggleDto {
}
exports.FeatureToggleDto = FeatureToggleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.FeatureName }),
    (0, class_validator_1.IsEnum)(enums_1.FeatureName),
    __metadata("design:type", String)
], FeatureToggleDto.prototype, "featureName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FeatureToggleDto.prototype, "isEnabled", void 0);
class UpdateFeaturesDto {
}
exports.UpdateFeaturesDto = UpdateFeaturesDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FeatureToggleDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FeatureToggleDto),
    __metadata("design:type", Array)
], UpdateFeaturesDto.prototype, "features", void 0);
class ActionToggleDto {
}
exports.ActionToggleDto = ActionToggleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ActionName }),
    (0, class_validator_1.IsEnum)(enums_1.ActionName),
    __metadata("design:type", String)
], ActionToggleDto.prototype, "actionName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ActionToggleDto.prototype, "isEnabled", void 0);
class UpdateActionsDto {
}
exports.UpdateActionsDto = UpdateActionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ActionToggleDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ActionToggleDto),
    __metadata("design:type", Array)
], UpdateActionsDto.prototype, "actions", void 0);
class AllocateTeamCreditsDto {
}
exports.AllocateTeamCreditsDto = AllocateTeamCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], AllocateTeamCreditsDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ModuleType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    __metadata("design:type", String)
], AllocateTeamCreditsDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Monthly credit allocation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllocateTeamCreditsDto.prototype, "comment", void 0);
class TeamMemberResponseDto {
}
exports.TeamMemberResponseDto = TeamMemberResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "internalRoleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberResponseDto.prototype, "creditBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TeamMemberResponseDto.prototype, "validityStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TeamMemberResponseDto.prototype, "validityEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberResponseDto.prototype, "daysUntilExpiry", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TeamMemberResponseDto.prototype, "lastActiveAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], TeamMemberResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], TeamMemberResponseDto.prototype, "enabledFeatures", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], TeamMemberResponseDto.prototype, "enabledActions", void 0);
class CreditUsageLogDto {
}
exports.CreditUsageLogDto = CreditUsageLogDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageLogDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageLogDto.prototype, "userName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageLogDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageLogDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogDto.prototype, "currentBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogDto.prototype, "totalCreditsAdded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogDto.prototype, "totalCreditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogDto.prototype, "discoveryCreditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogDto.prototype, "insightsCreditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CreditUsageLogDto.prototype, "lastActiveAt", void 0);
class CreditUsageDetailDto {
}
exports.CreditUsageDetailDto = CreditUsageDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageDetailDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageDetailDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageDetailDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageDetailDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditUsageDetailDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CreditUsageDetailDto.prototype, "createdAt", void 0);
class TeamMemberQueryDto {
}
exports.TeamMemberQueryDto = TeamMemberQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.UserStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.UserStatus),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.InternalRoleType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.InternalRoleType),
    __metadata("design:type", String)
], TeamMemberQueryDto.prototype, "roleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], TeamMemberQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], TeamMemberQueryDto.prototype, "limit", void 0);
class CreditLogQueryDto {
}
exports.CreditLogQueryDto = CreditLogQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreditLogQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreditLogQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreditLogQueryDto.prototype, "limit", void 0);
class CreditDetailQueryDto {
}
exports.CreditDetailQueryDto = CreditDetailQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['CREDIT', 'DEBIT', 'ALL'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreditDetailQueryDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ModuleType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    __metadata("design:type", String)
], CreditDetailQueryDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreditDetailQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreditDetailQueryDto.prototype, "limit", void 0);
class ImpersonationResponseDto {
}
exports.ImpersonationResponseDto = ImpersonationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ImpersonationResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], ImpersonationResponseDto.prototype, "impersonationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ImpersonationResponseDto.prototype, "targetUser", void 0);
//# sourceMappingURL=team.dto.js.map