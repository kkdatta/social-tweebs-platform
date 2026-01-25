import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  ChangePasswordDto,
  PreferencesResponseDto,
  UpdatePreferencesDto,
  AccountExpiryDto,
} from './dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
  ) {}

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);

    return { success: true, message: 'Password changed successfully' };
  }

  async getPreferences(userId: string): Promise<PreferencesResponseDto> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      // Create default preferences
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

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<{ success: boolean; message: string }> {
    let preferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.preferencesRepository.create({ userId });
    }

    // Update only provided fields
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

  async getAccountExpiry(userId: string): Promise<AccountExpiryDto> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId },
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found');
    }

    const now = new Date();

    return {
      expiresAt: creditAccount.validityEnd,
      daysRemaining: creditAccount.daysRemaining(),
      isExpiringSoon: creditAccount.isExpiringSoon(7),
      isExpired: now > creditAccount.validityEnd,
    };
  }
}
