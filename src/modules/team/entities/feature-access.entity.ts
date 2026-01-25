import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { FeatureName } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'feature_access', schema: 'zorbitads' })
@Unique(['userId', 'featureName'])
export class FeatureAccess {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'feature_name',
    type: 'enum',
    enum: FeatureName,
    enumName: 'feature_name',
  })
  featureName: FeatureName;

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean;

  @Column({ name: 'granted_by', type: 'uuid', nullable: true })
  grantedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'granted_by' })
  grantor: User;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamptz' })
  grantedAt: Date;
}
