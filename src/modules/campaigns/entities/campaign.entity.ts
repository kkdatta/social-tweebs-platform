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

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum CampaignObjective {
  BRAND_AWARENESS = 'BRAND_AWARENESS',
  ENGAGEMENT = 'ENGAGEMENT',
  CONVERSIONS = 'CONVERSIONS',
  REACH = 'REACH',
  TRAFFIC = 'TRAFFIC',
  SALES = 'SALES',
}

@Entity({ name: 'campaigns', schema: 'zorbitads' })
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: CampaignStatus.DRAFT,
  })
  status: CampaignStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  objective?: CampaignObjective;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate?: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  budget?: number;

  @Column({ length: 10, default: 'INR' })
  currency: string;

  @Column({ type: 'text', array: true, nullable: true })
  hashtags?: string[];

  @Column({ type: 'text', array: true, nullable: true })
  mentions?: string[];

  @Column({ name: 'target_audience', type: 'jsonb', nullable: true })
  targetAudience?: Record<string, any>;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CampaignInfluencer, (influencer) => influencer.campaign)
  influencers: CampaignInfluencer[];

  @OneToMany(() => CampaignDeliverable, (deliverable) => deliverable.campaign)
  deliverables: CampaignDeliverable[];

  @OneToMany(() => CampaignPost, (post) => post.campaign)
  posts: CampaignPost[];

  @OneToMany(() => CampaignShare, (share) => share.campaign)
  shares: CampaignShare[];
}

export enum InfluencerStatus {
  INVITED = 'INVITED',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
}

export enum ContractStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
}

@Entity({ name: 'campaign_influencers', schema: 'zorbitads' })
export class CampaignInfluencer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.influencers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'influencer_profile_id', type: 'uuid', nullable: true })
  influencerProfileId: string;

  @Column({ name: 'influencer_name', length: 255 })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'follower_count', type: 'integer', nullable: true })
  followerCount: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: InfluencerStatus.INVITED,
  })
  status: InfluencerStatus;

  @Column({ name: 'budget_allocated', type: 'decimal', precision: 10, scale: 2, nullable: true })
  budgetAllocated: number;

  @Column({
    name: 'payment_status',
    type: 'varchar',
    length: 50,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'payment_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  paymentAmount: number;

  @Column({
    name: 'contract_status',
    type: 'varchar',
    length: 50,
    default: ContractStatus.PENDING,
  })
  contractStatus: ContractStatus;

  @Column({ name: 'likes_count', type: 'integer', default: 0 })
  likesCount: number;

  @Column({ name: 'views_count', type: 'integer', default: 0 })
  viewsCount: number;

  @Column({ name: 'comments_count', type: 'integer', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', type: 'integer', default: 0 })
  sharesCount: number;

  @Column({ name: 'posts_count', type: 'integer', default: 0 })
  postsCount: number;

  @Column({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true })
  audienceCredibility: number;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => CampaignDeliverable, (deliverable) => deliverable.campaignInfluencer)
  deliverables: CampaignDeliverable[];

  @OneToMany(() => CampaignPost, (post) => post.campaignInfluencer)
  posts: CampaignPost[];

  @OneToMany(() => CampaignMetric, (metric) => metric.campaignInfluencer)
  metrics: CampaignMetric[];
}

export enum DeliverableType {
  POST = 'POST',
  STORY = 'STORY',
  REEL = 'REEL',
  VIDEO = 'VIDEO',
  CAROUSEL = 'CAROUSEL',
  TWEET = 'TWEET',
  THREAD = 'THREAD',
}

export enum DeliverableStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

@Entity({ name: 'campaign_deliverables', schema: 'zorbitads' })
export class CampaignDeliverable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.deliverables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'campaign_influencer_id', type: 'uuid', nullable: true })
  campaignInfluencerId: string;

  @ManyToOne(() => CampaignInfluencer, (influencer) => influencer.deliverables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_influencer_id' })
  campaignInfluencer: CampaignInfluencer;

  @Column({
    name: 'deliverable_type',
    type: 'varchar',
    length: 50,
  })
  deliverableType: DeliverableType;

  @Column({ length: 255, nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    default: DeliverableStatus.PENDING,
  })
  status: DeliverableStatus;

  @Column({ name: 'content_url', type: 'text', nullable: true })
  contentUrl: string;

  @Column({ name: 'post_id', length: 255, nullable: true })
  postId: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => CampaignMetric, (metric) => metric.deliverable)
  metrics: CampaignMetric[];
}

