import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { InfluencerProfile } from './influencer-profile.entity';
export declare class InsightsAccess {
    id: string;
    userId: string;
    user: User;
    influencerProfileId: string;
    influencerProfile: InfluencerProfile;
    platform: PlatformType;
    platformUserId: string;
    creditsUsed: number;
    firstAccessedAt: Date;
    lastAccessedAt: Date;
    accessCount: number;
    lastRefreshAt: Date;
    refreshCount: number;
    createdAt: Date;
    lastUpdatedAt: Date;
}
