import { User } from '../../users/entities/user.entity';
export declare enum OverlapReportStatus {
    PENDING = "PENDING",
    IN_PROCESS = "IN_PROCESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare enum OverlapSharePermission {
    VIEW = "VIEW",
    EDIT = "EDIT"
}
export declare class AudienceOverlapReport {
    id: string;
    title: string;
    platform: string;
    status: OverlapReportStatus;
    totalFollowers: number;
    uniqueFollowers: number;
    overlappingFollowers: number;
    overlapPercentage?: number;
    uniquePercentage?: number;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    isPublic: boolean;
    shareUrlToken?: string;
    influencers: AudienceOverlapInfluencer[];
    shares: AudienceOverlapShare[];
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    retryCount: number;
}
export declare class AudienceOverlapInfluencer {
    id: string;
    reportId: string;
    report: AudienceOverlapReport;
    influencerProfileId?: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    uniqueFollowers: number;
    uniquePercentage?: number;
    overlappingFollowers: number;
    overlappingPercentage?: number;
    displayOrder: number;
    createdAt: Date;
}
export declare class AudienceOverlapShare {
    id: string;
    reportId: string;
    report: AudienceOverlapReport;
    sharedWithUserId?: string;
    sharedWithUser?: User;
    sharedByUserId: string;
    sharedByUser: User;
    permissionLevel: OverlapSharePermission;
    sharedAt: Date;
}
