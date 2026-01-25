import { ModuleType, ActionType, PlatformType } from '../../../common/enums';
export declare class GetBalanceResponseDto {
    unifiedBalance: number;
    moduleBalances: Record<string, number>;
    totalBalance: number;
    accountValidUntil: Date;
    daysRemaining: number;
    isExpiringSoon: boolean;
}
export declare class AllocateCreditsDto {
    accountId: string;
    amount: number;
    module?: ModuleType;
    comment?: string;
}
export declare class DeductCreditsDto {
    actionType: ActionType;
    module?: ModuleType;
    quantity: number;
    resourceId?: string;
    resourceType?: string;
}
export declare class DeductCreditsResponseDto {
    success: boolean;
    creditsDeducted: number;
    remainingBalance: number;
}
export declare class UnblurInfluencersDto {
    influencerIds: string[];
    platform: PlatformType;
}
export declare class UnblurInfluencersResponseDto {
    success: boolean;
    unlockedCount: number;
    alreadyUnlockedCount: number;
    creditsUsed: number;
    remainingBalance: number;
}
export declare class CreditTransactionDto {
    id: string;
    transactionType: string;
    amount: number;
    moduleType: string;
    actionType: string;
    comment: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
}
export declare class GetTransactionsQueryDto {
    module?: ModuleType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export declare class CreditUsageChartDto {
    labels: string[];
    credits: number[];
    debits: number[];
}
export declare class TeamMemberUsageSummaryDto {
    userId: string;
    name: string;
    email: string;
    country: string;
    currentBalance: number;
    totalCreditsAdded: number;
    discoveryUsage: number;
    insightsUsage: number;
    otherUsage: number;
    lastActiveAt: Date | null;
}
export declare class CreditUsageLogsQueryDto {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class CreditUsageLogsResponseDto {
    data: TeamMemberUsageSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class MonthlyUsageDto {
    month: string;
    moduleType: string;
    transactionType: string;
    totalAmount: number;
    transactionCount: number;
}
export declare class UserCreditDetailDto {
    userId: string;
    name: string;
    email: string;
    currentBalance: number;
    totalCreditsAdded: number;
    totalCreditsUsed: number;
    accountValidUntil: Date;
    daysRemaining: number;
}
export declare class UserCreditDetailQueryDto {
    transactionType?: 'CREDIT' | 'DEBIT' | 'ALL';
    moduleType?: ModuleType;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}
export declare class UserCreditDetailResponseDto {
    user: UserCreditDetailDto;
    monthlyBreakdown: MonthlyUsageDto[];
    transactions: CreditTransactionDto[];
    total: number;
    page: number;
    limit: number;
}
export declare class CreditGuideDto {
    rules: {
        action: string;
        description: string;
        creditCost: string;
        notes?: string;
    }[];
    generalInfo: {
        creditValue: string;
        refreshInfo: string;
        reportInfo: string;
    };
}
