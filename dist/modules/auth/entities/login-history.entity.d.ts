import { User } from '../../users/entities/user.entity';
export declare class LoginHistory {
    id: string;
    userId: string | null;
    user: User;
    email: string;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    failureReason: string | null;
    createdAt: Date;
}
