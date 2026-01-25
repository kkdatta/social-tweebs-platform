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

export enum PaidCollabReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum InfluencerCategory {
  ALL = 'ALL',
  NANO = 'NANO',       // < 10K followers
  MICRO = 'MICRO',     // 10K - 100K followers
  MACRO = 'MACRO',     // 100K - 500K followers
  MEGA = 'MEGA',       // > 500K followers
}

export enum QueryLogic {
  AND = 'AND',         // Hashtag AND Mention both must be present
  OR = 'OR',           // Either Hashtag OR Mention
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

@Entity({ name: 'paid_collab_reports', schema: 'zorbitads' })
export class PaidCollabReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled Report' })
  title: string;

  @Column({ length: 50 })
  platform: string; // INSTAGRAM, TIKTOK

  @Column({ type: 'varchar', length: 50, default: PaidCollabReportStatus.PENDING })
  status: PaidCollabReportStatus;

  // Search criteria
  @Column({ type: 'text', array: true, nullable: true })
  hashtags: string[];

  @Column({ type: 'text', array: true, nullable: true })
  mentions: string[];

  @Column({ name: 'query_logic', type: 'varchar', length: 10, default: QueryLogic.OR })
  queryLogic: QueryLogic;

  // Date range (max 3 months)
  @Column({ name: 'date_range_start', type: 'date' })
  dateRangeStart: Date;

  @Column({ name: 'date_range_end', type: 'date' })
  dateRangeEnd: Date;

  // Aggregated metrics
  @Column({ name: 'total_influencers', type: 'int', default: 0 })
  totalInfluencers: number;

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

  @Column({ name: 'avg_engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  avgEngagementRate?: number;

  @Column({ name: 'engagement_views_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  engagementViewsRate?: number;

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
  @OneToMany(() => PaidCollabInfluencer, (inf) => inf.report)
  influencers: PaidCollabInfluencer[];

  @OneToMany(() => PaidCollabPost, (post) => post.report)
  posts: PaidCollabPost[];

  @OneToMany(() => PaidCollabShare, (share) => share.report)
  shares: PaidCollabShare[];

  @OneToMany(() => PaidCollabCategorization, (cat) => cat.report)
  categorizations: PaidCollabCategorization[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

@Entity({ name: 'paid_collab_influencers', schema: 'zorbitads' })
export class PaidCollabInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => PaidCollabReport, (report) => report.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: PaidCollabReport;

  // Profile reference
  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId?: string;

  @Column({ name: 'platform_user_id', length: 255, nullable: true })
  platformUserId?: string;

  @Column({ name: 'influencer_name', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string;

  // Metrics
  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

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

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  engagementRate?: number;

  // Category based on follower count
  @Column({ name: 'category', type: 'varchar', length: 20, default: InfluencerCategory.ALL })
  category: InfluencerCategory;

  // Credibility score
  @Column({ name: 'credibility_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  credibilityScore?: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'paid_collab_posts', schema: 'zorbitads' })
export class PaidCollabPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => PaidCollabReport, (report) => report.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: PaidCollabReport;

  @Column({ name: 'influencer_id', type: 'uuid', nullable: true })
  influencerId?: string;

  @ManyToOne(() => PaidCollabInfluencer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_id' })
  influencer?: PaidCollabInfluencer;

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
  caption?: string;

  // Matched criteria
  @Column({ name: 'matched_hashtags', type: 'text', array: true, nullable: true })
  matchedHashtags?: string[];

  @Column({ name: 'matched_mentions', type: 'text', array: true, nullable: true })
  matchedMentions?: string[];

  // Is sponsored post
  @Column({ name: 'is_sponsored', default: false })
  isSponsored: boolean;

  // Post metrics
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'shares_count', type: 'int', default: 0 })
  sharesCount: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  engagementRate?: number;

  @Column({ name: 'post_date', type: 'date', nullable: true })
  postDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'paid_collab_categorizations', schema: 'zorbitads' })
export class PaidCollabCategorization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => PaidCollabReport, (report) => report.categorizations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: PaidCollabReport;

  @Column({ type: 'varchar', length: 20 })
  category: InfluencerCategory;

  @Column({ name: 'accounts_count', type: 'int', default: 0 })
  accountsCount: number;

  @Column({ name: 'followers_count', type: 'bigint', default: 0 })
  followersCount: number;

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

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  engagementRate?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'paid_collab_shares', schema: 'zorbitads' })
export class PaidCollabShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => PaidCollabReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: PaidCollabReport;

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
