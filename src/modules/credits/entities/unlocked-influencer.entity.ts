import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'unlocked_influencers', schema: 'zorbitads' })
@Unique(['userId', 'influencerId', 'platform'])
export class UnlockedInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'influencer_id', length: 255 })
  influencerId: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'platform_type',
  })
  platform: PlatformType;

  @Column({ name: 'unlock_type', length: 50, default: 'UNBLUR' })
  unlockType: string;

  @Column({
    name: 'credits_used',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  creditsUsed: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
