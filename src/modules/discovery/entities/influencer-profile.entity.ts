import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { AudienceData } from './audience-data.entity';

@Entity({ name: 'cached_influencer_profiles', schema: 'zorbitads' })
@Index(['platform', 'platformUserId'], { unique: true })
export class InfluencerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
    enumName: 'social_platform',
  })
  platform: PlatformType;

  @Column({ name: 'platform_user_id', length: 255 })
  platformUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl: string | null;

  @Column({ type: 'text', nullable: true })
  biography: string | null;

  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

  @Column({ name: 'following_count', type: 'bigint', default: 0 })
  followingCount: number;

  @Column({ name: 'post_count', type: 'int', default: 0 })
  postCount: number;

  @Column({
    name: 'engagement_rate',
    type: 'decimal',
    precision: 8,
    scale: 4,
    nullable: true,
  })
  engagementRate: number | null;

  @Column({ name: 'avg_likes', type: 'bigint', default: 0 })
  avgLikes: number;

  @Column({ name: 'avg_comments', type: 'bigint', default: 0 })
  avgComments: number;

  @Column({ name: 'avg_views', type: 'bigint', default: 0 })
  avgViews: number;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_business_account', default: false })
  isBusinessAccount: boolean;

  @Column({ name: 'account_type', type: 'varchar', length: 50, nullable: true })
  accountType: string | null;

  @Column({ name: 'location_country', type: 'varchar', length: 100, nullable: true })
  locationCountry: string | null;

  @Column({ name: 'location_city', type: 'varchar', length: 100, nullable: true })
  locationCity: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({
    name: 'audience_credibility',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  audienceCredibility: number | null;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string | null;

  @Column({ name: 'contact_phone', type: 'varchar', length: 50, nullable: true })
  contactPhone: string | null;

  @Column({ name: 'website_url', type: 'text', nullable: true })
  websiteUrl: string | null;

  @Column({ name: 'raw_modash_data', type: 'jsonb', nullable: true })
  rawModashData: Record<string, any>;

  @Column({ name: 'modash_fetched_at', type: 'timestamptz', nullable: true })
  modashFetchedAt: Date;

  @Column({ name: 'data_ttl_expires_at', type: 'timestamptz', nullable: true })
  dataTtlExpiresAt: Date;

  @OneToMany(() => AudienceData, (audience) => audience.profile)
  audienceData: AudienceData[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'last_updated_at', type: 'timestamptz' })
  lastUpdatedAt: Date;

  // Helper method to check if data is stale
  isDataStale(): boolean {
    if (!this.dataTtlExpiresAt) return true;
    return new Date() > this.dataTtlExpiresAt;
  }
}
