import { User } from '../../users/entities/user.entity';
export declare class ImpersonationLog {
    id: string;
    impersonatorId: string;
    impersonator: User;
    targetUserId: string;
    targetUser: User;
    sessionTokenHash: string;
    ipAddress: string;
    userAgent: string;
    startedAt: Date;
    endedAt: Date;
    isActive: boolean;
}
