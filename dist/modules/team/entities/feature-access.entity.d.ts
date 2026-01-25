import { FeatureName } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class FeatureAccess {
    id: string;
    userId: string;
    user: User;
    featureName: FeatureName;
    isEnabled: boolean;
    grantedBy: string;
    grantor: User;
    grantedAt: Date;
}
