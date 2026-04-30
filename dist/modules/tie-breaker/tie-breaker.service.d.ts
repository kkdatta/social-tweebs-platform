import { Repository } from 'typeorm';
import { TieBreakerComparison, TieBreakerInfluencer, TieBreakerShare } from './entities';
import { User } from '../users/entities/user.entity';
import { InfluencerProfile } from '../discovery/entities/influencer-profile.entity';
import { InfluencerInsight } from '../insights/entities/influencer-insight.entity';
import { UnlockedInfluencer } from '../credits/entities/unlocked-influencer.entity';
import { CreditsService } from '../credits/credits.service';
import { ModashService } from '../discovery/services/modash.service';
import { CreateTieBreakerComparisonDto, UpdateTieBreakerComparisonDto, ShareTieBreakerComparisonDto, TieBreakerFilterDto, TieBreakerListResponseDto, TieBreakerComparisonDetailDto, TieBreakerDashboardStatsDto, SearchInfluencerResultDto } from './dto';
export declare class TieBreakerService {
    private readonly comparisonRepo;
    private readonly influencerRepo;
    private readonly shareRepo;
    private readonly userRepo;
    private readonly profileRepo;
    private readonly unlockedRepo;
    private readonly insightRepo;
    private readonly creditsService;
    private readonly modashService;
    private readonly logger;
    constructor(comparisonRepo: Repository<TieBreakerComparison>, influencerRepo: Repository<TieBreakerInfluencer>, shareRepo: Repository<TieBreakerShare>, userRepo: Repository<User>, profileRepo: Repository<InfluencerProfile>, unlockedRepo: Repository<UnlockedInfluencer>, insightRepo: Repository<InfluencerInsight>, creditsService: CreditsService, modashService: ModashService);
    createComparison(userId: string, dto: CreateTieBreakerComparisonDto): Promise<{
        success: boolean;
        comparison: TieBreakerComparison;
        creditsUsed: number;
        unlockedCount: number;
    }>;
    private addInfluencersToComparison;
    private processComparison;
    private extractStat;
    private populateFromCacheIfFresh;
    private populateFromInsights;
    private populateInfluencerFromModash;
    getComparisons(userId: string, filters: TieBreakerFilterDto): Promise<TieBreakerListResponseDto>;
    getComparisonById(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto>;
    getComparisonByShareToken(token: string): Promise<TieBreakerComparisonDetailDto>;
    updateComparison(userId: string, comparisonId: string, dto: UpdateTieBreakerComparisonDto): Promise<{
        success: boolean;
        comparison: TieBreakerComparison;
    }>;
    deleteComparison(userId: string, comparisonId: string): Promise<{
        success: boolean;
    }>;
    shareComparison(userId: string, comparisonId: string, dto: ShareTieBreakerComparisonDto): Promise<{
        success: boolean;
        shareUrl?: string;
    }>;
    getDashboardStats(userId: string): Promise<TieBreakerDashboardStatsDto>;
    searchInfluencers(userId: string, platform: string, query: string, limit?: number): Promise<SearchInfluencerResultDto[]>;
    getComparisonForDownload(userId: string, comparisonId: string): Promise<TieBreakerComparisonDetailDto>;
    private getClientUserIds;
    private getTeamUserIds;
    private checkComparisonAccess;
    private toSummaryDto;
    private toDetailDto;
    private toInfluencerDto;
}
