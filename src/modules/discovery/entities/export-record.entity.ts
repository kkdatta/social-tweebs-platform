import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'discovery_export_records', schema: 'zorbitads' })
@Index(['userId'])
export class ExportRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'format', length: 20, default: 'csv' })
  format: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'platform_type',
    nullable: true,
  })
  platform: PlatformType;

  @Column({ name: 'profile_ids', type: 'jsonb' })
  profileIds: string[];

  @Column({ name: 'exported_count', type: 'int' })
  exportedCount: number;

  @Column({
    name: 'credits_used',
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0,
  })
  creditsUsed: number;

  @Column({ name: 'excluded_previously_exported', default: false })
  excludedPreviouslyExported: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
