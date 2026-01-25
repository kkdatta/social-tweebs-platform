export declare enum ReportTab {
    INFLUENCER_DISCOVERY = "INFLUENCER_DISCOVERY",
    PAID_COLLABORATION = "PAID_COLLABORATION"
}
export declare enum ReportCreatedBy {
    ALL = "ALL",
    ME = "ME",
    TEAM = "TEAM"
}
export declare class GeneratedReportsFilterDto {
    tab?: ReportTab;
    platform?: string;
    status?: string;
    createdBy?: ReportCreatedBy;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class RenameReportDto {
    title: string;
}
export declare class BulkDeleteReportsDto {
    reportIds: string[];
    tab: ReportTab;
}
export declare class DiscoveryExportDto {
    id: string;
    title: string;
    platform: string;
    exportFormat: string;
    profileCount: number;
    fileUrl?: string;
    status: string;
    creditsUsed: number;
    createdAt: Date;
    downloadedAt?: Date;
    createdById: string;
    createdByName?: string;
}
export declare class PaidCollaborationReportDto {
    id: string;
    title: string;
    platform: string;
    reportType: string;
    exportFormat: string;
    influencerCount: number;
    fileUrl?: string;
    status: string;
    creditsUsed: number;
    createdAt: Date;
    downloadedAt?: Date;
    createdById: string;
    createdByName?: string;
}
export declare class GeneratedReportsListResponseDto {
    discoveryExports?: DiscoveryExportDto[];
    paidCollaborationReports?: PaidCollaborationReportDto[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}
export declare class DashboardStatsDto {
    totalDiscoveryExports: number;
    totalPaidCollaborationReports: number;
    totalReports: number;
    reportsThisMonth: number;
    byPlatform: Record<string, number>;
}
