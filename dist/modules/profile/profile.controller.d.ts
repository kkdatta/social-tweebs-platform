import { ProfileService } from './profile.service';
import { ProfileResponseDto, UpdateProfileDto, ChangePasswordDto, PreferencesResponseDto, UpdatePreferencesDto, AccountExpiryDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators';
export declare class ProfileController {
    private readonly profileService;
    constructor(profileService: ProfileService);
    getProfile(user: CurrentUserPayload): Promise<ProfileResponseDto>;
    updateProfile(user: CurrentUserPayload, dto: UpdateProfileDto): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(user: CurrentUserPayload, dto: ChangePasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getPreferences(user: CurrentUserPayload): Promise<PreferencesResponseDto>;
    updatePreferences(user: CurrentUserPayload, dto: UpdatePreferencesDto): Promise<{
        success: boolean;
        message: string;
    }>;
    getAccountExpiry(user: CurrentUserPayload): Promise<AccountExpiryDto>;
}
