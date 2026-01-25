import { User } from '../../users/entities/user.entity';
export declare enum ExportFormat {
    CSV = "CSV",
    XLSX = "XLSX",
    JSON = "JSON"
}
export declare enum ExportStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class DiscoveryExport {
    id: string;
    title: string;
    platform: string;
    exportFormat: ExportFormat;
    profileCount: number;
    fileUrl?: string;
    fileSizeBytes?: number;
    searchFilters?: Record<string, any>;
    exportedProfileIds?: string[];
    status: ExportStatus;
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
