import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'impersonation_logs', schema: 'zorbitads' })
export class ImpersonationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'impersonator_id', type: 'uuid' })
  impersonatorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'impersonator_id' })
  impersonator: User;

  @Column({ name: 'target_user_id', type: 'uuid' })
  targetUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_user_id' })
  targetUser: User;

  @Column({ name: 'session_token_hash', length: 255, unique: true })
  sessionTokenHash: string;

  @Column({ name: 'ip_address', length: 45 })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @CreateDateColumn({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
