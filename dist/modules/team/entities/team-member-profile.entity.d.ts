import { InternalRoleType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class TeamMemberProfile {
    id: string;
    userId: string;
    user: User;
    internalRoleType: InternalRoleType;
    country: string;
    validityStart: Date;
    validityEnd: Date;
    validityNotificationEnabled: boolean;
    createdBy: string;
    creator: User;
    createdAt: Date;
    updatedAt: Date;
    isValid(): boolean;
    daysUntilExpiry(): number;
    isExpiringSoon(daysThreshold?: number): boolean;
}
