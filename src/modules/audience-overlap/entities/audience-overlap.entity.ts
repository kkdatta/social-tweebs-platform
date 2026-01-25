import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum OverlapReportStatus {
  PENDING = 'PENDING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum OverlapSharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

@Entity({ name: 'audience_overlap_reports', schema: 'zorbitads' })
export class AudienceOverlapReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ type: 'varchar', length: 50, default: OverlapReportStatus.PENDING })
  status: OverlapReportStatus;

  // Calculated metrics
  @Column({ name: 'total_followers', type: 'int', default: 0 })
  totalFollowers: number;

  @Column({ name: 'unique_followers', type: 'int', default: 0 })
  uniqueFollowers: number;

  @Column({ name: 'overlapping_followers', type: 'int', default: 0 })
  overlappingFollowers: number;

  @Column({ name: 'overlap_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overlapPercentage?: number;

  @Column({ name: 'unique_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  uniquePercentage?: number;

  // Ownership
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  // Sharing
  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'share_url_token', length: 100, nullable: true, unique: true })
  shareUrlToken?: string;

  // Relations
  @OneToMany(() => AudienceOverlapInfluencer, (inf) => inf.report)
  influencers: AudienceOverlapInfluencer[];

  @OneToMany(() => AudienceOverlapShare, (share) => share.report)
  shares: AudienceOverlapShare[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Processing info
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;
}

@Entity({ name: 'audience_overlap_influencers', schema: 'zorbitads' })
export class AudienceOverlapInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => AudienceOverlapReport, (report) => report.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: AudienceOverlapReport;

  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId?: string;

  @Column({ name: 'influencer_name', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string;

  @Column({ name: 'follower_count', type: 'int', default: 0 })
  followerCount: number;

  // Individual metrics
  @Column({ name: 'unique_followers', type: 'int', default: 0 })
  uniqueFollowers: number;

  @Column({ name: 'unique_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  uniquePercentage?: number;

  @Column({ name: 'overlapping_followers', type: 'int', default: 0 })
  overlappingFollowers: number;

  @Column({ name: 'overlapping_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overlappingPercentage?: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'audience_overlap_shares', schema: 'zorbitads' })
export class AudienceOverlapShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => AudienceOverlapReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: AudienceOverlapReport;

  @Column({ name: 'shared_with_user_id', type: 'uuid', nullable: true })
  sharedWithUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shared_with_user_id' })
  sharedWithUser?: User;

  @Column({ name: 'shared_by_user_id', type: 'uuid' })
  sharedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shared_by_user_id' })
  sharedByUser: User;

  @Column({ name: 'permission_level', type: 'varchar', length: 50, default: OverlapSharePermission.VIEW })
  permissionLevel: OverlapSharePermission;

  @Column({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sharedAt: Date;
}
