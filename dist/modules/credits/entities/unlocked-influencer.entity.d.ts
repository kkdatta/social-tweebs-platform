import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class UnlockedInfluencer {
    id: string;
    userId: string;
    user: User;
    influencerId: string;
    platform: PlatformType;
    unlockType: string;
    creditsUsed: number;
    createdAt: Date;
}
