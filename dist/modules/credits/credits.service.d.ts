import { Repository, DataSource } from 'typeorm';
import { CreditAccount } from './entities/credit-account.entity';
import { ModuleBalance } from './entities/module-balance.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { UnlockedInfluencer } from './entities/unlocked-influencer.entity';
import { User } from '../users/entities/user.entity';
import { AllocateCreditsDto, DeductCreditsDto, DeductCreditsResponseDto, GetBalanceResponseDto, UnblurInfluencersDto, UnblurInfluencersResponseDto, GetTransactionsQueryDto, CreditTransactionDto, CreditUsageChartDto, CreditUsageLogsQueryDto, CreditUsageLogsResponseDto, UserCreditDetailQueryDto, UserCreditDetailResponseDto, CreditGuideDto } from './dto';
export declare class CreditsService {
    private creditAccountRepository;
    private moduleBalanceRepository;
    private transactionRepository;
    private unlockedInfluencerRepository;
    private userRepository;
    private dataSource;
    constructor(creditAccountRepository: Repository<CreditAccount>, moduleBalanceRepository: Repository<ModuleBalance>, transactionRepository: Repository<CreditTransaction>, unlockedInfluencerRepository: Repository<UnlockedInfluencer>, userRepository: Repository<User>, dataSource: DataSource);
    getBalance(userId: string): Promise<GetBalanceResponseDto>;
    allocateCredits(dto: AllocateCreditsDto, performedByUserId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    deductCredits(userId: string, dto: DeductCreditsDto): Promise<DeductCreditsResponseDto>;
    unblurInfluencers(userId: string, dto: UnblurInfluencersDto): Promise<UnblurInfluencersResponseDto>;
    isInfluencerUnlocked(userId: string, influencerId: string, platform: string): Promise<boolean>;
    getTransactions(userId: string, query: GetTransactionsQueryDto): Promise<{
        data: CreditTransactionDto[];
        total: number;
    }>;
    getCreditUsageChart(userId: string, daysBack?: number): Promise<CreditUsageChartDto>;
    getCreditUsageLogs(adminUserId: string, query: CreditUsageLogsQueryDto): Promise<CreditUsageLogsResponseDto>;
    getUserCreditDetail(adminUserId: string, targetUserId: string, query: UserCreditDetailQueryDto): Promise<UserCreditDetailResponseDto>;
    private getMonthlyBreakdown;
    getCreditGuide(): CreditGuideDto;
    getAnalyticsSummary(adminUserId: string): Promise<{
        totalTeamMembers: number;
        totalCreditsAllocated: number;
        totalCreditsUsed: number;
        activeUsers: number;
        usageByModule: Record<string, number>;
    }>;
}
