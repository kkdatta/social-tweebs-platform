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
exports.TeamService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const user_entity_1 = require("../users/entities/user.entity");
const user_preferences_entity_1 = require("../users/entities/user-preferences.entity");
const credit_account_entity_1 = require("../credits/entities/credit-account.entity");
const credit_transaction_entity_1 = require("../credits/entities/credit-transaction.entity");
const entities_1 = require("./entities");
const enums_1 = require("../../common/enums");
let TeamService = class TeamService {
    constructor(userRepository, profileRepository, featureAccessRepository, actionPermissionRepository, impersonationLogRepository, creditAccountRepository, transactionRepository, preferencesRepository, dataSource, jwtService, configService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.featureAccessRepository = featureAccessRepository;
        this.actionPermissionRepository = actionPermissionRepository;
        this.impersonationLogRepository = impersonationLogRepository;
        this.creditAccountRepository = creditAccountRepository;
        this.transactionRepository = transactionRepository;
        this.preferencesRepository = preferencesRepository;
        this.dataSource = dataSource;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async getTeamMembers(requesterId, query) {
        const requester = await this.userRepository.findOne({
            where: { id: requesterId },
        });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        const whereClause = {};
        if (requester.role === enums_1.UserRole.SUPER_ADMIN) {
            whereClause.role = (0, typeorm_2.In)([enums_1.UserRole.ADMIN, enums_1.UserRole.SUB_USER]);
        }
        else if (requester.role === enums_1.UserRole.ADMIN) {
            whereClause.parentId = requesterId;
        }
        else {
            throw new common_1.ForbiddenException('Sub-users cannot view team members');
        }
        if (query.status) {
            whereClause.status = query.status;
        }
        if (query.search) {
            whereClause.name = (0, typeorm_2.ILike)(`%${query.search}%`);
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
        const data = await Promise.all(users.map((user) => this.mapToTeamMemberResponse(user)));
        return { data, total };
    }
    async getTeamMemberById(requesterId, memberId) {
        await this.validateAccessToMember(requesterId, memberId);
        const user = await this.userRepository.findOne({
            where: { id: memberId },
            relations: ['creditAccount'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Team member not found');
        }
        return this.mapToTeamMemberResponse(user);
    }
    async createTeamMember(creatorId, dto) {
        const creator = await this.userRepository.findOne({
            where: { id: creatorId },
            relations: ['creditAccount'],
        });
        if (!creator) {
            throw new common_1.NotFoundException('Creator not found');
        }
        if (creator.role === enums_1.UserRole.SUB_USER) {
            throw new common_1.ForbiddenException('Sub-users cannot create team members');
        }
        if (creator.role === enums_1.UserRole.ADMIN &&
            dto.roleType === enums_1.InternalRoleType.CLIENT) {
            throw new common_1.ForbiddenException('Admins cannot create other Admin users');
        }
        const existingUser = await this.userRepository.findOne({
            where: { email: dto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists');
        }
        if (creator.role === enums_1.UserRole.ADMIN && dto.initialCredits) {
            const creatorBalance = Number(creator.creditAccount?.unifiedBalance || 0);
            if (creatorBalance < dto.initialCredits) {
                throw new common_1.BadRequestException(`Insufficient credits. You have ${creatorBalance}, trying to allocate ${dto.initialCredits}`);
            }
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const userRole = dto.roleType === enums_1.InternalRoleType.CLIENT
                ? enums_1.UserRole.ADMIN
                : enums_1.UserRole.SUB_USER;
            const passwordHash = await bcrypt.hash(dto.password, 12);
            const user = queryRunner.manager.create(user_entity_1.User, {
                email: dto.email,
                passwordHash,
                name: dto.name,
                phone: dto.phone,
                role: userRole,
                status: enums_1.UserStatus.ACTIVE,
                parentId: userRole === enums_1.UserRole.SUB_USER ? creatorId : null,
            });
            await queryRunner.manager.save(user);
            const profile = queryRunner.manager.create(entities_1.TeamMemberProfile, {
                userId: user.id,
                internalRoleType: dto.roleType,
                country: dto.country,
                validityStart: new Date(dto.validityStart),
                validityEnd: new Date(dto.validityEnd),
                validityNotificationEnabled: dto.validityNotificationEnabled ?? true,
                createdBy: creatorId,
            });
            await queryRunner.manager.save(profile);
            const creditAccount = queryRunner.manager.create(credit_account_entity_1.CreditAccount, {
                userId: user.id,
                unifiedBalance: 0,
                validityStart: new Date(dto.validityStart),
                validityEnd: new Date(dto.validityEnd),
                isLocked: false,
            });
            await queryRunner.manager.save(creditAccount);
            const preferences = queryRunner.manager.create(user_preferences_entity_1.UserPreferences, {
                userId: user.id,
            });
            await queryRunner.manager.save(preferences);
            if (dto.enabledFeatures && dto.enabledFeatures.length > 0) {
                for (const feature of dto.enabledFeatures) {
                    const featureAccess = queryRunner.manager.create(entities_1.FeatureAccess, {
                        userId: user.id,
                        featureName: feature,
                        isEnabled: true,
                        grantedBy: creatorId,
                    });
                    await queryRunner.manager.save(featureAccess);
                }
            }
            if (dto.enabledActions && dto.enabledActions.length > 0) {
                for (const action of dto.enabledActions) {
                    const actionPerm = queryRunner.manager.create(entities_1.ActionPermission, {
                        userId: user.id,
                        actionName: action,
                        isEnabled: true,
                        grantedBy: creatorId,
                    });
                    await queryRunner.manager.save(actionPerm);
                }
            }
            if (dto.initialCredits && dto.initialCredits > 0) {
                if (creator.role === enums_1.UserRole.ADMIN) {
                    creator.creditAccount.unifiedBalance =
                        Number(creator.creditAccount.unifiedBalance) - dto.initialCredits;
                    await queryRunner.manager.save(creator.creditAccount);
                    const transferOut = queryRunner.manager.create(credit_transaction_entity_1.CreditTransaction, {
                        accountId: creator.creditAccount.id,
                        transactionType: enums_1.TransactionType.TRANSFER_OUT,
                        amount: dto.initialCredits,
                        moduleType: enums_1.ModuleType.UNIFIED_BALANCE,
                        actionType: enums_1.ActionType.MANUAL_ALLOCATION,
                        sourceUserId: creatorId,
                        comment: `Transferred to ${user.name}`,
                        balanceBefore: Number(creator.creditAccount.unifiedBalance) + dto.initialCredits,
                        balanceAfter: Number(creator.creditAccount.unifiedBalance),
                    });
                    await queryRunner.manager.save(transferOut);
                }
                creditAccount.unifiedBalance = dto.initialCredits;
                await queryRunner.manager.save(creditAccount);
                const transaction = queryRunner.manager.create(credit_transaction_entity_1.CreditTransaction, {
                    accountId: creditAccount.id,
                    transactionType: enums_1.TransactionType.CREDIT,
                    amount: dto.initialCredits,
                    moduleType: enums_1.ModuleType.UNIFIED_BALANCE,
                    actionType: enums_1.ActionType.MANUAL_ALLOCATION,
                    sourceUserId: creatorId,
                    comment: dto.creditComment || 'Initial credit allocation',
                    balanceBefore: 0,
                    balanceAfter: dto.initialCredits,
                });
                await queryRunner.manager.save(transaction);
            }
            await queryRunner.commitTransaction();
            return this.getTeamMemberById(creatorId, user.id);
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateTeamMember(requesterId, memberId, dto) {
        await this.validateAccessToMember(requesterId, memberId);
        const user = await this.userRepository.findOne({
            where: { id: memberId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Team member not found');
        }
        const profile = await this.profileRepository.findOne({
            where: { userId: memberId },
        });
        if (dto.name)
            user.name = dto.name;
        if (dto.phone)
            user.phone = dto.phone;
        if (dto.status)
            user.status = dto.status;
        await this.userRepository.save(user);
        if (profile) {
            if (dto.country)
                profile.country = dto.country;
            if (dto.roleType)
                profile.internalRoleType = dto.roleType;
            if (dto.validityStart)
                profile.validityStart = new Date(dto.validityStart);
            if (dto.validityEnd)
                profile.validityEnd = new Date(dto.validityEnd);
            if (dto.validityNotificationEnabled !== undefined) {
                profile.validityNotificationEnabled = dto.validityNotificationEnabled;
            }
            await this.profileRepository.save(profile);
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
    async deleteTeamMember(requesterId, memberId) {
        await this.validateAccessToMember(requesterId, memberId);
        const user = await this.userRepository.findOne({
            where: { id: memberId },
            relations: ['creditAccount'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Team member not found');
        }
        const requester = await this.userRepository.findOne({
            where: { id: requesterId },
            relations: ['creditAccount'],
        });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        if (requester.role === enums_1.UserRole.ADMIN && user.creditAccount && requester.creditAccount) {
            const remainingBalance = Number(user.creditAccount.unifiedBalance);
            if (remainingBalance > 0) {
                requester.creditAccount.unifiedBalance =
                    Number(requester.creditAccount.unifiedBalance) + remainingBalance;
                await this.creditAccountRepository.save(requester.creditAccount);
                user.creditAccount.unifiedBalance = 0;
                await this.creditAccountRepository.save(user.creditAccount);
            }
        }
        user.status = enums_1.UserStatus.SUSPENDED;
        await this.userRepository.save(user);
        await this.userRepository.update({ parentId: memberId }, { status: enums_1.UserStatus.SUSPENDED });
    }
    async getMemberFeatures(requesterId, memberId) {
        await this.validateAccessToMember(requesterId, memberId);
        const features = await this.featureAccessRepository.find({
            where: { userId: memberId },
        });
        const allFeatures = Object.values(enums_1.FeatureName);
        return allFeatures.map((feature) => {
            const existing = features.find((f) => f.featureName === feature);
            return {
                featureName: feature,
                isEnabled: existing?.isEnabled || false,
            };
        });
    }
    async updateMemberFeatures(requesterId, memberId, dto) {
        await this.validateAccessToMember(requesterId, memberId);
        for (const feature of dto.features) {
            let existing = await this.featureAccessRepository.findOne({
                where: { userId: memberId, featureName: feature.featureName },
            });
            if (existing) {
                existing.isEnabled = feature.isEnabled;
                existing.grantedBy = requesterId;
                await this.featureAccessRepository.save(existing);
            }
            else {
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
    async getMemberActions(requesterId, memberId) {
        await this.validateAccessToMember(requesterId, memberId);
        const actions = await this.actionPermissionRepository.find({
            where: { userId: memberId },
        });
        const allActions = Object.values(enums_1.ActionName);
        return allActions.map((action) => {
            const existing = actions.find((a) => a.actionName === action);
            return {
                actionName: action,
                isEnabled: existing?.isEnabled || false,
            };
        });
    }
    async updateMemberActions(requesterId, memberId, dto) {
        await this.validateAccessToMember(requesterId, memberId);
        for (const action of dto.actions) {
            let existing = await this.actionPermissionRepository.findOne({
                where: { userId: memberId, actionName: action.actionName },
            });
            if (existing) {
                existing.isEnabled = action.isEnabled;
                existing.grantedBy = requesterId;
                await this.actionPermissionRepository.save(existing);
            }
            else {
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
    async allocateCreditsToMember(allocatorId, memberId, dto) {
        await this.validateAccessToMember(allocatorId, memberId);
        const allocator = await this.userRepository.findOne({
            where: { id: allocatorId },
            relations: ['creditAccount'],
        });
        if (!allocator) {
            throw new common_1.NotFoundException('Allocator not found');
        }
        const member = await this.userRepository.findOne({
            where: { id: memberId },
            relations: ['creditAccount'],
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (!member.creditAccount) {
            throw new common_1.NotFoundException('Member credit account not found');
        }
        if (allocator.role === enums_1.UserRole.ADMIN) {
            if (!allocator.creditAccount) {
                throw new common_1.NotFoundException('Allocator credit account not found');
            }
            const allocatorBalance = Number(allocator.creditAccount.unifiedBalance || 0);
            if (allocatorBalance < dto.amount) {
                throw new common_1.BadRequestException(`Insufficient credits. You have ${allocatorBalance}, trying to allocate ${dto.amount}`);
            }
            allocator.creditAccount.unifiedBalance = allocatorBalance - dto.amount;
            await this.creditAccountRepository.save(allocator.creditAccount);
            const transferOut = this.transactionRepository.create({
                accountId: allocator.creditAccount.id,
                transactionType: enums_1.TransactionType.TRANSFER_OUT,
                amount: dto.amount,
                moduleType: dto.moduleType || enums_1.ModuleType.UNIFIED_BALANCE,
                actionType: enums_1.ActionType.MANUAL_ALLOCATION,
                sourceUserId: allocatorId,
                comment: `Transferred to ${member.name}`,
                balanceBefore: allocatorBalance,
                balanceAfter: allocatorBalance - dto.amount,
            });
            await this.transactionRepository.save(transferOut);
        }
        const memberBalanceBefore = Number(member.creditAccount.unifiedBalance);
        member.creditAccount.unifiedBalance = memberBalanceBefore + dto.amount;
        await this.creditAccountRepository.save(member.creditAccount);
        const transaction = this.transactionRepository.create({
            accountId: member.creditAccount.id,
            transactionType: enums_1.TransactionType.CREDIT,
            amount: dto.amount,
            moduleType: dto.moduleType || enums_1.ModuleType.UNIFIED_BALANCE,
            actionType: enums_1.ActionType.MANUAL_ALLOCATION,
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
    async impersonateUser(impersonatorId, targetUserId, ipAddress, userAgent) {
        await this.validateImpersonationPermission(impersonatorId, targetUserId);
        const targetUser = await this.userRepository.findOne({
            where: { id: targetUserId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('Target user not found');
        }
        const payload = {
            sub: targetUser.id,
            email: targetUser.email,
            role: targetUser.role,
            impersonator: impersonatorId,
        };
        const accessToken = this.jwtService.sign(payload, {
            expiresIn: this.configService.get('jwt.accessExpiration'),
        });
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
    async exitImpersonation(impersonationId) {
        await this.impersonationLogRepository.update({ id: impersonationId }, { isActive: false, endedAt: new Date() });
    }
    async getCreditUsageLogs(requesterId, query) {
        const requester = await this.userRepository.findOne({
            where: { id: requesterId },
        });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        let userIds = [];
        if (requester.role === enums_1.UserRole.SUPER_ADMIN) {
            const users = await this.userRepository.find({
                where: { role: (0, typeorm_2.In)([enums_1.UserRole.ADMIN, enums_1.UserRole.SUB_USER]) },
                select: ['id'],
            });
            userIds = users.map((u) => u.id);
        }
        else if (requester.role === enums_1.UserRole.ADMIN) {
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
        const usersWithCredits = await this.userRepository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.creditAccount', 'creditAccount')
            .leftJoin('zorbitads.team_member_profiles', 'profile', 'profile.user_id = user.id')
            .where('user.id IN (:...userIds)', { userIds })
            .orderBy('user.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        const data = [];
        for (const user of usersWithCredits) {
            const creditSum = await this.transactionRepository
                .createQueryBuilder('txn')
                .select('SUM(txn.amount)', 'total')
                .where('txn.account_id = :accountId', {
                accountId: user.creditAccount?.id,
            })
                .andWhere('txn.transaction_type = :type', { type: enums_1.TransactionType.CREDIT })
                .getRawOne();
            const debitSum = await this.transactionRepository
                .createQueryBuilder('txn')
                .select('SUM(txn.amount)', 'total')
                .where('txn.account_id = :accountId', {
                accountId: user.creditAccount?.id,
            })
                .andWhere('txn.transaction_type = :type', { type: enums_1.TransactionType.DEBIT })
                .getRawOne();
            const profile = await this.profileRepository.findOne({
                where: { userId: user.id },
            });
            data.push({
                userId: user.id,
                userName: user.name,
                email: user.email,
                country: profile?.country || '',
                currentBalance: Number(user.creditAccount?.unifiedBalance || 0),
                totalCreditsAdded: Number(creditSum?.total || 0),
                totalCreditsUsed: Number(debitSum?.total || 0),
                discoveryCreditsUsed: 0,
                insightsCreditsUsed: 0,
                lastActiveAt: user.updatedAt,
            });
        }
        return { data, total: userIds.length };
    }
    async getUserCreditDetails(requesterId, userId, query) {
        await this.validateAccessToMember(requesterId, userId);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['creditAccount'],
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const profile = await this.profileRepository.findOne({
            where: { userId },
        });
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
        const creditSum = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('SUM(txn.amount)', 'total')
            .where('txn.account_id = :accountId', {
            accountId: user.creditAccount?.id,
        })
            .andWhere('txn.transaction_type = :type', { type: enums_1.TransactionType.CREDIT })
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
    async validateAccessToMember(requesterId, memberId) {
        const requester = await this.userRepository.findOne({
            where: { id: requesterId },
        });
        if (!requester) {
            throw new common_1.NotFoundException('Requester not found');
        }
        if (requester.role === enums_1.UserRole.SUPER_ADMIN) {
            return;
        }
        if (requester.role === enums_1.UserRole.ADMIN) {
            const member = await this.userRepository.findOne({
                where: { id: memberId },
            });
            if (!member || member.parentId !== requesterId) {
                throw new common_1.ForbiddenException('Access denied to this team member');
            }
            return;
        }
        throw new common_1.ForbiddenException('Sub-users cannot access team management');
    }
    async validateImpersonationPermission(impersonatorId, targetUserId) {
        const impersonator = await this.userRepository.findOne({
            where: { id: impersonatorId },
        });
        const target = await this.userRepository.findOne({
            where: { id: targetUserId },
        });
        if (!impersonator || !target) {
            throw new common_1.NotFoundException('User not found');
        }
        if (impersonator.role === enums_1.UserRole.SUPER_ADMIN) {
            if (target.role === enums_1.UserRole.SUPER_ADMIN) {
                throw new common_1.ForbiddenException('Cannot impersonate another Super Admin');
            }
            return;
        }
        if (impersonator.role === enums_1.UserRole.ADMIN) {
            if (target.parentId !== impersonatorId) {
                throw new common_1.ForbiddenException('Can only impersonate your own sub-users');
            }
            return;
        }
        throw new common_1.ForbiddenException('Sub-users cannot impersonate other users');
    }
    async mapToTeamMemberResponse(user) {
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
};
exports.TeamService = TeamService;
exports.TeamService = TeamService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.TeamMemberProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.FeatureAccess)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.ActionPermission)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.ImpersonationLog)),
    __param(5, (0, typeorm_1.InjectRepository)(credit_account_entity_1.CreditAccount)),
    __param(6, (0, typeorm_1.InjectRepository)(credit_transaction_entity_1.CreditTransaction)),
    __param(7, (0, typeorm_1.InjectRepository)(user_preferences_entity_1.UserPreferences)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        jwt_1.JwtService,
        config_1.ConfigService])
], TeamService);
//# sourceMappingURL=team.service.js.map