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

// ============ ENUMS ============

export enum GroupPlatform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
}

export enum SharePermission {
  VIEW = 'VIEW',
  EDIT = 'EDIT',
  ADMIN = 'ADMIN',
}

export enum InvitationType {
  LANDING_PAGE = 'LANDING_PAGE',
  FORM_ONLY = 'FORM_ONLY',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum CurrencyType {
  INR = 'INR',
  USD = 'USD',
  RM = 'RM',
  SGD = 'SGD',
  AED = 'AED',
  VND = 'VND',
}

// ============ MAIN GROUP ENTITY ============

@Entity({ name: 'influencer_groups', schema: 'zorbitads' })
export class InfluencerGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', array: true, default: '{}' })
  platforms: string[];

  @Column({ name: 'influencer_count', type: 'integer', default: 0 })
  influencerCount: number;

  @Column({ name: 'unapproved_count', type: 'integer', default: 0 })
  unapprovedCount: number;

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

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'share_url_token', length: 100, unique: true, nullable: true })
  shareUrlToken?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => InfluencerGroupMember, (member) => member.group)
  members: InfluencerGroupMember[];

  @OneToMany(() => InfluencerGroupShare, (share) => share.group)
  shares: InfluencerGroupShare[];

  @OneToMany(() => GroupInvitation, (invitation) => invitation.group)
  invitations: GroupInvitation[];
}

// ============ GROUP MEMBER ENTITY ============

@Entity({ name: 'influencer_group_members', schema: 'zorbitads' })
export class InfluencerGroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => InfluencerGroup, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: InfluencerGroup;

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

  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

  @Column({ name: 'audience_credibility', type: 'decimal', precision: 5, scale: 2, nullable: true })
  audienceCredibility?: number;

  @Column({ name: 'engagement_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  engagementRate?: number;

  @Column({ name: 'avg_likes', type: 'bigint', nullable: true })
  avgLikes?: number;

  @Column({ name: 'avg_views', type: 'bigint', nullable: true })
  avgViews?: number;

  @Column({ name: 'added_by', type: 'uuid' })
  addedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'added_by' })
  addedBy: User;

  @Column({ name: 'source', length: 50, default: 'MANUAL' })
  source: string; // MANUAL, XLSX_IMPORT, GROUP_IMPORT, APPLICATION

  @Column({ name: 'source_group_id', type: 'uuid', nullable: true })
  sourceGroupId?: string;

  @Column({ name: 'application_id', type: 'uuid', nullable: true })
  applicationId?: string;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;
}

// ============ GROUP SHARE ENTITY ============

@Entity({ name: 'influencer_group_shares', schema: 'zorbitads' })
export class InfluencerGroupShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => InfluencerGroup, (group) => group.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: InfluencerGroup;

  @Column({ name: 'shared_with_user_id', type: 'uuid', nullable: true })
  sharedWithUserId?: string;

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

// ============ GROUP INVITATION ENTITY ============

@Entity({ name: 'group_invitations', schema: 'zorbitads' })
export class GroupInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  @ManyToOne(() => InfluencerGroup, (group) => group.invitations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: InfluencerGroup;

  @Column({ name: 'invitation_name', length: 255 })
  invitationName: string;

  @Column({ name: 'invitation_type', type: 'varchar', length: 50 })
  invitationType: InvitationType;

  @Column({ name: 'url_slug', length: 100, unique: true })
  urlSlug: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  // Landing Page Settings
  @Column({ name: 'landing_header', type: 'text', nullable: true })
  landingHeader?: string;

  @Column({ name: 'landing_content', type: 'text', nullable: true })
  landingContent?: string;

  @Column({ name: 'landing_button_text', length: 100, nullable: true })
  landingButtonText?: string;

  @Column({ name: 'landing_images', type: 'text', array: true, nullable: true })
  landingImages?: string[];

  @Column({ name: 'landing_video_url', type: 'text', nullable: true })
  landingVideoUrl?: string;

  // Form Settings
  @Column({ name: 'form_header', type: 'text', nullable: true })
  formHeader?: string;

  @Column({ name: 'form_content', type: 'text', nullable: true })
  formContent?: string;

  @Column({ name: 'form_platforms', type: 'text', array: true, default: '{}' })
  formPlatforms: string[];

  @Column({ name: 'collect_phone', default: false })
  collectPhone: boolean;

  @Column({ name: 'collect_email', default: false })
  collectEmail: boolean;

  @Column({ name: 'collect_address', default: false })
  collectAddress: boolean;

  @Column({ name: 'pricing_options', type: 'text', array: true, nullable: true })
  pricingOptions?: string[]; // PHOTO, VIDEO, STORY, CAROUSEL

  @Column({ name: 'pricing_currency', type: 'varchar', length: 10, nullable: true })
  pricingCurrency?: CurrencyType;

  @Column({ name: 'form_button_text', length: 100, nullable: true })
  formButtonText?: string;

  // Thank You Page
  @Column({ name: 'thankyou_header', type: 'text', nullable: true })
  thankyouHeader?: string;

  @Column({ name: 'thankyou_content', type: 'text', nullable: true })
  thankyouContent?: string;

  // Branding
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'background_color', length: 20, default: '#ffffff' })
  backgroundColor: string;

  @Column({ name: 'title_color', length: 20, default: '#000000' })
  titleColor: string;

  @Column({ name: 'text_color', length: 20, default: '#333333' })
  textColor: string;

  @Column({ name: 'button_bg_color', length: 20, default: '#6366f1' })
  buttonBgColor: string;

  @Column({ name: 'button_text_color', length: 20, default: '#ffffff' })
  buttonTextColor: string;

  // Notification
  @Column({ name: 'notify_on_submission', default: true })
  notifyOnSubmission: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'applications_count', type: 'integer', default: 0 })
  applicationsCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => GroupInvitationApplication, (app) => app.invitation)
  applications: GroupInvitationApplication[];
}

// ============ GROUP INVITATION APPLICATION ENTITY ============

@Entity({ name: 'group_invitation_applications', schema: 'zorbitads' })
export class GroupInvitationApplication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'invitation_id', type: 'uuid' })
  invitationId: string;

  @ManyToOne(() => GroupInvitation, (invitation) => invitation.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitation_id' })
  invitation: GroupInvitation;

  @Column({ name: 'group_id', type: 'uuid' })
  groupId: string;

  // Influencer Info
  @Column({ name: 'influencer_name', length: 255, nullable: true })
  influencerName?: string;

  @Column({ length: 50 })
  platform: string;

  @Column({ name: 'platform_username', length: 255 })
  platformUsername: string;

  @Column({ name: 'platform_url', type: 'text', nullable: true })
  platformUrl?: string;

  @Column({ name: 'follower_count', type: 'bigint', default: 0 })
  followerCount: number;

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl?: string;

  // Contact Info
  @Column({ name: 'phone_number', length: 50, nullable: true })
  phoneNumber?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Pricing Info
  @Column({ name: 'photo_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  photoPrice?: number;

  @Column({ name: 'video_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  videoPrice?: number;

  @Column({ name: 'story_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  storyPrice?: number;

  @Column({ name: 'carousel_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  carouselPrice?: number;

  @Column({ name: 'pricing_currency', type: 'varchar', length: 10, nullable: true })
  pricingCurrency?: CurrencyType;

  // Status
  @Column({
    type: 'varchar',
    length: 50,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  // Additional data
  @Column({ name: 'additional_data', type: 'jsonb', nullable: true })
  additionalData?: Record<string, any>;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'submitted_at' })
  submittedAt: Date;
}
