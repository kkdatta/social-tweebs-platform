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
    profile: ModashInfluencer['profile'] & {
        followers?: number;
        engagements?: number;
        engagementRate?: number;
        averageViews?: number;
        avgLikes?: number;
        avgComments?: number;
    };
    stats?: ModashInfluencer['stats'];
    features?: ModashInfluencer['features'];
    audience?: {
        credibility?: number;
        notable?: number;
        genders?: Array<{
            code: string;
            weight: number;
        }>;
        ages?: Array<{
            code: string;
            weight: number;
        }>;
        gendersPerAge?: Array<{
            code: string;
            male: number;
            female: number;
        }>;
        geoCountries?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
        geoCities?: Array<{
            code?: string;
            name: string;
            weight: number;
        }>;
        geoStates?: Array<{
            code?: string;
            name: string;
            weight: number;
        }>;
        geoSubdivisions?: Array<{
            code?: string;
            name: string;
            items?: any[];
        }>;
        languages?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
        interests?: Array<{
            id: string | number;
            name: string;
            weight?: number;
        }>;
        brandAffinity?: Array<{
            id: string | number;
            name: string;
            weight?: number;
        }>;
        notableUsers?: Array<{
            userId?: string;
            username: string;
            fullname?: string;
            picture?: string;
            followers: number;
            engagements: number;
        }>;
        audienceLookalikes?: Array<any>;
        audienceTypes?: Array<{
            code: string;
            weight: number;
        }>;
        audienceReachability?: Array<{
            code: string;
            weight: number;
        }>;
        ethnicities?: Array<{
            code: string;
            name: string;
            weight: number;
        }>;
    };
    statHistory?: Array<{
        month: string;
        followers: number;
        following?: number;
        avgLikes?: number;
        avgViews?: number;
        avgComments?: number;
        avgShares?: number;
    }>;
    statsByContentType?: {
        all?: {
            engagements?: number;
            engagementRate?: number;
            avgLikes?: number;
            avgComments?: number;
            avgViews?: number;
            avgReelsPlays?: number;
            avgShares?: number;
            statHistory?: Array<{
                month: string;
                avgLikes?: number;
                avgComments?: number;
                avgViews?: number;
                avgEngagements?: number;
            }>;
        };
        reels?: {
            engagements?: number;
            engagementRate?: number;
            avgLikes?: number;
            avgComments?: number;
            avgReelsPlays?: number;
            avgShares?: number;
            statHistory?: Array<any>;
        };
    };
    hashtags?: Array<{
        tag: string;
        weight: number;
    }>;
    mentions?: Array<{
        tag: string;
        weight: number;
    }>;
    recentPosts?: Array<{
        id: string;
        url: string;
        created: string | number;
        likes: number;
        comments: number;
        views?: number;
        type: string;
        thumbnail?: string;
        text?: string;
        image?: string;
    }>;
    popularPosts?: Array<any>;
    bio?: string;
    isVerified?: boolean;
    isPrivate?: boolean;
    city?: string;
    state?: string;
    country?: string;
    gender?: string;
    ageGroup?: string;
    postsCount?: number;
    contacts?: Array<{
        type: string;
        value: string;
    }>;
    lookalikes?: {
        influencer?: any[];
        audience?: any[];
    };
    paidPostPerformance?: number;
    engagementDistribution?: any[];
}
export interface ModashCollaborationPost {
    post_id: string;
    post_thumbnail?: string;
    post_timestamp?: number;
    title?: string;
    description?: string;
    label: string;
    collaboration_type: 'Paid' | 'Gifted' | 'Ambassador' | 'Affiliate' | 'Unspecified';
    stats?: {
        likes?: number;
        comments?: number;
        plays?: number;
        views?: number;
        shares?: number;
    };
    sponsors?: Array<{
        name?: string;
        username?: string;
        domain?: string;
        logo_url?: string;
        user_id?: string;
        category: string;
    }>;
    user_id?: string;
    username?: string;
    user_picture?: string;
    platform?: string;
}
export interface ModashCollaborationPostsResponse {
    error: boolean;
    cursor?: string;
    influencer?: {
        id: string;
        platform: string;
        is_more_available: boolean;
        username?: string;
        user_picture?: string;
        posts: ModashCollaborationPost[];
    };
    brand?: {
        id: string;
        platform: string;
        is_more_available: boolean;
        brand_name?: string;
        brand_domain?: string;
        brand_logo?: string;
        brand_category: string;
        posts: ModashCollaborationPost[];
    };
}
export interface ModashCollaborationSummaryResponse {
    error: boolean;
    cursor?: string;
    influencer?: {
        id: string;
        platform: string;
        is_more_available: boolean;
        summary: any;
        per_brand_summary: Array<{
            brand: {
                name?: string;
                username?: string;
                domain?: string;
                logo_url?: string;
                user_id?: string;
                category: string;
            };
            summary: any;
        }>;
    };
    brand?: {
        id: string;
        platform: string;
        is_more_available: boolean;
        summary: any;
        per_influencer_summary: Array<{
            influencer: {
                username?: string;
                user_id?: string;
                user_picture?: string;
            };
            summary: any;
        }>;
    };
}
export interface ModashAudienceOverlapResponse {
    error: boolean;
    reportInfo: {
        totalFollowers: number;
        totalUniqueFollowers: number;
    };
    data: Array<{
        userId: string;
        username?: string;
        followers: number;
        uniquePercentage: number;
        overlappingPercentage: number;
    }>;
}
export interface ModashEmailSearchResponse {
    error: boolean;
    matchedEmails: Array<{
        email: string;
        users: Array<{
            platform: string;
            userId?: string;
            url: string;
            username: string;
            fullname?: string;
            picture: string;
            followers: number;
            engagements: number;
            engagementRate: number;
            isVerified: boolean;
        }>;
    }>;
    notMatchedEmails: string[];
    totalMatches: number;
}
export interface ModashAccountInfoResponse {
    error: boolean;
    billing: {
        credits: number;
        rawRequests: number;
    };
    rateLimits: {
        discoveryRatelimit: number;
        rawRatelimit: number;
    };
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
    getCollaborationPosts(id: string, platform: 'instagram' | 'tiktok' | 'youtube', options?: {
        collaboratorId?: string;
        postCreationTimestampMs?: {
            gte?: number;
            lte?: number;
        };
        cursor?: string;
        limit?: number;
        groupBrandCollaborations?: boolean;
    }, userId?: string): Promise<ModashCollaborationPostsResponse>;
    getCollaborationSummary(id: string, platform: 'instagram' | 'tiktok' | 'youtube', options?: {
        collaboratorId?: string;
        cursor?: string;
        limit?: number;
        groupBrandCollaborations?: boolean;
    }, userId?: string): Promise<ModashCollaborationSummaryResponse>;
    getAudienceOverlap(platform: PlatformType, influencers: string[], userId?: string): Promise<ModashAudienceOverlapResponse>;
    searchByEmail(emails: string[], userId?: string): Promise<ModashEmailSearchResponse>;
    getAccountInfo(): Promise<ModashAccountInfoResponse>;
    getLocations(query?: string, platform?: PlatformType): Promise<any>;
    getInterests(platform: PlatformType): Promise<any>;
    getLanguages(platform?: PlatformType): Promise<any>;
    getBrands(query?: string, platform?: PlatformType): Promise<any>;
    private makeRequest;
    private getPlatformPath;
    private buildSearchRequestBody;
    private buildInfluencerFilter;
    private buildAudienceFilter;
    private logApiCall;
}
