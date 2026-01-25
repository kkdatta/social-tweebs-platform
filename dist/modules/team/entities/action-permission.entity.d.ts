import { ActionName } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class ActionPermission {
    id: string;
    userId: string;
    user: User;
    actionName: ActionName;
    isEnabled: boolean;
    grantedBy: string;
    grantor: User;
    grantedAt: Date;
}
