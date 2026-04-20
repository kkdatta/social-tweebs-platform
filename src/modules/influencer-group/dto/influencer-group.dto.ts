import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  IsOptional,
  IsUUID,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  GroupPlatform,
  SharePermission,
  InvitationType,
  ApplicationStatus,
  CurrencyType,
} from '../entities/influencer-group.entity';

// ============ GROUP DTOs ============

export class CreateGroupDto {
  @ApiProperty({ description: 'Group name', example: 'Fashion Influencers Q1 2026' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Platforms for this group',
    example: ['INSTAGRAM', 'YOUTUBE'],
    enum: GroupPlatform,
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsEnum(GroupPlatform, { each: true })
  platforms: GroupPlatform[];
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ description: 'Group name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ description: 'Group description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Platforms for this group',
    enum: GroupPlatform,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsEnum(GroupPlatform, { each: true })
  platforms?: GroupPlatform[];

  @ApiPropertyOptional({ description: 'Make group public' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class GroupFilterDto {
  @ApiPropertyOptional({ description: 'Tab filter', example: 'created_by_me' })
  @IsOptional()
  @IsString()
  tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me';

  @ApiPropertyOptional({ description: 'Filter by platforms', isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(GroupPlatform, { each: true })
  platforms?: GroupPlatform[];

  @ApiPropertyOptional({ description: 'Search by name or keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// ============ MEMBER DTOs ============

@ValidatorConstraint({ name: 'hasInfluencerNameOrId', async: false })
export class HasInfluencerNameOrIdConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const o = args.object as AddInfluencerDto;
    const name = o.influencerName?.trim();
    return !!(name && name.length > 0) || !!o.influencerProfileId || !!(o.platformUserId?.trim());
  }
  defaultMessage() {
    return 'Provide influencerName, influencerProfileId, or platformUserId';
  }
}

export class AddInfluencerDto {
  @ApiPropertyOptional({ description: 'Influencer display name (optional if profile or platform user id is set)' })
  @Validate(HasInfluencerNameOrIdConstraint)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  influencerName?: string;

  @ApiPropertyOptional({ description: 'Influencer username on platform' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  influencerUsername?: string;

  @ApiPropertyOptional({
    description: 'Platform; when omitted, the group’s first platform is used',
    enum: GroupPlatform,
  })
  @Validate(HasInfluencerNameOrIdConstraint)
  @IsOptional()
  @IsEnum(GroupPlatform)
  platform?: GroupPlatform;

  @ApiPropertyOptional({ description: 'Profile ID from cached profiles' })
  @Validate(HasInfluencerNameOrIdConstraint)
  @IsOptional()
  @IsUUID()
  influencerProfileId?: string;

  @ApiPropertyOptional({ description: 'Platform user ID' })
  @Validate(HasInfluencerNameOrIdConstraint)
  @IsOptional()
  @IsString()
  platformUserId?: string;

  @ApiPropertyOptional({ description: 'Profile picture URL' })
  @IsOptional()
  @IsUrl()
  profilePictureUrl?: string;

  @ApiPropertyOptional({ description: 'Follower count', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  followerCount?: number;

  @ApiPropertyOptional({ description: 'Audience credibility percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  audienceCredibility?: number;

  @ApiPropertyOptional({ description: 'Engagement rate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  engagementRate?: number;

  @ApiPropertyOptional({ description: 'Average likes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avgLikes?: number;

  @ApiPropertyOptional({ description: 'Average views' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avgViews?: number;
}

export class BulkAddInfluencersDto {
  @ApiProperty({ description: 'List of influencers to add', type: [AddInfluencerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddInfluencerDto)
  influencers: AddInfluencerDto[];
}

export class ImportFromGroupDto {
  @ApiProperty({ description: 'Source group ID to import from' })
  @IsUUID()
  sourceGroupId: string;

  @ApiPropertyOptional({ description: 'Specific influencer IDs to import (if empty, imports all)' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  influencerIds?: string[];
}

export class CopyInfluencersDto {
  @ApiProperty({ description: 'Influencer member IDs to copy' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  memberIds: string[];

  @ApiProperty({ description: 'Target group ID to copy to' })
  @IsUUID()
  targetGroupId: string;
}

export class RemoveInfluencersDto {
  @ApiProperty({ description: 'Influencer member IDs to remove' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  memberIds: string[];
}

export class MemberFilterDto {
  @ApiPropertyOptional({ description: 'Filter by platform', enum: GroupPlatform })
  @IsOptional()
  @IsEnum(GroupPlatform)
  platform?: GroupPlatform;

  @ApiPropertyOptional({ description: 'Search by name or username' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', default: 'addedAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

// ============ SHARE DTOs ============

export class ShareGroupDto {
  @ApiPropertyOptional({ description: 'User ID to share with' })
  @IsOptional()
  @IsUUID()
  sharedWithUserId?: string;

  @ApiPropertyOptional({ description: 'Email of user to share with (must be registered)' })
  @IsOptional()
  @IsString()
  shareWithEmail?: string;

  @ApiPropertyOptional({
    description: 'Permission level',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  @IsOptional()
  @IsEnum(SharePermission)
  permissionLevel?: SharePermission;

  @ApiPropertyOptional({ description: 'Make group public (accessible via URL)' })
  @IsOptional()
  @IsBoolean()
  makePublic?: boolean;
}

// ============ INVITATION DTOs ============

export class CreateInvitationDto {
  @ApiProperty({ description: 'Invitation name for reference' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  invitationName: string;

  @ApiProperty({ description: 'Invitation type', enum: InvitationType })
  @IsEnum(InvitationType)
  invitationType: InvitationType;

  @ApiProperty({ description: 'Custom URL slug (permanent)' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  urlSlug: string;

  // Landing Page Settings (for LANDING_PAGE type)
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landingHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landingContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landingButtonText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  landingImages?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  landingVideoUrl?: string;

  // Form Settings
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formContent?: string;

  @ApiProperty({ description: 'Platforms for application form', enum: GroupPlatform, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(GroupPlatform, { each: true })
  formPlatforms: GroupPlatform[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  collectPhone?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  collectEmail?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  collectAddress?: boolean;

  @ApiPropertyOptional({ description: 'Pricing options', example: ['PHOTO', 'VIDEO'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pricingOptions?: string[];

  @ApiPropertyOptional({ enum: CurrencyType })
  @IsOptional()
  @IsEnum(CurrencyType)
  pricingCurrency?: CurrencyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formButtonText?: string;

  // Thank You Page
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thankyouHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thankyouContent?: string;

  // Branding
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional({ default: '#ffffff' })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({ default: '#000000' })
  @IsOptional()
  @IsString()
  titleColor?: string;

  @ApiPropertyOptional({ default: '#333333' })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiPropertyOptional({ default: '#6366f1' })
  @IsOptional()
  @IsString()
  buttonBgColor?: string;

  @ApiPropertyOptional({ default: '#ffffff' })
  @IsOptional()
  @IsString()
  buttonTextColor?: string;

  // Notification
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnSubmission?: boolean;
}

export class UpdateInvitationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // All other editable fields...
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landingHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landingContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formHeader?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnSubmission?: boolean;
}

// ============ APPLICATION DTOs ============

export class SubmitApplicationDto {
  @ApiProperty({ description: 'Platform', enum: GroupPlatform })
  @IsEnum(GroupPlatform)
  platform: GroupPlatform;

  @ApiProperty({ description: 'Platform username' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  platformUsername: string;

  @ApiPropertyOptional({ description: 'Platform profile URL' })
  @IsOptional()
  @IsUrl()
  platformUrl?: string;

  @ApiPropertyOptional({ description: 'Influencer name' })
  @IsOptional()
  @IsString()
  influencerName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  photoPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  videoPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  carouselPrice?: number;

  @ApiPropertyOptional({ enum: CurrencyType })
  @IsOptional()
  @IsEnum(CurrencyType)
  pricingCurrency?: CurrencyType;

  @ApiPropertyOptional()
  @IsOptional()
  additionalData?: Record<string, any>;
}

export class ApplicationFilterDto {
  @ApiPropertyOptional({ enum: GroupPlatform })
  @IsOptional()
  @IsEnum(GroupPlatform)
  platform?: GroupPlatform;

  @ApiPropertyOptional({ enum: ApplicationStatus })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class BulkApproveApplicationsDto {
  @ApiProperty({ description: 'Application IDs to approve' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  applicationIds: string[];
}

export class BulkRejectApplicationsDto {
  @ApiProperty({ description: 'Application IDs to reject' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  applicationIds: string[];

  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

// ============ RESPONSE DTOs ============

export class GroupSummaryDto {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  influencerCount: number;
  unapprovedCount: number;
  ownerName?: string;
  createdAt: Date;
}

export class GroupDetailDto extends GroupSummaryDto {
  ownerId: string;
  createdById: string;
  isPublic: boolean;
  shareUrlToken?: string;
  shares?: ShareSummaryDto[];
  invitations?: InvitationSummaryDto[];
}

export class GroupMemberDto {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  audienceCredibility?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgViews?: number;
  addedAt: Date;
  source: string;
}

export class ShareSummaryDto {
  id: string;
  sharedWithUserId?: string;
  sharedWithUserName?: string;
  sharedWithUserEmail?: string;
  permissionLevel: SharePermission;
  sharedAt: Date;
}

export class InvitationSummaryDto {
  id: string;
  invitationName: string;
  invitationType: InvitationType;
  urlSlug: string;
  isActive: boolean;
  applicationsCount: number;
  createdAt: Date;
}

export class ApplicationSummaryDto {
  id: string;
  platform: string;
  platformUsername: string;
  influencerName?: string;
  followerCount: number;
  profilePictureUrl?: string;
  status: ApplicationStatus;
  submittedAt: Date;
  phoneNumber?: string;
  email?: string;
}

export class GroupListResponseDto {
  groups: GroupSummaryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class MemberListResponseDto {
  members: GroupMemberDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class ApplicationListResponseDto {
  applications: ApplicationSummaryDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class DashboardStatsDto {
  totalGroups: number;
  totalInfluencers: number;
  pendingApplications: number;
  groupsByPlatform: Record<string, number>;
  recentGroups: GroupSummaryDto[];
}
