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
exports.InfluencerGroupController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const influencer_group_service_1 = require("./influencer-group.service");
const influencer_group_dto_1 = require("./dto/influencer-group.dto");
let InfluencerGroupController = class InfluencerGroupController {
    constructor(groupService) {
        this.groupService = groupService;
    }
    async createGroup(userId, dto) {
        return this.groupService.createGroup(userId, dto);
    }
    async getGroups(userId, filters) {
        return this.groupService.getGroups(userId, filters);
    }
    async getDashboardStats(userId) {
        return this.groupService.getDashboardStats(userId);
    }
    async getSharedGroup(token) {
        return this.groupService.getSharedGroup(token);
    }
    async getGroupById(userId, groupId) {
        return this.groupService.getGroupById(userId, groupId);
    }
    async updateGroup(userId, groupId, dto) {
        return this.groupService.updateGroup(userId, groupId, dto);
    }
    async deleteGroup(userId, groupId) {
        await this.groupService.deleteGroup(userId, groupId);
    }
    async addInfluencer(userId, groupId, dto) {
        return this.groupService.addInfluencer(userId, groupId, dto);
    }
    async bulkAddInfluencers(userId, groupId, dto) {
        return this.groupService.bulkAddInfluencers(userId, groupId, dto);
    }
    async importFromGroup(userId, groupId, dto) {
        return this.groupService.importFromGroup(userId, groupId, dto);
    }
    async copyInfluencers(userId, groupId, dto) {
        return this.groupService.copyInfluencers(userId, groupId, dto);
    }
    async removeInfluencers(userId, groupId, dto) {
        return this.groupService.removeInfluencers(userId, groupId, dto);
    }
    async getMembers(userId, groupId, filters) {
        return this.groupService.getMembers(userId, groupId, filters);
    }
    async shareGroup(userId, groupId, dto) {
        return this.groupService.shareGroup(userId, groupId, dto);
    }
    async removeShare(userId, groupId, shareId) {
        await this.groupService.removeShare(userId, groupId, shareId);
    }
    async createInvitation(userId, groupId, dto) {
        return this.groupService.createInvitation(userId, groupId, dto);
    }
    async getInvitation(userId, groupId, invitationId) {
        return this.groupService.getInvitation(userId, groupId, invitationId);
    }
    async updateInvitation(userId, groupId, invitationId, dto) {
        return this.groupService.updateInvitation(userId, groupId, invitationId, dto);
    }
    async deleteInvitation(userId, groupId, invitationId) {
        await this.groupService.deleteInvitation(userId, groupId, invitationId);
    }
    async getInvitationBySlug(slug) {
        return this.groupService.getInvitationBySlug(slug);
    }
    async submitApplication(slug, dto, req) {
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
        const userAgent = req.headers['user-agent'];
        return this.groupService.submitApplication(slug, dto, ipAddress, userAgent);
    }
    async getApplications(userId, groupId, invitationId, filters) {
        return this.groupService.getApplications(userId, groupId, invitationId, filters);
    }
    async approveApplication(userId, groupId, applicationId) {
        return this.groupService.approveApplication(userId, groupId, applicationId);
    }
    async bulkApproveApplications(userId, groupId, dto) {
        return this.groupService.bulkApproveApplications(userId, groupId, dto);
    }
    async rejectApplication(userId, groupId, applicationId, reason) {
        return this.groupService.rejectApplication(userId, groupId, applicationId, reason);
    }
    async bulkRejectApplications(userId, groupId, dto) {
        return this.groupService.bulkRejectApplications(userId, groupId, dto);
    }
};
exports.InfluencerGroupController = InfluencerGroupController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new influencer group' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Group created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, influencer_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of groups with filters' }),
    (0, swagger_1.ApiQuery)({ name: 'tab', required: false, enum: ['created_by_me', 'created_by_team', 'shared_with_me'] }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, influencer_group_dto_1.GroupFilterDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getGroups", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('shared/:token'),
    (0, swagger_1.ApiOperation)({ summary: 'Get publicly shared group' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Share URL token' }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getSharedGroup", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get group details by ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getGroupById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.UpdateGroupDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "deleteGroup", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add an influencer to the group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.AddInfluencerDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "addInfluencer", null);
__decorate([
    (0, common_1.Post)(':id/members/bulk'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk add influencers (XLSX import)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.BulkAddInfluencersDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "bulkAddInfluencers", null);
__decorate([
    (0, common_1.Post)(':id/members/import'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Import influencers from another group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.ImportFromGroupDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "importFromGroup", null);
__decorate([
    (0, common_1.Post)(':id/members/copy'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Copy influencers to another group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.CopyInfluencersDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "copyInfluencers", null);
__decorate([
    (0, common_1.Delete)(':id/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove influencers from group (bulk)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.RemoveInfluencersDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "removeInfluencers", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get group members with filters' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.MemberFilterDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share group with a user or make public' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.ShareGroupDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "shareGroup", null);
__decorate([
    (0, common_1.Delete)(':id/share/:shareId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove group share' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('shareId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "removeShare", null);
__decorate([
    (0, common_1.Post)(':id/invitations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create an invitation for the group' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.CreateInvitationDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)(':id/invitations/:invitationId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get invitation details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('invitationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getInvitation", null);
__decorate([
    (0, common_1.Patch)(':id/invitations/:invitationId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update invitation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('invitationId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, influencer_group_dto_1.UpdateInvitationDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "updateInvitation", null);
__decorate([
    (0, common_1.Delete)(':id/invitations/:invitationId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete invitation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('invitationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "deleteInvitation", null);
__decorate([
    (0, common_1.Get)('invite/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get invitation form by URL slug (public)' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getInvitationBySlug", null);
__decorate([
    (0, common_1.Post)('invite/:slug/apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit an application via invitation (public)' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, influencer_group_dto_1.SubmitApplicationDto, Object]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "submitApplication", null);
__decorate([
    (0, common_1.Get)(':id/invitations/:invitationId/applications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get applications for an invitation' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('invitationId')),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, influencer_group_dto_1.ApplicationFilterDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Post)(':id/applications/:applicationId/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Approve an application' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('applicationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "approveApplication", null);
__decorate([
    (0, common_1.Post)(':id/applications/bulk-approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk approve applications' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.BulkApproveApplicationsDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "bulkApproveApplications", null);
__decorate([
    (0, common_1.Post)(':id/applications/:applicationId/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reject an application' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('applicationId')),
    __param(3, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "rejectApplication", null);
__decorate([
    (0, common_1.Post)(':id/applications/bulk-reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk reject applications' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, influencer_group_dto_1.BulkRejectApplicationsDto]),
    __metadata("design:returntype", Promise)
], InfluencerGroupController.prototype, "bulkRejectApplications", null);
exports.InfluencerGroupController = InfluencerGroupController = __decorate([
    (0, swagger_1.ApiTags)('influencer-groups'),
    (0, common_1.Controller)('influencer-groups'),
    __metadata("design:paramtypes", [influencer_group_service_1.InfluencerGroupService])
], InfluencerGroupController);
//# sourceMappingURL=influencer-group.controller.js.map