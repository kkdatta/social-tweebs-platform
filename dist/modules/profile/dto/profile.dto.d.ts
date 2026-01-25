export declare class ProfileResponseDto {
    id: string;
    email: string;
    name: string;
    phone: string;
    businessName: string;
    role: string;
    status: string;
    creditBalance: number;
    accountValidUntil: Date | null;
    daysRemaining: number;
    createdAt: Date;
}
export declare class UpdateProfileDto {
    name?: string;
    phone?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class PreferencesResponseDto {
    notifyDiscoveryExport: boolean;
    notifyCollabExport: boolean;
    notifyOverlapReport: boolean;
    notifyContentDiscovery: boolean;
    notifyGroupImport: boolean;
    notifyCampaignImport: boolean;
    notifyReportShared: boolean;
}
export declare class UpdatePreferencesDto {
    notifyDiscoveryExport?: boolean;
    notifyCollabExport?: boolean;
    notifyOverlapReport?: boolean;
    notifyContentDiscovery?: boolean;
    notifyGroupImport?: boolean;
    notifyCampaignImport?: boolean;
    notifyReportShared?: boolean;
}
export declare class AccountExpiryDto {
    expiresAt: Date;
    daysRemaining: number;
    isExpiringSoon: boolean;
    isExpired: boolean;
}
