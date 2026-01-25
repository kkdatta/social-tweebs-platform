import { CampaignFrequency, SignupRequestStatus } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class SignupRequest {
    id: string;
    email: string;
    name: string;
    phone: string;
    businessName: string;
    campaignFrequency: CampaignFrequency;
    message: string;
    passwordHash: string;
    status: SignupRequestStatus;
    processedAt: Date;
    processedBy: string;
    processedByUser: User;
    rejectionReason: string;
    createdAt: Date;
    isPending(): boolean;
}
