import { CreditsService } from './credits.service';
import { GetBalanceResponseDto, AllocateCreditsDto, DeductCreditsDto, DeductCreditsResponseDto, UnblurInfluencersDto, UnblurInfluencersResponseDto, GetTransactionsQueryDto, CreditTransactionDto, CreditUsageChartDto, CreditUsageLogsQueryDto, CreditUsageLogsResponseDto, UserCreditDetailQueryDto, UserCreditDetailResponseDto, CreditGuideDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators';
import { PlatformType } from '../../common/enums';
export declare class CreditsController {
    private readonly creditsService;
    constructor(creditsService: CreditsService);
    getBalance(user: CurrentUserPayload): Promise<GetBalanceResponseDto>;
    allocateCredits(user: CurrentUserPayload, dto: AllocateCreditsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    deductCredits(user: CurrentUserPayload, dto: DeductCreditsDto): Promise<DeductCreditsResponseDto>;
    unblurInfluencers(user: CurrentUserPayload, dto: UnblurInfluencersDto): Promise<UnblurInfluencersResponseDto>;
    checkInfluencerUnlocked(user: CurrentUserPayload, influencerId: string, platform: PlatformType): Promise<{
        isUnlocked: boolean;
    }>;
    getTransactions(user: CurrentUserPayload, query: GetTransactionsQueryDto): Promise<{
        data: CreditTransactionDto[];
        total: number;
    }>;
    getCreditUsageChart(user: CurrentUserPayload, days?: number): Promise<CreditUsageChartDto>;
    getCreditGuide(): CreditGuideDto;
    getAnalyticsSummary(user: CurrentUserPayload): Promise<{
        totalTeamMembers: number;
        totalCreditsAllocated: number;
        totalCreditsUsed: number;
        activeUsers: number;
        usageByModule: Record<string, number>;
    }>;
    getCreditUsageLogs(user: CurrentUserPayload, query: CreditUsageLogsQueryDto): Promise<CreditUsageLogsResponseDto>;
    getUserCreditDetail(user: CurrentUserPayload, targetUserId: string, query: UserCreditDetailQueryDto): Promise<UserCreditDetailResponseDto>;
}
