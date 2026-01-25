import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import {
  ProfileResponseDto,
  UpdateProfileDto,
  ChangePasswordDto,
  PreferencesResponseDto,
  UpdatePreferencesDto,
  AccountExpiryDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved', type: ProfileResponseDto })
  async getProfile(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(user.sub);
  }

  @Put()
  @ApiOperation({ summary: 'Update profile (name, phone)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.profileService.updateProfile(user.sub, dto);
  }

  @Put('password')
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @ApiResponse({ status: 400, description: 'Current password incorrect' })
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.profileService.changePassword(user.sub, dto);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved', type: PreferencesResponseDto })
  async getPreferences(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PreferencesResponseDto> {
    return this.profileService.getPreferences(user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  async updatePreferences(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.profileService.updatePreferences(user.sub, dto);
  }

  @Get('account-expiry')
  @ApiOperation({ summary: 'Get account expiry information' })
  @ApiResponse({ status: 200, description: 'Account expiry info', type: AccountExpiryDto })
  async getAccountExpiry(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AccountExpiryDto> {
    return this.profileService.getAccountExpiry(user.sub);
  }
}
