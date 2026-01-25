import { Request } from 'express';
import { TeamService } from './team.service';
import { CreateTeamMemberDto, UpdateTeamMemberDto, UpdateFeaturesDto, UpdateActionsDto, AllocateTeamCreditsDto, TeamMemberResponseDto, TeamMemberQueryDto, CreditUsageLogDto, CreditLogQueryDto, CreditDetailQueryDto, ImpersonationResponseDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators';
export declare class TeamController {
    private readonly teamService;
    constructor(teamService: TeamService);
    getTeamMembers(user: CurrentUserPayload, query: TeamMemberQueryDto): Promise<{
        data: TeamMemberResponseDto[];
        total: number;
    }>;
    getTeamMember(user: CurrentUserPayload, memberId: string): Promise<TeamMemberResponseDto>;
    createTeamMember(user: CurrentUserPayload, dto: CreateTeamMemberDto): Promise<TeamMemberResponseDto>;
    updateTeamMember(user: CurrentUserPayload, memberId: string, dto: UpdateTeamMemberDto): Promise<TeamMemberResponseDto>;
    deleteTeamMember(user: CurrentUserPayload, memberId: string): Promise<{
        success: boolean;
    }>;
    getMemberFeatures(user: CurrentUserPayload, memberId: string): Promise<{
        featureName: string;
        isEnabled: boolean;
    }[]>;
    updateMemberFeatures(user: CurrentUserPayload, memberId: string, dto: UpdateFeaturesDto): Promise<{
        success: boolean;
    }>;
    getMemberActions(user: CurrentUserPayload, memberId: string): Promise<{
        actionName: string;
        isEnabled: boolean;
    }[]>;
    updateMemberActions(user: CurrentUserPayload, memberId: string, dto: UpdateActionsDto): Promise<{
        success: boolean;
    }>;
    allocateCredits(user: CurrentUserPayload, memberId: string, dto: AllocateTeamCreditsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    impersonateUser(user: CurrentUserPayload, targetUserId: string, request: Request): Promise<ImpersonationResponseDto>;
    exitImpersonation(body: {
        impersonationId: string;
    }): Promise<{
        success: boolean;
    }>;
    getCreditUsageLogs(user: CurrentUserPayload, query: CreditLogQueryDto): Promise<{
        data: CreditUsageLogDto[];
        total: number;
    }>;
    getUserCreditDetails(user: CurrentUserPayload, userId: string, query: CreditDetailQueryDto): Promise<{
        user: any;
        transactions: any[];
        total: number;
    }>;
}
