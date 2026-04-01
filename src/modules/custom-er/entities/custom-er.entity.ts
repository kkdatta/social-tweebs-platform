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

export enum CustomErReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum PostType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  REEL = 'REEL',
  CAROUSEL = 'CAROUSEL',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

@Entity({ name: 'custom_er_reports', schema: 'zorbitads' })
export class CustomErReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Influencer info
  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId?: string;

  @Column({ name: 'influencer_name', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ name: 'influencer_profile_url', type: 'text', nullable: true })
  influencerProfileUrl?: string;

  @Column({ name: 'influencer_avatar_url', type: 'text', nullable: true })
  influencerAvatarUrl?: string;

  @Column({ name: 'follower_count', type: 'int', default: 0 })
  followerCount: number;

  @Column({ length: 50 })
  platform: string;

  // Report parameters
  @Column({ name: 'date_range_start', type: 'date' })
  dateRangeStart: Date;

  @Column({ name: 'date_range_end', type: 'date' })
  dateRangeEnd: Date;

  // Status
  @Column({ type: 'varchar', length: 50, default: CustomErReportStatus.PENDING })
  status: CustomErReportStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  // All Posts Metrics
  @Column({ name: 'all_posts_count', type: 'int', default: 0 })
  allPostsCount: number;

  @Column({ name: 'all_likes_count', type: 'bigint', default: 0 })
  allLikesCount: number;

  @Column({ name: 'all_views_count', type: 'bigint', default: 0 })
  allViewsCount: number;

  @Column({ name: 'all_comments_count', type: 'bigint', default: 0 })
  allCommentsCount: number;

  @Column({ name: 'all_shares_count', type: 'bigint', default: 0 })
  allSharesCount: number;

  @Column({ name: 'all_avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  allAvgEngagementRate?: number;

  @Column({ name: 'all_engagement_views_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  allEngagementViewsRate?: number;

  // Sponsored Posts Metrics
  @Column({ name: 'sponsored_posts_count', type: 'int', default: 0 })
  sponsoredPostsCount: number;

  @Column({ name: 'sponsored_likes_count', type: 'bigint', default: 0 })
  sponsoredLikesCount: number;

  @Column({ name: 'sponsored_views_count', type: 'bigint', default: 0 })
  sponsoredViewsCount: number;

  @Column({ name: 'sponsored_comments_count', type: 'bigint', default: 0 })
  sponsoredCommentsCount: number;

  @Column({ name: 'sponsored_shares_count', type: 'bigint', default: 0 })
  sponsoredSharesCount: number;

  @Column({ name: 'sponsored_avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  sponsoredAvgEngagementRate?: number;

  @Column({ name: 'sponsored_engagement_views_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  sponsoredEngagementViewsRate?: number;

  @Column({ name: 'has_sponsored_posts', default: false })
  hasSponsoredPosts: boolean;

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
  @OneToMany(() => CustomErPost, (post) => post.report)
  posts: CustomErPost[];

  @OneToMany(() => CustomErShare, (share) => share.report)
  shares: CustomErShare[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

@Entity({ name: 'custom_er_posts', schema: 'zorbitads' })
export class CustomErPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CustomErReport, (report) => report.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CustomErReport;

  // Post info
  @Column({ name: 'post_id', length: 255, nullable: true })
  postId?: string;

  @Column({ name: 'post_url', type: 'text', nullable: true })
  postUrl?: string;

  @Column({ name: 'post_type', type: 'varchar', length: 50, nullable: true })
  postType?: PostType;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, nullable: true })
  hashtags?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  mentions?: string[];

  // Metrics
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', type: 'int', default: 0 })
  sharesCount: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  engagementRate?: number;

  // Classification
  @Column({ name: 'is_sponsored', default: false })
  isSponsored: boolean;

  @Column({ name: 'post_date', type: 'date' })
  postDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'custom_er_shares', schema: 'zorbitads' })
export class CustomErShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CustomErReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CustomErReport;

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
