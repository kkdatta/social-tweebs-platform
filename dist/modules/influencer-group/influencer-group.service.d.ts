import { Repository, DataSource } from 'typeorm';
import { InfluencerGroup, InfluencerGroupMember, InfluencerGroupShare, GroupInvitation, GroupInvitationApplication } from './entities/influencer-group.entity';
import { User } from '../users/entities/user.entity';
import { CreateGroupDto, UpdateGroupDto, GroupFilterDto, AddInfluencerDto, BulkAddInfluencersDto, ImportFromGroupDto, CopyInfluencersDto, RemoveInfluencersDto, MemberFilterDto, ShareGroupDto, CreateInvitationDto, UpdateInvitationDto, SubmitApplicationDto, ApplicationFilterDto, BulkApproveApplicationsDto, BulkRejectApplicationsDto, GroupDetailDto, GroupListResponseDto, MemberListResponseDto, ApplicationListResponseDto, DashboardStatsDto } from './dto/influencer-group.dto';
export declare class InfluencerGroupService {
    private groupRepo;
    private memberRepo;
    private shareRepo;
    private invitationRepo;
    private applicationRepo;
    private userRepo;
    private dataSource;
    private readonly logger;
    constructor(groupRepo: Repository<InfluencerGroup>, memberRepo: Repository<InfluencerGroupMember>, shareRepo: Repository<InfluencerGroupShare>, invitationRepo: Repository<GroupInvitation>, applicationRepo: Repository<GroupInvitationApplication>, userRepo: Repository<User>, dataSource: DataSource);
    createGroup(userId: string, dto: CreateGroupDto): Promise<InfluencerGroup>;
    getGroups(userId: string, filters: GroupFilterDto): Promise<GroupListResponseDto>;
    getGroupById(userId: string, groupId: string): Promise<GroupDetailDto>;
    updateGroup(userId: string, groupId: string, dto: UpdateGroupDto): Promise<InfluencerGroup>;
    deleteGroup(userId: string, groupId: string): Promise<void>;
    private normalizeAddInfluencerInput;
    private findExistingGroupMember;
    addInfluencer(userId: string, groupId: string, dto: AddInfluencerDto): Promise<InfluencerGroupMember>;
    bulkAddInfluencers(userId: string, groupId: string, dto: BulkAddInfluencersDto): Promise<{
        added: number;
        skipped: number;
    }>;
    importFromGroup(userId: string, targetGroupId: string, dto: ImportFromGroupDto): Promise<{
        imported: number;
        skipped: number;
    }>;
    copyInfluencers(userId: string, sourceGroupId: string, dto: CopyInfluencersDto): Promise<{
        copied: number;
        skipped: number;
    }>;
    removeInfluencers(userId: string, groupId: string, dto: RemoveInfluencersDto): Promise<{
        removed: number;
    }>;
    getMembers(userId: string, groupId: string, filters: MemberFilterDto): Promise<MemberListResponseDto>;
    shareGroup(userId: string, groupId: string, dto: ShareGroupDto): Promise<InfluencerGroupShare | {
        shareUrl: string;
    }>;
    removeShare(userId: string, groupId: string, shareId: string): Promise<void>;
    getSharedGroup(token: string): Promise<GroupDetailDto>;
    createInvitation(userId: string, groupId: string, dto: CreateInvitationDto): Promise<GroupInvitation>;
    getInvitation(userId: string, groupId: string, invitationId: string): Promise<GroupInvitation>;
    updateInvitation(userId: string, groupId: string, invitationId: string, dto: UpdateInvitationDto): Promise<GroupInvitation>;
    deleteInvitation(userId: string, groupId: string, invitationId: string): Promise<void>;
    getInvitationBySlug(urlSlug: string): Promise<GroupInvitation>;
    submitApplication(urlSlug: string, dto: SubmitApplicationDto, ipAddress?: string, userAgent?: string): Promise<GroupInvitationApplication>;
    getApplications(userId: string, groupId: string, invitationId: string, filters: ApplicationFilterDto): Promise<ApplicationListResponseDto>;
    approveApplication(userId: string, groupId: string, applicationId: string): Promise<InfluencerGroupMember>;
    bulkApproveApplications(userId: string, groupId: string, dto: BulkApproveApplicationsDto): Promise<{
        approved: number;
    }>;
    rejectApplication(userId: string, groupId: string, applicationId: string, reason?: string): Promise<void>;
    bulkRejectApplications(userId: string, groupId: string, dto: BulkRejectApplicationsDto): Promise<{
        rejected: number;
    }>;
    getDashboardStats(userId: string): Promise<DashboardStatsDto>;
    private checkGroupAccess;
    private getTeamUserIds;
    private getAccessibleGroupIds;
    private updateGroupInfluencerCount;
    private updateGroupUnapprovedCount;
}
