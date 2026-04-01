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

export enum CompetitionReportStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

export enum InfluencerCategory {
  NANO = 'NANO',       // < 10K followers
  MICRO = 'MICRO',     // 10K - 100K followers
  MACRO = 'MACRO',     // 100K - 500K followers
  MEGA = 'MEGA',       // > 500K followers
}

export enum PostType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  CAROUSEL = 'CAROUSEL',
  REEL = 'REEL',
}

// Main Competition Analysis Report
@Entity({ name: 'competition_analysis_reports', schema: 'zorbitads' })
export class CompetitionAnalysisReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled Competition Report' })
  title: string;

  // Platform(s) - Instagram, TikTok
  @Column({ type: 'text', array: true, default: '{}' })
  platforms: string[];

  @Column({ type: 'varchar', length: 50, default: CompetitionReportStatus.PENDING })
  status: CompetitionReportStatus;

  // Date Range
  @Column({ name: 'date_range_start', type: 'date' })
  dateRangeStart: Date;

  @Column({ name: 'date_range_end', type: 'date' })
  dateRangeEnd: Date;

  // Auto-refresh settings
  @Column({ name: 'auto_refresh_enabled', default: false })
  autoRefreshEnabled: boolean;

  @Column({ name: 'next_refresh_date', type: 'date', nullable: true })
  nextRefreshDate?: Date;

  // Aggregated metrics (across all brands)
  @Column({ name: 'total_brands', type: 'int', default: 0 })
  totalBrands: number;

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
  @OneToMany(() => CompetitionBrand, (brand) => brand.report)
  brands: CompetitionBrand[];

  @OneToMany(() => CompetitionInfluencer, (inf) => inf.report)
  influencers: CompetitionInfluencer[];

  @OneToMany(() => CompetitionPost, (post) => post.report)
  posts: CompetitionPost[];

  @OneToMany(() => CompetitionShare, (share) => share.report)
  shares: CompetitionShare[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

// Brand entry in competition analysis
@Entity({ name: 'competition_brands', schema: 'zorbitads' })
export class CompetitionBrand {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CompetitionAnalysisReport, (report) => report.brands, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CompetitionAnalysisReport;

  @Column({ name: 'brand_name', length: 255 })
  brandName: string;

  // Search criteria for this brand
  @Column({ type: 'text', array: true, nullable: true })
  hashtags: string[];

  @Column({ length: 255, nullable: true })
  username?: string;  // @mention

  @Column({ type: 'text', array: true, nullable: true })
  keywords: string[];

  /** Per-brand platform; falls back to report-level platforms when null */
  @Column({ length: 32, nullable: true })
  platform?: string;

  // Brand color for charts
  @Column({ name: 'display_color', length: 20, nullable: true })
  displayColor?: string;

  // Brand metrics
  @Column({ name: 'influencer_count', type: 'int', default: 0 })
  influencerCount: number;

  @Column({ name: 'posts_count', type: 'int', default: 0 })
  postsCount: number;

  @Column({ name: 'total_likes', type: 'bigint', default: 0 })
  totalLikes: number;

  @Column({ name: 'total_views', type: 'bigint', default: 0 })
  totalViews: number;

  @Column({ name: 'total_comments', type: 'bigint', default: 0 })
  totalComments: number;

  @Column({ name: 'total_shares', type: 'bigint', default: 0 })
  totalShares: number;

  @Column({ name: 'total_followers', type: 'bigint', default: 0 })
  totalFollowers: number;

  @Column({ name: 'avg_engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  avgEngagementRate?: number;

  // Post type distribution
  @Column({ name: 'photo_count', type: 'int', default: 0 })
  photoCount: number;

  @Column({ name: 'video_count', type: 'int', default: 0 })
  videoCount: number;

  @Column({ name: 'carousel_count', type: 'int', default: 0 })
  carouselCount: number;

  @Column({ name: 'reel_count', type: 'int', default: 0 })
  reelCount: number;

  // Category breakdown
  @Column({ name: 'nano_count', type: 'int', default: 0 })
  nanoCount: number;

  @Column({ name: 'micro_count', type: 'int', default: 0 })
  microCount: number;

  @Column({ name: 'macro_count', type: 'int', default: 0 })
  macroCount: number;

  @Column({ name: 'mega_count', type: 'int', default: 0 })
  megaCount: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// Influencer in competition analysis
@Entity({ name: 'competition_influencers', schema: 'zorbitads' })
export class CompetitionInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CompetitionAnalysisReport, (report) => report.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CompetitionAnalysisReport;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @ManyToOne(() => CompetitionBrand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: CompetitionBrand;

  // Profile reference
  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId?: string;

  @Column({ name: 'platform_user_id', type: 'varchar', length: 255, nullable: true })
  platformUserId?: string;

  @Column({ name: 'influencer_name', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string;

  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  category?: InfluencerCategory;

  // Audience credibility
  @Column({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true })
  audienceCredibility?: number;

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

// Post in competition analysis
@Entity({ name: 'competition_posts', schema: 'zorbitads' })
export class CompetitionPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CompetitionAnalysisReport, (report) => report.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CompetitionAnalysisReport;

  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  @ManyToOne(() => CompetitionBrand, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: CompetitionBrand;

  @Column({ name: 'influencer_id', type: 'uuid', nullable: true })
  influencerId?: string;

  @ManyToOne(() => CompetitionInfluencer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'influencer_id' })
  influencer?: CompetitionInfluencer;

  @Column({ length: 50 })
  platform: string;

  // Post info
  @Column({ name: 'post_id', length: 255, nullable: true })
  postId?: string;

  @Column({ name: 'post_url', type: 'text', nullable: true })
  postUrl?: string;

  @Column({ name: 'post_type', length: 50, nullable: true })
  postType?: PostType;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Matched search criteria
  @Column({ name: 'matched_hashtags', type: 'text', array: true, nullable: true })
  matchedHashtags?: string[];

  @Column({ name: 'matched_username', length: 255, nullable: true })
  matchedUsername?: string;

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

  @Column({ name: 'is_sponsored', default: false })
  isSponsored: boolean;

  @Column({ name: 'post_date', type: 'date', nullable: true })
  postDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// Share for competition analysis reports
@Entity({ name: 'competition_shares', schema: 'zorbitads' })
export class CompetitionShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => CompetitionAnalysisReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: CompetitionAnalysisReport;

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
