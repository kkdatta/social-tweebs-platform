import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsDateString,
  MinLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InternalRoleType,
  FeatureName,
  ActionName,
  UserStatus,
  ModuleType,
} from '../../../common/enums';

// Create Team Member DTO
export class CreateTeamMemberDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'United States' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ enum: InternalRoleType, example: InternalRoleType.CLIENT })
  @IsEnum(InternalRoleType)
  roleType: InternalRoleType;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  validityStart: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  validityEnd: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  validityNotificationEnabled?: boolean;

  @ApiPropertyOptional({ type: [String], enum: FeatureName })
  @IsOptional()
  @IsArray()
  @IsEnum(FeatureName, { each: true })
  enabledFeatures?: FeatureName[];

  @ApiPropertyOptional({ type: [String], enum: ActionName })
  @IsOptional()
  @IsArray()
  @IsEnum(ActionName, { each: true })
  enabledActions?: ActionName[];

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialCredits?: number;

  @ApiPropertyOptional({ example: 'Initial credit allocation' })
  @IsOptional()
  @IsString()
  creditComment?: string;
}

// Update Team Member DTO
export class UpdateTeamMemberDto {
  @ApiPropertyOptional({ example: 'John Doe Updated' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Canada' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: InternalRoleType })
  @IsOptional()
  @IsEnum(InternalRoleType)
  roleType?: InternalRoleType;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsOptional()
  @IsDateString()
  validityStart?: string;

  @ApiPropertyOptional({ example: '2027-01-31' })
  @IsOptional()
  @IsDateString()
  validityEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  validityNotificationEnabled?: boolean;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

// Feature Toggle DTO
export class FeatureToggleDto {
  @ApiProperty({ enum: FeatureName })
  @IsEnum(FeatureName)
  featureName: FeatureName;

  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;
}

// Update Features DTO
export class UpdateFeaturesDto {
  @ApiProperty({ type: [FeatureToggleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeatureToggleDto)
  features: FeatureToggleDto[];
}

// Action Toggle DTO
export class ActionToggleDto {
  @ApiProperty({ enum: ActionName })
  @IsEnum(ActionName)
  actionName: ActionName;

  @ApiProperty()
  @IsBoolean()
  isEnabled: boolean;
}

// Update Actions DTO
export class UpdateActionsDto {
  @ApiProperty({ type: [ActionToggleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionToggleDto)
  actions: ActionToggleDto[];
}

// Allocate Credits DTO
export class AllocateTeamCreditsDto {
  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ enum: ModuleType })
  @IsOptional()
  @IsEnum(ModuleType)
  moduleType?: ModuleType;

  @ApiPropertyOptional({ example: 'Monthly credit allocation' })
  @IsOptional()
  @IsString()
  comment?: string;
}

// Team Member Response DTO
export class TeamMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  internalRoleType: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  creditBalance: number;

  @ApiProperty({ nullable: true })
  validityStart: Date | null;

  @ApiProperty({ nullable: true })
  validityEnd: Date | null;

  @ApiProperty()
  daysUntilExpiry: number;

  @ApiProperty()
  lastActiveAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [String] })
  enabledFeatures: string[];

  @ApiProperty({ type: [String] })
  enabledActions: string[];
}

// Credit Usage Log Summary DTO
export class CreditUsageLogDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  totalCreditsAdded: number;

  @ApiProperty()
  totalCreditsUsed: number;

  @ApiProperty()
  discoveryCreditsUsed: number;

  @ApiProperty()
  insightsCreditsUsed: number;

  @ApiProperty()
  lastActiveAt: Date;
}

// Credit Usage Detail DTO
export class CreditUsageDetailDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  moduleType: string;

  @ApiProperty()
  transactionType: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  createdAt: Date;
}

// Query DTOs
export class TeamMemberQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: InternalRoleType })
  @IsOptional()
  @IsEnum(InternalRoleType)
  roleType?: InternalRoleType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class CreditLogQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

export class CreditDetailQueryDto {
  @ApiPropertyOptional({ enum: ['CREDIT', 'DEBIT', 'ALL'] })
  @IsOptional()
  @IsString()
  transactionType?: string;

  @ApiPropertyOptional({ enum: ModuleType })
  @IsOptional()
  @IsEnum(ModuleType)
  moduleType?: ModuleType;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number;
}

// Impersonation Response DTO
export class ImpersonationResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  impersonationId: string;

  @ApiProperty()
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
