import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { ModashApiLog } from '../entities/modash-api-log.entity';
import { SearchInfluencersDto } from '../dto/search.dto';
export interface ModashInfluencer {
    userId: string;
    profile: {
        username: string;
        fullname?: string;
        picture?: string;
        bio?: string;
        url?: string;
        isPrivate?: boolean;
        isVerified?: boolean;
        accountType?: string;
        gender?: string;
        ageGroup?: string;
        language?: {
            code: string;
            name: string;
        };
        geo?: {
            country?: {
                code: string;
                name: string;
            };
            city?: {
                name: string;
            };
        };
        contacts?: {
            email?: string;
            phone?: string;
        };
    };
    stats: {
        followers: number;
        following?: number;
        posts?: number;
        avgLikes?: number;
        avgComments?: number;
        avgViews?: number;
        avgReelPlays?: number;
        engagementRate?: number;
        avgEngagements?: number;
    };
    features?: {
        hashtags?: Array<{
            tag: string;
            weight: number;
        }>;
        mentions?: Array<{
            tag: string;
            weight: number;
        }>;
        interests?: Array<{
            id: string;
            name: string;
        }>;
        brandAffinity?: Array<{
            id: string;
            name: string;
        }>;
    };
    audience?: {
        credibility?: number;
        genders?: Array<{
            code: string;
            weight: number;
        }>;
        ages?: Array<{
            code: string;
            weight: number;
        }>;
        geoCountries?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
        geoCities?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
        languages?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
        interests?: Array<{
            id: string;
            name: string;
            weight: number;
        }>;
        brandAffinity?: Array<{
            id: string;
            name: string;
            weight: number;
        }>;
    };
}
export interface ModashSearchResponse {
    lookalikes: ModashInfluencer[];
    total: number;
    page: number;
    hasMore: boolean;
}
export interface ModashReportResponse {
    userId: string;
    profile: ModashInfluencer['profile'];
    stats: ModashInfluencer['stats'];
    features?: ModashInfluencer['features'];
    audience?: ModashInfluencer['audience'];
    statHistory?: Array<{
        month: string;
        followers: number;
        avgLikes?: number;
    }>;
    recentPosts?: Array<{
        id: string;
        url: string;
        created: string;
        likes: number;
        comments: number;
        type: string;
        thumbnail?: string;
    }>;
}
export declare class ModashService {
    private configService;
    private apiLogRepository;
    private readonly logger;
    private readonly baseUrl;
    private readonly apiKey;
    private readonly isEnabled;
    constructor(configService: ConfigService, apiLogRepository: Repository<ModashApiLog>);
    isModashEnabled(): boolean;
    searchInfluencers(dto: SearchInfluencersDto, userId?: string): Promise<ModashSearchResponse>;
    getInfluencerReport(platform: PlatformType, platformUserId: string, userId?: string): Promise<ModashReportResponse>;
    getLocations(query?: string): Promise<any>;
    getInterests(platform: PlatformType): Promise<any>;
    getLanguages(): Promise<any>;
    getBrands(query?: string): Promise<any>;
    private makeRequest;
    private getPlatformPath;
    private buildSearchRequestBody;
    private buildInfluencerFilter;
    private buildAudienceFilter;
    private logApiCall;
}
