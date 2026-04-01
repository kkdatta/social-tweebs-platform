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
var InfluencerGroupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfluencerGroupService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const influencer_group_entity_1 = require("./entities/influencer-group.entity");
const user_entity_1 = require("../users/entities/user.entity");
let InfluencerGroupService = InfluencerGroupService_1 = class InfluencerGroupService {
    constructor(groupRepo, memberRepo, shareRepo, invitationRepo, applicationRepo, userRepo, dataSource) {
        this.groupRepo = groupRepo;
        this.memberRepo = memberRepo;
        this.shareRepo = shareRepo;
        this.invitationRepo = invitationRepo;
        this.applicationRepo = applicationRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(InfluencerGroupService_1.name);
    }
    async createGroup(userId, dto) {
        const group = new influencer_group_entity_1.InfluencerGroup();
        group.name = dto.name;
        group.description = dto.description;
        group.platforms = dto.platforms;
        group.ownerId = userId;
        group.createdById = userId;
        group.influencerCount = 0;
        group.unapprovedCount = 0;
        const saved = await this.groupRepo.save(group);
        this.logger.log(`Group created: ${saved.id} by user ${userId}`);
        return saved;
    }
    async getGroups(userId, filters) {
        const { tab, platforms, search, page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const queryBuilder = this.groupRepo.createQueryBuilder('group')
            .leftJoinAndSelect('group.owner', 'owner');
        if (tab === 'created_by_me') {
            queryBuilder.where('group.createdById = :userId', { userId });
        }
        else if (tab === 'created_by_team') {
            const teamUserIds = await this.getTeamUserIds(userId, user);
            queryBuilder.where('group.createdById IN (:...teamUserIds)', { teamUserIds })
                .andWhere('group.createdById != :userId', { userId });
        }
        else if (tab === 'shared_with_me') {
            queryBuilder.innerJoin('group.shares', 'share', 'share.sharedWithUserId = :userId', { userId });
        }
        else {
            const accessibleIds = await this.getAccessibleGroupIds(userId, user);
            if (accessibleIds.length > 0) {
                queryBuilder.where('group.id IN (:...accessibleIds)', { accessibleIds });
            }
            else {
                queryBuilder.where('group.ownerId = :userId', { userId });
            }
        }
        if (platforms && platforms.length > 0) {
            queryBuilder.andWhere('group.platforms && :platforms', { platforms });
        }
        if (search) {
            queryBuilder.andWhere('(group.name ILIKE :search OR group.description ILIKE :search)', {
                search: `%${search}%`,
            });
        }
        const sortField = ['createdAt', 'name', 'influencerCount'].includes(sortBy)
            ? `group.${sortBy}`
            : 'group.createdAt';
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase());
        const total = await queryBuilder.getCount();
        queryBuilder.skip(page * limit).take(limit);
        const groups = await queryBuilder.getMany();
        const groupSummaries = groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            platforms: group.platforms,
            influencerCount: group.influencerCount,
            unapprovedCount: group.unapprovedCount,
            ownerName: group.owner?.name,
            createdAt: group.createdAt,
        }));
        return {
            groups: groupSummaries,
            total,
            page,
            limit,
            hasMore: (page + 1) * limit < total,
        };
    }
    async getGroupById(userId, groupId) {
        const group = await this.groupRepo.findOne({
            where: { id: groupId },
            relations: ['owner', 'shares', 'shares.sharedWithUser', 'invitations'],
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        await this.checkGroupAccess(userId, group);
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            platforms: group.platforms,
            influencerCount: group.influencerCount,
            unapprovedCount: group.unapprovedCount,
            ownerName: group.owner?.name,
            ownerId: group.ownerId,
            createdById: group.createdById,
            isPublic: group.isPublic,
            shareUrlToken: group.shareUrlToken,
            createdAt: group.createdAt,
            shares: group.shares?.map((share) => ({
                id: share.id,
                sharedWithUserId: share.sharedWithUserId,
                sharedWithUserName: share.sharedWithUser?.name,
                sharedWithUserEmail: share.sharedWithUser?.email,
                permissionLevel: share.permissionLevel,
                sharedAt: share.sharedAt,
            })),
            invitations: group.invitations?.map((inv) => ({
                id: inv.id,
                invitationName: inv.invitationName,
                invitationType: inv.invitationType,
                urlSlug: inv.urlSlug,
                isActive: inv.isActive,
                applicationsCount: inv.applicationsCount,
                createdAt: inv.createdAt,
            })),
        };
    }
    async updateGroup(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        Object.assign(group, dto);
        const updated = await this.groupRepo.save(group);
        this.logger.log(`Group updated: ${groupId}`);
        return updated;
    }
    async deleteGroup(userId, groupId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'admin');
        await this.groupRepo.remove(group);
        this.logger.log(`Group deleted: ${groupId}`);
    }
    async addInfluencer(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        if (!group.platforms.includes(dto.platform)) {
            throw new common_1.BadRequestException(`Platform ${dto.platform} is not allowed in this group`);
        }
        const existing = await this.memberRepo.findOne({
            where: {
                groupId,
                platform: dto.platform,
                influencerUsername: dto.influencerUsername,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Influencer already exists in this group');
        }
        const member = this.memberRepo.create({
            ...dto,
            groupId,
            addedById: userId,
            source: 'MANUAL',
        });
        const saved = await this.memberRepo.save(member);
        await this.updateGroupInfluencerCount(groupId);
        this.logger.log(`Influencer added to group ${groupId}: ${saved.id}`);
        return saved;
    }
    async bulkAddInfluencers(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        let added = 0;
        let skipped = 0;
        for (const influencer of dto.influencers) {
            try {
                if (!group.platforms.includes(influencer.platform)) {
                    skipped++;
                    continue;
                }
                const existing = await this.memberRepo.findOne({
                    where: {
                        groupId,
                        platform: influencer.platform,
                        influencerUsername: influencer.influencerUsername,
                    },
                });
                if (existing) {
                    skipped++;
                    continue;
                }
                const member = this.memberRepo.create({
                    ...influencer,
                    groupId,
                    addedById: userId,
                    source: 'XLSX_IMPORT',
                });
                await this.memberRepo.save(member);
                added++;
            }
            catch (error) {
                skipped++;
                this.logger.warn(`Failed to add influencer: ${error.message}`);
            }
        }
        await this.updateGroupInfluencerCount(groupId);
        this.logger.log(`Bulk add to group ${groupId}: ${added} added, ${skipped} skipped`);
        return { added, skipped };
    }
    async importFromGroup(userId, targetGroupId, dto) {
        const targetGroup = await this.groupRepo.findOne({ where: { id: targetGroupId } });
        if (!targetGroup)
            throw new common_1.NotFoundException('Target group not found');
        await this.checkGroupAccess(userId, targetGroup, 'edit');
        const sourceGroup = await this.groupRepo.findOne({ where: { id: dto.sourceGroupId } });
        if (!sourceGroup)
            throw new common_1.NotFoundException('Source group not found');
        await this.checkGroupAccess(userId, sourceGroup, 'view');
        let sourceMembers;
        if (dto.influencerIds && dto.influencerIds.length > 0) {
            sourceMembers = await this.memberRepo.find({
                where: { groupId: dto.sourceGroupId, id: (0, typeorm_2.In)(dto.influencerIds) },
            });
        }
        else {
            sourceMembers = await this.memberRepo.find({
                where: { groupId: dto.sourceGroupId },
            });
        }
        let imported = 0;
        let skipped = 0;
        for (const sourceMember of sourceMembers) {
            if (!targetGroup.platforms.includes(sourceMember.platform)) {
                skipped++;
                continue;
            }
            const existing = await this.memberRepo.findOne({
                where: {
                    groupId: targetGroupId,
                    platform: sourceMember.platform,
                    influencerUsername: sourceMember.influencerUsername,
                },
            });
            if (existing) {
                skipped++;
                continue;
            }
            const newMember = this.memberRepo.create({
                groupId: targetGroupId,
                influencerProfileId: sourceMember.influencerProfileId,
                platformUserId: sourceMember.platformUserId,
                influencerName: sourceMember.influencerName,
                influencerUsername: sourceMember.influencerUsername,
                platform: sourceMember.platform,
                profilePictureUrl: sourceMember.profilePictureUrl,
                followerCount: sourceMember.followerCount,
                audienceCredibility: sourceMember.audienceCredibility,
                engagementRate: sourceMember.engagementRate,
                avgLikes: sourceMember.avgLikes,
                avgViews: sourceMember.avgViews,
                addedById: userId,
                source: 'GROUP_IMPORT',
                sourceGroupId: dto.sourceGroupId,
            });
            await this.memberRepo.save(newMember);
            imported++;
        }
        await this.updateGroupInfluencerCount(targetGroupId);
        this.logger.log(`Import to group ${targetGroupId} from ${dto.sourceGroupId}: ${imported} imported, ${skipped} skipped`);
        return { imported, skipped };
    }
    async copyInfluencers(userId, sourceGroupId, dto) {
        const sourceGroup = await this.groupRepo.findOne({ where: { id: sourceGroupId } });
        if (!sourceGroup)
            throw new common_1.NotFoundException('Source group not found');
        await this.checkGroupAccess(userId, sourceGroup, 'view');
        const targetGroup = await this.groupRepo.findOne({ where: { id: dto.targetGroupId } });
        if (!targetGroup)
            throw new common_1.NotFoundException('Target group not found');
        await this.checkGroupAccess(userId, targetGroup, 'edit');
        const members = await this.memberRepo.find({
            where: { id: (0, typeorm_2.In)(dto.memberIds), groupId: sourceGroupId },
        });
        let copied = 0;
        let skipped = 0;
        for (const member of members) {
            if (!targetGroup.platforms.includes(member.platform)) {
                skipped++;
                continue;
            }
            const existing = await this.memberRepo.findOne({
                where: {
                    groupId: dto.targetGroupId,
                    platform: member.platform,
                    influencerUsername: member.influencerUsername,
                },
            });
            if (existing) {
                skipped++;
                continue;
            }
            const newMember = this.memberRepo.create({
                groupId: dto.targetGroupId,
                influencerProfileId: member.influencerProfileId,
                platformUserId: member.platformUserId,
                influencerName: member.influencerName,
                influencerUsername: member.influencerUsername,
                platform: member.platform,
                profilePictureUrl: member.profilePictureUrl,
                followerCount: member.followerCount,
                audienceCredibility: member.audienceCredibility,
                engagementRate: member.engagementRate,
                avgLikes: member.avgLikes,
                avgViews: member.avgViews,
                addedById: userId,
                source: 'GROUP_IMPORT',
                sourceGroupId: sourceGroupId,
            });
            await this.memberRepo.save(newMember);
            copied++;
        }
        await this.updateGroupInfluencerCount(dto.targetGroupId);
        return { copied, skipped };
    }
    async removeInfluencers(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        const membersToRemove = await this.memberRepo.find({
            where: {
                id: (0, typeorm_2.In)(dto.memberIds),
                groupId,
            },
        });
        if (membersToRemove.length === 0) {
            this.logger.warn(`No matching members found for removal in group ${groupId}. Requested IDs: ${dto.memberIds.join(', ')}`);
            return { removed: 0 };
        }
        try {
            await this.memberRepo.remove(membersToRemove);
        }
        catch (error) {
            this.logger.error(`Failed to remove members from group ${groupId}: ${error.message}`, error.stack);
            throw new common_1.BadRequestException(`Failed to remove influencer(s): ${error.message}`);
        }
        await this.updateGroupInfluencerCount(groupId);
        this.logger.log(`Removed ${membersToRemove.length} influencers from group ${groupId}`);
        return { removed: membersToRemove.length };
    }
    async getMembers(userId, groupId, filters) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group);
        const { platform, search, page = 0, limit = 20, sortBy = 'addedAt', sortOrder = 'desc' } = filters;
        const queryBuilder = this.memberRepo.createQueryBuilder('member')
            .where('member.groupId = :groupId', { groupId });
        if (platform) {
            queryBuilder.andWhere('member.platform = :platform', { platform });
        }
        if (search) {
            queryBuilder.andWhere('(member.influencerName ILIKE :search OR member.influencerUsername ILIKE :search)', { search: `%${search}%` });
        }
        const sortField = ['addedAt', 'influencerName', 'followerCount', 'audienceCredibility', 'engagementRate'].includes(sortBy)
            ? `member.${sortBy}`
            : 'member.addedAt';
        queryBuilder.orderBy(sortField, sortOrder.toUpperCase());
        const total = await queryBuilder.getCount();
        queryBuilder.skip(page * limit).take(limit);
        const members = await queryBuilder.getMany();
        const memberDtos = members.map((m) => ({
            id: m.id,
            influencerName: m.influencerName,
            influencerUsername: m.influencerUsername,
            platform: m.platform,
            profilePictureUrl: m.profilePictureUrl,
            followerCount: Number(m.followerCount),
            audienceCredibility: m.audienceCredibility ? Number(m.audienceCredibility) : undefined,
            engagementRate: m.engagementRate ? Number(m.engagementRate) : undefined,
            avgLikes: m.avgLikes ? Number(m.avgLikes) : undefined,
            avgViews: m.avgViews ? Number(m.avgViews) : undefined,
            addedAt: m.addedAt,
            source: m.source,
        }));
        return {
            members: memberDtos,
            total,
            page,
            limit,
            hasMore: (page + 1) * limit < total,
        };
    }
    async shareGroup(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'admin');
        if (dto.makePublic) {
            if (!group.shareUrlToken) {
                group.shareUrlToken = (0, uuid_1.v4)();
            }
            group.isPublic = true;
            await this.groupRepo.save(group);
            return { shareUrl: `/groups/shared/${group.shareUrlToken}` };
        }
        let sharedWithUserId = dto.sharedWithUserId;
        if (dto.shareWithEmail) {
            const targetUser = await this.userRepo.findOne({ where: { email: dto.shareWithEmail } });
            if (!targetUser) {
                throw new common_1.NotFoundException('User with this email not found');
            }
            sharedWithUserId = targetUser.id;
        }
        if (!sharedWithUserId) {
            throw new common_1.BadRequestException('Must provide either sharedWithUserId or shareWithEmail');
        }
        const existing = await this.shareRepo.findOne({
            where: { groupId, sharedWithUserId },
        });
        if (existing) {
            existing.permissionLevel = dto.permissionLevel || influencer_group_entity_1.SharePermission.VIEW;
            return this.shareRepo.save(existing);
        }
        const share = this.shareRepo.create({
            groupId,
            sharedWithUserId,
            sharedByUserId: userId,
            permissionLevel: dto.permissionLevel || influencer_group_entity_1.SharePermission.VIEW,
        });
        return this.shareRepo.save(share);
    }
    async removeShare(userId, groupId, shareId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'admin');
        await this.shareRepo.delete({ id: shareId, groupId });
    }
    async getSharedGroup(token) {
        const group = await this.groupRepo.findOne({
            where: { shareUrlToken: token, isPublic: true },
            relations: ['owner'],
        });
        if (!group) {
            throw new common_1.NotFoundException('Shared group not found');
        }
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            platforms: group.platforms,
            influencerCount: group.influencerCount,
            unapprovedCount: 0,
            ownerName: group.owner?.name,
            ownerId: group.ownerId,
            createdById: group.createdById,
            isPublic: group.isPublic,
            createdAt: group.createdAt,
        };
    }
    async createInvitation(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        const existingSlug = await this.invitationRepo.findOne({ where: { urlSlug: dto.urlSlug } });
        if (existingSlug) {
            throw new common_1.ConflictException('This URL slug is already in use');
        }
        const invitation = this.invitationRepo.create({
            ...dto,
            groupId,
            createdById: userId,
        });
        const saved = await this.invitationRepo.save(invitation);
        this.logger.log(`Invitation created for group ${groupId}: ${saved.id}`);
        return saved;
    }
    async getInvitation(userId, groupId, invitationId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group);
        const invitation = await this.invitationRepo.findOne({
            where: { id: invitationId, groupId },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        return invitation;
    }
    async updateInvitation(userId, groupId, invitationId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        const invitation = await this.invitationRepo.findOne({
            where: { id: invitationId, groupId },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found');
        }
        Object.assign(invitation, dto);
        return this.invitationRepo.save(invitation);
    }
    async deleteInvitation(userId, groupId, invitationId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        await this.invitationRepo.delete({ id: invitationId, groupId });
    }
    async getInvitationBySlug(urlSlug) {
        const invitation = await this.invitationRepo.findOne({
            where: { urlSlug, isActive: true },
            relations: ['group'],
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found or inactive');
        }
        return invitation;
    }
    async submitApplication(urlSlug, dto, ipAddress, userAgent) {
        const invitation = await this.invitationRepo.findOne({
            where: { urlSlug, isActive: true },
        });
        if (!invitation) {
            throw new common_1.NotFoundException('Invitation not found or inactive');
        }
        if (!invitation.formPlatforms.includes(dto.platform)) {
            throw new common_1.BadRequestException('Platform not allowed for this invitation');
        }
        const existing = await this.applicationRepo.findOne({
            where: {
                invitationId: invitation.id,
                platform: dto.platform,
                platformUsername: dto.platformUsername,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('You have already applied');
        }
        const application = this.applicationRepo.create({
            ...dto,
            invitationId: invitation.id,
            groupId: invitation.groupId,
            ipAddress,
            userAgent,
        });
        const saved = await this.applicationRepo.save(application);
        await this.invitationRepo.increment({ id: invitation.id }, 'applicationsCount', 1);
        await this.updateGroupUnapprovedCount(invitation.groupId);
        this.logger.log(`Application submitted for invitation ${invitation.id}: ${saved.id}`);
        return saved;
    }
    async getApplications(userId, groupId, invitationId, filters) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group);
        const { platform, status, search, page = 0, limit = 20 } = filters;
        const queryBuilder = this.applicationRepo.createQueryBuilder('app')
            .where('app.invitationId = :invitationId', { invitationId });
        if (platform) {
            queryBuilder.andWhere('app.platform = :platform', { platform });
        }
        if (status) {
            queryBuilder.andWhere('app.status = :status', { status });
        }
        if (search) {
            queryBuilder.andWhere('(app.influencerName ILIKE :search OR app.platformUsername ILIKE :search)', { search: `%${search}%` });
        }
        queryBuilder.orderBy('app.submittedAt', 'DESC');
        const total = await queryBuilder.getCount();
        queryBuilder.skip(page * limit).take(limit);
        const applications = await queryBuilder.getMany();
        const applicationDtos = applications.map((app) => ({
            id: app.id,
            platform: app.platform,
            platformUsername: app.platformUsername,
            influencerName: app.influencerName,
            followerCount: Number(app.followerCount),
            profilePictureUrl: app.profilePictureUrl,
            status: app.status,
            submittedAt: app.submittedAt,
            phoneNumber: app.phoneNumber,
            email: app.email,
        }));
        return {
            applications: applicationDtos,
            total,
            page,
            limit,
            hasMore: (page + 1) * limit < total,
        };
    }
    async approveApplication(userId, groupId, applicationId) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        const application = await this.applicationRepo.findOne({
            where: { id: applicationId, groupId },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        if (application.status !== influencer_group_entity_1.ApplicationStatus.PENDING) {
            throw new common_1.BadRequestException('Application is not pending');
        }
        application.status = influencer_group_entity_1.ApplicationStatus.APPROVED;
        application.approvedById = userId;
        application.approvedAt = new Date();
        await this.applicationRepo.save(application);
        const member = this.memberRepo.create({
            groupId,
            influencerName: application.influencerName || application.platformUsername,
            influencerUsername: application.platformUsername,
            platform: application.platform,
            platformUserId: application.platformUrl,
            profilePictureUrl: application.profilePictureUrl,
            followerCount: application.followerCount,
            addedById: userId,
            source: 'APPLICATION',
            applicationId: application.id,
        });
        const savedMember = await this.memberRepo.save(member);
        await this.updateGroupInfluencerCount(groupId);
        await this.updateGroupUnapprovedCount(groupId);
        this.logger.log(`Application ${applicationId} approved for group ${groupId}`);
        return savedMember;
    }
    async bulkApproveApplications(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        let approved = 0;
        for (const applicationId of dto.applicationIds) {
            try {
                await this.approveApplication(userId, groupId, applicationId);
                approved++;
            }
            catch (error) {
                this.logger.warn(`Failed to approve application ${applicationId}: ${error.message}`);
            }
        }
        return { approved };
    }
    async rejectApplication(userId, groupId, applicationId, reason) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        const application = await this.applicationRepo.findOne({
            where: { id: applicationId, groupId },
        });
        if (!application) {
            throw new common_1.NotFoundException('Application not found');
        }
        application.status = influencer_group_entity_1.ApplicationStatus.REJECTED;
        application.rejectionReason = reason;
        await this.applicationRepo.save(application);
        await this.updateGroupUnapprovedCount(groupId);
        this.logger.log(`Application ${applicationId} rejected for group ${groupId}`);
    }
    async bulkRejectApplications(userId, groupId, dto) {
        const group = await this.groupRepo.findOne({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        await this.checkGroupAccess(userId, group, 'edit');
        let rejected = 0;
        for (const applicationId of dto.applicationIds) {
            try {
                await this.rejectApplication(userId, groupId, applicationId, dto.rejectionReason);
                rejected++;
            }
            catch (error) {
                this.logger.warn(`Failed to reject application ${applicationId}: ${error.message}`);
            }
        }
        return { rejected };
    }
    async getDashboardStats(userId) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const accessibleIds = await this.getAccessibleGroupIds(userId, user);
        const totalGroups = accessibleIds.length;
        const influencerStats = await this.memberRepo
            .createQueryBuilder('member')
            .select('COUNT(*)', 'total')
            .where(accessibleIds.length > 0 ? 'member.groupId IN (:...ids)' : '1=0', { ids: accessibleIds })
            .getRawOne();
        const pendingStats = await this.applicationRepo
            .createQueryBuilder('app')
            .select('COUNT(*)', 'total')
            .where(accessibleIds.length > 0 ? 'app.groupId IN (:...ids)' : '1=0', { ids: accessibleIds })
            .andWhere('app.status = :status', { status: influencer_group_entity_1.ApplicationStatus.PENDING })
            .getRawOne();
        const groups = await this.groupRepo.find({
            where: accessibleIds.length > 0 ? { id: (0, typeorm_2.In)(accessibleIds) } : { ownerId: userId },
            select: ['platforms'],
        });
        const groupsByPlatform = {};
        for (const group of groups) {
            for (const platform of group.platforms) {
                groupsByPlatform[platform] = (groupsByPlatform[platform] || 0) + 1;
            }
        }
        const recentGroups = await this.groupRepo.find({
            where: accessibleIds.length > 0 ? { id: (0, typeorm_2.In)(accessibleIds) } : { ownerId: userId },
            order: { createdAt: 'DESC' },
            take: 5,
            relations: ['owner'],
        });
        return {
            totalGroups,
            totalInfluencers: parseInt(influencerStats?.total) || 0,
            pendingApplications: parseInt(pendingStats?.total) || 0,
            groupsByPlatform,
            recentGroups: recentGroups.map((g) => ({
                id: g.id,
                name: g.name,
                description: g.description,
                platforms: g.platforms,
                influencerCount: g.influencerCount,
                unapprovedCount: g.unapprovedCount,
                ownerName: g.owner?.name,
                createdAt: g.createdAt,
            })),
        };
    }
    async checkGroupAccess(userId, group, level = 'view') {
        if (group.ownerId === userId || group.createdById === userId)
            return;
        const share = await this.shareRepo.findOne({
            where: { groupId: group.id, sharedWithUserId: userId },
        });
        if (!share) {
            const user = await this.userRepo.findOne({ where: { id: userId } });
            const owner = await this.userRepo.findOne({ where: { id: group.ownerId } });
            if (user?.parentId === owner?.id || owner?.parentId === user?.id || user?.parentId === owner?.parentId) {
                if (level !== 'view') {
                    throw new common_1.ForbiddenException('You do not have permission to modify this group');
                }
                return;
            }
            throw new common_1.ForbiddenException('You do not have access to this group');
        }
        if (level === 'admin' && share.permissionLevel !== influencer_group_entity_1.SharePermission.ADMIN) {
            throw new common_1.ForbiddenException('Admin access required');
        }
        if (level === 'edit' && share.permissionLevel === influencer_group_entity_1.SharePermission.VIEW) {
            throw new common_1.ForbiddenException('Edit access required');
        }
    }
    async getTeamUserIds(userId, user) {
        const ids = [userId];
        if (user.role === 'SUPER_ADMIN') {
            const allUsers = await this.userRepo.find({ select: ['id'] });
            return allUsers.map((u) => u.id);
        }
        if (user.parentId) {
            const siblings = await this.userRepo.find({ where: { parentId: user.parentId }, select: ['id'] });
            ids.push(...siblings.map((s) => s.id));
            ids.push(user.parentId);
        }
        const children = await this.userRepo.find({ where: { parentId: userId }, select: ['id'] });
        ids.push(...children.map((c) => c.id));
        return [...new Set(ids)];
    }
    async getAccessibleGroupIds(userId, user) {
        const ids = [];
        const owned = await this.groupRepo.find({ where: { ownerId: userId }, select: ['id'] });
        ids.push(...owned.map((g) => g.id));
        const created = await this.groupRepo.find({ where: { createdById: userId }, select: ['id'] });
        ids.push(...created.map((g) => g.id));
        const shared = await this.shareRepo.find({ where: { sharedWithUserId: userId }, select: ['groupId'] });
        ids.push(...shared.map((s) => s.groupId));
        if (user.role !== 'SUPER_ADMIN') {
            const teamIds = await this.getTeamUserIds(userId, user);
            const teamGroups = await this.groupRepo.find({
                where: { createdById: (0, typeorm_2.In)(teamIds) },
                select: ['id'],
            });
            ids.push(...teamGroups.map((g) => g.id));
        }
        return [...new Set(ids)];
    }
    async updateGroupInfluencerCount(groupId) {
        const count = await this.memberRepo.count({ where: { groupId } });
        await this.groupRepo.update({ id: groupId }, { influencerCount: count });
    }
    async updateGroupUnapprovedCount(groupId) {
        const count = await this.applicationRepo.count({
            where: { groupId, status: influencer_group_entity_1.ApplicationStatus.PENDING },
        });
        await this.groupRepo.update({ id: groupId }, { unapprovedCount: count });
    }
};
exports.InfluencerGroupService = InfluencerGroupService;
exports.InfluencerGroupService = InfluencerGroupService = InfluencerGroupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(influencer_group_entity_1.InfluencerGroup)),
    __param(1, (0, typeorm_1.InjectRepository)(influencer_group_entity_1.InfluencerGroupMember)),
    __param(2, (0, typeorm_1.InjectRepository)(influencer_group_entity_1.InfluencerGroupShare)),
    __param(3, (0, typeorm_1.InjectRepository)(influencer_group_entity_1.GroupInvitation)),
    __param(4, (0, typeorm_1.InjectRepository)(influencer_group_entity_1.GroupInvitationApplication)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InfluencerGroupService);
//# sourceMappingURL=influencer-group.service.js.map