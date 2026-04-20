import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import {
  InfluencerGroup,
  InfluencerGroupMember,
  InfluencerGroupShare,
  GroupInvitation,
  GroupInvitationApplication,
  SharePermission,
  ApplicationStatus,
} from './entities/influencer-group.entity';
import { User } from '../users/entities/user.entity';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupFilterDto,
  AddInfluencerDto,
  BulkAddInfluencersDto,
  ImportFromGroupDto,
  CopyInfluencersDto,
  RemoveInfluencersDto,
  MemberFilterDto,
  ShareGroupDto,
  CreateInvitationDto,
  UpdateInvitationDto,
  SubmitApplicationDto,
  ApplicationFilterDto,
  BulkApproveApplicationsDto,
  BulkRejectApplicationsDto,
  GroupSummaryDto,
  GroupDetailDto,
  GroupMemberDto,
  GroupListResponseDto,
  MemberListResponseDto,
  ApplicationListResponseDto,
  DashboardStatsDto,
  InvitationSummaryDto,
  ShareSummaryDto,
  ApplicationSummaryDto,
} from './dto/influencer-group.dto';

@Injectable()
export class InfluencerGroupService {
  private readonly logger = new Logger(InfluencerGroupService.name);

  constructor(
    @InjectRepository(InfluencerGroup)
    private groupRepo: Repository<InfluencerGroup>,
    @InjectRepository(InfluencerGroupMember)
    private memberRepo: Repository<InfluencerGroupMember>,
    @InjectRepository(InfluencerGroupShare)
    private shareRepo: Repository<InfluencerGroupShare>,
    @InjectRepository(GroupInvitation)
    private invitationRepo: Repository<GroupInvitation>,
    @InjectRepository(GroupInvitationApplication)
    private applicationRepo: Repository<GroupInvitationApplication>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // ============ GROUP CRUD ============

  async createGroup(userId: string, dto: CreateGroupDto): Promise<InfluencerGroup> {
    const group = new InfluencerGroup();
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

  async getGroups(userId: string, filters: GroupFilterDto): Promise<GroupListResponseDto> {
    const { tab, platforms, search, page = 0, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const queryBuilder = this.groupRepo.createQueryBuilder('group')
      .leftJoinAndSelect('group.owner', 'owner');

    // Tab-based filtering
    if (tab === 'created_by_me') {
      queryBuilder.where('group.createdById = :userId', { userId });
    } else if (tab === 'created_by_team') {
      const teamUserIds = await this.getTeamUserIds(userId, user);
      queryBuilder.where('group.createdById IN (:...teamUserIds)', { teamUserIds })
        .andWhere('group.createdById != :userId', { userId });
    } else if (tab === 'shared_with_me') {
      queryBuilder.innerJoin('group.shares', 'share', 'share.sharedWithUserId = :userId', { userId });
    } else {
      // Default: show all accessible groups
      const accessibleIds = await this.getAccessibleGroupIds(userId, user);
      if (accessibleIds.length > 0) {
        queryBuilder.where('group.id IN (:...accessibleIds)', { accessibleIds });
      } else {
        queryBuilder.where('group.ownerId = :userId', { userId });
      }
    }

    // Platform filter
    if (platforms && platforms.length > 0) {
      queryBuilder.andWhere('group.platforms && :platforms', { platforms });
    }

    // Search filter
    if (search) {
      queryBuilder.andWhere('(group.name ILIKE :search OR group.description ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Sorting
    const sortField = ['createdAt', 'name', 'influencerCount'].includes(sortBy)
      ? `group.${sortBy}`
      : 'group.createdAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(page * limit).take(limit);

    const groups = await queryBuilder.getMany();

    const groupSummaries: GroupSummaryDto[] = groups.map((group) => ({
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

  async getGroupById(userId: string, groupId: string): Promise<GroupDetailDto> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['owner', 'shares', 'shares.sharedWithUser', 'invitations'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
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

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto): Promise<InfluencerGroup> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    Object.assign(group, dto);
    const updated = await this.groupRepo.save(group);
    this.logger.log(`Group updated: ${groupId}`);
    return updated;
  }

  async deleteGroup(userId: string, groupId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'admin');

    await this.groupRepo.remove(group);
    this.logger.log(`Group deleted: ${groupId}`);
  }

  // ============ MEMBER MANAGEMENT ============

  /** Resolve platform and display name; requires at least one of name, profile id, or platform user id (DTO enforces). */
  private normalizeAddInfluencerInput(
    group: InfluencerGroup,
    dto: AddInfluencerDto,
  ): { platform: string; influencerName: string } {
    const hasName = dto.influencerName?.trim();
    const hasProfile = !!dto.influencerProfileId;
    const hasPuid = !!dto.platformUserId?.trim();
    if (!hasName && !hasProfile && !hasPuid) {
      throw new BadRequestException('Provide influencerName, influencerProfileId, or platformUserId');
    }

    let platform: string;
    if (dto.platform) {
      if (!group.platforms.includes(dto.platform)) {
        throw new BadRequestException(`Platform ${dto.platform} is not allowed in this group`);
      }
      platform = dto.platform;
    } else {
      platform = group.platforms[0];
    }
    if (!platform) {
      throw new BadRequestException('Group has no platforms configured');
    }

    const influencerName =
      dto.influencerName?.trim() ||
      dto.platformUserId?.trim() ||
      (dto.influencerProfileId ? `Profile ${dto.influencerProfileId.slice(0, 8)}` : '');

    return { platform, influencerName };
  }

  private async findExistingGroupMember(
    groupId: string,
    platform: string,
    dto: AddInfluencerDto,
    resolvedName: string,
  ): Promise<InfluencerGroupMember | null> {
    if (dto.influencerProfileId) {
      return this.memberRepo.findOne({
        where: { groupId, influencerProfileId: dto.influencerProfileId },
      });
    }
    if (dto.platformUserId?.trim()) {
      return this.memberRepo.findOne({
        where: { groupId, platform, platformUserId: dto.platformUserId.trim() },
      });
    }

    const qb = this.memberRepo
      .createQueryBuilder('m')
      .where('m.groupId = :groupId', { groupId })
      .andWhere('m.platform = :platform', { platform })
      .andWhere('m.influencerName = :resolvedName', { resolvedName })
      .andWhere('m.influencerProfileId IS NULL')
      .andWhere('(m.platformUserId IS NULL OR m.platformUserId = :empty)', { empty: '' });
    const u = dto.influencerUsername?.trim();
    if (u) {
      qb.andWhere('m.influencerUsername = :u', { u });
    } else {
      qb.andWhere('(m.influencerUsername IS NULL OR m.influencerUsername = :empty)', { empty: '' });
    }
    return qb.getOne();
  }

  async addInfluencer(userId: string, groupId: string, dto: AddInfluencerDto): Promise<InfluencerGroupMember> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    const { platform, influencerName } = this.normalizeAddInfluencerInput(group, dto);

    const existing = await this.findExistingGroupMember(groupId, platform, dto, influencerName);
    if (existing) {
      throw new ConflictException('Influencer already exists in this group');
    }

    const member = this.memberRepo.create({
      ...dto,
      influencerName,
      platform,
      groupId,
      addedById: userId,
      source: 'MANUAL',
      followerCount: dto.followerCount ?? 0,
    });

    const saved = await this.memberRepo.save(member);

    // Update influencer count
    await this.updateGroupInfluencerCount(groupId);

    this.logger.log(`Influencer added to group ${groupId}: ${saved.id}`);
    return saved;
  }

  async bulkAddInfluencers(userId: string, groupId: string, dto: BulkAddInfluencersDto): Promise<{ added: number; skipped: number }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    let added = 0;
    let skipped = 0;

    for (const influencer of dto.influencers) {
      try {
        const { platform, influencerName } = this.normalizeAddInfluencerInput(group, influencer);

        const existing = await this.findExistingGroupMember(groupId, platform, influencer, influencerName);
        if (existing) {
          skipped++;
          continue;
        }

        const member = this.memberRepo.create({
          ...influencer,
          influencerName,
          platform,
          groupId,
          addedById: userId,
          source: 'XLSX_IMPORT',
          followerCount: influencer.followerCount ?? 0,
        });

        await this.memberRepo.save(member);
        added++;
      } catch (error) {
        skipped++;
        this.logger.warn(`Failed to add influencer: ${error.message}`);
      }
    }

    // Update influencer count
    await this.updateGroupInfluencerCount(groupId);

    this.logger.log(`Bulk add to group ${groupId}: ${added} added, ${skipped} skipped`);
    return { added, skipped };
  }

  async importFromGroup(userId: string, targetGroupId: string, dto: ImportFromGroupDto): Promise<{ imported: number; skipped: number }> {
    const targetGroup = await this.groupRepo.findOne({ where: { id: targetGroupId } });
    if (!targetGroup) throw new NotFoundException('Target group not found');

    await this.checkGroupAccess(userId, targetGroup, 'edit');

    const sourceGroup = await this.groupRepo.findOne({ where: { id: dto.sourceGroupId } });
    if (!sourceGroup) throw new NotFoundException('Source group not found');

    await this.checkGroupAccess(userId, sourceGroup, 'view');

    // Get influencers from source group
    let sourceMembers: InfluencerGroupMember[];
    if (dto.influencerIds && dto.influencerIds.length > 0) {
      sourceMembers = await this.memberRepo.find({
        where: { groupId: dto.sourceGroupId, id: In(dto.influencerIds) },
      });
    } else {
      sourceMembers = await this.memberRepo.find({
        where: { groupId: dto.sourceGroupId },
      });
    }

    let imported = 0;
    let skipped = 0;

    for (const sourceMember of sourceMembers) {
      // Check if platform is allowed
      if (!targetGroup.platforms.includes(sourceMember.platform)) {
        skipped++;
        continue;
      }

      // Check duplicate
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

    // Update influencer count
    await this.updateGroupInfluencerCount(targetGroupId);

    this.logger.log(`Import to group ${targetGroupId} from ${dto.sourceGroupId}: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped };
  }

  async copyInfluencers(userId: string, sourceGroupId: string, dto: CopyInfluencersDto): Promise<{ copied: number; skipped: number }> {
    const sourceGroup = await this.groupRepo.findOne({ where: { id: sourceGroupId } });
    if (!sourceGroup) throw new NotFoundException('Source group not found');

    await this.checkGroupAccess(userId, sourceGroup, 'view');

    const targetGroup = await this.groupRepo.findOne({ where: { id: dto.targetGroupId } });
    if (!targetGroup) throw new NotFoundException('Target group not found');

    await this.checkGroupAccess(userId, targetGroup, 'edit');

    const members = await this.memberRepo.find({
      where: { id: In(dto.memberIds), groupId: sourceGroupId },
    });

    let copied = 0;
    let skipped = 0;

    for (const member of members) {
      // Check if platform is allowed
      if (!targetGroup.platforms.includes(member.platform)) {
        skipped++;
        continue;
      }

      // Check duplicate
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

    // Update influencer count
    await this.updateGroupInfluencerCount(dto.targetGroupId);

    return { copied, skipped };
  }

  async removeInfluencers(userId: string, groupId: string, dto: RemoveInfluencersDto): Promise<{ removed: number }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    const membersToRemove = await this.memberRepo.find({
      where: {
        id: In(dto.memberIds),
        groupId,
      },
    });

    if (membersToRemove.length === 0) {
      this.logger.warn(
        `No matching members found for removal in group ${groupId}. Requested IDs: ${dto.memberIds.join(', ')}`,
      );
      return { removed: 0 };
    }

    try {
      await this.memberRepo.remove(membersToRemove);
    } catch (error) {
      this.logger.error(
        `Failed to remove members from group ${groupId}: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException(
        `Failed to remove influencer(s): ${error.message}`,
      );
    }

    await this.updateGroupInfluencerCount(groupId);

    this.logger.log(`Removed ${membersToRemove.length} influencers from group ${groupId}`);
    return { removed: membersToRemove.length };
  }

  async getMembers(userId: string, groupId: string, filters: MemberFilterDto): Promise<MemberListResponseDto> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group);

    const { platform, search, page = 0, limit = 20, sortBy = 'addedAt', sortOrder = 'desc' } = filters;

    const queryBuilder = this.memberRepo.createQueryBuilder('member')
      .where('member.groupId = :groupId', { groupId });

    if (platform) {
      queryBuilder.andWhere('member.platform = :platform', { platform });
    }

    if (search) {
      queryBuilder.andWhere(
        '(member.influencerName ILIKE :search OR member.influencerUsername ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Sorting
    const sortField = ['addedAt', 'influencerName', 'followerCount', 'audienceCredibility', 'engagementRate'].includes(sortBy)
      ? `member.${sortBy}`
      : 'member.addedAt';
    queryBuilder.orderBy(sortField, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(page * limit).take(limit);

    const members = await queryBuilder.getMany();

    const memberDtos: GroupMemberDto[] = members.map((m) => ({
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

  // ============ SHARE MANAGEMENT ============

  async shareGroup(userId: string, groupId: string, dto: ShareGroupDto): Promise<InfluencerGroupShare | { shareUrl: string }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'admin');

    // Handle public sharing
    if (dto.makePublic) {
      if (!group.shareUrlToken) {
        group.shareUrlToken = uuidv4();
      }
      group.isPublic = true;
      await this.groupRepo.save(group);
      return { shareUrl: `/groups/shared/${group.shareUrlToken}` };
    }

    // Handle user-specific sharing
    let sharedWithUserId = dto.sharedWithUserId;

    if (dto.shareWithEmail) {
      const targetUser = await this.userRepo.findOne({ where: { email: dto.shareWithEmail } });
      if (!targetUser) {
        throw new NotFoundException('User with this email not found');
      }
      sharedWithUserId = targetUser.id;
    }

    if (!sharedWithUserId) {
      throw new BadRequestException('Must provide either sharedWithUserId or shareWithEmail');
    }

    // Check if already shared
    const existing = await this.shareRepo.findOne({
      where: { groupId, sharedWithUserId },
    });

    if (existing) {
      existing.permissionLevel = dto.permissionLevel || SharePermission.VIEW;
      return this.shareRepo.save(existing);
    }

    const share = this.shareRepo.create({
      groupId,
      sharedWithUserId,
      sharedByUserId: userId,
      permissionLevel: dto.permissionLevel || SharePermission.VIEW,
    });

    return this.shareRepo.save(share);
  }

  async removeShare(userId: string, groupId: string, shareId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'admin');

    await this.shareRepo.delete({ id: shareId, groupId });
  }

  async getSharedGroup(token: string): Promise<GroupDetailDto> {
    const group = await this.groupRepo.findOne({
      where: { shareUrlToken: token, isPublic: true },
      relations: ['owner'],
    });

    if (!group) {
      throw new NotFoundException('Shared group not found');
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

  // ============ INVITATION MANAGEMENT ============

  async createInvitation(userId: string, groupId: string, dto: CreateInvitationDto): Promise<GroupInvitation> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    // Check if URL slug is unique
    const existingSlug = await this.invitationRepo.findOne({ where: { urlSlug: dto.urlSlug } });
    if (existingSlug) {
      throw new ConflictException('This URL slug is already in use');
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

  async getInvitation(userId: string, groupId: string, invitationId: string): Promise<GroupInvitation> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group);

    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, groupId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  async updateInvitation(userId: string, groupId: string, invitationId: string, dto: UpdateInvitationDto): Promise<GroupInvitation> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    const invitation = await this.invitationRepo.findOne({
      where: { id: invitationId, groupId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    Object.assign(invitation, dto);
    return this.invitationRepo.save(invitation);
  }

  async deleteInvitation(userId: string, groupId: string, invitationId: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    await this.invitationRepo.delete({ id: invitationId, groupId });
  }

  async getInvitationBySlug(urlSlug: string): Promise<GroupInvitation> {
    const invitation = await this.invitationRepo.findOne({
      where: { urlSlug, isActive: true },
      relations: ['group'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or inactive');
    }

    return invitation;
  }

  // ============ APPLICATION MANAGEMENT ============

  async submitApplication(urlSlug: string, dto: SubmitApplicationDto, ipAddress?: string, userAgent?: string): Promise<GroupInvitationApplication> {
    const invitation = await this.invitationRepo.findOne({
      where: { urlSlug, isActive: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or inactive');
    }

    // Validate platform is allowed
    if (!invitation.formPlatforms.includes(dto.platform)) {
      throw new BadRequestException('Platform not allowed for this invitation');
    }

    // Check for duplicate application
    const existing = await this.applicationRepo.findOne({
      where: {
        invitationId: invitation.id,
        platform: dto.platform,
        platformUsername: dto.platformUsername,
      },
    });

    if (existing) {
      throw new ConflictException('You have already applied');
    }

    const application = this.applicationRepo.create({
      ...dto,
      invitationId: invitation.id,
      groupId: invitation.groupId,
      ipAddress,
      userAgent,
    });

    const saved = await this.applicationRepo.save(application);

    // Update invitation applications count
    await this.invitationRepo.increment({ id: invitation.id }, 'applicationsCount', 1);

    // Update group unapproved count
    await this.updateGroupUnapprovedCount(invitation.groupId);

    this.logger.log(`Application submitted for invitation ${invitation.id}: ${saved.id}`);
    return saved;
  }

  async getApplications(userId: string, groupId: string, invitationId: string, filters: ApplicationFilterDto): Promise<ApplicationListResponseDto> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

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
      queryBuilder.andWhere(
        '(app.influencerName ILIKE :search OR app.platformUsername ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('app.submittedAt', 'DESC');

    const total = await queryBuilder.getCount();
    queryBuilder.skip(page * limit).take(limit);

    const applications = await queryBuilder.getMany();

    const applicationDtos: ApplicationSummaryDto[] = applications.map((app) => ({
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

  async approveApplication(userId: string, groupId: string, applicationId: string): Promise<InfluencerGroupMember> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, groupId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Application is not pending');
    }

    // Update application status
    application.status = ApplicationStatus.APPROVED;
    application.approvedById = userId;
    application.approvedAt = new Date();
    await this.applicationRepo.save(application);

    const member = this.memberRepo.create({
      groupId,
      influencerName: application.influencerName || application.platformUsername,
      influencerUsername: application.platformUsername,
      platform: application.platform,
      platformUserId: application.platformUsername || '',
      profilePictureUrl: application.profilePictureUrl,
      followerCount: application.followerCount,
      addedById: userId,
      source: 'APPLICATION',
      applicationId: application.id,
    });

    const savedMember = await this.memberRepo.save(member);

    // Update counts
    await this.updateGroupInfluencerCount(groupId);
    await this.updateGroupUnapprovedCount(groupId);

    this.logger.log(`Application ${applicationId} approved for group ${groupId}`);
    return savedMember;
  }

  async bulkApproveApplications(userId: string, groupId: string, dto: BulkApproveApplicationsDto): Promise<{ approved: number }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    let approved = 0;

    for (const applicationId of dto.applicationIds) {
      try {
        await this.approveApplication(userId, groupId, applicationId);
        approved++;
      } catch (error) {
        this.logger.warn(`Failed to approve application ${applicationId}: ${error.message}`);
      }
    }

    return { approved };
  }

  async rejectApplication(userId: string, groupId: string, applicationId: string, reason?: string): Promise<void> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    const application = await this.applicationRepo.findOne({
      where: { id: applicationId, groupId },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.status = ApplicationStatus.REJECTED;
    application.rejectionReason = reason;
    await this.applicationRepo.save(application);

    // Update unapproved count
    await this.updateGroupUnapprovedCount(groupId);

    this.logger.log(`Application ${applicationId} rejected for group ${groupId}`);
  }

  async bulkRejectApplications(userId: string, groupId: string, dto: BulkRejectApplicationsDto): Promise<{ rejected: number }> {
    const group = await this.groupRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    await this.checkGroupAccess(userId, group, 'edit');

    let rejected = 0;

    for (const applicationId of dto.applicationIds) {
      try {
        await this.rejectApplication(userId, groupId, applicationId, dto.rejectionReason);
        rejected++;
      } catch (error) {
        this.logger.warn(`Failed to reject application ${applicationId}: ${error.message}`);
      }
    }

    return { rejected };
  }

  // ============ DASHBOARD ============

  async getDashboardStats(userId: string): Promise<DashboardStatsDto> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const accessibleIds = await this.getAccessibleGroupIds(userId, user);

    // Total groups
    const totalGroups = accessibleIds.length;

    // Total influencers across all groups
    const influencerStats = await this.memberRepo
      .createQueryBuilder('member')
      .select('COUNT(*)', 'total')
      .where(accessibleIds.length > 0 ? 'member.groupId IN (:...ids)' : '1=0', { ids: accessibleIds })
      .getRawOne();

    // Pending applications
    const pendingStats = await this.applicationRepo
      .createQueryBuilder('app')
      .select('COUNT(*)', 'total')
      .where(accessibleIds.length > 0 ? 'app.groupId IN (:...ids)' : '1=0', { ids: accessibleIds })
      .andWhere('app.status = :status', { status: ApplicationStatus.PENDING })
      .getRawOne();

    // Groups by platform
    const groups = await this.groupRepo.find({
      where: accessibleIds.length > 0 ? { id: In(accessibleIds) } : { ownerId: userId },
      select: ['platforms'],
    });

    const groupsByPlatform: Record<string, number> = {};
    for (const group of groups) {
      for (const platform of group.platforms) {
        groupsByPlatform[platform] = (groupsByPlatform[platform] || 0) + 1;
      }
    }

    // Recent groups
    const recentGroups = await this.groupRepo.find({
      where: accessibleIds.length > 0 ? { id: In(accessibleIds) } : { ownerId: userId },
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

  // ============ HELPER METHODS ============

  private async checkGroupAccess(userId: string, group: InfluencerGroup, level: 'view' | 'edit' | 'admin' = 'view'): Promise<void> {
    // Owner has full access
    if (group.ownerId === userId || group.createdById === userId) return;

    // Check share permissions
    const share = await this.shareRepo.findOne({
      where: { groupId: group.id, sharedWithUserId: userId },
    });

    if (!share) {
      // Check if user is in same organization
      const user = await this.userRepo.findOne({ where: { id: userId } });
      const owner = await this.userRepo.findOne({ where: { id: group.ownerId } });

      if (user?.parentId === owner?.id || owner?.parentId === user?.id || user?.parentId === owner?.parentId) {
        if (level !== 'view') {
          throw new ForbiddenException('You do not have permission to modify this group');
        }
        return;
      }

      throw new ForbiddenException('You do not have access to this group');
    }

    if (level === 'admin' && share.permissionLevel !== SharePermission.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    if (level === 'edit' && share.permissionLevel === SharePermission.VIEW) {
      throw new ForbiddenException('Edit access required');
    }
  }

  private async getTeamUserIds(userId: string, user: User): Promise<string[]> {
    const ids: string[] = [userId];

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

  private async getAccessibleGroupIds(userId: string, user: User): Promise<string[]> {
    const ids: string[] = [];

    // Owned groups
    const owned = await this.groupRepo.find({ where: { ownerId: userId }, select: ['id'] });
    ids.push(...owned.map((g) => g.id));

    // Created groups
    const created = await this.groupRepo.find({ where: { createdById: userId }, select: ['id'] });
    ids.push(...created.map((g) => g.id));

    // Shared groups
    const shared = await this.shareRepo.find({ where: { sharedWithUserId: userId }, select: ['groupId'] });
    ids.push(...shared.map((s) => s.groupId));

    // Team groups
    if (user.role !== 'SUPER_ADMIN') {
      const teamIds = await this.getTeamUserIds(userId, user);
      const teamGroups = await this.groupRepo.find({
        where: { createdById: In(teamIds) },
        select: ['id'],
      });
      ids.push(...teamGroups.map((g) => g.id));
    }

    return [...new Set(ids)];
  }

  private async updateGroupInfluencerCount(groupId: string): Promise<void> {
    const count = await this.memberRepo.count({ where: { groupId } });
    await this.groupRepo.update({ id: groupId }, { influencerCount: count });
  }

  private async updateGroupUnapprovedCount(groupId: string): Promise<void> {
    const count = await this.applicationRepo.count({
      where: { groupId, status: ApplicationStatus.PENDING },
    });
    await this.groupRepo.update({ id: groupId }, { unapprovedCount: count });
  }
}
