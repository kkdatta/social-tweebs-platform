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
exports.ProfileController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const profile_service_1 = require("./profile.service");
const dto_1 = require("./dto");
const guards_1 = require("../../common/guards");
const decorators_1 = require("../../common/decorators");
let ProfileController = class ProfileController {
    constructor(profileService) {
        this.profileService = profileService;
    }
    async getProfile(user) {
        return this.profileService.getProfile(user.sub);
    }
    async updateProfile(user, dto) {
        return this.profileService.updateProfile(user.sub, dto);
    }
    async changePassword(user, dto) {
        return this.profileService.changePassword(user.sub, dto);
    }
    async getPreferences(user) {
        return this.profileService.getPreferences(user.sub);
    }
    async updatePreferences(user, dto) {
        return this.profileService.updatePreferences(user.sub, dto);
    }
    async getAccountExpiry(user) {
        return this.profileService.getAccountExpiry(user.sub);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved', type: dto_1.ProfileResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update profile (name, phone)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('password'),
    (0, swagger_1.ApiOperation)({ summary: 'Change password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Current password incorrect' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferences retrieved', type: dto_1.PreferencesResponseDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Put)('preferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification preferences' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Preferences updated' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.UpdatePreferencesDto]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "updatePreferences", null);
__decorate([
    (0, common_1.Get)('account-expiry'),
    (0, swagger_1.ApiOperation)({ summary: 'Get account expiry information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account expiry info', type: dto_1.AccountExpiryDto }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProfileController.prototype, "getAccountExpiry", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiTags)('Profile'),
    (0, common_1.Controller)('profile'),
    (0, common_1.UseGuards)(guards_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    __metadata("design:paramtypes", [profile_service_1.ProfileService])
], ProfileController);
//# sourceMappingURL=profile.controller.js.map