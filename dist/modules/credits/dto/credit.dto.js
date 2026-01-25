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
exports.CreditGuideDto = exports.UserCreditDetailResponseDto = exports.UserCreditDetailQueryDto = exports.UserCreditDetailDto = exports.MonthlyUsageDto = exports.CreditUsageLogsResponseDto = exports.CreditUsageLogsQueryDto = exports.TeamMemberUsageSummaryDto = exports.CreditUsageChartDto = exports.GetTransactionsQueryDto = exports.CreditTransactionDto = exports.UnblurInfluencersResponseDto = exports.UnblurInfluencersDto = exports.DeductCreditsResponseDto = exports.DeductCreditsDto = exports.AllocateCreditsDto = exports.GetBalanceResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../common/enums");
class GetBalanceResponseDto {
}
exports.GetBalanceResponseDto = GetBalanceResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GetBalanceResponseDto.prototype, "unifiedBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], GetBalanceResponseDto.prototype, "moduleBalances", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GetBalanceResponseDto.prototype, "totalBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], GetBalanceResponseDto.prototype, "accountValidUntil", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], GetBalanceResponseDto.prototype, "daysRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], GetBalanceResponseDto.prototype, "isExpiringSoon", void 0);
class AllocateCreditsDto {
}
exports.AllocateCreditsDto = AllocateCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target user ID' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AllocateCreditsDto.prototype, "accountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: 'Amount of credits to allocate' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], AllocateCreditsDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ModuleType, default: enums_1.ModuleType.UNIFIED_BALANCE }),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AllocateCreditsDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Optional comment' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AllocateCreditsDto.prototype, "comment", void 0);
class DeductCreditsDto {
}
exports.DeductCreditsDto = DeductCreditsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ActionType }),
    (0, class_validator_1.IsEnum)(enums_1.ActionType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeductCreditsDto.prototype, "actionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.ModuleType, default: enums_1.ModuleType.UNIFIED_BALANCE }),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeductCreditsDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Quantity for calculation' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], DeductCreditsDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Resource ID (e.g., influencer ID)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeductCreditsDto.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Resource type' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeductCreditsDto.prototype, "resourceType", void 0);
class DeductCreditsResponseDto {
}
exports.DeductCreditsResponseDto = DeductCreditsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], DeductCreditsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DeductCreditsResponseDto.prototype, "creditsDeducted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], DeductCreditsResponseDto.prototype, "remainingBalance", void 0);
class UnblurInfluencersDto {
}
exports.UnblurInfluencersDto = UnblurInfluencersDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Array of influencer IDs to unblur' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], UnblurInfluencersDto.prototype, "influencerIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.PlatformType }),
    (0, class_validator_1.IsEnum)(enums_1.PlatformType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UnblurInfluencersDto.prototype, "platform", void 0);
class UnblurInfluencersResponseDto {
}
exports.UnblurInfluencersResponseDto = UnblurInfluencersResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], UnblurInfluencersResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurInfluencersResponseDto.prototype, "unlockedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurInfluencersResponseDto.prototype, "alreadyUnlockedCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurInfluencersResponseDto.prototype, "creditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UnblurInfluencersResponseDto.prototype, "remainingBalance", void 0);
class CreditTransactionDto {
}
exports.CreditTransactionDto = CreditTransactionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "actionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], CreditTransactionDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "balanceBefore", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditTransactionDto.prototype, "balanceAfter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], CreditTransactionDto.prototype, "createdAt", void 0);
class GetTransactionsQueryDto {
}
exports.GetTransactionsQueryDto = GetTransactionsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ModuleType }),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetTransactionsQueryDto.prototype, "module", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], GetTransactionsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], GetTransactionsQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GetTransactionsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], GetTransactionsQueryDto.prototype, "limit", void 0);
class CreditUsageChartDto {
}
exports.CreditUsageChartDto = CreditUsageChartDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    __metadata("design:type", Array)
], CreditUsageChartDto.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number] }),
    __metadata("design:type", Array)
], CreditUsageChartDto.prototype, "credits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Number] }),
    __metadata("design:type", Array)
], CreditUsageChartDto.prototype, "debits", void 0);
class TeamMemberUsageSummaryDto {
}
exports.TeamMemberUsageSummaryDto = TeamMemberUsageSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberUsageSummaryDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberUsageSummaryDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberUsageSummaryDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], TeamMemberUsageSummaryDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberUsageSummaryDto.prototype, "currentBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberUsageSummaryDto.prototype, "totalCreditsAdded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberUsageSummaryDto.prototype, "discoveryUsage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberUsageSummaryDto.prototype, "insightsUsage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], TeamMemberUsageSummaryDto.prototype, "otherUsage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ nullable: true }),
    __metadata("design:type", Object)
], TeamMemberUsageSummaryDto.prototype, "lastActiveAt", void 0);
class CreditUsageLogsQueryDto {
}
exports.CreditUsageLogsQueryDto = CreditUsageLogsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreditUsageLogsQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreditUsageLogsQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreditUsageLogsQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreditUsageLogsQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreditUsageLogsQueryDto.prototype, "sortOrder", void 0);
class CreditUsageLogsResponseDto {
}
exports.CreditUsageLogsResponseDto = CreditUsageLogsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TeamMemberUsageSummaryDto] }),
    __metadata("design:type", Array)
], CreditUsageLogsResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogsResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogsResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], CreditUsageLogsResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], CreditUsageLogsResponseDto.prototype, "hasMore", void 0);
class MonthlyUsageDto {
}
exports.MonthlyUsageDto = MonthlyUsageDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MonthlyUsageDto.prototype, "month", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MonthlyUsageDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], MonthlyUsageDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MonthlyUsageDto.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], MonthlyUsageDto.prototype, "transactionCount", void 0);
class UserCreditDetailDto {
}
exports.UserCreditDetailDto = UserCreditDetailDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserCreditDetailDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserCreditDetailDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], UserCreditDetailDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailDto.prototype, "currentBalance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailDto.prototype, "totalCreditsAdded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailDto.prototype, "totalCreditsUsed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], UserCreditDetailDto.prototype, "accountValidUntil", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailDto.prototype, "daysRemaining", void 0);
class UserCreditDetailQueryDto {
}
exports.UserCreditDetailQueryDto = UserCreditDetailQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['CREDIT', 'DEBIT', 'ALL'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserCreditDetailQueryDto.prototype, "transactionType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ModuleType }),
    (0, class_validator_1.IsEnum)(enums_1.ModuleType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserCreditDetailQueryDto.prototype, "moduleType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UserCreditDetailQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UserCreditDetailQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 1 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UserCreditDetailQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: 20 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UserCreditDetailQueryDto.prototype, "limit", void 0);
class UserCreditDetailResponseDto {
}
exports.UserCreditDetailResponseDto = UserCreditDetailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", UserCreditDetailDto)
], UserCreditDetailResponseDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [MonthlyUsageDto] }),
    __metadata("design:type", Array)
], UserCreditDetailResponseDto.prototype, "monthlyBreakdown", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CreditTransactionDto] }),
    __metadata("design:type", Array)
], UserCreditDetailResponseDto.prototype, "transactions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], UserCreditDetailResponseDto.prototype, "limit", void 0);
class CreditGuideDto {
}
exports.CreditGuideDto = CreditGuideDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Array)
], CreditGuideDto.prototype, "rules", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], CreditGuideDto.prototype, "generalInfo", void 0);
//# sourceMappingURL=credit.dto.js.map