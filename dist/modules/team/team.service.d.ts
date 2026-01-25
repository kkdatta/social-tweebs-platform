import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { CreditAccount } from '../credits/entities/credit-account.entity';
import { CreditTransaction } from '../credits/entities/credit-transaction.entity';
import { TeamMemberProfile, FeatureAccess, ActionPermission, ImpersonationLog } from './entities';
import { CreateTeamMemberDto, UpdateTeamMemberDto, UpdateFeaturesDto, UpdateActionsDto, AllocateTeamCreditsDto, TeamMemberResponseDto, TeamMemberQueryDto, CreditUsageLogDto, CreditLogQueryDto, CreditUsageDetailDto, CreditDetailQueryDto, ImpersonationResponseDto } from './dto';
export declare class TeamService {
    private userRepository;
    private profileRepository;
    private featureAccessRepository;
    private actionPermissionRepository;
    private impersonationLogRepository;
    private creditAccountRepository;
    private transactionRepository;
    private preferencesRepository;
    private dataSource;
    private jwtService;
    private configService;
    constructor(userRepository: Repository<User>, profileRepository: Repository<TeamMemberProfile>, featureAccessRepository: Repository<FeatureAccess>, actionPermissionRepository: Repository<ActionPermission>, impersonationLogRepository: Repository<ImpersonationLog>, creditAccountRepository: Repository<CreditAccount>, transactionRepository: Repository<CreditTransaction>, preferencesRepository: Repository<UserPreferences>, dataSource: DataSource, jwtService: JwtService, configService: ConfigService);
    getTeamMembers(requesterId: string, query: TeamMemberQueryDto): Promise<{
        data: TeamMemberResponseDto[];
        total: number;
    }>;
    getTeamMemberById(requesterId: string, memberId: string): Promise<TeamMemberResponseDto>;
    createTeamMember(creatorId: string, dto: CreateTeamMemberDto): Promise<TeamMemberResponseDto>;
    updateTeamMember(requesterId: string, memberId: string, dto: UpdateTeamMemberDto): Promise<TeamMemberResponseDto>;
    deleteTeamMember(requesterId: string, memberId: string): Promise<void>;
    getMemberFeatures(requesterId: string, memberId: string): Promise<{
        featureName: string;
        isEnabled: boolean;
    }[]>;
    updateMemberFeatures(requesterId: string, memberId: string, dto: UpdateFeaturesDto): Promise<void>;
    getMemberActions(requesterId: string, memberId: string): Promise<{
        actionName: string;
        isEnabled: boolean;
    }[]>;
    updateMemberActions(requesterId: string, memberId: string, dto: UpdateActionsDto): Promise<void>;
    allocateCreditsToMember(allocatorId: string, memberId: string, dto: AllocateTeamCreditsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    impersonateUser(impersonatorId: string, targetUserId: string, ipAddress: string, userAgent: string): Promise<ImpersonationResponseDto>;
    exitImpersonation(impersonationId: string): Promise<void>;
    getCreditUsageLogs(requesterId: string, query: CreditLogQueryDto): Promise<{
        data: CreditUsageLogDto[];
        total: number;
    }>;
    getUserCreditDetails(requesterId: string, userId: string, query: CreditDetailQueryDto): Promise<{
        user: any;
        transactions: CreditUsageDetailDto[];
        total: number;
    }>;
    private validateAccessToMember;
    private validateImpersonationPermission;
    private mapToTeamMemberResponse;
}
