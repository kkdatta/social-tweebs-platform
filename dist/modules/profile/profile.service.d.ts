import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { ProfileResponseDto, UpdateProfileDto, ChangePasswordDto, PreferencesResponseDto, UpdatePreferencesDto, AccountExpiryDto } from './dto';
export declare class ProfileService {
    private userRepository;
    private preferencesRepository;
    private creditAccountRepository;
    constructor(userRepository: Repository<User>, preferencesRepository: Repository<UserPreferences>, creditAccountRepository: Repository<CreditAccount>);
    getProfile(userId: string): Promise<ProfileResponseDto>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getPreferences(userId: string): Promise<PreferencesResponseDto>;
    updatePreferences(userId: string, dto: UpdatePreferencesDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getAccountExpiry(userId: string): Promise<AccountExpiryDto>;
}
