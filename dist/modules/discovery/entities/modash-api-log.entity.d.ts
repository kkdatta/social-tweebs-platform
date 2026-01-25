import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
export declare class ModashApiLog {
    id: string;
    userId: string | null;
    user: User;
    endpoint: string;
    httpMethod: string;
    platform: PlatformType;
    requestPayload: Record<string, any>;
    responseStatusCode: number;
    responseTimeMs: number;
    modashCreditsConsumed: number;
    platformCreditsCharged: number;
    errorMessage: string | null;
    createdAt: Date;
    lastUpdatedAt: Date;
}
