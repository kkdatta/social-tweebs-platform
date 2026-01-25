"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const credit_account_entity_1 = require("./entities/credit-account.entity");
const module_balance_entity_1 = require("./entities/module-balance.entity");
const credit_transaction_entity_1 = require("./entities/credit-transaction.entity");
const unlocked_influencer_entity_1 = require("./entities/unlocked-influencer.entity");
const user_entity_1 = require("../users/entities/user.entity");
const enums_1 = require("../../common/enums");
const CREDIT_RULES = {
    [enums_1.ActionType.INFLUENCER_SEARCH]: 0.01,
    [enums_1.ActionType.INFLUENCER_UNBLUR]: 0.04,
    [enums_1.ActionType.INFLUENCER_INSIGHT]: 1,
    [enums_1.ActionType.INFLUENCER_EXPORT]: 0.04,
    [enums_1.ActionType.REPORT_GENERATION]: 1,
    [enums_1.ActionType.REPORT_REFRESH]: 1,
    [enums_1.ActionType.MANUAL_ALLOCATION]: 0,
    [enums_1.ActionType.ACCOUNT_EXPIRY]: 0,
    [enums_1.ActionType.ADMIN_ADJUSTMENT]: 0,
};
let CreditsService = class CreditsService {
    constructor(creditAccountRepository, moduleBalanceRepository, transactionRepository, unlockedInfluencerRepository, userRepository, dataSource) {
        this.creditAccountRepository = creditAccountRepository;
        this.moduleBalanceRepository = moduleBalanceRepository;
        this.transactionRepository = transactionRepository;
        this.unlockedInfluencerRepository = unlockedInfluencerRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    async getBalance(userId) {
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId },
            relations: ['moduleBalances'],
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found');
        }
        const moduleBalances = {};
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
    async allocateCredits(dto, performedByUserId) {
        const { accountId, amount, module, comment } = dto;
        const performer = await this.userRepository.findOne({
            where: { id: performedByUserId },
        });
        if (!performer) {
            throw new common_1.ForbiddenException('User not found');
        }
        const targetUser = await this.userRepository.findOne({
            where: { id: accountId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('Target user not found');
        }
        if (performer.role === enums_1.UserRole.ADMIN) {
            if (targetUser.parentId !== performer.id) {
                throw new common_1.ForbiddenException('You can only allocate credits to your sub-users');
            }
        }
        else if (performer.role !== enums_1.UserRole.SUPER_ADMIN) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        let creditAccount = await this.creditAccountRepository.findOne({
            where: { userId: accountId },
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found for this user');
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const moduleType = module || enums_1.ModuleType.UNIFIED_BALANCE;
            const balanceBefore = Number(creditAccount.unifiedBalance);
            if (moduleType === enums_1.ModuleType.UNIFIED_BALANCE) {
                creditAccount.unifiedBalance = Number(creditAccount.unifiedBalance) + amount;
                await queryRunner.manager.save(creditAccount);
            }
            else {
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
            const transaction = this.transactionRepository.create({
                accountId: creditAccount.id,
                transactionType: enums_1.TransactionType.CREDIT,
                amount,
                moduleType,
                actionType: enums_1.ActionType.MANUAL_ALLOCATION,
                sourceUserId: performedByUserId,
                comment,
                balanceBefore,
                balanceAfter: balanceBefore + amount,
            });
            await queryRunner.manager.save(transaction);
            await queryRunner.commitTransaction();
            return { success: true, message: `${amount} credits allocated successfully` };
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async deductCredits(userId, dto) {
        const { actionType, module, quantity, resourceId, resourceType } = dto;
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId },
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found');
        }
        if (!creditAccount.isActive()) {
            throw new common_1.ForbiddenException('Credit account is not active or has expired');
        }
        const creditRate = CREDIT_RULES[actionType];
        if (creditRate === undefined) {
            throw new common_1.BadRequestException(`Unknown action type: ${actionType}`);
        }
        const creditsNeeded = creditRate * quantity;
        const moduleType = module || enums_1.ModuleType.UNIFIED_BALANCE;
        const currentBalance = Number(creditAccount.unifiedBalance);
        if (currentBalance < creditsNeeded) {
            throw new common_1.BadRequestException(`Insufficient credits. Required: ${creditsNeeded}, Available: ${currentBalance}`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            creditAccount.unifiedBalance = currentBalance - creditsNeeded;
            await queryRunner.manager.save(creditAccount);
            const transaction = this.transactionRepository.create({
                accountId: creditAccount.id,
                transactionType: enums_1.TransactionType.DEBIT,
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
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async unblurInfluencers(userId, dto) {
        const { influencerIds, platform } = dto;
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const userIdsToCheck = [userId];
        if (user.parentId) {
            userIdsToCheck.push(user.parentId);
        }
        const alreadyUnlocked = await this.unlockedInfluencerRepository.find({
            where: {
                userId: (0, typeorm_2.In)(userIdsToCheck),
                influencerId: (0, typeorm_2.In)(influencerIds),
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
        const deductResult = await this.deductCredits(userId, {
            actionType: enums_1.ActionType.INFLUENCER_UNBLUR,
            module: enums_1.ModuleType.UNIFIED_BALANCE,
            quantity: toUnlock.length,
            resourceType: 'influencer',
        });
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
                    creditsUsed: CREDIT_RULES[enums_1.ActionType.INFLUENCER_UNBLUR],
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
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async isInfluencerUnlocked(userId, influencerId, platform) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user)
            return false;
        const userIdsToCheck = [userId];
        if (user.parentId) {
            userIdsToCheck.push(user.parentId);
        }
        const unlocked = await this.unlockedInfluencerRepository.findOne({
            where: {
                userId: (0, typeorm_2.In)(userIdsToCheck),
                influencerId,
                platform: platform,
            },
        });
        return !!unlocked;
    }
    async getTransactions(userId, query) {
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId },
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found');
        }
        const { module, startDate, endDate, page = 1, limit = 20 } = query;
        const whereClause = { accountId: creditAccount.id };
        if (module) {
            whereClause.moduleType = module;
        }
        if (startDate && endDate) {
            whereClause.createdAt = (0, typeorm_2.Between)(startDate, endDate);
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
    async getCreditUsageChart(userId, daysBack = 30) {
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
                createdAt: (0, typeorm_2.Between)(startDate, new Date()),
            },
            order: { createdAt: 'ASC' },
        });
        const grouped = new Map();
        transactions.forEach((txn) => {
            const dateKey = txn.createdAt.toISOString().split('T')[0];
            const existing = grouped.get(dateKey) || { credits: 0, debits: 0 };
            if (txn.transactionType === enums_1.TransactionType.CREDIT) {
                existing.credits += Number(txn.amount);
            }
            else if (txn.transactionType === enums_1.TransactionType.DEBIT) {
                existing.debits += Number(txn.amount);
            }
            grouped.set(dateKey, existing);
        });
        const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        return {
            labels: sorted.map(([date]) => date),
            credits: sorted.map(([, values]) => values.credits),
            debits: sorted.map(([, values]) => values.debits),
        };
    }
    async getCreditUsageLogs(adminUserId, query) {
        const { search, page = 1, limit = 20, sortBy = 'lastActiveAt', sortOrder = 'desc' } = query;
        const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
        if (!adminUser) {
            throw new common_1.ForbiddenException('User not found');
        }
        let userWhereClause = {};
        if (adminUser.role === enums_1.UserRole.SUPER_ADMIN) {
            userWhereClause = { id: (0, typeorm_2.Not)(adminUserId) };
        }
        else if (adminUser.role === enums_1.UserRole.ADMIN) {
            userWhereClause = { parentId: adminUserId };
        }
        else {
            throw new common_1.ForbiddenException('Insufficient permissions to view usage logs');
        }
        const teamMembers = await this.userRepository.find({
            where: userWhereClause,
        });
        const userIds = teamMembers.map(u => u.id);
        const creditAccounts = await this.creditAccountRepository.find({
            where: { userId: (0, typeorm_2.In)(userIds) },
        });
        const accountMap = new Map(creditAccounts.map(ca => [ca.userId, ca]));
        const summaries = [];
        for (const member of teamMembers) {
            const creditAccount = accountMap.get(member.id);
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
            let lastActiveAt = null;
            if (creditAccount) {
                const transactions = await this.transactionRepository.find({
                    where: { accountId: creditAccount.id },
                });
                transactions.forEach(txn => {
                    if (txn.transactionType === enums_1.TransactionType.CREDIT) {
                        totalCreditsAdded += Number(txn.amount);
                    }
                    else if (txn.transactionType === enums_1.TransactionType.DEBIT) {
                        if (txn.actionType === enums_1.ActionType.INFLUENCER_UNBLUR ||
                            txn.actionType === enums_1.ActionType.INFLUENCER_SEARCH) {
                            discoveryUsage += Number(txn.amount);
                        }
                        else if (txn.actionType === enums_1.ActionType.INFLUENCER_INSIGHT ||
                            txn.actionType === enums_1.ActionType.INSIGHT_UNLOCK ||
                            txn.actionType === enums_1.ActionType.INSIGHT_REFRESH) {
                            insightsUsage += Number(txn.amount);
                        }
                        else {
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
                country: member.country || '',
                currentBalance: creditAccount ? Number(creditAccount.unifiedBalance) : 0,
                totalCreditsAdded,
                discoveryUsage,
                insightsUsage,
                otherUsage,
                lastActiveAt,
            });
        }
        summaries.sort((a, b) => {
            let aVal, bVal;
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
            }
            else {
                return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
            }
        });
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
    async getUserCreditDetail(adminUserId, targetUserId, query) {
        const { transactionType, moduleType, startDate, endDate, page = 1, limit = 20 } = query;
        const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
        if (!adminUser) {
            throw new common_1.ForbiddenException('User not found');
        }
        const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });
        if (!targetUser) {
            throw new common_1.NotFoundException('Target user not found');
        }
        if (adminUser.role === enums_1.UserRole.ADMIN && targetUser.parentId !== adminUserId) {
            throw new common_1.ForbiddenException('You can only view your sub-users\' details');
        }
        else if (adminUser.role !== enums_1.UserRole.SUPER_ADMIN && adminUser.role !== enums_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const creditAccount = await this.creditAccountRepository.findOne({
            where: { userId: targetUserId },
        });
        if (!creditAccount) {
            throw new common_1.NotFoundException('Credit account not found for this user');
        }
        const whereClause = { accountId: creditAccount.id };
        if (transactionType && transactionType !== 'ALL') {
            whereClause.transactionType = transactionType;
        }
        if (moduleType) {
            whereClause.moduleType = moduleType;
        }
        if (startDate && endDate) {
            whereClause.createdAt = (0, typeorm_2.Between)(startDate, endDate);
        }
        const allTransactions = await this.transactionRepository.find({
            where: { accountId: creditAccount.id },
        });
        let totalCreditsAdded = 0;
        let totalCreditsUsed = 0;
        allTransactions.forEach(txn => {
            if (txn.transactionType === enums_1.TransactionType.CREDIT) {
                totalCreditsAdded += Number(txn.amount);
            }
            else if (txn.transactionType === enums_1.TransactionType.DEBIT) {
                totalCreditsUsed += Number(txn.amount);
            }
        });
        const [transactions, total] = await this.transactionRepository.findAndCount({
            where: whereClause,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
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
    async getMonthlyBreakdown(accountId, query) {
        const { transactionType, moduleType } = query;
        const transactions = await this.transactionRepository.find({
            where: { accountId },
            order: { createdAt: 'DESC' },
        });
        const grouped = new Map();
        transactions.forEach(txn => {
            if (transactionType && transactionType !== 'ALL' && txn.transactionType !== transactionType) {
                return;
            }
            if (moduleType && txn.moduleType !== moduleType) {
                return;
            }
            const month = txn.createdAt.toISOString().substring(0, 7);
            const key = `${month}-${txn.moduleType}-${txn.transactionType}`;
            const existing = grouped.get(key);
            if (existing) {
                existing.totalAmount += Number(txn.amount);
                existing.transactionCount += 1;
            }
            else {
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
    getCreditGuide() {
        return {
            rules: [
                {
                    action: 'Influencer Discovery',
                    description: 'Unblur influencer profiles',
                    creditCost: '1 Credit = 25 Profiles',
                    notes: '0.04 credits per profile',
                },
                {
                    action: 'Influencer Insights',
                    description: 'Unlock detailed influencer profile',
                    creditCost: '1 Credit = 1 Profile',
                    notes: 'First-time view only; free access thereafter',
                },
                {
                    action: 'Insight Refresh',
                    description: 'Re-fetch updated data for insights',
                    creditCost: '1 Credit per refresh',
                },
                {
                    action: 'Export Influencers',
                    description: 'Export influencer list to Excel/CSV',
                    creditCost: '1 Credit = 25 Profiles',
                    notes: '0.04 credits per profile',
                },
                {
                    action: 'Audience Overlap',
                    description: 'Compare audience demographics',
                    creditCost: '1 Credit = 1 Report',
                },
                {
                    action: 'Social Sentiments',
                    description: 'Sentiment analysis report',
                    creditCost: '1 Credit = 1 URL',
                },
                {
                    action: 'Influencer Collab Check',
                    description: 'Collaboration history check',
                    creditCost: '1 Credit = 1 Report',
                    notes: 'Refresh costs 1 credit',
                },
                {
                    action: 'Influencer Tie Breaker',
                    description: 'Compare influencers side-by-side',
                    creditCost: '1 Credit = 1 Influencer',
                },
                {
                    action: 'Paid Collaboration',
                    description: 'Sponsored post analysis',
                    creditCost: '1 Credit = 1 Report',
                },
                {
                    action: 'Campaign Tracking',
                    description: 'Campaign performance tracking',
                    creditCost: '1 Credit = 1 Report',
                },
                {
                    action: 'Mention Tracking',
                    description: 'Brand mention monitoring',
                    creditCost: '1 Credit = 1 Report',
                },
                {
                    action: 'Competition Analysis',
                    description: 'Competitor benchmarking',
                    creditCost: '1 Credit = 1 Report',
                },
            ],
            generalInfo: {
                creditValue: '1 Credit = Rs. 100/-',
                refreshInfo: 'Refreshing Influencer Insights & Collab Check will deduct 1 Credit',
                reportInfo: 'No refresh concept in other reports. Create a new report for updated data.',
            },
        };
    }
    async getAnalyticsSummary(adminUserId) {
        const adminUser = await this.userRepository.findOne({ where: { id: adminUserId } });
        if (!adminUser) {
            throw new common_1.ForbiddenException('User not found');
        }
        let userWhereClause = {};
        if (adminUser.role === enums_1.UserRole.SUPER_ADMIN) {
            userWhereClause = { id: (0, typeorm_2.Not)(adminUserId) };
        }
        else if (adminUser.role === enums_1.UserRole.ADMIN) {
            userWhereClause = { parentId: adminUserId };
        }
        else {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const teamMembers = await this.userRepository.find({ where: userWhereClause });
        const userIds = teamMembers.map(u => u.id);
        const creditAccounts = await this.creditAccountRepository.find({
            where: { userId: (0, typeorm_2.In)(userIds) },
        });
        const accountIds = creditAccounts.map(ca => ca.id);
        const transactions = await this.transactionRepository.find({
            where: { accountId: (0, typeorm_2.In)(accountIds) },
        });
        let totalCreditsAllocated = 0;
        let totalCreditsUsed = 0;
        const usageByModule = {};
        const activeUserIds = new Set();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        transactions.forEach(txn => {
            if (txn.transactionType === enums_1.TransactionType.CREDIT) {
                totalCreditsAllocated += Number(txn.amount);
            }
            else if (txn.transactionType === enums_1.TransactionType.DEBIT) {
                totalCreditsUsed += Number(txn.amount);
                const module = txn.moduleType || 'OTHER';
                usageByModule[module] = (usageByModule[module] || 0) + Number(txn.amount);
            }
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
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(credit_account_entity_1.CreditAccount)),
    __param(1, (0, typeorm_1.InjectRepository)(module_balance_entity_1.ModuleBalance)),
    __param(2, (0, typeorm_1.InjectRepository)(credit_transaction_entity_1.CreditTransaction)),
    __param(3, (0, typeorm_1.InjectRepository)(unlocked_influencer_entity_1.UnlockedInfluencer)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CreditsService);
//# sourceMappingURL=credits.service.js.map