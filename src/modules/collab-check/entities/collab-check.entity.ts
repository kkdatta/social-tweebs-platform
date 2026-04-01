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

export enum CollabReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TimePeriod {
  ONE_MONTH = '1_MONTH',
  THREE_MONTHS = '3_MONTHS',
  SIX_MONTHS = '6_MONTHS',
  ONE_YEAR = '1_YEAR',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

@Entity({ name: 'collab_check_reports', schema: 'zorbitads' })
export class CollabCheckReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ type: 'varchar', length: 50, default: CollabReportStatus.PENDING })
  status: CollabReportStatus;

  // Time period for analysis
  @Column({ name: 'time_period', type: 'varchar', length: 50 })
  timePeriod: TimePeriod;

  // Search queries (hashtags, mentions, keywords)
  @Column({ type: 'text', array: true, nullable: true })
  queries: string[];

  // Aggregated metrics
  @Column({ name: 'total_posts', type: 'int', default: 0 })
  totalPosts: number;

  @Column({ name: 'total_likes', type: 'bigint', default: 0 })
  totalLikes: number;

  @Column({ name: 'total_views', type: 'bigint', default: 0 })
  totalViews: number;

  @Column({ name: 'total_comments', type: 'bigint', default: 0 })
  totalComments: number;

  @Column({ name: 'total_shares', type: 'bigint', default: 0 })
  totalShares: number;

  @Column({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  avgEngagementRate?: number;

  @Column({ name: 'total_followers', type: 'bigint', default: 0 })
  totalFollowers: number;

  // Error tracking
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

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

  // Credits
  @Column({ name: 'credits_used', type: 'int', default: 1 })
  creditsUsed: number;

  // Relations
  @OneToMany(() => CollabCheckInfluencer, (inf) => inf.report)
  influencers: CollabCheckInfluencer[];

  @OneToMany(() => CollabCheckPost, (post) => post.report)
  posts: CollabCheckPost[];

  @OneToMany(() => CollabCheckShare, (share) => share.report)
  shares: CollabCheckShare[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

@Entity({ name: 'collab_check_influencers', schema: 'zorbitads' })
export class CollabCheckInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CollabCheckReport, (report) => report.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CollabCheckReport;

  // Profile reference
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
  @Column({ name: 'posts_count', type: 'int', default: 0 })
  postsCount: number;

  @Column({ name: 'likes_count', type: 'bigint', default: 0 })
  likesCount: number;

  @Column({ name: 'views_count', type: 'bigint', default: 0 })
  viewsCount: number;

  @Column({ name: 'comments_count', type: 'bigint', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', type: 'bigint', default: 0 })
  sharesCount: number;

  @Column({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  avgEngagementRate?: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'collab_check_posts', schema: 'zorbitads' })
export class CollabCheckPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CollabCheckReport, (report) => report.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CollabCheckReport;

  @Column({ name: 'influencer_id', type: 'uuid', nullable: true })
  influencerId?: string;

  @ManyToOne(() => CollabCheckInfluencer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_id' })
  influencer?: CollabCheckInfluencer;

  // Post info
  @Column({ name: 'post_id', length: 255, nullable: true })
  postId?: string;

  @Column({ name: 'post_url', type: 'text', nullable: true })
  postUrl?: string;

  @Column({ name: 'post_type', length: 50, nullable: true })
  postType?: string; // IMAGE, VIDEO, REEL, CAROUSEL

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Matched keywords (highlighted in UI)
  @Column({ name: 'matched_keywords', type: 'text', array: true, nullable: true })
  matchedKeywords?: string[];

  // Post metrics
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'shares_count', type: 'int', default: 0 })
  sharesCount: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  engagementRate?: number;

  @Column({ name: 'post_date', type: 'date', nullable: true })
  postDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'collab_check_shares', schema: 'zorbitads' })
export class CollabCheckShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CollabCheckReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CollabCheckReport;

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

  @Column({ name: 'permission_level', type: 'varchar', length: 50, default: SharePermission.VIEW })
  permissionLevel: SharePermission;

  @Column({ name: 'shared_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sharedAt: Date;
}
