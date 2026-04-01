import { InternalRoleType, FeatureName, ActionName, UserStatus, ModuleType } from '../../../common/enums';
export declare class CreateTeamMemberDto {
    name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    roleType: InternalRoleType;
    validityStart: string;
    validityEnd: string;
    validityNotificationEnabled?: boolean;
    enabledFeatures?: FeatureName[];
    enabledActions?: ActionName[];
    initialCredits?: number;
    creditComment?: string;
}
export declare class UpdateTeamMemberDto {
    name?: string;
    phone?: string;
    country?: string;
    roleType?: InternalRoleType;
    validityStart?: string;
    validityEnd?: string;
    validityNotificationEnabled?: boolean;
    status?: UserStatus;
    password?: string;
}
export declare class FeatureToggleDto {
    featureName: FeatureName;
    isEnabled: boolean;
}
export declare class UpdateFeaturesDto {
    features: FeatureToggleDto[];
}
export declare class ActionToggleDto {
    actionName: ActionName;
    isEnabled: boolean;
}
export declare class UpdateActionsDto {
    actions: ActionToggleDto[];
}
export declare class AllocateTeamCreditsDto {
    amount: number;
    moduleType?: ModuleType;
    comment?: string;
}
export declare class TeamMemberResponseDto {
    id: string;
    name: string;
    email: string;
    phone: string;
    country: string;
    role: string;
    internalRoleType: string;
    status: string;
    creditBalance: number;
    validityStart: Date | null;
    validityEnd: Date | null;
    daysUntilExpiry: number;
    lastActiveAt: Date;
    createdAt: Date;
    enabledFeatures: string[];
    enabledActions: string[];
}
export declare class CreditUsageLogDto {
    userId: string;
    userName: string;
    email: string;
    country: string;
    currentBalance: number;
    totalCreditsAdded: number;
    totalCreditsUsed: number;
    discoveryCreditsUsed: number;
    insightsCreditsUsed: number;
    lastActiveAt: Date;
}
export declare class CreditUsageDetailDto {
    month: string;
    moduleType: string;
    transactionType: string;
    amount: number;
    comment: string;
    createdAt: Date;
}
export declare class TeamMemberQueryDto {
    search?: string;
    status?: UserStatus;
    roleType?: InternalRoleType;
    page?: number;
    limit?: number;
}
export declare class CreditLogQueryDto {
    search?: string;
    page?: number;
    limit?: number;
}
export declare class CreditDetailQueryDto {
    transactionType?: string;
    moduleType?: ModuleType;
    page?: number;
    limit?: number;
}
export declare class ImpersonationResponseDto {
    accessToken: string;
    impersonationId: string;
    targetUser: {
        id: string;
        name: string;
        email: string;
        role: string;
    };
}
