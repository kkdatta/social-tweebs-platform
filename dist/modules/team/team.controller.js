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
exports.TeamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const team_service_1 = require("./team.service");
const dto_1 = require("./dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
const enums_1 = require("../../common/enums");
let TeamController = class TeamController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async getTeamMembers(user, query) {
        return this.teamService.getTeamMembers(user.sub, query);
    }
    async getTeamMember(user, memberId) {
        return this.teamService.getTeamMemberById(user.sub, memberId);
    }
    async createTeamMember(user, dto) {
        return this.teamService.createTeamMember(user.sub, dto);
    }
    async updateTeamMember(user, memberId, dto) {
        return this.teamService.updateTeamMember(user.sub, memberId, dto);
    }
    async deleteTeamMember(user, memberId) {
        await this.teamService.deleteTeamMember(user.sub, memberId);
        return { success: true };
    }
    async getMemberFeatures(user, memberId) {
        return this.teamService.getMemberFeatures(user.sub, memberId);
    }
    async updateMemberFeatures(user, memberId, dto) {
        await this.teamService.updateMemberFeatures(user.sub, memberId, dto);
        return { success: true };
    }
    async getMemberActions(user, memberId) {
        return this.teamService.getMemberActions(user.sub, memberId);
    }
    async updateMemberActions(user, memberId, dto) {
        await this.teamService.updateMemberActions(user.sub, memberId, dto);
        return { success: true };
    }
    async allocateCredits(user, memberId, dto) {
        return this.teamService.allocateCreditsToMember(user.sub, memberId, dto);
    }
    async impersonateUser(user, targetUserId, request) {
        const ipAddress = request.ip || request.socket.remoteAddress || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';
        return this.teamService.impersonateUser(user.sub, targetUserId, ipAddress, userAgent);
    }
    async exitImpersonation(body) {
        await this.teamService.exitImpersonation(body.impersonationId);
        return { success: true };
    }
    async getCreditUsageLogs(user, query) {
        return this.teamService.getCreditUsageLogs(user.sub, query);
    }
    async getUserCreditDetails(user, userId, query) {
        return this.teamService.getUserCreditDetails(user.sub, userId, query);
    }
};
exports.TeamController = TeamController;
__decorate([
    (0, common_1.Get)('members'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get all team members' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team members retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.TeamMemberQueryDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getTeamMembers", null);
__decorate([
    (0, common_1.Get)('members/:id'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get team member by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getTeamMember", null);
__decorate([
    (0, common_1.Post)('members'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create new team member' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Team member created' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateTeamMemberDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "createTeamMember", null);
__decorate([
    (0, common_1.Put)('members/:id'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member updated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateTeamMemberDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateTeamMember", null);
__decorate([
    (0, common_1.Delete)('members/:id'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Team member deleted' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "deleteTeamMember", null);
__decorate([
    (0, common_1.Get)('members/:id/features'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get member feature access' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Features retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberFeatures", null);
__decorate([
    (0, common_1.Put)('members/:id/features'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update member feature access' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Features updated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateFeaturesDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateMemberFeatures", null);
__decorate([
    (0, common_1.Get)('members/:id/actions'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get member action permissions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Actions retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getMemberActions", null);
__decorate([
    (0, common_1.Put)('members/:id/actions'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update member action permissions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Actions updated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateActionsDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "updateMemberActions", null);
__decorate([
    (0, common_1.Post)('members/:id/credits/allocate'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Allocate credits to team member' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credits allocated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AllocateTeamCreditsDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "allocateCredits", null);
__decorate([
    (0, common_1.Post)('members/:id/impersonate'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Login as team member (impersonate)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Impersonation started' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "impersonateUser", null);
__decorate([
    (0, common_1.Post)('impersonation/exit'),
    (0, swagger_1.ApiOperation)({ summary: 'Exit impersonation session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Impersonation ended' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "exitImpersonation", null);
__decorate([
    (0, common_1.Get)('credit-logs'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get credit usage logs for all team members' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit logs retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreditLogQueryDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getCreditUsageLogs", null);
__decorate([
    (0, common_1.Get)('credit-logs/:userId'),
    (0, common_1.UseGuards)(guards_1.RolesGuard),
    (0, decorators_1.Roles)(enums_1.UserRole.SUPER_ADMIN, enums_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed credit usage for a user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credit details retrieved' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.CreditDetailQueryDto]),
    __metadata("design:returntype", Promise)
], TeamController.prototype, "getUserCreditDetails", null);
exports.TeamController = TeamController = __decorate([
    (0, swagger_1.ApiTags)('Team Management'),
    (0, common_1.Controller)('team'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [team_service_1.TeamService])
], TeamController);
//# sourceMappingURL=team.controller.js.map