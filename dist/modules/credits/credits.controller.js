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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const credits_service_1 = require("./credits.service");
const dto_1 = require("./dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
let CreditsController = class CreditsController {
    constructor(creditsService) {
        this.creditsService = creditsService;
    }
    async getBalance(user) {
        return this.creditsService.getBalance(user.sub);
    }
    async allocateCredits(user, dto) {
        return this.creditsService.allocateCredits(dto, user.sub);
    }
    async deductCredits(user, dto) {
        return this.creditsService.deductCredits(user.sub, dto);
    }
    async unblurInfluencers(user, dto) {
        return this.creditsService.unblurInfluencers(user.sub, dto);
    }
    async checkInfluencerUnlocked(user, influencerId, platform) {
        const isUnlocked = await this.creditsService.isInfluencerUnlocked(user.sub, influencerId, platform);
        return { isUnlocked };
    }
    async getTransactions(user, query) {
        return this.creditsService.getTransactions(user.sub, query);
    }
    async getCreditUsageChart(user, days = 30) {
        return this.creditsService.getCreditUsageChart(user.sub, days);
    }
    getCreditGuide() {
        return this.creditsService.getCreditGuide();
    }
    async getAnalyticsSummary(user) {
        return this.creditsService.getAnalyticsSummary(user.sub);
    }
    async getCreditUsageLogs(user, query) {
        return this.creditsService.getCreditUsageLogs(user.sub, query);
    }
    async getUserCreditDetail(user, targetUserId, query) {
        return this.creditsService.getUserCreditDetail(user.sub, targetUserId, query);
    }
};
exports.CreditsController = CreditsController;
__decorate([
    (0, common_1.Get)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current credit balance' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit balance retrieved', type: dto_1.GetBalanceResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('allocate'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Allocate credits to a user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credits allocated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Insufficient permissions' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.AllocateCreditsDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "allocateCredits", null);
__decorate([
    (0, common_1.Post)('deduct'),
    (0, swagger_1.ApiOperation)({ summary: 'Deduct credits for an action' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credits deducted', type: dto_1.DeductCreditsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DeductCreditsDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "deductCredits", null);
__decorate([
    (0, common_1.Post)('influencer/unblur'),
    (0, swagger_1.ApiOperation)({ summary: 'Unblur influencer profiles' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Influencers unblurred', type: dto_1.UnblurInfluencersResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UnblurInfluencersDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "unblurInfluencers", null);
__decorate([
    (0, common_1.Get)('influencer/check/:influencerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if influencer is already unlocked' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns unlock status' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('influencerId')),
    __param(2, (0, common_1.Query)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "checkInfluencerUnlocked", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit transaction history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transaction history retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetTransactionsQueryDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getTransactions", null);
__decorate([
    (0, common_1.Get)('usage-chart'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit usage chart data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chart data retrieved', type: dto_1.CreditUsageChartDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getCreditUsageChart", null);
__decorate([
    (0, common_1.Get)('guide'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit usage guide' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit guide retrieved', type: dto_1.CreditGuideDto }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", dto_1.CreditGuideDto)
], CreditsController.prototype, "getCreditGuide", null);
__decorate([
    (0, common_1.Get)('analytics/summary'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics summary for team (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics summary retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getAnalyticsSummary", null);
__decorate([
    (0, common_1.Get)('usage-logs'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit usage logs for all team members (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage logs retrieved', type: dto_1.CreditUsageLogsResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreditUsageLogsQueryDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getCreditUsageLogs", null);
__decorate([
    (0, common_1.Get)('usage-logs/:userId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed credit usage for a specific user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User credit details retrieved', type: dto_1.UserCreditDetailResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UserCreditDetailQueryDto]),
    __metadata("design:returntype", Promise)
], CreditsController.prototype, "getUserCreditDetail", null);
exports.CreditsController = CreditsController = __decorate([
    (0, swagger_1.ApiTags)('Credits'),
    (0, common_1.Controller)('credits'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [credits_service_1.CreditsService])
], CreditsController);
//# sourceMappingURL=credits.controller.js.map