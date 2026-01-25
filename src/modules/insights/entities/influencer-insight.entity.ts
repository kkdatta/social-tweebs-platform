import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { PlatformType } from '../../../common/enums';

@Entity({ name: 'influencer_insights', schema: 'zorbitads' })
@Unique(['userId', 'platform', 'platformUserId'])
export class InfluencerInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'profile_id', type: 'uuid', nullable: true })
  profileId: string | null;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'social_platform',
  })
  platform: PlatformType;

  @Column({ name: 'platform_user_id', type: 'varchar', length: 255 })
  platformUserId: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  // Basic Stats
  @Column({ name: 'follower_count', type: 'bigint', nullable: true })
  followerCount: number | null;

  @Column({ name: 'following_count', type: 'bigint', nullable: true })
  followingCount: number | null;

  @Column({ name: 'post_count', type: 'int', nullable: true })
  postCount: number | null;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 8, scale: 4, nullable: true })
  engagementRate: number | null;

  @Column({ name: 'avg_likes', type: 'bigint', nullable: true })
  avgLikes: number | null;

  @Column({ name: 'avg_comments', type: 'bigint', nullable: true })
  avgComments: number | null;

  @Column({ name: 'avg_views', type: 'bigint', nullable: true })
  avgViews: number | null;

  @Column({ name: 'avg_reel_views', type: 'bigint', nullable: true })
  avgReelViews: number | null;

  @Column({ name: 'avg_reel_likes', type: 'bigint', nullable: true })
  avgReelLikes: number | null;

  @Column({ name: 'avg_reel_comments', type: 'bigint', nullable: true })
  avgReelComments: number | null;

  @Column({ name: 'brand_post_er', type: 'decimal', precision: 8, scale: 4, nullable: true })
  brandPostER: number | null;

  @Column({ name: 'posts_with_hidden_likes_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  postsWithHiddenLikesPct: number | null;

  // Location & Verification
  @Column({ name: 'location_country', type: 'varchar', length: 100, nullable: true })
  locationCountry: string | null;

  @Column({ name: 'location_city', type: 'varchar', length: 100, nullable: true })
  locationCity: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  // Credibility Scores
  @Column({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 4, nullable: true })
  audienceCredibility: number | null;

  @Column({ name: 'notable_followers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  notableFollowersPct: number | null;

  @Column({ name: 'engager_credibility', type: 'decimal', precision: 5, scale: 4, nullable: true })
  engagerCredibility: number | null;

  @Column({ name: 'notable_engagers_pct', type: 'decimal', precision: 5, scale: 2, nullable: true })
  notableEngagersPct: number | null;

  // JSONB data fields
  @Column({ name: 'audience_data', type: 'jsonb', nullable: true })
  audienceData: any;

  @Column({ name: 'engagement_data', type: 'jsonb', nullable: true })
  engagementData: any;

  @Column({ name: 'growth_data', type: 'jsonb', nullable: true })
  growthData: any;

  @Column({ name: 'lookalikes_data', type: 'jsonb', nullable: true })
  lookalikesData: any;

  @Column({ name: 'brand_affinity_data', type: 'jsonb', nullable: true })
  brandAffinityData: any;

  @Column({ name: 'interests_data', type: 'jsonb', nullable: true })
  interestsData: any;

  @Column({ name: 'hashtags_data', type: 'jsonb', nullable: true })
  hashtagsData: any;

  @Column({ name: 'recent_posts', type: 'jsonb', nullable: true })
  recentPosts: any;

  @Column({ name: 'recent_reels', type: 'jsonb', nullable: true })
  recentReels: any;

  @Column({ name: 'popular_posts', type: 'jsonb', nullable: true })
  popularPosts: any;

  @Column({ name: 'sponsored_posts', type: 'jsonb', nullable: true })
  sponsoredPosts: any;

  @Column({ name: 'word_cloud_data', type: 'jsonb', nullable: true })
  wordCloudData: any;

  // Credits and timestamps
  @Column({ name: 'credits_used', type: 'decimal', precision: 10, scale: 2, default: 1 })
  creditsUsed: number;

  @Column({ name: 'unlocked_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  unlockedAt: Date;

  @Column({ name: 'last_refreshed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastRefreshedAt: Date;

  @Column({ name: 'modash_fetched_at', type: 'timestamp', nullable: true })
  modashFetchedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
