import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { InfluencerProfile } from './influencer-profile.entity';

@Entity({ name: 'influencer_insights_access', schema: 'zorbitads' })
@Index(['userId', 'influencerProfileId'], { unique: true })
export class InsightsAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'influencer_profile_id', type: 'uuid' })
  influencerProfileId: string;

  @ManyToOne(() => InfluencerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_profile_id' })
  influencerProfile: InfluencerProfile;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'social_platform',
  })
  platform: PlatformType;

  @Column({ name: 'platform_user_id', length: 255 })
  platformUserId: string;

  @Column({
    name: 'credits_used',
    type: 'decimal',
    precision: 10,
    scale: 4,
    default: 1,
  })
  creditsUsed: number;

  @Column({ name: 'first_accessed_at', type: 'timestamptz' })
  firstAccessedAt: Date;

  @Column({ name: 'last_accessed_at', type: 'timestamptz' })
  lastAccessedAt: Date;

  @Column({ name: 'access_count', type: 'int', default: 1 })
  accessCount: number;

  @Column({ name: 'last_refresh_at', type: 'timestamptz', nullable: true })
  lastRefreshAt: Date;

  @Column({ name: 'refresh_count', type: 'int', default: 0 })
  refreshCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;
}
