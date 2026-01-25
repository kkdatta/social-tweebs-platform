import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ModuleBalance } from './module-balance.entity';
import { CreditTransaction } from './credit-transaction.entity';

@Entity({ name: 'credit_accounts', schema: 'zorbitads' })
export class CreditAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.creditAccount)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'unified_balance',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  unifiedBalance: number;

  @Column({ name: 'validity_start', type: 'timestamptz' })
  validityStart: Date;

  @Column({ name: 'validity_end', type: 'timestamptz' })
  validityEnd: Date;

  @Column({ name: 'is_locked', default: false })
  isLocked: boolean;

  @OneToMany(() => ModuleBalance, (moduleBalance) => moduleBalance.creditAccount)
  moduleBalances: ModuleBalance[];

  @OneToMany(() => CreditTransaction, (transaction) => transaction.creditAccount)
  transactions: CreditTransaction[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Helper methods
  isActive(): boolean {
    const now = new Date();
    return (
      !this.isLocked &&
      now >= this.validityStart &&
      now <= this.validityEnd
    );
  }

  isExpiringSoon(daysThreshold: number = 7): boolean {
    const now = new Date();
    const threshold = new Date(this.validityEnd);
    threshold.setDate(threshold.getDate() - daysThreshold);
    return now >= threshold && now <= this.validityEnd;
  }

  daysRemaining(): number {
    const now = new Date();
    const diff = this.validityEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
