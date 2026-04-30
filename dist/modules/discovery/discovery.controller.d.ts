import { PlatformType } from '../../common/enums';
import { DiscoveryService } from './services/discovery.service';
import { SearchInfluencersDto, SearchResponseDto, SearchHistoryResponseDto } from './dto/search.dto';
import { UnblurInfluencersDto, UnblurResponseDto, ViewInsightsResponseDto, RefreshInsightsResponseDto, InfluencerProfileDto, ExportInfluencersDto, ExportResponseDto, ExportHistoryResponseDto, InsightsCheckResponseDto, ExportCostEstimateDto } from './dto/influencer.dto';
export declare class DiscoveryController {
    private readonly discoveryService;
    constructor(discoveryService: DiscoveryService);
    searchInfluencers(userId: string, dto: SearchInfluencersDto): Promise<SearchResponseDto>;
    getSearchHistory(userId: string, page?: number, limit?: number): Promise<SearchHistoryResponseDto>;
    typeaheadSearch(q: string, limit?: number): Promise<any[]>;
    getInfluencerProfile(userId: string, profileId: string): Promise<InfluencerProfileDto>;
    viewInsights(userId: string, profileId: string): Promise<ViewInsightsResponseDto>;
    refreshInsights(userId: string, profileId: string): Promise<RefreshInsightsResponseDto>;
    unblurInfluencers(userId: string, dto: UnblurInfluencersDto): Promise<UnblurResponseDto>;
    exportInfluencers(userId: string, dto: ExportInfluencersDto): Promise<ExportResponseDto>;
    getExportHistory(userId: string): Promise<ExportHistoryResponseDto>;
    getExportCostEstimate(userId: string, body: {
        profileIds: string[];
        excludePreviouslyExported?: boolean;
    }): Promise<ExportCostEstimateDto>;
    checkInsightsAccess(userId: string, profileId: string): Promise<InsightsCheckResponseDto>;
    getLocations(query?: string): Promise<any>;
    getInterests(platform: PlatformType): Promise<any>;
    getLanguages(): Promise<any>;
    getBrands(query?: string): Promise<any>;
    getModashAccountInfo(): Promise<{
        enabled: boolean;
        message: string;
        billing?: undefined;
        rateLimits?: undefined;
    } | {
        enabled: boolean;
        billing: {
            credits: number;
            rawRequests: number;
        };
        rateLimits: {
            discoveryRatelimit: number;
            rawRatelimit: number;
        };
        message?: undefined;
    }>;
}
