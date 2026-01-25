import { PlatformType } from '../../../common/enums';
import { User } from '../../users/entities/user.entity';
import { SearchResult } from './search-result.entity';
export declare enum SearchStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class DiscoverySearch {
    id: string;
    userId: string;
    user: User;
    platform: PlatformType;
    searchQuery: string;
    filtersApplied: Record<string, any>;
    resultCount: number;
    modashRequestId: string;
    creditsUsed: number;
    status: SearchStatus;
    errorMessage: string;
    modashResponseTimeMs: number;
    page: number;
    totalAvailable: number;
    hasMore: boolean;
    sortField: string;
    sortDirection: string;
    results: SearchResult[];
    createdAt: Date;
    lastUpdatedAt: Date;
}
