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

export enum TieBreakerStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TieBreakerPlatform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
}

export enum TieBreakerSharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

/**
 * Main Tie Breaker Comparison entity
 */
@Entity({ name: 'tie_breaker_comparisons', schema: 'zorbitads' })
export class TieBreakerComparison {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Influencer Comparison' })
  title: string;

  @Column({ type: 'varchar', length: 50 })
  platform: TieBreakerPlatform;

  @Column({ type: 'varchar', length: 50, default: TieBreakerStatus.PENDING })
  status: TieBreakerStatus;

  @Column({ name: 'search_query', type: 'text', nullable: true })
  searchQuery?: string;

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
  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ name: 'share_url_token', type: 'varchar', length: 100, unique: true, nullable: true })
  shareUrlToken?: string;

  // Credits
  @Column({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 0 })
  creditsUsed: number;

  // Error tracking
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  // Relations
  @OneToMany(() => TieBreakerInfluencer, (inf) => inf.comparison)
  influencers: TieBreakerInfluencer[];

  @OneToMany(() => TieBreakerShare, (share) => share.comparison)
  shares: TieBreakerShare[];
}

/**
 * Influencer data in a comparison
 */
@Entity({ name: 'tie_breaker_influencers', schema: 'zorbitads' })
export class TieBreakerInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comparison_id', type: 'uuid' })
  comparisonId: string;

  @ManyToOne(() => TieBreakerComparison, (comp) => comp.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comparison_id' })
  comparison: TieBreakerComparison;

  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId?: string;

  @Column({ name: 'platform_user_id', type: 'varchar', length: 255, nullable: true })
  platformUserId?: string;

  @Column({ name: 'influencer_name', type: 'varchar', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', type: 'varchar', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ type: 'varchar', length: 50 })
  platform: string;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string;

  // Overview Metrics
  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

  @Column({ name: 'following_count', type: 'bigint', default: 0, nullable: true })
  followingCount?: number;

  @Column({ name: 'avg_likes', type: 'bigint', default: 0 })
  avgLikes: number;

  @Column({ name: 'avg_views', type: 'bigint', default: 0 })
  avgViews: number;

  @Column({ name: 'avg_comments', type: 'bigint', default: 0 })
  avgComments: number;

  @Column({ name: 'avg_reel_views', type: 'bigint', default: 0, nullable: true })
  avgReelViews?: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, default: 0 })
  engagementRate: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  // Followers' Audience Data (JSONB)
  @Column({ name: 'audience_quality', type: 'decimal', precision: 5, scale: 2, nullable: true })
  audienceQuality?: number;

  @Column({ name: 'notable_followers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  notableFollowersPct?: number;

  @Column({ name: 'followers_gender_data', type: 'jsonb', nullable: true })
  followersGenderData?: { male: number; female: number };

  @Column({ name: 'followers_age_data', type: 'jsonb', nullable: true })
  followersAgeData?: Array<{ ageRange: string; male: number; female: number }>;

  @Column({ name: 'followers_countries', type: 'jsonb', nullable: true })
  followersCountries?: Array<{ country: string; percentage: number }>;

  @Column({ name: 'followers_cities', type: 'jsonb', nullable: true })
  followersCities?: Array<{ city: string; percentage: number }>;

  @Column({ name: 'followers_interests', type: 'jsonb', nullable: true })
  followersInterests?: Array<{ interest: string; percentage: number }>;

  // Engagers' Audience Data (JSONB)
  @Column({ name: 'engagers_quality', type: 'decimal', precision: 5, scale: 2, nullable: true })
  engagersQuality?: number;

  @Column({ name: 'notable_engagers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  notableEngagersPct?: number;

  @Column({ name: 'engagers_gender_data', type: 'jsonb', nullable: true })
  engagersGenderData?: { male: number; female: number };

  @Column({ name: 'engagers_age_data', type: 'jsonb', nullable: true })
  engagersAgeData?: Array<{ ageRange: string; male: number; female: number }>;

  @Column({ name: 'engagers_countries', type: 'jsonb', nullable: true })
  engagersCountries?: Array<{ country: string; percentage: number }>;

  @Column({ name: 'engagers_cities', type: 'jsonb', nullable: true })
  engagersCities?: Array<{ city: string; percentage: number }>;

  @Column({ name: 'engagers_interests', type: 'jsonb', nullable: true })
  engagersInterests?: Array<{ interest: string; percentage: number }>;

  // Top Posts Data
  @Column({ name: 'top_posts', type: 'jsonb', nullable: true })
  topPosts?: Array<{
    postId: string;
    postUrl: string;
    thumbnailUrl: string;
    caption: string;
    likes: number;
    comments: number;
    views: number;
    engagementRate: number;
    isSponsored: boolean;
    postDate: string;
  }>;

  // Display order in comparison
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  // Was this influencer newly unlocked for this comparison?
  @Column({ name: 'was_unlocked', type: 'boolean', default: false })
  wasUnlocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

/**
 * Sharing settings for comparisons
 */
@Entity({ name: 'tie_breaker_shares', schema: 'zorbitads' })
export class TieBreakerShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'comparison_id', type: 'uuid' })
  comparisonId: string;

  @ManyToOne(() => TieBreakerComparison, (comp) => comp.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comparison_id' })
  comparison: TieBreakerComparison;

  @Column({ name: 'shared_with_user_id', type: 'uuid', nullable: true })
  sharedWithUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'shared_with_user_id' })
  sharedWithUser?: User;

  @Column({ name: 'shared_by_user_id', type: 'uuid' })
  sharedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shared_by_user_id' })
  sharedByUser: User;

  @Column({ name: 'permission_level', type: 'varchar', length: 50, default: TieBreakerSharePermission.VIEW })
  permissionLevel: TieBreakerSharePermission;

  @CreateDateColumn({ name: 'shared_at' })
  sharedAt: Date;
}
