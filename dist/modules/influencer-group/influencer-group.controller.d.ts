import { InfluencerGroupService } from './influencer-group.service';
import { CreateGroupDto, UpdateGroupDto, GroupFilterDto, AddInfluencerDto, BulkAddInfluencersDto, ImportFromGroupDto, CopyInfluencersDto, RemoveInfluencersDto, MemberFilterDto, ShareGroupDto, CreateInvitationDto, UpdateInvitationDto, SubmitApplicationDto, ApplicationFilterDto, BulkApproveApplicationsDto, BulkRejectApplicationsDto } from './dto/influencer-group.dto';
import { Request } from 'express';
export declare class InfluencerGroupController {
    private readonly groupService;
    constructor(groupService: InfluencerGroupService);
    createGroup(userId: string, dto: CreateGroupDto): Promise<import("./entities").InfluencerGroup>;
    getGroups(userId: string, filters: GroupFilterDto): Promise<import("./dto/influencer-group.dto").GroupListResponseDto>;
    getDashboardStats(userId: string): Promise<import("./dto/influencer-group.dto").DashboardStatsDto>;
    getSharedGroup(token: string): Promise<import("./dto/influencer-group.dto").GroupDetailDto>;
    getGroupById(userId: string, groupId: string): Promise<import("./dto/influencer-group.dto").GroupDetailDto>;
    updateGroup(userId: string, groupId: string, dto: UpdateGroupDto): Promise<import("./entities").InfluencerGroup>;
    deleteGroup(userId: string, groupId: string): Promise<void>;
    addInfluencer(userId: string, groupId: string, dto: AddInfluencerDto): Promise<import("./entities").InfluencerGroupMember>;
    bulkAddInfluencers(userId: string, groupId: string, dto: BulkAddInfluencersDto): Promise<{
        added: number;
        skipped: number;
    }>;
    importFromGroup(userId: string, groupId: string, dto: ImportFromGroupDto): Promise<{
        imported: number;
        skipped: number;
    }>;
    copyInfluencers(userId: string, groupId: string, dto: CopyInfluencersDto): Promise<{
        copied: number;
        skipped: number;
    }>;
    removeInfluencers(userId: string, groupId: string, dto: RemoveInfluencersDto): Promise<{
        removed: number;
    }>;
    getMembers(userId: string, groupId: string, filters: MemberFilterDto): Promise<import("./dto/influencer-group.dto").MemberListResponseDto>;
    shareGroup(userId: string, groupId: string, dto: ShareGroupDto): Promise<import("./entities").InfluencerGroupShare | {
        shareUrl: string;
    }>;
    removeShare(userId: string, groupId: string, shareId: string): Promise<void>;
    createInvitation(userId: string, groupId: string, dto: CreateInvitationDto): Promise<import("./entities").GroupInvitation>;
    getInvitation(userId: string, groupId: string, invitationId: string): Promise<import("./entities").GroupInvitation>;
    updateInvitation(userId: string, groupId: string, invitationId: string, dto: UpdateInvitationDto): Promise<import("./entities").GroupInvitation>;
    deleteInvitation(userId: string, groupId: string, invitationId: string): Promise<void>;
    getInvitationBySlug(slug: string): Promise<import("./entities").GroupInvitation>;
    submitApplication(slug: string, dto: SubmitApplicationDto, req: Request): Promise<import("./entities").GroupInvitationApplication>;
    getApplications(userId: string, groupId: string, invitationId: string, filters: ApplicationFilterDto): Promise<import("./dto/influencer-group.dto").ApplicationListResponseDto>;
    approveApplication(userId: string, groupId: string, applicationId: string): Promise<import("./entities").InfluencerGroupMember>;
    bulkApproveApplications(userId: string, groupId: string, dto: BulkApproveApplicationsDto): Promise<{
        approved: number;
    }>;
    rejectApplication(userId: string, groupId: string, applicationId: string, reason?: string): Promise<void>;
    bulkRejectApplications(userId: string, groupId: string, dto: BulkRejectApplicationsDto): Promise<{
        rejected: number;
    }>;
}
