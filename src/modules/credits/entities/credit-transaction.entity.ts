import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  TransactionType,
  ModuleType,
  ActionType,
} from '../../../common/enums';
import { CreditAccount } from './credit-account.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'credit_transactions', schema: 'zorbitads' })
export class CreditTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id', type: 'uuid' })
  accountId: string;

  @ManyToOne(() => CreditAccount, (account) => account.transactions)
  @JoinColumn({ name: 'account_id' })
  creditAccount: CreditAccount;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: TransactionType,
    enumName: 'transaction_type',
  })
  transactionType: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    name: 'module_type',
    type: 'enum',
    enum: ModuleType,
    enumName: 'module_type',
    default: ModuleType.UNIFIED_BALANCE,
  })
  moduleType: ModuleType;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: ActionType,
    enumName: 'action_type',
  })
  actionType: ActionType;

  @Column({ name: 'source_user_id', type: 'uuid', nullable: true })
  sourceUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'source_user_id' })
  sourceUser: User;

  @Column({ name: 'resource_id', length: 255, nullable: true })
  resourceId: string;

  @Column({ name: 'resource_type', length: 100, nullable: true })
  resourceType: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    name: 'balance_before',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  balanceBefore: number;

  @Column({
    name: 'balance_after',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  balanceAfter: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
