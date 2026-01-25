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
exports.TieBreakerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const tie_breaker_service_1 = require("./tie-breaker.service");
const dto_1 = require("./dto");
let TieBreakerController = class TieBreakerController {
    constructor(tieBreakerService) {
        this.tieBreakerService = tieBreakerService;
    }
    async createComparison(userId, dto) {
        return this.tieBreakerService.createComparison(userId, dto);
    }
    async getComparisons(userId, filters) {
        return this.tieBreakerService.getComparisons(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.tieBreakerService.getDashboardStats(userId);
    }
    async searchInfluencers(userId, platform, query, limit) {
        return this.tieBreakerService.searchInfluencers(userId, platform, query, limit || 20);
    }
    async getComparisonById(userId, comparisonId) {
        return this.tieBreakerService.getComparisonById(userId, comparisonId);
    }
    async getComparisonForDownload(userId, comparisonId) {
        return this.tieBreakerService.getComparisonForDownload(userId, comparisonId);
    }
    async updateComparison(userId, comparisonId, dto) {
        return this.tieBreakerService.updateComparison(userId, comparisonId, dto);
    }
    async deleteComparison(userId, comparisonId) {
        return this.tieBreakerService.deleteComparison(userId, comparisonId);
    }
    async shareComparison(userId, comparisonId, dto) {
        return this.tieBreakerService.shareComparison(userId, comparisonId, dto);
    }
    async getSharedComparison(token) {
        return this.tieBreakerService.getComparisonByShareToken(token);
    }
};
exports.TieBreakerController = TieBreakerController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new influencer comparison' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comparison created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request - must have 2-3 influencers' }),
    (0, swagger_1.ApiResponse)({ status: 402, description: 'Insufficient credits' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateTieBreakerComparisonDto]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "createComparison", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of comparisons' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: false, enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'ALL'] }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] }),
    (0, swagger_1.ApiQuery)({ name: 'createdBy', required: false, enum: ['ALL', 'ME', 'TEAM'] }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.TieBreakerListResponseDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.TieBreakerFilterDto]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "getComparisons", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.TieBreakerDashboardStatsDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('search/influencers'),
    (0, swagger_1.ApiOperation)({ summary: 'Search influencers for comparison' }),
    (0, swagger_1.ApiQuery)({ name: 'platform', required: true, enum: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query (name, username, keyword)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Max results to return (default 20)' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: [dto_1.SearchInfluencerResultDto] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('platform')),
    __param(2, (0, common_1.Query)('q')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Number]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "searchInfluencers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comparison details by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Comparison ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.TieBreakerComparisonDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Comparison not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "getComparisonById", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comparison data for PDF download' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Comparison ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.TieBreakerComparisonDetailDto }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "getComparisonForDownload", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update comparison (title, visibility)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Comparison ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comparison updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Comparison not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateTieBreakerComparisonDto]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "updateComparison", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete comparison' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Comparison ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comparison deleted' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Comparison not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "deleteComparison", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Share comparison with user or get shareable link' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Comparison ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comparison shared' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.ShareTieBreakerComparisonDto]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "shareComparison", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get publicly shared comparison by token' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: dto_1.TieBreakerComparisonDetailDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Comparison not found or not public' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TieBreakerController.prototype, "getSharedComparison", null);
exports.TieBreakerController = TieBreakerController = __decorate([
    (0, swagger_1.ApiTags)('tie-breaker'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tie-breaker'),
    __metadata("design:paramtypes", [tie_breaker_service_1.TieBreakerService])
], TieBreakerController);
//# sourceMappingURL=tie-breaker.controller.js.map