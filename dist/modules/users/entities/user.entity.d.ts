import { UserRole, UserStatus } from '../../../common/enums';
import { CreditAccount } from '../../credits/entities/credit-account.entity';
import { UserPreferences } from './user-preferences.entity';
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    phone: string;
    businessName: string;
    role: UserRole;
    status: UserStatus;
    parentId: string | null;
    parent: User;
    children: User[];
    creditAccount: CreditAccount;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
    canLogin(): boolean;
    isAdmin(): boolean;
    isSuperAdmin(): boolean;
}
