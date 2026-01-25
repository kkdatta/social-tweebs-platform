import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  Min,
} from 'class-validator';
import { ModuleType, ActionType, PlatformType } from '../../../common/enums';

export class GetBalanceResponseDto {
  @ApiProperty()
  unifiedBalance: number;

  @ApiProperty()
  moduleBalances: Record<string, number>;

  @ApiProperty()
  totalBalance: number;

  @ApiProperty()
  accountValidUntil: Date;

  @ApiProperty()
  daysRemaining: number;

  @ApiProperty()
  isExpiringSoon: boolean;
}

export class AllocateCreditsDto {
  @ApiProperty({ description: 'Target user ID' })
  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: 100, description: 'Amount of credits to allocate' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: ModuleType, default: ModuleType.UNIFIED_BALANCE })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType;

  @ApiPropertyOptional({ description: 'Optional comment' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class DeductCreditsDto {
  @ApiProperty({ enum: ActionType })
  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType: ActionType;

  @ApiProperty({ enum: ModuleType, default: ModuleType.UNIFIED_BALANCE })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType;

  @ApiProperty({ example: 1, description: 'Quantity for calculation' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Resource ID (e.g., influencer ID)' })
  @IsString()
  @IsOptional()
  resourceId?: string;

  @ApiPropertyOptional({ description: 'Resource type' })
  @IsString()
  @IsOptional()
  resourceType?: string;
}

export class DeductCreditsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  creditsDeducted: number;

  @ApiProperty()
  remainingBalance: number;
}

export class UnblurInfluencersDto {
  @ApiProperty({ type: [String], description: 'Array of influencer IDs to unblur' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  influencerIds: string[];

  @ApiProperty({ enum: PlatformType })
  @IsEnum(PlatformType)
  @IsNotEmpty()
  platform: PlatformType;
}

export class UnblurInfluencersResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  unlockedCount: number;

  @ApiProperty()
  alreadyUnlockedCount: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  remainingBalance: number;
}

export class CreditTransactionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  transactionType: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  moduleType: string;

  @ApiProperty()
  actionType: string;

  @ApiProperty()
  comment: string;

  @ApiProperty()
  balanceBefore: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  createdAt: Date;
}

export class GetTransactionsQueryDto {
  @ApiPropertyOptional({ enum: ModuleType })
  @IsEnum(ModuleType)
  @IsOptional()
  module?: ModuleType;

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class CreditUsageChartDto {
  @ApiProperty({ type: [String] })
  labels: string[];

  @ApiProperty({ type: [Number] })
  credits: number[];

  @ApiProperty({ type: [Number] })
  debits: number[];
}

// ============ CREDIT USAGE LOGS DTOs ============

export class TeamMemberUsageSummaryDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  totalCreditsAdded: number;

  @ApiProperty()
  discoveryUsage: number;

  @ApiProperty()
  insightsUsage: number;

  @ApiProperty()
  otherUsage: number;

  @ApiProperty({ nullable: true })
  lastActiveAt: Date | null;
}

export class CreditUsageLogsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class CreditUsageLogsResponseDto {
  @ApiProperty({ type: [TeamMemberUsageSummaryDto] })
  data: TeamMemberUsageSummaryDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}

export class MonthlyUsageDto {
  @ApiProperty()
  month: string;

  @ApiProperty()
  moduleType: string;

  @ApiProperty()
  transactionType: string;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  transactionCount: number;
}

export class UserCreditDetailDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  totalCreditsAdded: number;

  @ApiProperty()
  totalCreditsUsed: number;

  @ApiProperty()
  accountValidUntil: Date;

  @ApiProperty()
  daysRemaining: number;
}

export class UserCreditDetailQueryDto {
  @ApiPropertyOptional({ enum: ['CREDIT', 'DEBIT', 'ALL'] })
  @IsString()
  @IsOptional()
  transactionType?: 'CREDIT' | 'DEBIT' | 'ALL';

  @ApiPropertyOptional({ enum: ModuleType })
  @IsEnum(ModuleType)
  @IsOptional()
  moduleType?: ModuleType;

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class UserCreditDetailResponseDto {
  @ApiProperty()
  user: UserCreditDetailDto;

  @ApiProperty({ type: [MonthlyUsageDto] })
  monthlyBreakdown: MonthlyUsageDto[];

  @ApiProperty({ type: [CreditTransactionDto] })
  transactions: CreditTransactionDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class CreditGuideDto {
  @ApiProperty()
  rules: {
    action: string;
    description: string;
    creditCost: string;
    notes?: string;
  }[];

  @ApiProperty()
  generalInfo: {
    creditValue: string;
    refreshInfo: string;
    reportInfo: string;
  };
}
