import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InfluencerInsight } from './influencer-insight.entity';

export enum InsightAccessType {
  UNLOCK = 'UNLOCK',
  VIEW = 'VIEW',
  REFRESH = 'REFRESH',
  EXPORT = 'EXPORT',
}

@Entity({ name: 'insight_access_log', schema: 'zorbitads' })
export class InsightAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'insight_id', type: 'uuid' })
  insightId: string;

  @ManyToOne(() => InfluencerInsight)
  @JoinColumn({ name: 'insight_id' })
  insight: InfluencerInsight;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'access_type', type: 'varchar', length: 20 })
  accessType: InsightAccessType;

  @Column({ name: 'credits_deducted', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditsDeducted: number;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'accessed_at' })
  accessedAt: Date;
}
