import { ModuleType } from '../../../common/enums';
import { CreditAccount } from './credit-account.entity';
export declare class ModuleBalance {
    id: string;
    accountId: string;
    creditAccount: CreditAccount;
    moduleType: ModuleType;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
}