@Entity({ name: 'campaign_metrics', schema: 'zorbitads' })
export class CampaignMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'deliverable_id', type: 'uuid', nullable: true })
  deliverableId: string;

  @ManyToOne(() => CampaignDeliverable, (deliverable) => deliverable.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'deliverable_id' })
  deliverable: CampaignDeliverable;

  @Column({ name: 'campaign_influencer_id', type: 'uuid', nullable: true })
  campaignInfluencerId: string;

  @ManyToOne(() => CampaignInfluencer, (influencer) => influencer.metrics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_influencer_id' })
  campaignInfluencer: CampaignInfluencer;

  @CreateDateColumn({ name: 'recorded_at' })
  recordedAt: Date;

  @Column({ type: 'integer', default: 0 })
  impressions: number;

  @Column({ type: 'integer', default: 0 })
  reach: number;

  @Column({ type: 'integer', default: 0 })
  likes: number;

  @Column({ type: 'integer', default: 0 })
  comments: number;

  @Column({ type: 'integer', default: 0 })
  shares: number;

  @Column({ type: 'integer', default: 0 })
  saves: number;

  @Column({ type: 'integer', default: 0 })
  views: number;

  @Column({ type: 'integer', default: 0 })
  clicks: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  engagementRate: number;

  @Column({ name: 'cost_per_engagement', type: 'decimal', precision: 10, scale: 4, nullable: true })
  costPerEngagement: number;

  @Column({ name: 'cost_per_click', type: 'decimal', precision: 10, scale: 4, nullable: true })
  costPerClick: number;

  @Column({ name: 'cost_per_impression', type: 'decimal', precision: 10, scale: 6, nullable: true })
  costPerImpression: number;
}

export enum PostType {
  POST = 'POST',
  STORY = 'STORY',
  REEL = 'REEL',
  VIDEO = 'VIDEO',
}

@Entity({ name: 'campaign_posts', schema: 'zorbitads' })
export class CampaignPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'campaign_influencer_id', type: 'uuid', nullable: true })
  campaignInfluencerId: string;

  @ManyToOne(() => CampaignInfluencer, (influencer) => influencer.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_influencer_id' })
  campaignInfluencer: CampaignInfluencer;

  @Column({ name: 'post_url', type: 'text', nullable: true })
  postUrl: string;

  @Column({ name: 'post_type', type: 'varchar', length: 50, default: PostType.POST })
  postType: PostType;

  @Column({ length: 50, nullable: true })
  platform: string;

  @Column({ name: 'influencer_name', length: 255, nullable: true })
  influencerName: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername: string;

  @Column({ name: 'post_image_url', type: 'text', nullable: true })
  postImageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'posted_date', type: 'timestamp', nullable: true })
  postedDate: Date;

  @Column({ name: 'follower_count', type: 'integer', default: 0 })
  followerCount: number;

  @Column({ name: 'likes_count', type: 'integer', default: 0 })
  likesCount: number;

  @Column({ name: 'views_count', type: 'integer', default: 0 })
  viewsCount: number;

  @Column({ name: 'comments_count', type: 'integer', default: 0 })
  commentsCount: number;

  @Column({ name: 'shares_count', type: 'integer', default: 0 })
  sharesCount: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  engagementRate: number;

  @Column({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true })
  audienceCredibility: number;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}

@Entity({ name: 'campaign_shares', schema: 'zorbitads' })
export class CampaignShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ name: 'shared_with_user_id', type: 'uuid', nullable: true })
  sharedWithUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shared_with_user_id' })
  sharedWithUser: User;

  @Column({ name: 'shared_by_user_id', type: 'uuid' })
  sharedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shared_by_user_id' })
  sharedByUser: User;

  @Column({
    name: 'permission_level',
    type: 'varchar',
    length: 50,
    default: SharePermission.VIEW,
  })
  permissionLevel: SharePermission;

  @CreateDateColumn({ name: 'shared_at' })
  sharedAt: Date;
}
