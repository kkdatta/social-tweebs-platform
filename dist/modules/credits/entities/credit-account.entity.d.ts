import { User } from '../../users/entities/user.entity';
import { ModuleBalance } from './module-balance.entity';
import { CreditTransaction } from './credit-transaction.entity';
export declare class CreditAccount {
    id: string;
    userId: string;
    user: User;
    unifiedBalance: number;
    validityStart: Date;
    validityEnd: Date;
    isLocked: boolean;
    moduleBalances: ModuleBalance[];
    transactions: CreditTransaction[];
    createdAt: Date;
    updatedAt: Date;
    isActive(): boolean;
    isExpiringSoon(daysThreshold?: number): boolean;
    daysRemaining(): number;
}
