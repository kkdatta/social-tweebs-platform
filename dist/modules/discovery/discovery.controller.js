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
exports.DiscoveryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const enums_1 = require("../../common/enums");
const discovery_service_1 = require("./services/discovery.service");
const search_dto_1 = require("./dto/search.dto");
const influencer_dto_1 = require("./dto/influencer.dto");
let DiscoveryController = class DiscoveryController {
    constructor(discoveryService) {
        this.discoveryService = discoveryService;
    }
    async searchInfluencers(userId, dto) {
        console.log('Search request received:', JSON.stringify(dto, null, 2));
        return this.discoveryService.searchInfluencers(userId, dto);
    }
    async getSearchHistory(userId, page, limit) {
        return this.discoveryService.getSearchHistory(userId, page || 1, limit || 20);
    }
    async getInfluencerProfile(userId, profileId) {
        return this.discoveryService.getProfile(userId, profileId);
    }
    async viewInsights(userId, profileId) {
        return this.discoveryService.viewInsights(userId, profileId);
    }
    async refreshInsights(userId, profileId) {
        return this.discoveryService.refreshInsights(userId, profileId);
    }
    async unblurInfluencers(userId, dto) {
        return this.discoveryService.unblurInfluencers(userId, dto);
    }
    async exportInfluencers(userId, dto) {
        return this.discoveryService.exportInfluencers(userId, dto);
    }
    async getLocations(query) {
        return this.discoveryService.getLocations(query);
    }
    async getInterests(platform) {
        return this.discoveryService.getInterests(platform);
    }
    async getLanguages() {
        return this.discoveryService.getLanguages();
    }
    async getBrands(query) {
        return this.discoveryService.getBrands(query);
    }
};
exports.DiscoveryController = DiscoveryController;
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({
        summary: 'Search influencers',
        description: 'Search for influencers using filters. Every call hits Modash API directly (no caching). Results are stored in DB and returned to user.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: search_dto_1.SearchResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits or invalid filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, search_dto_1.SearchInfluencersDto]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "searchInfluencers", null);
__decorate([
    (0, common_1.Get)('search/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get search history' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, type: search_dto_1.SearchHistoryResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getSearchHistory", null);
__decorate([
    (0, common_1.Get)('influencer/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get influencer profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: influencer_dto_1.InfluencerProfileDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profile not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getInfluencerProfile", null);
__decorate([
    (0, common_1.Get)('insights/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'View influencer insights',
        description: 'Get full insights for an influencer. First access costs 1 credit, subsequent views are free.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: influencer_dto_1.ViewInsightsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Profile not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "viewInsights", null);
__decorate([
    (0, common_1.Post)('influencer/:id/refresh'),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh influencer insights',
        description: 'Refresh insights from Modash. Costs 1 credit.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: influencer_dto_1.RefreshInsightsResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Must view insights first' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "refreshInsights", null);
__decorate([
    (0, common_1.Post)('unblur'),
    (0, swagger_1.ApiOperation)({
        summary: 'Unblur influencer profiles',
        description: 'Unblur multiple profiles. Costs 0.04 credits per profile.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: influencer_dto_1.UnblurResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, influencer_dto_1.UnblurInfluencersDto]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "unblurInfluencers", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, swagger_1.ApiOperation)({
        summary: 'Export influencer data',
        description: 'Export unlocked influencer data. Costs 0.04 credits per profile.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, type: influencer_dto_1.ExportResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Insufficient credits' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Some profiles not unlocked' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, influencer_dto_1.ExportInfluencersDto]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "exportInfluencers", null);
__decorate([
    (0, common_1.Get)('locations'),
    (0, swagger_1.ApiOperation)({ summary: 'Get location dictionary' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false, description: 'Search query' }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getLocations", null);
__decorate([
    (0, common_1.Get)('interests/:platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Get interests dictionary for a platform' }),
    __param(0, (0, common_1.Param)('platform')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getInterests", null);
__decorate([
    (0, common_1.Get)('languages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get languages dictionary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getLanguages", null);
__decorate([
    (0, common_1.Get)('brands'),
    (0, swagger_1.ApiOperation)({ summary: 'Get brands dictionary' }),
    (0, swagger_1.ApiQuery)({ name: 'query', required: false, description: 'Search query' }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DiscoveryController.prototype, "getBrands", null);
exports.DiscoveryController = DiscoveryController = __decorate([
    (0, swagger_1.ApiTags)('Discovery'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('discovery'),
    __metadata("design:paramtypes", [discovery_service_1.DiscoveryService])
], DiscoveryController);
//# sourceMappingURL=discovery.controller.js.map