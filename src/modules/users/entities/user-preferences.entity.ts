import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_preferences', schema: 'zorbitads' })
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.preferences)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'notify_discovery_export', default: true })
  notifyDiscoveryExport: boolean;

  @Column({ name: 'notify_collab_export', default: true })
  notifyCollabExport: boolean;

  @Column({ name: 'notify_overlap_report', default: true })
  notifyOverlapReport: boolean;

  @Column({ name: 'notify_content_discovery', default: true })
  notifyContentDiscovery: boolean;

  @Column({ name: 'notify_group_import', default: true })
  notifyGroupImport: boolean;

  @Column({ name: 'notify_campaign_import', default: true })
  notifyCampaignImport: boolean;

  @Column({ name: 'notify_report_shared', default: true })
  notifyReportShared: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
