import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Like, ILike } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { CreditTransaction } from '../credits/entities/credit-transaction.entity';
import {
  TeamMemberProfile,
  FeatureAccess,
  ActionPermission,
  ImpersonationLog,
} from './entities';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  UpdateFeaturesDto,
  UpdateActionsDto,
  AllocateTeamCreditsDto,
  TeamMemberResponseDto,
  TeamMemberQueryDto,
  CreditUsageLogDto,
  CreditLogQueryDto,
  CreditUsageDetailDto,
  CreditDetailQueryDto,
  ImpersonationResponseDto,
} from './dto';
import {
  UserRole,
  UserStatus,
  InternalRoleType,
  FeatureName,
  ActionName,
  TransactionType,
  ActionType,
  ModuleType,
} from '../../common/enums';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TeamMemberProfile)
    private profileRepository: Repository<TeamMemberProfile>,
    @InjectRepository(FeatureAccess)
    private featureAccessRepository: Repository<FeatureAccess>,
    @InjectRepository(ActionPermission)
    private actionPermissionRepository: Repository<ActionPermission>,
    @InjectRepository(ImpersonationLog)
    private impersonationLogRepository: Repository<ImpersonationLog>,
    @InjectRepository(CreditAccount)
    private creditAccountRepository: Repository<CreditAccount>,
    @InjectRepository(CreditTransaction)
    private transactionRepository: Repository<CreditTransaction>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    private dataSource: DataSource,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async getTeamMembers(
    requesterId: string,
    query: TeamMemberQueryDto,
  ): Promise<{ data: TeamMemberResponseDto[]; total: number }> {
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // Build where clause based on role
    const whereClause: any = {};

    if (requester.role === UserRole.SUPER_ADMIN) {
      whereClause.role = In([UserRole.ADMIN, UserRole.SUB_USER]);
    } else if (requester.role === UserRole.ADMIN) {
      whereClause.parentId = requesterId;
    } else {
      throw new ForbiddenException('Sub-users cannot view team members');
    }

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.search) {
      whereClause.name = ILike(`%${query.search}%`);
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    const [users, total] = await this.userRepository.findAndCount({
      where: whereClause,
      relations: ['creditAccount'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const data = await Promise.all(
      users.map((user) => this.mapToTeamMemberResponse(user)),
    );

    return { data, total };
  }

  async getTeamMemberById(
    requesterId: string,
    memberId: string,
  ): Promise<TeamMemberResponseDto> {
    await this.validateAccessToMember(requesterId, memberId);

    const user = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['creditAccount'],
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    return this.mapToTeamMemberResponse(user);
  }

  async createTeamMember(
    creatorId: string,
    dto: CreateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
      relations: ['creditAccount'],
    });

    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Validate permissions
    if (creator.role === UserRole.SUB_USER) {
      throw new ForbiddenException('Sub-users cannot create team members');
    }

    // Check if Admin is trying to create another Admin
    if (
      creator.role === UserRole.ADMIN &&
      dto.roleType === InternalRoleType.CLIENT
    ) {
      throw new ForbiddenException('Admins cannot create other Admin users');
    }

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate credit allocation for Admin
    if (creator.role === UserRole.ADMIN && dto.initialCredits) {
      const creatorBalance = Number(creator.creditAccount?.unifiedBalance || 0);
      if (creatorBalance < dto.initialCredits) {
        throw new BadRequestException(
          `Insufficient credits. You have ${creatorBalance}, trying to allocate ${dto.initialCredits}`,
        );
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determine user role
      const userRole =
        dto.roleType === InternalRoleType.CLIENT
          ? UserRole.ADMIN
          : UserRole.SUB_USER;

      // Hash password
      const passwordHash = await bcrypt.hash(dto.password, 12);

      // Create user
      const user = queryRunner.manager.create(User, {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: userRole,
        status: UserStatus.ACTIVE,
        parentId: userRole === UserRole.SUB_USER ? creatorId : null,
      });
      await queryRunner.manager.save(user);

      // Create team member profile
      const profile = queryRunner.manager.create(TeamMemberProfile, {
        userId: user.id,
        internalRoleType: dto.roleType,
        country: dto.country,
        validityStart: new Date(dto.validityStart),
        validityEnd: new Date(dto.validityEnd),
        validityNotificationEnabled: dto.validityNotificationEnabled ?? true,
        createdBy: creatorId,
      });
      await queryRunner.manager.save(profile);

      // Create credit account
      const creditAccount = queryRunner.manager.create(CreditAccount, {
        userId: user.id,
        unifiedBalance: 0,
        validityStart: new Date(dto.validityStart),
        validityEnd: new Date(dto.validityEnd),
        isLocked: false,
      });
      await queryRunner.manager.save(creditAccount);

      // Create user preferences
      const preferences = queryRunner.manager.create(UserPreferences, {
        userId: user.id,
      });
      await queryRunner.manager.save(preferences);

      // Set feature access
      if (dto.enabledFeatures && dto.enabledFeatures.length > 0) {
        for (const feature of dto.enabledFeatures) {
          const featureAccess = queryRunner.manager.create(FeatureAccess, {
            userId: user.id,
            featureName: feature,
            isEnabled: true,
            grantedBy: creatorId,
          });
          await queryRunner.manager.save(featureAccess);
        }
      }

      // Set action permissions
      if (dto.enabledActions && dto.enabledActions.length > 0) {
        for (const action of dto.enabledActions) {
          const actionPerm = queryRunner.manager.create(ActionPermission, {
            userId: user.id,
            actionName: action,
            isEnabled: true,
            grantedBy: creatorId,
          });
          await queryRunner.manager.save(actionPerm);
        }
      }

      // Allocate initial credits
      if (dto.initialCredits && dto.initialCredits > 0) {
        // If Admin, deduct from their balance
        if (creator.role === UserRole.ADMIN) {
          creator.creditAccount.unifiedBalance =
            Number(creator.creditAccount.unifiedBalance) - dto.initialCredits;
          await queryRunner.manager.save(creator.creditAccount);

          // Record transfer out transaction
          const transferOut = queryRunner.manager.create(CreditTransaction, {
            accountId: creator.creditAccount.id,
            transactionType: TransactionType.TRANSFER_OUT,
            amount: dto.initialCredits,
            moduleType: ModuleType.UNIFIED_BALANCE,
            actionType: ActionType.MANUAL_ALLOCATION,
            sourceUserId: creatorId,
            comment: `Transferred to ${user.name}`,
            balanceBefore: Number(creator.creditAccount.unifiedBalance) + dto.initialCredits,
            balanceAfter: Number(creator.creditAccount.unifiedBalance),
          });
          await queryRunner.manager.save(transferOut);
        }

        // Add to new user's balance
        creditAccount.unifiedBalance = dto.initialCredits;
        await queryRunner.manager.save(creditAccount);

        // Record credit transaction
        const transaction = queryRunner.manager.create(CreditTransaction, {
          accountId: creditAccount.id,
          transactionType: TransactionType.CREDIT,
          amount: dto.initialCredits,
          moduleType: ModuleType.UNIFIED_BALANCE,
          actionType: ActionType.MANUAL_ALLOCATION,
          sourceUserId: creatorId,
          comment: dto.creditComment || 'Initial credit allocation',
          balanceBefore: 0,
          balanceAfter: dto.initialCredits,
        });
        await queryRunner.manager.save(transaction);
      }

      await queryRunner.commitTransaction();

      await this.mailService.sendWelcomeEmail(
        user.email,
        user.name,
        dto.password,
      );

      // Return the created member
      return this.getTeamMemberById(creatorId, user.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateTeamMember(
    requesterId: string,
    memberId: string,
    dto: UpdateTeamMemberDto,
  ): Promise<TeamMemberResponseDto> {
    await this.validateAccessToMember(requesterId, memberId);

    const user = await this.userRepository.findOne({
      where: { id: memberId },
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    const profile = await this.profileRepository.findOne({
      where: { userId: memberId },
    });

    // Update user fields
    if (dto.name) user.name = dto.name;
    if (dto.phone) user.phone = dto.phone;
    if (dto.status) user.status = dto.status;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 12);
    }
    await this.userRepository.save(user);

    // Update profile fields
    if (profile) {
      if (dto.country) profile.country = dto.country;
      if (dto.roleType) profile.internalRoleType = dto.roleType;
      if (dto.validityStart) profile.validityStart = new Date(dto.validityStart);
      if (dto.validityEnd) profile.validityEnd = new Date(dto.validityEnd);
      if (dto.validityNotificationEnabled !== undefined) {
        profile.validityNotificationEnabled = dto.validityNotificationEnabled;
      }
      await this.profileRepository.save(profile);

      // Also update credit account validity
      const creditAccount = await this.creditAccountRepository.findOne({
        where: { userId: memberId },
      });
      if (creditAccount) {
        if (dto.validityStart)
          creditAccount.validityStart = new Date(dto.validityStart);
        if (dto.validityEnd)
          creditAccount.validityEnd = new Date(dto.validityEnd);
        await this.creditAccountRepository.save(creditAccount);
      }
    }

    return this.getTeamMemberById(requesterId, memberId);
  }

  async deleteTeamMember(requesterId: string, memberId: string): Promise<void> {
    await this.validateAccessToMember(requesterId, memberId);

    const user = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['creditAccount'],
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
      relations: ['creditAccount'],
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // Return credits to Admin if applicable
    if (requester.role === UserRole.ADMIN && user.creditAccount && requester.creditAccount) {
      const remainingBalance = Number(user.creditAccount.unifiedBalance);
      if (remainingBalance > 0) {
        requester.creditAccount.unifiedBalance =
          Number(requester.creditAccount.unifiedBalance) + remainingBalance;
        await this.creditAccountRepository.save(requester.creditAccount);

        user.creditAccount.unifiedBalance = 0;
        await this.creditAccountRepository.save(user.creditAccount);
      }
    }

    // Soft delete - set status to SUSPENDED
    user.status = UserStatus.SUSPENDED;
    await this.userRepository.save(user);

    // Also suspend sub-users
    await this.userRepository.update(
      { parentId: memberId },
      { status: UserStatus.SUSPENDED },
    );
  }

  async getMemberFeatures(
    requesterId: string,
    memberId: string,
  ): Promise<{ featureName: string; isEnabled: boolean }[]> {
    await this.validateAccessToMember(requesterId, memberId);

    const features = await this.featureAccessRepository.find({
      where: { userId: memberId },
    });

    // Return all features with their status
    const allFeatures = Object.values(FeatureName);
    return allFeatures.map((feature) => {
      const existing = features.find((f) => f.featureName === feature);
      return {
        featureName: feature,
        isEnabled: existing?.isEnabled || false,
      };
    });
  }

  async updateMemberFeatures(
    requesterId: string,
    memberId: string,
    dto: UpdateFeaturesDto,
  ): Promise<void> {
    await this.validateAccessToMember(requesterId, memberId);

    for (const feature of dto.features) {
      let existing = await this.featureAccessRepository.findOne({
        where: { userId: memberId, featureName: feature.featureName },
      });

      if (existing) {
        existing.isEnabled = feature.isEnabled;
        existing.grantedBy = requesterId;
        await this.featureAccessRepository.save(existing);
      } else {
        const newFeature = this.featureAccessRepository.create({
          userId: memberId,
          featureName: feature.featureName,
          isEnabled: feature.isEnabled,
          grantedBy: requesterId,
        });
        await this.featureAccessRepository.save(newFeature);
      }
    }
  }

  async getMemberActions(
    requesterId: string,
    memberId: string,
  ): Promise<{ actionName: string; isEnabled: boolean }[]> {
    await this.validateAccessToMember(requesterId, memberId);

    const actions = await this.actionPermissionRepository.find({
      where: { userId: memberId },
    });

    const allActions = Object.values(ActionName);
    return allActions.map((action) => {
      const existing = actions.find((a) => a.actionName === action);
      return {
        actionName: action,
        isEnabled: existing?.isEnabled || false,
      };
    });
  }

  async updateMemberActions(
    requesterId: string,
    memberId: string,
    dto: UpdateActionsDto,
  ): Promise<void> {
    await this.validateAccessToMember(requesterId, memberId);

    for (const action of dto.actions) {
      let existing = await this.actionPermissionRepository.findOne({
        where: { userId: memberId, actionName: action.actionName },
      });

      if (existing) {
        existing.isEnabled = action.isEnabled;
        existing.grantedBy = requesterId;
        await this.actionPermissionRepository.save(existing);
      } else {
        const newAction = this.actionPermissionRepository.create({
          userId: memberId,
          actionName: action.actionName,
          isEnabled: action.isEnabled,
          grantedBy: requesterId,
        });
        await this.actionPermissionRepository.save(newAction);
      }
    }
  }

  async allocateCreditsToMember(
    allocatorId: string,
    memberId: string,
    dto: AllocateTeamCreditsDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.validateAccessToMember(allocatorId, memberId);

    const allocator = await this.userRepository.findOne({
      where: { id: allocatorId },
      relations: ['creditAccount'],
    });

    if (!allocator) {
      throw new NotFoundException('Allocator not found');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId },
      relations: ['creditAccount'],
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (!member.creditAccount) {
      throw new NotFoundException('Member credit account not found');
    }

    // If Admin, validate and deduct from their balance
    if (allocator.role === UserRole.ADMIN) {
      if (!allocator.creditAccount) {
        throw new NotFoundException('Allocator credit account not found');
      }

      const allocatorBalance = Number(allocator.creditAccount.unifiedBalance || 0);
      if (allocatorBalance < dto.amount) {
        throw new BadRequestException(
          `Insufficient credits. You have ${allocatorBalance}, trying to allocate ${dto.amount}`,
        );
      }

      // Deduct from allocator
      allocator.creditAccount.unifiedBalance = allocatorBalance - dto.amount;
      await this.creditAccountRepository.save(allocator.creditAccount);

      // Record transfer out
      const transferOut = this.transactionRepository.create({
        accountId: allocator.creditAccount.id,
        transactionType: TransactionType.TRANSFER_OUT,
        amount: dto.amount,
        moduleType: dto.moduleType || ModuleType.UNIFIED_BALANCE,
        actionType: ActionType.MANUAL_ALLOCATION,
        sourceUserId: allocatorId,
        comment: `Transferred to ${member.name}`,
        balanceBefore: allocatorBalance,
        balanceAfter: allocatorBalance - dto.amount,
      });
      await this.transactionRepository.save(transferOut);
    }

    // Add to member's balance
    const memberBalanceBefore = Number(member.creditAccount.unifiedBalance);
    member.creditAccount.unifiedBalance = memberBalanceBefore + dto.amount;
    await this.creditAccountRepository.save(member.creditAccount);

    // Record credit transaction
    const transaction = this.transactionRepository.create({
      accountId: member.creditAccount.id,
      transactionType: TransactionType.CREDIT,
      amount: dto.amount,
      moduleType: dto.moduleType || ModuleType.UNIFIED_BALANCE,
      actionType: ActionType.MANUAL_ALLOCATION,
      sourceUserId: allocatorId,
      comment: dto.comment || `Allocated by ${allocator.name}`,
      balanceBefore: memberBalanceBefore,
      balanceAfter: memberBalanceBefore + dto.amount,
    });
    await this.transactionRepository.save(transaction);

    return {
      success: true,
      message: `${dto.amount} credits allocated to ${member.name}`,
    };
  }

  async impersonateUser(
    impersonatorId: string,
    targetUserId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<ImpersonationResponseDto> {
    await this.validateImpersonationPermission(impersonatorId, targetUserId);

    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // Generate impersonation token
    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      impersonator: impersonatorId,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.accessExpiration'),
    });

    // Log impersonation
    const sessionTokenHash = crypto
      .createHash('sha256')
      .update(accessToken)
      .digest('hex');

    const log = this.impersonationLogRepository.create({
      impersonatorId,
      targetUserId,
      sessionTokenHash,
      ipAddress,
      userAgent,
      isActive: true,
    });
    await this.impersonationLogRepository.save(log);

    return {
      accessToken,
      impersonationId: log.id,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    };
  }

  async exitImpersonation(impersonationId: string): Promise<void> {
    await this.impersonationLogRepository.update(
      { id: impersonationId },
      { isActive: false, endedAt: new Date() },
    );
  }

  async getCreditUsageLogs(
    requesterId: string,
    query: CreditLogQueryDto,
  ): Promise<{ data: CreditUsageLogDto[]; total: number }> {
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    // Get users based on role
    let userIds: string[] = [];

    if (requester.role === UserRole.SUPER_ADMIN) {
      const users = await this.userRepository.find({
        where: { role: In([UserRole.ADMIN, UserRole.SUB_USER]) },
        select: ['id'],
      });
      userIds = users.map((u) => u.id);
    } else if (requester.role === UserRole.ADMIN) {
      const subUsers = await this.userRepository.find({
        where: { parentId: requesterId },
        select: ['id'],
      });
      userIds = subUsers.map((u) => u.id);
    }

    if (userIds.length === 0) {
      return { data: [], total: 0 };
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    // Get users with their credit info
    const usersWithCredits = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.creditAccount', 'creditAccount')
      .where('user.id IN (:...userIds)', { userIds })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data: CreditUsageLogDto[] = [];

    for (const user of usersWithCredits) {
      // Get transaction summaries
      const creditSum = await this.transactionRepository
        .createQueryBuilder('txn')
        .select('SUM(txn.amount)', 'total')
        .where('txn.account_id = :accountId', {
          accountId: user.creditAccount?.id,
        })
        .andWhere('txn.transaction_type = :type', { type: TransactionType.CREDIT })
        .getRawOne();

      const debitSum = await this.transactionRepository
        .createQueryBuilder('txn')
        .select('SUM(txn.amount)', 'total')
        .where('txn.account_id = :accountId', {
          accountId: user.creditAccount?.id,
        })
        .andWhere('txn.transaction_type = :type', { type: TransactionType.DEBIT })
        .getRawOne();

      const profile = await this.profileRepository.findOne({
        where: { userId: user.id },
      });

      const discoveryCreditsUsed = await this.sumDebitByModuleAndActions(
        user.creditAccount?.id,
        ModuleType.DISCOVERY,
        [
          ActionType.INFLUENCER_SEARCH,
          ActionType.INFLUENCER_UNBLUR,
          ActionType.INFLUENCER_EXPORT,
        ],
      );
      const insightsCreditsUsed = await this.sumDebitByModuleAndActions(
        user.creditAccount?.id,
        ModuleType.INSIGHTS,
        [
          ActionType.INFLUENCER_INSIGHT,
          ActionType.INSIGHT_UNLOCK,
          ActionType.INSIGHT_REFRESH,
        ],
      );

      data.push({
        userId: user.id,
        userName: user.name,
        email: user.email,
        country: profile?.country || '',
        currentBalance: Number(user.creditAccount?.unifiedBalance || 0),
        totalCreditsAdded: Number(creditSum?.total || 0),
        totalCreditsUsed: Number(debitSum?.total || 0),
        discoveryCreditsUsed,
        insightsCreditsUsed,
        lastActiveAt: user.updatedAt,
      });
    }

    return { data, total: userIds.length };
  }

  async getUserCreditDetails(
    requesterId: string,
    userId: string,
    query: CreditDetailQueryDto,
  ): Promise<{
    user: any;
    transactions: CreditUsageDetailDto[];
    total: number;
  }> {
    await this.validateAccessToMember(requesterId, userId);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['creditAccount'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.profileRepository.findOne({
      where: { userId },
    });

    // Build query for transactions
    const qb = this.transactionRepository
      .createQueryBuilder('txn')
      .where('txn.account_id = :accountId', {
        accountId: user.creditAccount?.id,
      });

    if (query.transactionType && query.transactionType !== 'ALL') {
      qb.andWhere('txn.transaction_type = :type', {
        type: query.transactionType,
      });
    }

    if (query.moduleType) {
      qb.andWhere('txn.module_type = :module', { module: query.moduleType });
    }

    const page = query.page || 1;
    const limit = query.limit || 20;

    qb.orderBy('txn.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [transactions, total] = await qb.getManyAndCount();

    // Get total credits added
    const creditSum = await this.transactionRepository
      .createQueryBuilder('txn')
      .select('SUM(txn.amount)', 'total')
      .where('txn.account_id = :accountId', {
        accountId: user.creditAccount?.id,
      })
      .andWhere('txn.transaction_type = :type', { type: TransactionType.CREDIT })
      .getRawOne();

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        country: profile?.country,
        currentBalance: Number(user.creditAccount?.unifiedBalance || 0),
        totalCreditsAdded: Number(creditSum?.total || 0),
      },
      transactions: transactions.map((txn) => ({
        month: txn.createdAt.toISOString().slice(0, 7),
        moduleType: txn.moduleType,
        transactionType: txn.transactionType,
        amount: Number(txn.amount),
        comment: txn.comment,
        createdAt: txn.createdAt,
      })),
      total,
    };
  }

  /**
   * Sums DEBIT amounts for credit_transactions on an account where module matches
   * the discovery/insights module enum, or (for legacy rows) module is UNIFIED_BALANCE
   * and action_type is in the given set — matching usage in credit analytics.
   */
  private async sumDebitByModuleAndActions(
    accountId: string | undefined,
    module: ModuleType,
    unifiedBalanceActions: ActionType[],
  ): Promise<number> {
    if (!accountId) return 0;

    const qb = this.transactionRepository
      .createQueryBuilder('txn')
      .select('COALESCE(SUM(txn.amount), 0)', 'total')
      .where('txn.account_id = :accountId', { accountId })
      .andWhere('txn.transaction_type = :tt', { tt: TransactionType.DEBIT })
      .andWhere(
        '(txn.module_type = :module OR (txn.module_type = :unified AND txn.action_type IN (:...actions)))',
        {
          module,
          unified: ModuleType.UNIFIED_BALANCE,
          actions: unifiedBalanceActions,
        },
      );

    const raw = await qb.getRawOne();
    return Number(raw?.total || 0);
  }

  // Helper methods
  private async validateAccessToMember(
    requesterId: string,
    memberId: string,
  ): Promise<void> {
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }

    if (requester.role === UserRole.SUPER_ADMIN) {
      return; // Super Admin can access anyone
    }

    if (requester.role === UserRole.ADMIN) {
      const member = await this.userRepository.findOne({
        where: { id: memberId },
      });

      if (!member || member.parentId !== requesterId) {
        throw new ForbiddenException('Access denied to this team member');
      }
      return;
    }

    throw new ForbiddenException('Sub-users cannot access team management');
  }

  private async validateImpersonationPermission(
    impersonatorId: string,
    targetUserId: string,
  ): Promise<void> {
    const impersonator = await this.userRepository.findOne({
      where: { id: impersonatorId },
    });

    const target = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!impersonator || !target) {
      throw new NotFoundException('User not found');
    }

    if (impersonator.role === UserRole.SUPER_ADMIN) {
      // Super Admin can impersonate anyone except other Super Admins
      if (target.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Cannot impersonate another Super Admin');
      }
      return;
    }

    if (impersonator.role === UserRole.ADMIN) {
      // Admin can only impersonate their Sub-users
      if (target.parentId !== impersonatorId) {
        throw new ForbiddenException('Can only impersonate your own sub-users');
      }
      return;
    }

    throw new ForbiddenException('Sub-users cannot impersonate other users');
  }

  private async mapToTeamMemberResponse(
    user: User,
  ): Promise<TeamMemberResponseDto> {
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    const features = await this.featureAccessRepository.find({
      where: { userId: user.id, isEnabled: true },
    });

    const actions = await this.actionPermissionRepository.find({
      where: { userId: user.id, isEnabled: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      country: profile?.country || '',
      role: user.role,
      internalRoleType: profile?.internalRoleType || '',
      status: user.status,
      creditBalance: Number(user.creditAccount?.unifiedBalance || 0),
      validityStart: profile?.validityStart || null,
      validityEnd: profile?.validityEnd || null,
      daysUntilExpiry: profile?.daysUntilExpiry() || 0,
      lastActiveAt: user.updatedAt,
      createdAt: user.createdAt,
      enabledFeatures: features.map((f) => f.featureName),
      enabledActions: actions.map((a) => a.actionName),
    };
  }
}
