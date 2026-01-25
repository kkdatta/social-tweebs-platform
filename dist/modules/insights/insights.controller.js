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
exports.InsightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const insights_service_1 = require("./insights.service");
const dto_1 = require("./dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
let InsightsController = class InsightsController {
    constructor(insightsService) {
        this.insightsService = insightsService;
    }
    async listInsights(user, query) {
        return this.insightsService.listInsights(user.sub, query);
    }
    async searchAndUnlock(user, dto) {
        return this.insightsService.searchAndUnlock(user.sub, dto);
    }
    async getInsight(user, id) {
        return this.insightsService.getInsight(user.sub, id);
    }
    async refreshInsight(user, id) {
        return this.insightsService.forceRefresh(user.sub, id);
    }
    async getCacheTTL() {
        const ttlDays = await this.insightsService.getCacheTTLDays();
        return { ttlDays };
    }
};
exports.InsightsController = InsightsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List user\'s unlocked insights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insights list retrieved', type: dto_1.InsightListResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ListInsightsQueryDto]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "listInsights", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search and unlock influencer insight' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insight retrieved (cached)', type: dto_1.SearchInsightResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'New insight unlocked', type: dto_1.SearchInsightResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Influencer not found' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SearchInsightDto]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "searchAndUnlock", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full insight details by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insight details retrieved', type: dto_1.FullInsightResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Insight not found' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getInsight", null);
__decorate([
    (0, common_1.Post)(':id/refresh'),
    (0, swagger_1.ApiOperation)({ summary: 'Force refresh insight data (costs 1 credit)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insight refreshed', type: dto_1.RefreshInsightResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Insight not found' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "refreshInsight", null);
__decorate([
    (0, common_1.Get)('config/cache-ttl'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current cache TTL configuration' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cache TTL in days' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InsightsController.prototype, "getCacheTTL", null);
exports.InsightsController = InsightsController = __decorate([
    (0, swagger_1.ApiTags)('Insights'),
    (0, common_1.Controller)('insights'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [insights_service_1.InsightsService])
], InsightsController);
//# sourceMappingURL=insights.controller.js.map