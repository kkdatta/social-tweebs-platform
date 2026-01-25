import { User } from '../../users/entities/user.entity';
export declare enum PaidReportType {
    COLLABORATION = "COLLABORATION",
    COMPARISON = "COMPARISON",
    ANALYSIS = "ANALYSIS"
}
export declare enum PaidReportFormat {
    PDF = "PDF",
    XLSX = "XLSX"
}
export declare enum PaidReportStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class PaidCollaborationReport {
    id: string;
    title: string;
    platform: string;
    reportType: PaidReportType;
    exportFormat: PaidReportFormat;
    influencerCount: number;
    influencerIds?: string[];
    influencerData?: Record<string, any>;
    reportContent?: Record<string, any>;
    fileUrl?: string;
    fileSizeBytes?: number;
    dateRangeStart?: Date;
    dateRangeEnd?: Date;
    status: PaidReportStatus;
    errorMessage?: string;
    ownerId: string;
    owner: User;
    createdById: string;
    createdBy: User;
    creditsUsed: number;
    createdAt: Date;
    updatedAt: Date;
    downloadedAt?: Date;
}
