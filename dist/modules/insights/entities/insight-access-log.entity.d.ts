import { User } from '../../users/entities/user.entity';
import { InfluencerInsight } from './influencer-insight.entity';
export declare enum InsightAccessType {
    UNLOCK = "UNLOCK",
    VIEW = "VIEW",
    REFRESH = "REFRESH",
    EXPORT = "EXPORT"
}
export declare class InsightAccessLog {
    id: string;
    insightId: string;
    insight: InfluencerInsight;
    userId: string;
    user: User;
    accessType: InsightAccessType;
    creditsDeducted: number;
    ipAddress: string | null;
    userAgent: string | null;
    accessedAt: Date;
}
