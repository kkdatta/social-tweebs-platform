import { GroupPlatform, SharePermission, InvitationType, ApplicationStatus, CurrencyType } from '../entities/influencer-group.entity';
export declare class CreateGroupDto {
    name: string;
    description?: string;
    platforms: GroupPlatform[];
}
export declare class UpdateGroupDto {
    name?: string;
    description?: string;
    platforms?: GroupPlatform[];
    isPublic?: boolean;
}
export declare class GroupFilterDto {
    tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me';
    platforms?: GroupPlatform[];
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class AddInfluencerDto {
    influencerName: string;
    influencerUsername?: string;
    platform: GroupPlatform;
    influencerProfileId?: string;
    platformUserId?: string;
    profilePictureUrl?: string;
    followerCount?: number;
    audienceCredibility?: number;
    engagementRate?: number;
    avgLikes?: number;
    avgViews?: number;
}
export declare class BulkAddInfluencersDto {
    influencers: AddInfluencerDto[];
}
export declare class ImportFromGroupDto {
    sourceGroupId: string;
    influencerIds?: string[];
}
export declare class CopyInfluencersDto {
    memberIds: string[];
    targetGroupId: string;
}
export declare class RemoveInfluencersDto {
    memberIds: string[];
}
export declare class MemberFilterDto {
    platform?: GroupPlatform;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class ShareGroupDto {
    sharedWithUserId?: string;
    shareWithEmail?: string;
    permissionLevel?: SharePermission;
    makePublic?: boolean;
}
export declare class CreateInvitationDto {
    invitationName: string;
    invitationType: InvitationType;
    urlSlug: string;
    landingHeader?: string;
    landingContent?: string;
    landingButtonText?: string;
    landingImages?: string[];
    landingVideoUrl?: string;
    formHeader?: string;
    formContent?: string;
    formPlatforms: GroupPlatform[];
    collectPhone?: boolean;
    collectEmail?: boolean;
    collectAddress?: boolean;
    pricingOptions?: string[];
    pricingCurrency?: CurrencyType;
    formButtonText?: string;
    thankyouHeader?: string;
    thankyouContent?: string;
    logoUrl?: string;
    backgroundColor?: string;
    titleColor?: string;
    textColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    notifyOnSubmission?: boolean;
}
export declare class UpdateInvitationDto {
    invitationName?: string;
    isActive?: boolean;
    landingHeader?: string;
    landingContent?: string;
    formHeader?: string;
    formContent?: string;
    notifyOnSubmission?: boolean;
}
export declare class SubmitApplicationDto {
    platform: GroupPlatform;
    platformUsername: string;
    platformUrl?: string;
    influencerName?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    photoPrice?: number;
    videoPrice?: number;
    storyPrice?: number;
    carouselPrice?: number;
    pricingCurrency?: CurrencyType;
    additionalData?: Record<string, any>;
}
export declare class ApplicationFilterDto {
    platform?: GroupPlatform;
    status?: ApplicationStatus;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class BulkApproveApplicationsDto {
    applicationIds: string[];
}
export declare class BulkRejectApplicationsDto {
    applicationIds: string[];
    rejectionReason?: string;
}
export declare class GroupSummaryDto {
    id: string;
    name: string;
    description?: string;
    platforms: string[];
    influencerCount: number;
    unapprovedCount: number;
    ownerName?: string;
    createdAt: Date;
}
export declare class GroupDetailDto extends GroupSummaryDto {
    ownerId: string;
    createdById: string;
    isPublic: boolean;
    shareUrlToken?: string;
    shares?: ShareSummaryDto[];
    invitations?: InvitationSummaryDto[];
}
export declare class GroupMemberDto {
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
export declare class ShareSummaryDto {
    id: string;
    sharedWithUserId?: string;
    sharedWithUserName?: string;
    sharedWithUserEmail?: string;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
export declare class InvitationSummaryDto {
    id: string;
    invitationName: string;
    invitationType: InvitationType;
    urlSlug: string;
    isActive: boolean;
    applicationsCount: number;
    createdAt: Date;
}
export declare class ApplicationSummaryDto {
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
export declare class GroupListResponseDto {
    groups: GroupSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class MemberListResponseDto {
    members: GroupMemberDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class ApplicationListResponseDto {
    applications: ApplicationSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class DashboardStatsDto {
    totalGroups: number;
    totalInfluencers: number;
    pendingApplications: number;
    groupsByPlatform: Record<string, number>;
    recentGroups: GroupSummaryDto[];
}
