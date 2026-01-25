import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserRole, UserStatus } from '../../../common/enums';
import { CreditAccount } from '../../credits/entities/credit-account.entity';
import { UserPreferences } from './user-preferences.entity';

@Entity({ name: 'users', schema: 'zorbitads' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'business_name', length: 255, nullable: true })
  businessName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.SUB_USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    enumName: 'user_status',
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: User;

  @OneToMany(() => User, (user) => user.parent)
  children: User[];

  @OneToOne(() => CreditAccount, (creditAccount) => creditAccount.user)
  creditAccount: CreditAccount;

  @OneToOne(() => UserPreferences, (preferences) => preferences.user)
  preferences: UserPreferences;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Helper methods
  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN;
  }

  isSuperAdmin(): boolean {
    return this.role === UserRole.SUPER_ADMIN;
  }
}
