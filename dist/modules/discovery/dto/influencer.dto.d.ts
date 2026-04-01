import { PlatformType } from '../../../common/enums';
import { AudienceDataType } from '../entities/audience-data.entity';
export declare class UnblurInfluencersDto {
    profileIds: string[];
    platform: PlatformType;
}
export declare class UnblurResponseDto {
    success: boolean;
    unlockedCount: number;
    alreadyUnlockedCount: number;
    creditsUsed: number;
    remainingBalance: number;
    unlockedProfileIds: string[];
}
export declare class AudienceDataDto {
    dataType: AudienceDataType;
    categoryKey: string;
    percentage: number;
    affinityScore?: number;
}
export declare class InfluencerInsightsDto {
    id: string;
    platformUserId: string;
    platform: PlatformType;
    username: string;
    fullName?: string;
    profilePictureUrl?: string;
    biography?: string;
    followerCount: number;
    followingCount: number;
    postCount: number;
    engagementRate?: number;
    avgLikes: number;
    avgComments: number;
    avgViews: number;
    isVerified: boolean;
    isBusinessAccount: boolean;
    accountType?: string;
    locationCountry?: string;
    locationCity?: string;
    category?: string;
    audienceCredibility?: number;
    contactEmail?: string;
    websiteUrl?: string;
    audienceData: AudienceDataDto[];
    lastUpdatedAt: Date;
    modashFetchedAt: Date;
}
export declare class ViewInsightsResponseDto {
    success: boolean;
    insightId: string;
    isFirstAccess: boolean;
    creditsCharged: number;
    remainingBalance: number;
    insights: InfluencerInsightsDto;
}
export declare class RefreshInsightsResponseDto {
    success: boolean;
    creditsCharged: number;
    remainingBalance: number;
    insights: InfluencerInsightsDto;
}
export declare class InfluencerProfileDto {
    id: string;
    platformUserId: string;
    platform: PlatformType;
    username?: string;
    fullName?: string;
    profilePictureUrl?: string;
    biography?: string;
    followerCount: number;
    engagementRate?: number;
    avgLikes?: number;
    isVerified: boolean;
    locationCountry?: string;
    category?: string;
    isUnlocked: boolean;
    lastUpdatedAt: Date;
}
export declare class ExportInfluencersDto {
    profileIds: string[];
    format: 'csv' | 'xlsx' | 'json';
    fileName?: string;
    excludePreviouslyExported?: boolean;
    fields?: string[];
}
export declare class ExportResponseDto {
    success: boolean;
    exportedCount: number;
    creditsUsed: number;
    remainingBalance: number;
    downloadUrl?: string;
    data?: any[];
}
export declare class ExportHistoryItemDto {
    id: string;
    fileName: string;
    exportedCount: number;
    creditsUsed: number;
    createdAt: Date;
    profileIds: string[];
}
export declare class ExportHistoryResponseDto {
    exports: ExportHistoryItemDto[];
    total: number;
    allExportedProfileIds: string[];
}
export declare class InsightsCheckResponseDto {
    hasAccess: boolean;
    creditCost: number;
    insightId?: string;
    firstAccessedAt?: Date;
}
export declare class ExportCostEstimateDto {
    count: number;
    creditCost: number;
    previouslyExportedCount: number;
    newExportCount: number;
}
