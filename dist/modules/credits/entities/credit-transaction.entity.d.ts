import { TransactionType, ModuleType, ActionType } from '../../../common/enums';
import { CreditAccount } from './credit-account.entity';
import { User } from '../../users/entities/user.entity';
export declare class CreditTransaction {
    id: string;
    accountId: string;
    creditAccount: CreditAccount;
    transactionType: TransactionType;
    amount: number;
    moduleType: ModuleType;
    actionType: ActionType;
    sourceUserId: string;
    sourceUser: User;
    resourceId: string;
    resourceType: string;
    comment: string;
    metadata: Record<string, any>;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: Date;
}
