import { User } from '../../users/entities/user.entity';
export declare enum GroupPlatform {
    INSTAGRAM = "INSTAGRAM",
    YOUTUBE = "YOUTUBE",
    TIKTOK = "TIKTOK"
}
export declare enum SharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT",
    ADMIN = "ADMIN"
}
export declare enum InvitationType {
    LANDING_PAGE = "LANDING_PAGE",
    FORM_ONLY = "FORM_ONLY"
}
export declare enum ApplicationStatus {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum CurrencyType {
    INR = "INR",
    USD = "USD",
    RM = "RM",
    SGD = "SGD",
    AED = "AED",
    VND = "VND"
}
export declare class InfluencerGroup {
    id: string;
    name: string;
    description?: string;
    platforms: string[];
    influencerCount: number;
    unapprovedCount: number;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    createdAt: Date;
    updatedAt: Date;
    members: InfluencerGroupMember[];
    shares: InfluencerGroupShare[];
    invitations: GroupInvitation[];
}
export declare class InfluencerGroupMember {
    id: string;
    groupId: string;
    group: InfluencerGroup;
    influencerProfileId?: string;
    platformUserId?: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    audienceCredibility?: number;
    engagementRate?: number;
    avgLikes?: number;
    avgViews?: number;
    addedById: string;
    addedBy: User;
    source: string;
    sourceGroupId?: string;
    applicationId?: string;
    addedAt: Date;
}
export declare class InfluencerGroupShare {
    id: string;
    groupId: string;
    group: InfluencerGroup;
    sharedWithUserId?: string;
    sharedWithUser: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: SharePermission;
    sharedAt: Date;
}
export declare class GroupInvitation {
    id: string;
    groupId: string;
    group: InfluencerGroup;
    invitationName: string;
    invitationType: InvitationType;
    urlSlug: string;
    isActive: boolean;
    landingHeader?: string;
    landingContent?: string;
    landingButtonText?: string;
    landingImages?: string[];
    landingVideoUrl?: string;
    formHeader?: string;
    formContent?: string;
    formPlatforms: string[];
    collectPhone: boolean;
    collectEmail: boolean;
    collectAddress: boolean;
    pricingOptions?: string[];
    pricingCurrency?: CurrencyType;
    formButtonText?: string;
    thankyouHeader?: string;
    thankyouContent?: string;
    logoUrl?: string;
    backgroundColor: string;
    titleColor: string;
    textColor: string;
    buttonBgColor: string;
    buttonTextColor: string;
    notifyOnSubmission: boolean;
    createdById: string;
    createdBy: User;
    applicationsCount: number;
    createdAt: Date;
    updatedAt: Date;
    applications: GroupInvitationApplication[];
}
export declare class GroupInvitationApplication {
    id: string;
    invitationId: string;
    invitation: GroupInvitation;
    groupId: string;
    influencerName?: string;
    platform: string;
    platformUsername: string;
    platformUrl?: string;
    followerCount: number;
    profilePictureUrl?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    photoPrice?: number;
    videoPrice?: number;
    storyPrice?: number;
    carouselPrice?: number;
    pricingCurrency?: CurrencyType;
    status: ApplicationStatus;
    approvedById?: string;
    approvedBy?: User;
    approvedAt?: Date;
    rejectionReason?: string;
    additionalData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    submittedAt: Date;
}
