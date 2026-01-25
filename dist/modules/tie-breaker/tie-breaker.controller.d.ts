import { TieBreakerService } from './tie-breaker.service';
import { CreateTieBreakerComparisonDto, UpdateTieBreakerComparisonDto, ShareTieBreakerComparisonDto, TieBreakerFilterDto, TieBreakerListResponseDto, TieBreakerComparisonDetailDto, TieBreakerDashboardStatsDto, SearchInfluencerResultDto } from './dto';
export declare class TieBreakerController {
    private readonly tieBreakerService;
    constructor(tieBreakerService: TieBreakerService);
    createComparison(userId: string, dto: CreateTieBreakerComparisonDto): Promise<{
        success: boolean;
        comparison: import("./entities").TieBreakerComparison;
        creditsUsed: number;
        unlockedCount: number;
    }>;
    getComparisons(userId: string, filters: TieBreakerFilterDto): Promise<TieBreakerListResponseDto>;
    getDashboardStats(userId: string): Promise<TieBreakerDashboardStatsDto>;
    searchInfluencers(userId: string, platform: string, query: string, limit?: number): Promise<SearchInfluencerResultDto[]>;
    getComparisonById(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto>;
    getComparisonForDownload(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto>;
    updateComparison(userId: string, comparisonId: string, dto: UpdateTieBreakerComparisonDto): Promise<{
        success: boolean;
        comparison: import("./entities").TieBreakerComparison;
    }>;
    deleteComparison(userId: string, comparisonId: string): Promise<{
        success: boolean;
    }>;
    shareComparison(userId: string, comparisonId: string, dto: ShareTieBreakerComparisonDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getSharedComparison(token: string): Promise<TieBreakerComparisonDetailDto>;
}
