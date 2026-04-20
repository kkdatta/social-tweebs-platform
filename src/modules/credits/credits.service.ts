import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In, Not } from 'typeorm';
import { CreditAccount } from './entities/credit-account.entity';
import { ModuleBalance } from './entities/module-balance.entity';
import { CreditTransaction } from './entities/credit-transaction.entity';
import { UnlockedInfluencer } from './entities/unlocked-influencer.entity';
import { User } from '../users/entities/user.entity';
import {
  AllocateCreditsDto,
  DeductCreditsDto,
  DeductCreditsResponseDto,
  GetBalanceResponseDto,
  UnblurInfluencersDto,
  UnblurInfluencersResponseDto,
  GetTransactionsQueryDto,
  CreditTransactionDto,
  CreditUsageChartDto,
  CreditUsageLogsQueryDto,
  CreditUsageLogsResponseDto,
  TeamMemberUsageSummaryDto,
  UserCreditDetailQueryDto,
  UserCreditDetailResponseDto,
  MonthlyUsageDto,
  CreditGuideDto,
} from './dto';
import {
  ModuleType,
  ActionType,
  TransactionType,
  UserRole,
} from '../../common/enums';

// Credit calculation rules
const CREDIT_RULES: Partial<Record<ActionType, number>> = {
  [ActionType.INFLUENCER_SEARCH]: 0,
  [ActionType.INFLUENCER_UNBLUR]: 0.04,
  [ActionType.INFLUENCER_INSIGHT]: 1,
  [ActionType.INFLUENCER_EXPORT]: 0.04,
  [ActionType.PROFILE_UNLOCK]: 1,
  [ActionType.REPORT_GENERATION]: 1,
  [ActionType.REPORT_REFRESH]: 1,
  [ActionType.MANUAL_ALLOCATION]: 0,
  [ActionType.ACCOUNT_EXPIRY]: 0,
  [ActionType.ADMIN_ADJUSTMENT]: 0,
};

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(ModuleBalance)
    private moduleBalanceRepository: Repository<ModuleBalance>,
    @InjectRepository(CreditTransaction)
    private transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(UnlockedInfluencer)
    private unlockedInfluencerRepository: Repository<UnlockedInfluencer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<GetBalanceResponseDto> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId },
      relations: ['moduleBalances'],
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found');
    }

    const moduleBalances: Record<string, number> = {};
    let totalModuleBalance = 0;

    if (creditAccount.moduleBalances) {
      for (const mb of creditAccount.moduleBalances) {
        moduleBalances[mb.moduleType] = Number(mb.balance);
        totalModuleBalance += Number(mb.balance);
      }
    }

    return {
      unifiedBalance: Number(creditAccount.unifiedBalance),
      moduleBalances,
      totalBalance: Number(creditAccount.unifiedBalance) + totalModuleBalance,
      accountValidUntil: creditAccount.validityEnd,
      daysRemaining: creditAccount.daysRemaining(),
      isExpiringSoon: creditAccount.isExpiringSoon(),
    };
  }

  async allocateCredits(
    dto: AllocateCreditsDto,
    performedByUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const { accountId, amount, module, comment } = dto;

    // Verify the performer has permission
    const performer = await this.userRepository.findOne({
      where: { id: performedByUserId },
    });

    if (!performer) {
      throw new ForbiddenException('User not found');
    }

    // Get target user's credit account
    const targetUser = await this.userRepository.findOne({
      where: { id: accountId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Permission check: Super Admin can allocate to anyone, Admin can allocate to sub-users
    if (performer.role === UserRole.ADMIN) {
      if (targetUser.parentId !== performer.id) {
        throw new ForbiddenException('You can only allocate credits to your sub-users');
      }
    } else if (performer.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Get or create credit account
    let creditAccount = await this.creditAccountRepository.findOne({
      where: { userId: accountId },
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found for this user');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const moduleType = module || ModuleType.UNIFIED_BALANCE;
      const balanceBefore = Number(creditAccount.unifiedBalance);

      if (moduleType === ModuleType.UNIFIED_BALANCE) {
        creditAccount.unifiedBalance = Number(creditAccount.unifiedBalance) + amount;
        await queryRunner.manager.save(creditAccount);
      } else {
        let moduleBalance = await this.moduleBalanceRepository.findOne({
          where: { accountId: creditAccount.id, moduleType },
        });

        if (!moduleBalance) {
          moduleBalance = this.moduleBalanceRepository.create({
            accountId: creditAccount.id,
            moduleType,
            balance: 0,
          });
        }

        moduleBalance.balance = Number(moduleBalance.balance) + amount;
        await queryRunner.manager.save(moduleBalance);
      }

      // Record transaction
      const transaction = this.transactionRepository.create({
        accountId: creditAccount.id,
        transactionType: TransactionType.CREDIT,
        amount,
        moduleType,
        actionType: ActionType.MANUAL_ALLOCATION,
        sourceUserId: performedByUserId,
        comment,
        balanceBefore,
        balanceAfter: balanceBefore + amount,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return { success: true, message: `${amount} credits allocated successfully` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deductCredits(
    userId: string,
    dto: DeductCreditsDto,
  ): Promise<DeductCreditsResponseDto> {
    const { actionType, module, quantity, resourceId, resourceType } = dto;

    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId },
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found');
    }

    if (!creditAccount.isActive()) {
      throw new ForbiddenException('Credit account is not active or has expired');
    }

    // Calculate credits needed
    const creditRate = CREDIT_RULES[actionType];
    if (creditRate === undefined) {
      throw new BadRequestException(`Unknown action type: ${actionType}`);
    }

    const creditsNeeded = creditRate * quantity;
    const moduleType = module || ModuleType.UNIFIED_BALANCE;
    const currentBalance = Number(creditAccount.unifiedBalance);

    if (currentBalance < creditsNeeded) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditsNeeded}, Available: ${currentBalance}`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Deduct credits
      creditAccount.unifiedBalance = currentBalance - creditsNeeded;
      await queryRunner.manager.save(creditAccount);

      // Record transaction
      const transaction = this.transactionRepository.create({
        accountId: creditAccount.id,
        transactionType: TransactionType.DEBIT,
        amount: creditsNeeded,
        moduleType,
        actionType,
        sourceUserId: userId,
        resourceId,
        resourceType,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance - creditsNeeded,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      return {
        success: true,
        creditsDeducted: creditsNeeded,
        remainingBalance: currentBalance - creditsNeeded,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async unblurInfluencers(
    userId: string,
    dto: UnblurInfluencersDto,
  ): Promise<UnblurInfluencersResponseDto> {
    const { influencerIds, platform } = dto;

    // Get user and their parent (for visibility inheritance)
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userIdsToCheck = await this.getUserIdsForUnlockVisibility(userId, user);

    const alreadyUnlocked = await this.unlockedInfluencerRepository.find({
      where: {
        userId: In(userIdsToCheck),
        influencerId: In(influencerIds),
        platform,
      },
    });

    const alreadyUnlockedIds = new Set(alreadyUnlocked.map((u) => u.influencerId));
    const toUnlock = influencerIds.filter((id) => !alreadyUnlockedIds.has(id));

    if (toUnlock.length === 0) {
      const balance = await this.getBalance(userId);
      return {
        success: true,
        unlockedCount: 0,
        alreadyUnlockedCount: influencerIds.length,
        creditsUsed: 0,
        remainingBalance: balance.unifiedBalance,
      };
    }

    // Deduct credits for unlocking
    const deductResult = await this.deductCredits(userId, {
      actionType: ActionType.INFLUENCER_UNBLUR,
      module: ModuleType.UNIFIED_BALANCE,
      quantity: toUnlock.length,
      resourceType: 'influencer',
    });

    // Record unlocked influencers
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const influencerId of toUnlock) {
        const unlocked = this.unlockedInfluencerRepository.create({
          userId,
          influencerId,
          platform,
          unlockType: 'UNBLUR',
          creditsUsed: CREDIT_RULES[ActionType.INFLUENCER_UNBLUR],
        });
        await queryRunner.manager.save(unlocked);
      }

      await queryRunner.commitTransaction();

      return {
        success: true,
        unlockedCount: toUnlock.length,
        alreadyUnlockedCount: alreadyUnlockedIds.size,
        creditsUsed: deductResult.creditsDeducted,
        remainingBalance: deductResult.remainingBalance,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async isInfluencerUnlocked(
    userId: string,
    influencerId: string,
    platform: string,
  ): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return false;

    const userIdsToCheck = await this.getUserIdsForUnlockVisibility(userId, user);

    const unlocked = await this.unlockedInfluencerRepository.findOne({
      where: {
        userId: In(userIdsToCheck),
        influencerId,
        platform: platform as any,
      },
    });

    return !!unlocked;
  }

  async getTransactions(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<{ data: CreditTransactionDto[]; total: number }> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId },
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found');
    }

    const { module, startDate, endDate, page = 1, limit = 20 } = query;

    const whereClause: any = { accountId: creditAccount.id };

    if (module) {
      whereClause.moduleType = module;
    }

    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: transactions.map((t) => ({
        id: t.id,
        transactionType: t.transactionType,
        amount: Number(t.amount),
        moduleType: t.moduleType,
        actionType: t.actionType,
        comment: t.comment,
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        createdAt: t.createdAt,
      })),
      total,
    };
  }

  async getCreditUsageChart(
    userId: string,
    daysBack: number = 30,
  ): Promise<CreditUsageChartDto> {
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId },
    });

    if (!creditAccount) {
      return { labels: [], credits: [], debits: [] };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const transactions = await this.transactionRepository.find({
      where: {
        accountId: creditAccount.id,
        createdAt: Between(startDate, new Date()),
      },
      order: { createdAt: 'ASC' },
    });

    // Group by date
    const grouped = new Map<string, { credits: number; debits: number }>();

    transactions.forEach((txn) => {
      const dateKey = txn.createdAt.toISOString().split('T')[0];
      const existing = grouped.get(dateKey) || { credits: 0, debits: 0 };

      if (txn.transactionType === TransactionType.CREDIT) {
        existing.credits += Number(txn.amount);
      } else if (txn.transactionType === TransactionType.DEBIT) {
        existing.debits += Number(txn.amount);
      }

      grouped.set(dateKey, existing);
    });

    const sorted = Array.from(grouped.entries()).sort((a, b) =>
      a[0].localeCompare(b[0]),
    );

    return {
      labels: sorted.map(([date]) => date),
      credits: sorted.map(([, values]) => values.credits),
      debits: sorted.map(([, values]) => values.debits),
    };
  }

  // ============ CREDIT USAGE LOGS (Admin Analytics) ============

  async getCreditUsageLogs(
    adminUserId: string,
    query: CreditUsageLogsQueryDto,
  ): Promise<CreditUsageLogsResponseDto> {
    const { search, page = 1, limit = 20, sortBy = 'lastActiveAt', sortOrder = 'desc' } = query;

    // Get the admin user to verify permissions
    const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!adminUser) {
      throw new ForbiddenException('User not found');
    }

    // Build query for team members based on admin role
    let userWhereClause: any = {};
    if (adminUser.role === UserRole.SUPER_ADMIN) {
      // Super admin can see all users except themselves
      userWhereClause = { id: Not(adminUserId) };
    } else if (adminUser.role === UserRole.ADMIN) {
      // Admin can only see their sub-users
      userWhereClause = { parentId: adminUserId };
    } else {
      throw new ForbiddenException('Insufficient permissions to view usage logs');
    }

    // Get all team members
    const teamMembers = await this.userRepository.find({
      where: userWhereClause,
    });

    // Get credit accounts for all team members
    const userIds = teamMembers.map(u => u.id);
    const creditAccounts = await this.creditAccountRepository.find({
      where: { userId: In(userIds) },
    });

    // Create a map of userId -> creditAccount
    const accountMap = new Map(creditAccounts.map(ca => [ca.userId, ca]));

    // Get usage summaries for each user
    const summaries: TeamMemberUsageSummaryDto[] = [];

    for (const member of teamMembers) {
      const creditAccount = accountMap.get(member.id);
      
      // Filter by search if provided
      if (search) {
        const searchLower = search.toLowerCase();
        if (!member.name?.toLowerCase().includes(searchLower) && 
            !member.email?.toLowerCase().includes(searchLower)) {
          continue;
        }
      }

      let discoveryUsage = 0;
      let insightsUsage = 0;
      let otherUsage = 0;
      let totalCreditsAdded = 0;
      let lastActiveAt: Date | null = null;

      if (creditAccount) {
        // Get transactions for this account
        const transactions = await this.transactionRepository.find({
          where: { accountId: creditAccount.id },
        });

        transactions.forEach(txn => {
          if (txn.transactionType === TransactionType.CREDIT) {
            totalCreditsAdded += Number(txn.amount);
          } else if (txn.transactionType === TransactionType.DEBIT) {
            if (txn.actionType === ActionType.INFLUENCER_UNBLUR || 
                txn.actionType === ActionType.INFLUENCER_SEARCH) {
              discoveryUsage += Number(txn.amount);
            } else if (txn.actionType === ActionType.INFLUENCER_INSIGHT || 
                       txn.actionType === ActionType.INSIGHT_UNLOCK ||
                       txn.actionType === ActionType.INSIGHT_REFRESH) {
              insightsUsage += Number(txn.amount);
            } else {
              otherUsage += Number(txn.amount);
            }
          }
          if (!lastActiveAt || txn.createdAt > lastActiveAt) {
            lastActiveAt = txn.createdAt;
          }
        });
      }

      summaries.push({
        userId: member.id,
        name: member.name,
        email: member.email,
        country: (member as any).country || '',
        currentBalance: creditAccount ? Number(creditAccount.unifiedBalance) : 0,
        totalCreditsAdded,
        discoveryUsage,
        insightsUsage,
        otherUsage,
        lastActiveAt,
      });
    }

    // Sort summaries
    summaries.sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aVal = a.email?.toLowerCase() || '';
          bVal = b.email?.toLowerCase() || '';
          break;
        case 'currentBalance':
          aVal = a.currentBalance;
          bVal = b.currentBalance;
          break;
        case 'discoveryUsage':
          aVal = a.discoveryUsage;
          bVal = b.discoveryUsage;
          break;
        case 'insightsUsage':
          aVal = a.insightsUsage;
          bVal = b.insightsUsage;
          break;
        case 'lastActiveAt':
        default:
          aVal = a.lastActiveAt?.getTime() || 0;
          bVal = b.lastActiveAt?.getTime() || 0;
          break;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    // Paginate
    const total = summaries.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = summaries.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      total,
      page,
      limit,
      hasMore: startIndex + limit < total,
    };
  }

  async getUserCreditDetail(
    adminUserId: string,
    targetUserId: string,
    query: UserCreditDetailQueryDto,
  ): Promise<UserCreditDetailResponseDto> {
    const { transactionType, moduleType, startDate, endDate, page = 1, limit = 20 } = query;

    // Verify admin permissions
    const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!adminUser) {
      throw new ForbiddenException('User not found');
    }

    // Get target user
    const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Permission check
    if (adminUser.role === UserRole.ADMIN && targetUser.parentId !== adminUserId) {
      throw new ForbiddenException('You can only view your sub-users\' details');
    } else if (adminUser.role !== UserRole.SUPER_ADMIN && adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Get credit account
    const creditAccount = await this.creditAccountRepository.findOne({
      where: { userId: targetUserId },
    });

    if (!creditAccount) {
      throw new NotFoundException('Credit account not found for this user');
    }

    // Build transaction query
    const whereClause: any = { accountId: creditAccount.id };

    if (transactionType && transactionType !== 'ALL') {
      whereClause.transactionType = transactionType;
    }

    if (moduleType) {
      whereClause.moduleType = moduleType;
    }

    if (startDate && endDate) {
      whereClause.createdAt = Between(startDate, endDate);
    }

    // Get all transactions for totals
    const allTransactions = await this.transactionRepository.find({
      where: { accountId: creditAccount.id },
    });

    let totalCreditsAdded = 0;
    let totalCreditsUsed = 0;
    allTransactions.forEach(txn => {
      if (txn.transactionType === TransactionType.CREDIT) {
        totalCreditsAdded += Number(txn.amount);
      } else if (txn.transactionType === TransactionType.DEBIT) {
        totalCreditsUsed += Number(txn.amount);
      }
    });

    // Get paginated transactions
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get monthly breakdown
    const monthlyBreakdown = await this.getMonthlyBreakdown(creditAccount.id, query);

    return {
      user: {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        currentBalance: Number(creditAccount.unifiedBalance),
        totalCreditsAdded,
        totalCreditsUsed,
        accountValidUntil: creditAccount.validityEnd,
        daysRemaining: creditAccount.daysRemaining(),
      },
      monthlyBreakdown,
      transactions: transactions.map(t => ({
        id: t.id,
        transactionType: t.transactionType,
        amount: Number(t.amount),
        moduleType: t.moduleType,
        actionType: t.actionType,
        comment: t.comment,
        balanceBefore: Number(t.balanceBefore),
        balanceAfter: Number(t.balanceAfter),
        createdAt: t.createdAt,
      })),
      total,
      page,
      limit,
    };
  }

  private async getMonthlyBreakdown(
    accountId: string,
    query: UserCreditDetailQueryDto,
  ): Promise<MonthlyUsageDto[]> {
    const { transactionType, moduleType } = query;

    // Get all transactions for this account
    const transactions = await this.transactionRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });

    // Group by month and module
    const grouped = new Map<string, MonthlyUsageDto>();

    transactions.forEach(txn => {
      // Apply filters
      if (transactionType && transactionType !== 'ALL' && txn.transactionType !== transactionType) {
        return;
      }
      if (moduleType && txn.moduleType !== moduleType) {
        return;
      }

      const month = txn.createdAt.toISOString().substring(0, 7); // YYYY-MM
      const key = `${month}-${txn.moduleType}-${txn.transactionType}`;
      
      const existing = grouped.get(key);
      if (existing) {
        existing.totalAmount += Number(txn.amount);
        existing.transactionCount += 1;
      } else {
        grouped.set(key, {
          month,
          moduleType: txn.moduleType,
          transactionType: txn.transactionType,
          totalAmount: Number(txn.amount),
          transactionCount: 1,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.month.localeCompare(a.month));
  }

  getCreditGuide(): CreditGuideDto {
    return {
      rules: [
        {
          action: 'Influencer Discovery',
          description: 'Unblur influencer profiles',
          creditCost: '1 Credit = 25 Profiles',
          notes: '0.04 credits per profile. Client-level: once unblurred, free for all team members. Resets monthly.',
        },
        {
          action: 'Influencer Insights',
          description: 'Unlock detailed influencer profile',
          creditCost: '1 Credit = 1 Profile',
          notes: 'Client-level: once any team member unlocks, all others see it free. Data valid for 7 days.',
        },
        {
          action: 'Insight Refresh',
          description: 'Re-fetch updated data for insights',
          creditCost: '1 Credit per refresh',
          notes: 'If data < 7 days old, returns same data (still charges 1 credit). No auto-refresh.',
        },
        {
          action: 'Export Influencers',
          description: 'Export influencer list to Excel/CSV',
          creditCost: '1 Credit = 25 Profiles',
          notes: '0.04 credits per profile. No API call — uses stored data.',
        },
        {
          action: 'Audience Overlap',
          description: 'Compare audience overlap between influencers',
          creditCost: '1 Credit per influencer',
          notes: 'First 10 queries per client account are FREE (lifetime). Client-level: view existing reports at 0 credits.',
        },
        {
          action: 'Social Sentiments',
          description: 'Sentiment analysis report',
          creditCost: '1 Credit = 1 URL',
          notes: 'Charged only after successful processing. URL must be valid (private/deleted content is rejected).',
        },
        {
          action: 'Influencer Collab Check',
          description: 'Collaboration history check',
          creditCost: '1 Credit per influencer',
          notes: 'Client-level: once generated, all team members view at 0 credits. Refresh = 1 credit.',
        },
        {
          action: 'Influencer Tie Breaker',
          description: 'Compare influencers side-by-side',
          creditCost: '1 Credit per uncached influencer',
          notes: 'If influencer data is already cached (< 7 days), 0 credits for that influencer.',
        },
        {
          action: 'Paid Collaboration',
          description: 'Sponsored post analysis',
          creditCost: '1 Credit per influencer found',
          notes: 'Client-level: unlock once, view forever. Charged after processing based on influencers discovered.',
        },
        {
          action: 'Campaign Tracking',
          description: 'Campaign performance tracking',
          creditCost: 'First 10 campaigns FREE, then 1 Credit per campaign',
          notes: 'Lifetime free quota per client account. Minimum 5 credits balance required.',
        },
        {
          action: 'Mention Tracking',
          description: 'Brand mention monitoring',
          creditCost: '1 Credit = 1 Report',
          notes: 'Uses Raw API (no Discovery credits). Stored permanently — fresh data = new report.',
        },
        {
          action: 'Competition Analysis',
          description: 'Competitor benchmarking',
          creditCost: '1 Credit = 1 Report',
          notes: 'Charged only after successful processing. Client-level view sharing.',
        },
      ],
      generalInfo: {
        creditValue: '1 Credit = Rs. 100/-',
        refreshInfo: 'All refreshes cost 1 Credit. Credits are NOT charged if the API call fails.',
        reportInfo: 'Reports are stored permanently. Create a new report for fresh data. Unblur resets monthly.',
      },
    };
  }

  /**
   * Unlocks are visible to the user, their parent admin, and (when viewer is admin)
   * all sub-users under that admin.
   */
  private async getUserIdsForUnlockVisibility(
    userId: string,
    user: User,
  ): Promise<string[]> {
    const userIdsToCheck = [userId];
    if (user.parentId) {
      userIdsToCheck.push(user.parentId);
    }
    if (user.role === UserRole.ADMIN) {
      const children = await this.userRepository.find({
        where: { parentId: userId },
        select: ['id'],
      });
      userIdsToCheck.push(...children.map((c) => c.id));
    }
    return userIdsToCheck;
  }

  async getAnalyticsSummary(adminUserId: string): Promise<{
    totalTeamMembers: number;
    totalCreditsAllocated: number;
    totalCreditsUsed: number;
    activeUsers: number;
    usageByModule: Record<string, number>;
  }> {
    // Verify admin permissions
    const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
    if (!adminUser) {
      throw new ForbiddenException('User not found');
    }

    // Get team members based on role
    let userWhereClause: any = {};
    if (adminUser.role === UserRole.SUPER_ADMIN) {
      userWhereClause = { id: Not(adminUserId) };
    } else if (adminUser.role === UserRole.ADMIN) {
      userWhereClause = { parentId: adminUserId };
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const teamMembers = await this.userRepository.find({ where: userWhereClause });
    const userIds = teamMembers.map(u => u.id);

    // Get credit accounts
    const creditAccounts = await this.creditAccountRepository.find({
      where: { userId: In(userIds) },
    });

    const accountIds = creditAccounts.map(ca => ca.id);

    // Get all transactions
    const transactions = await this.transactionRepository.find({
      where: { accountId: In(accountIds) },
    });

    let totalCreditsAllocated = 0;
    let totalCreditsUsed = 0;
    const usageByModule: Record<string, number> = {};
    const activeUserIds = new Set<string>();

    // Last 30 days for active users
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    transactions.forEach(txn => {
      if (txn.transactionType === TransactionType.CREDIT) {
        totalCreditsAllocated += Number(txn.amount);
      } else if (txn.transactionType === TransactionType.DEBIT) {
        totalCreditsUsed += Number(txn.amount);
        
        // Track usage by module
        const module = txn.moduleType || 'OTHER';
        usageByModule[module] = (usageByModule[module] || 0) + Number(txn.amount);
      }

      // Track active users (any transaction in last 30 days)
      if (txn.createdAt >= thirtyDaysAgo) {
        const account = creditAccounts.find(ca => ca.id === txn.accountId);
        if (account) {
          activeUserIds.add(account.userId);
        }
      }
    });

    return {
      totalTeamMembers: teamMembers.length,
      totalCreditsAllocated,
      totalCreditsUsed,
      activeUsers: activeUserIds.size,
      usageByModule,
    };
  }
}
