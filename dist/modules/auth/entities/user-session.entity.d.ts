import { User } from '../../users/entities/user.entity';
export declare class UserSession {
    id: string;
    userId: string;
    user: User;
    refreshTokenHash: string;
    ipAddress: string;
    userAgent: string;
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt: Date;
    createdAt: Date;
    isValid(): boolean;
}
