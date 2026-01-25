import { OverlapReportStatus, OverlapSharePermission } from '../entities';
export declare class CreateOverlapReportDto {
    title?: string;
    platform: string;
    influencerIds: string[];
}
export declare class AddInfluencerToReportDto {
    influencerProfileId: string;
}
export declare class UpdateOverlapReportDto {
    title?: string;
    isPublic?: boolean;
}
export declare class ShareOverlapReportDto {
    sharedWithUserId?: string;
    permissionLevel?: OverlapSharePermission;
}
export declare class OverlapReportFilterDto {
    platform?: string;
    status?: OverlapReportStatus;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class InfluencerSummaryDto {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    profilePictureUrl?: string;
    followerCount: number;
    uniqueFollowers: number;
    uniquePercentage?: number;
    overlappingFollowers: number;
    overlappingPercentage?: number;
}
export declare class OverlapReportSummaryDto {
    id: string;
    title: string;
    platform: string;
    status: OverlapReportStatus;
    overlapPercentage?: number;
    influencerCount: number;
    influencers: InfluencerSummaryDto[];
    createdAt: Date;
    createdById: string;
    createdByName?: string;
}
export declare class OverlapReportDetailDto {
    id: string;
    title: string;
    platform: string;
    status: OverlapReportStatus;
    totalFollowers: number;
    uniqueFollowers: number;
    overlappingFollowers: number;
    overlapPercentage?: number;
    uniquePercentage?: number;
    influencers: InfluencerSummaryDto[];
    isPublic: boolean;
    shareUrl?: string;
    createdAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    retryCount: number;
    ownerId: string;
    createdById: string;
}
export declare class OverlapReportListResponseDto {
    reports: OverlapReportSummaryDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class DashboardStatsDto {
    totalReports: number;
    completedReports: number;
    pendingReports: number;
    inProcessReports: number;
    failedReports: number;
    reportsThisMonth: number;
    remainingQuota: number;
}
