import { User } from './user.entity';
export declare class UserPreferences {
    id: string;
    userId: string;
    user: User;
    notifyDiscoveryExport: boolean;
    notifyCollabExport: boolean;
    notifyOverlapReport: boolean;
    notifyContentDiscovery: boolean;
    notifyGroupImport: boolean;
    notifyCampaignImport: boolean;
    notifyReportShared: boolean;
    createdAt: Date;
    updatedAt: Date;
}
