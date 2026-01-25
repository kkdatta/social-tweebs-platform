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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const user_entity_1 = require("../users/entities/user.entity");
const user_preferences_entity_1 = require("../users/entities/user-preferences.entity");
const credit_account_entity_1 = require("../credits/entities/credit-account.entity");
let ProfileService = class ProfileService {
    constructor(userRepository, preferencesRepository, creditAccountRepository) {
        this.userRepository = userRepository;
        this.preferencesRepository = preferencesRepository;
        this.creditAccountRepository = creditAccountRepository;
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId },
        });
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            businessName: user.businessName,
            role: user.role,
            status: user.status,
            creditBalance: creditAccount ? Number(creditAccount.unifiedBalance) : 0,
            accountValidUntil: creditAccount?.validityEnd || null,
            daysRemaining: creditAccount?.daysRemaining() || 0,
            createdAt: user.createdAt,
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (dto.name) {
            user.name = dto.name;
        }
        if (dto.phone) {
            user.phone = dto.phone;
        }
        await this.userRepository.save(user);
        return { success: true, message: 'Profile updated successfully' };
    }
    async changePassword(userId, dto) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.userRepository.save(user);
        return { success: true, message: 'Password changed successfully' };
    }
    async getPreferences(userId) {
        let preferences = await this.preferencesRepository.findOne({
            where: { userId },
        });
        if (!preferences) {
            preferences = this.preferencesRepository.create({
                userId,
                notifyDiscoveryExport: true,
                notifyCollabExport: true,
                notifyOverlapReport: true,
                notifyContentDiscovery: true,
                notifyGroupImport: true,
                notifyCampaignImport: true,
                notifyReportShared: true,
            });
            await this.preferencesRepository.save(preferences);
        }
        return {
            notifyDiscoveryExport: preferences.notifyDiscoveryExport,
            notifyCollabExport: preferences.notifyCollabExport,
            notifyOverlapReport: preferences.notifyOverlapReport,
            notifyContentDiscovery: preferences.notifyContentDiscovery,
            notifyGroupImport: preferences.notifyGroupImport,
            notifyCampaignImport: preferences.notifyCampaignImport,
            notifyReportShared: preferences.notifyReportShared,
        };
    }
    async updatePreferences(userId, dto) {
        let preferences = await this.preferencesRepository.findOne({
            where: { userId },
        });
        if (!preferences) {
            preferences = this.preferencesRepository.create({ userId });
        }
        if (dto.notifyDiscoveryExport !== undefined) {
            preferences.notifyDiscoveryExport = dto.notifyDiscoveryExport;
        }
        if (dto.notifyCollabExport !== undefined) {
            preferences.notifyCollabExport = dto.notifyCollabExport;
        }
        if (dto.notifyOverlapReport !== undefined) {
            preferences.notifyOverlapReport = dto.notifyOverlapReport;
        }
        if (dto.notifyContentDiscovery !== undefined) {
            preferences.notifyContentDiscovery = dto.notifyContentDiscovery;
        }
        if (dto.notifyGroupImport !== undefined) {
            preferences.notifyGroupImport = dto.notifyGroupImport;
        }
        if (dto.notifyCampaignImport !== undefined) {
            preferences.notifyCampaignImport = dto.notifyCampaignImport;
        }
        if (dto.notifyReportShared !== undefined) {
            preferences.notifyReportShared = dto.notifyReportShared;
        }
        await this.preferencesRepository.save(preferences);
        return { success: true, message: 'Preferences updated successfully' };
    }
    async getAccountExpiry(userId) {
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId },
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found');
        }
        const now = new Date();
        return {
            expiresAt: creditAccount.validityEnd,
            daysRemaining: creditAccount.daysRemaining(),
            isExpiringSoon: creditAccount.isExpiringSoon(7),
            isExpired: now > creditAccount.validityEnd,
        };
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_preferences_entity_1.UserPreferences)),
    __param(2, (0, typeorm_1.InjectRepository)(credit_account_entity_1.CreditAccount)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProfileService);
//# sourceMappingURL=profile.service.js.map