import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ModuleType } from '../../../common/enums';
import { CreditAccount } from './credit-account.entity';

@Entity({ name: 'module_balances', schema: 'zorbitads' })
@Unique(['accountId', 'moduleType'])
export class ModuleBalance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @ManyToOne(() => CreditAccount, (account) => account.moduleBalances)
  @JoinColumn({ name: 'account_id' })
  creditAccount: CreditAccount;

  @Column({
    name: 'module_type',
    type: 'enum',
    enum: ModuleType,
    enumName: 'module_type',
  })
  moduleType: ModuleType;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  balance: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
