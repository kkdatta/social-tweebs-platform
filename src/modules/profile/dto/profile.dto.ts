import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  Matches,
} from 'class-validator';

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creditBalance: number;

  @ApiProperty({ nullable: true })
  accountValidUntil: Date | null;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  createdAt: Date;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{10,15}$/, { message: 'Please provide a valid phone number' })
  phone?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @MinLength(8)
  currentPassword: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

export class PreferencesResponseDto {
  @ApiProperty()
  notifyDiscoveryExport: boolean;

  @ApiProperty()
  notifyCollabExport: boolean;

  @ApiProperty()
  notifyOverlapReport: boolean;

  @ApiProperty()
  notifyContentDiscovery: boolean;

  @ApiProperty()
  notifyGroupImport: boolean;

  @ApiProperty()
  notifyCampaignImport: boolean;

  @ApiProperty()
  notifyReportShared: boolean;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyDiscoveryExport?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyCollabExport?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyOverlapReport?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyContentDiscovery?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyGroupImport?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyCampaignImport?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  notifyReportShared?: boolean;
}

export class AccountExpiryDto {
  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  isExpiringSoon: boolean;

  @ApiProperty()
  isExpired: boolean;
}
