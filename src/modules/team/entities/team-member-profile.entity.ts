import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InternalRoleType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'team_member_profiles', schema: 'zorbitads' })
export class TeamMemberProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'internal_role_type',
    type: 'enum',
    enum: InternalRoleType,
    enumName: 'internal_role_type',
  })
  internalRoleType: InternalRoleType;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ name: 'validity_start', type: 'timestamptz' })
  validityStart: Date;

  @Column({ name: 'validity_end', type: 'timestamptz' })
  validityEnd: Date;

  @Column({ name: 'validity_notification_enabled', default: true })
  validityNotificationEnabled: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Helper methods
  isValid(): boolean {
    const now = new Date();
    return now >= this.validityStart && now <= this.validityEnd;
  }

  daysUntilExpiry(): number {
    const now = new Date();
    const diff = this.validityEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isExpiringSoon(daysThreshold: number = 5): boolean {
    const days = this.daysUntilExpiry();
    return days > 0 && days <= daysThreshold;
  }
}
