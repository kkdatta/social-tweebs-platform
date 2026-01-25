import { InsightsService } from './insights.service';
import { SearchInsightDto, ListInsightsQueryDto, InsightListResponseDto, SearchInsightResponseDto, RefreshInsightResponseDto, FullInsightResponseDto } from './dto';
import { CurrentUserPayload } from '../../common/decorators';
export declare class InsightsController {
    private readonly insightsService;
    constructor(insightsService: InsightsService);
    listInsights(user: CurrentUserPayload, query: ListInsightsQueryDto): Promise<InsightListResponseDto>;
    searchAndUnlock(user: CurrentUserPayload, dto: SearchInsightDto): Promise<SearchInsightResponseDto>;
    getInsight(user: CurrentUserPayload, id: string): Promise<FullInsightResponseDto>;
    refreshInsight(user: CurrentUserPayload, id: string): Promise<RefreshInsightResponseDto>;
    getCacheTTL(): Promise<{
        ttlDays: number;
    }>;
}
