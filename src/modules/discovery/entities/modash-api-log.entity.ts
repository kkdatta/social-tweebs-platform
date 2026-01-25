import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'modash_api_logs', schema: 'zorbitads' })
export class ModashApiLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 255 })
  endpoint: string;

  @Column({ name: 'http_method', length: 10 })
  httpMethod: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'social_platform',
    nullable: true,
  })
  platform: PlatformType;

  @Column({ name: 'request_payload', type: 'jsonb', nullable: true })
  requestPayload: Record<string, any>;

  @Column({ name: 'response_status_code', type: 'int', nullable: true })
  responseStatusCode: number;

  @Column({ name: 'response_time_ms', type: 'int', nullable: true })
  responseTimeMs: number;

  @Column({
    name: 'modash_credits_consumed',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  modashCreditsConsumed: number;

  @Column({
    name: 'platform_credits_charged',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  platformCreditsCharged: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
