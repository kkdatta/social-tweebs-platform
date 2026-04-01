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

export enum SentimentReportStatus {
  PENDING = 'PENDING',
  AGGREGATING = 'AGGREGATING',
  IN_PROCESS = 'IN_PROCESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ReportType {
  POST = 'POST',
  PROFILE = 'PROFILE',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
}

@Entity({ name: 'sentiment_reports', schema: 'zorbitads' })
export class SentimentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, default: 'Untitled' })
  title: string;

  // Analysis target
  @Column({ name: 'report_type', type: 'varchar', length: 50 })
  reportType: ReportType;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'target_url', type: 'text' })
  targetUrl: string;

  // Influencer info
  @Column({ name: 'influencer_name', length: 255, nullable: true })
  influencerName?: string;

  @Column({ name: 'influencer_username', length: 255, nullable: true })
  influencerUsername?: string;

  @Column({ name: 'influencer_avatar_url', type: 'text', nullable: true })
  influencerAvatarUrl?: string;

  // Status
  @Column({ type: 'varchar', length: 50, default: SentimentReportStatus.PENDING })
  status: SentimentReportStatus;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  // Sentiment scores
  @Column({ name: 'overall_sentiment_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  overallSentimentScore?: number;

  @Column({ name: 'positive_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  positivePercentage?: number;

  @Column({ name: 'neutral_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  neutralPercentage?: number;

  @Column({ name: 'negative_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  negativePercentage?: number;

  // Deep brand analysis
  @Column({ name: 'deep_brand_analysis', default: false })
  deepBrandAnalysis: boolean;

  @Column({ name: 'brand_name', length: 255, nullable: true })
  brandName?: string;

  @Column({ name: 'brand_username', length: 255, nullable: true })
  brandUsername?: string;

  @Column({ name: 'product_name', length: 255, nullable: true })
  productName?: string;

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
  @OneToMany(() => SentimentPost, (post) => post.report)
  posts: SentimentPost[];

  @OneToMany(() => SentimentEmotion, (emotion) => emotion.report)
  emotions: SentimentEmotion[];

  @OneToMany(() => SentimentWordCloud, (word) => word.report)
  wordCloud: SentimentWordCloud[];

  @OneToMany(() => SentimentShare, (share) => share.report)
  shares: SentimentShare[];

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

@Entity({ name: 'sentiment_posts', schema: 'zorbitads' })
export class SentimentPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => SentimentReport, (report) => report.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: SentimentReport;

  // Post info
  @Column({ name: 'post_id', length: 255, nullable: true })
  postId?: string;

  @Column({ name: 'post_url', type: 'text', nullable: true })
  postUrl?: string;

  @Column({ name: 'thumbnail_url', type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Post metrics
  @Column({ name: 'likes_count', type: 'int', default: 0 })
  likesCount: number;

  @Column({ name: 'comments_count', type: 'int', default: 0 })
  commentsCount: number;

  @Column({ name: 'views_count', type: 'int', default: 0 })
  viewsCount: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  engagementRate?: number;

  // Sentiment for this post
  @Column({ name: 'sentiment_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  sentimentScore?: number;

  @Column({ name: 'positive_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  positivePercentage?: number;

  @Column({ name: 'neutral_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  neutralPercentage?: number;

  @Column({ name: 'negative_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  negativePercentage?: number;

  @Column({ name: 'comments_analyzed', type: 'int', default: 0 })
  commentsAnalyzed: number;

  @Column({ name: 'post_date', type: 'date', nullable: true })
  postDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity({ name: 'sentiment_emotions', schema: 'zorbitads' })
export class SentimentEmotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => SentimentReport, (report) => report.emotions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: SentimentReport;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId?: string;

  @ManyToOne(() => SentimentPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post?: SentimentPost;

  @Column({ length: 50 })
  emotion: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @Column({ type: 'int', default: 0 })
  count: number;
}

@Entity({ name: 'sentiment_wordcloud', schema: 'zorbitads' })
export class SentimentWordCloud {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => SentimentReport, (report) => report.wordCloud, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: SentimentReport;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId?: string;

  @ManyToOne(() => SentimentPost, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post?: SentimentPost;

  @Column({ length: 100 })
  word: string;

  @Column({ type: 'int' })
  frequency: number;

  @Column({ length: 20, nullable: true })
  sentiment?: string;
}

@Entity({ name: 'sentiment_shares', schema: 'zorbitads' })
export class SentimentShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId: string;

  @ManyToOne(() => SentimentReport, (report) => report.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: SentimentReport;

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
