import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformType } from '../../../common/enums';
import { ModashApiLog } from '../entities/modash-api-log.entity';
import {
  SearchInfluencersDto,
  InfluencerFiltersDto,
  AudienceFiltersDto,
  SortOptionsDto,
} from '../dto/search.dto';

// ============ MODASH API RESPONSE TYPES ============
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
    language?: { code: string; name: string };
    geo?: {
      country?: { code: string; name: string };
      city?: { name: string };
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
    hashtags?: Array<{ tag: string; weight: number }>;
    mentions?: Array<{ tag: string; weight: number }>;
    interests?: Array<{ id: string; name: string }>;
    brandAffinity?: Array<{ id: string; name: string }>;
  };
  audience?: {
    credibility?: number;
    genders?: Array<{ code: string; weight: number }>;
    ages?: Array<{ code: string; weight: number }>;
    geoCountries?: Array<{ code: string; name: string; weight: number }>;
    geoCities?: Array<{ code: string; name: string; weight: number }>;
    languages?: Array<{ code: string; name: string; weight: number }>;
    interests?: Array<{ id: string; name: string; weight: number }>;
    brandAffinity?: Array<{ id: string; name: string; weight: number }>;
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
  profile: ModashInfluencer['profile'] & { followers?: number; engagements?: number; engagementRate?: number; averageViews?: number; avgLikes?: number; avgComments?: number };
  stats?: ModashInfluencer['stats'];
  features?: ModashInfluencer['features'];
  audience?: {
    credibility?: number;
    notable?: number;
    genders?: Array<{ code: string; weight: number }>;
    ages?: Array<{ code: string; weight: number }>;
    gendersPerAge?: Array<{ code: string; male: number; female: number }>;
    geoCountries?: Array<{ code: string; name: string; weight: number }>;
    geoCities?: Array<{ code?: string; name: string; weight: number }>;
    geoStates?: Array<{ code?: string; name: string; weight: number }>;
    geoSubdivisions?: Array<{ code?: string; name: string; items?: any[] }>;
    languages?: Array<{ code: string; name: string; weight: number }>;
    interests?: Array<{ id: string | number; name: string; weight?: number }>;
    brandAffinity?: Array<{ id: string | number; name: string; weight?: number }>;
    notableUsers?: Array<{ userId?: string; username: string; fullname?: string; picture?: string; followers: number; engagements: number }>;
    audienceLookalikes?: Array<any>;
    audienceTypes?: Array<{ code: string; weight: number }>;
    audienceReachability?: Array<{ code: string; weight: number }>;
    ethnicities?: Array<{ code: string; name: string; weight: number }>;
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
      statHistory?: Array<{ month: string; avgLikes?: number; avgComments?: number; avgViews?: number; avgEngagements?: number }>;
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
  hashtags?: Array<{ tag: string; weight: number }>;
  mentions?: Array<{ tag: string; weight: number }>;
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
  contacts?: Array<{ type: string; value: string }>;
  lookalikes?: { influencer?: any[]; audience?: any[] };
  paidPostPerformance?: number;
  engagementDistribution?: any[];
}

// ============ COLLABORATION API TYPES ============
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

// ============ AUDIENCE OVERLAP TYPES ============
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

// ============ EMAIL SEARCH TYPES ============
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

// ============ ACCOUNT INFO TYPES ============
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

@Injectable()
export class ModashService {
  private readonly logger = new Logger(ModashService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(ModashApiLog)
    private apiLogRepository: Repository<ModashApiLog>,
  ) {
    this.isEnabled = this.configService.get<boolean>('modash.enabled', false);
    this.baseUrl = this.configService.get<string>('modash.apiUrl', 'https://api.modash.io/v1');
    this.apiKey = this.configService.get<string>('modash.apiKey', '');

    const appMode = this.configService.get<string>('app.mode', 'development');
    this.logger.log(
      `Modash API [APP_MODE=${appMode}]: ${this.isEnabled ? 'ENABLED (production DB + live API)' : 'DISABLED (dev DB + simulated data)'}`,
    );
  }

  /**
   * Check if Modash API integration is enabled
   */
  isModashEnabled(): boolean {
    return this.isEnabled;
  }

  // ============ SEARCH INFLUENCERS ============
  async searchInfluencers(
    dto: SearchInfluencersDto,
    userId?: string,
  ): Promise<ModashSearchResponse> {
    const platform = this.getPlatformPath(dto.platform);
    const endpoint = `/${platform}/search`;
    const requestBody = this.buildSearchRequestBody(dto);

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined = undefined;

    try {
      const response = await this.makeRequest<ModashSearchResponse>(
        'POST',
        endpoint,
        requestBody,
      );

      responseStatus = 200;
      return response;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'POST',
        platform: dto.platform,
        requestPayload: requestBody,
        responseStatusCode: responseStatus,
        responseTimeMs: responseTime,
        errorMessage,
      });
    }
  }

  // ============ GET INFLUENCER REPORT ============
  async getInfluencerReport(
    platform: PlatformType,
    platformUserId: string,
    userId?: string,
  ): Promise<ModashReportResponse> {
    const platformPath = this.getPlatformPath(platform);
    const endpoint = `/${platformPath}/profile/${platformUserId}/report`;

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined = undefined;

    try {
      // Modash report API wraps everything in { error, profile: { ...actual data } }
      const response = await this.makeRequest<any>('GET', endpoint);

      responseStatus = 200;
      return (response.profile || response) as ModashReportResponse;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      const responseTime = Date.now() - startTime;
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'GET',
        platform,
        requestPayload: { platformUserId },
        responseStatusCode: responseStatus,
        responseTimeMs: responseTime,
        modashCreditsConsumed: responseStatus === 200 ? 1 : 0,
        errorMessage,
      });
    }
  }

  // ============ COLLABORATIONS API ============
  async getCollaborationPosts(
    id: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    options?: {
      collaboratorId?: string;
      postCreationTimestampMs?: { gte?: number; lte?: number };
      cursor?: string;
      limit?: number;
      groupBrandCollaborations?: boolean;
    },
    userId?: string,
  ): Promise<ModashCollaborationPostsResponse> {
    const endpoint = '/collaborations/posts';
    const requestBody = { id, platform, ...options };

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined;

    try {
      const response = await this.makeRequest<ModashCollaborationPostsResponse>(
        'POST',
        endpoint,
        requestBody,
      );
      responseStatus = 200;
      return response;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'POST',
        requestPayload: requestBody,
        responseStatusCode: responseStatus,
        responseTimeMs: Date.now() - startTime,
        modashCreditsConsumed: responseStatus === 200 ? 0.2 : 0,
        errorMessage,
      });
    }
  }

  async getCollaborationSummary(
    id: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    options?: {
      collaboratorId?: string;
      cursor?: string;
      limit?: number;
      groupBrandCollaborations?: boolean;
    },
    userId?: string,
  ): Promise<ModashCollaborationSummaryResponse> {
    const endpoint = '/collaborations/summary';
    const requestBody = { id, platform, ...options };

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined;

    try {
      const response =
        await this.makeRequest<ModashCollaborationSummaryResponse>(
          'POST',
          endpoint,
          requestBody,
        );
      responseStatus = 200;
      return response;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'POST',
        requestPayload: requestBody,
        responseStatusCode: responseStatus,
        responseTimeMs: Date.now() - startTime,
        modashCreditsConsumed: responseStatus === 200 ? 0.2 : 0,
        errorMessage,
      });
    }
  }

  // ============ AUDIENCE OVERLAP ============
  async getAudienceOverlap(
    platform: PlatformType,
    influencers: string[],
    userId?: string,
  ): Promise<ModashAudienceOverlapResponse> {
    const platformPath = this.getPlatformPath(platform);
    const endpoint = `/${platformPath}/reports/audience/overlap`;
    const requestBody = { influencers };

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined;

    try {
      const response =
        await this.makeRequest<ModashAudienceOverlapResponse>(
          'POST',
          endpoint,
          requestBody,
        );
      responseStatus = 200;
      return response;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'POST',
        platform,
        requestPayload: requestBody,
        responseStatusCode: responseStatus,
        responseTimeMs: Date.now() - startTime,
        modashCreditsConsumed: responseStatus === 200 ? 1 : 0,
        errorMessage,
      });
    }
  }

  // ============ EMAIL SEARCH ============
  async searchByEmail(
    emails: string[],
    userId?: string,
  ): Promise<ModashEmailSearchResponse> {
    const endpoint = '/email-search';
    const requestBody = { emails };

    const startTime = Date.now();
    let responseStatus = 0;
    let errorMessage: string | undefined;

    try {
      const response = await this.makeRequest<ModashEmailSearchResponse>(
        'POST',
        endpoint,
        requestBody,
      );
      responseStatus = 200;
      return response;
    } catch (error) {
      responseStatus = error.status || 500;
      errorMessage = error.message;
      throw error;
    } finally {
      await this.logApiCall({
        userId,
        endpoint,
        httpMethod: 'POST',
        requestPayload: { emailCount: emails.length },
        responseStatusCode: responseStatus,
        responseTimeMs: Date.now() - startTime,
        modashCreditsConsumed:
          responseStatus === 200 ? emails.length * 0.02 : 0,
        errorMessage,
      });
    }
  }

  // ============ ACCOUNT INFO ============
  async getAccountInfo(): Promise<ModashAccountInfoResponse> {
    const endpoint = '/user/info';
    return this.makeRequest<ModashAccountInfoResponse>('GET', endpoint);
  }

  // ============ GET DICTIONARIES (Passthrough) ============
  async getLocations(query?: string, platform?: PlatformType): Promise<any> {
    const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const endpoint = `/${platformPath}/locations${qs}`;
    return this.makeRequest('GET', endpoint);
  }

  async getInterests(platform: PlatformType): Promise<any> {
    const platformPath = this.getPlatformPath(platform);
    const endpoint = `/${platformPath}/interests`;
    return this.makeRequest('GET', endpoint);
  }

  async getLanguages(platform?: PlatformType): Promise<any> {
    const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
    const endpoint = `/${platformPath}/languages`;
    return this.makeRequest('GET', endpoint);
  }

  async getBrands(query?: string, platform?: PlatformType): Promise<any> {
    const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
    const qs = query ? `?query=${encodeURIComponent(query)}` : '';
    const endpoint = `/${platformPath}/brands${qs}`;
    return this.makeRequest('GET', endpoint);
  }

  // ============ PRIVATE METHODS ============

  private async makeRequest<T>(
    method: 'GET' | 'POST',
    endpoint: string,
    body?: any,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };

    try {
      const options: RequestInit = {
        method,
        headers,
      };

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      this.logger.debug(`Modash API Request: ${method} ${url}`);

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`Modash API Error: ${response.status} - ${errorBody}`);

        if (response.status === 429) {
          throw new HttpException(
            'Modash API rate limit exceeded. Please try again later.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (response.status === 401) {
          throw new HttpException(
            'Modash API authentication failed',
            HttpStatus.UNAUTHORIZED,
          );
        }

        throw new HttpException(
          `Modash API error: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Modash API Request Failed: ${error.message}`);
      throw new HttpException(
        'Failed to communicate with Modash API',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private getPlatformPath(platform: PlatformType): string {
    const platformMap: Record<PlatformType, string> = {
      [PlatformType.INSTAGRAM]: 'instagram',
      [PlatformType.YOUTUBE]: 'youtube',
      [PlatformType.TIKTOK]: 'tiktok',
      [PlatformType.LINKEDIN]: 'linkedin',
    };
    return platformMap[platform] || 'instagram';
  }

  private buildSearchRequestBody(dto: SearchInfluencersDto): any {
    const body: any = {
      page: dto.page || 0,
    };

    // Build influencer filters
    if (dto.influencer) {
      body.filter = this.buildInfluencerFilter(dto.influencer);
    }

    // Build audience filters
    if (dto.audience) {
      body.audienceFilter = this.buildAudienceFilter(dto.audience);
    }

    // Build sort
    if (dto.sort?.field) {
      body.sort = {
        field: dto.sort.field,
        direction: dto.sort.direction || 'desc',
      };
    }

    return body;
  }

  private buildInfluencerFilter(filters: InfluencerFiltersDto): any {
    const filter: any = {};

    if (filters.followers) {
      filter.followers = filters.followers;
    }

    if (filters.engagementRate) {
      filter.engagementRate = filters.engagementRate;
    }

    // engagements range filter (new)
    if (filters.engagements) {
      filter.engagements = filters.engagements;
    }

    // reelsPlays range filter (new)
    if (filters.reelsPlays) {
      filter.reelsPlays = filters.reelsPlays;
    }

    if (filters.location && filters.location.length > 0) {
      filter.location = filters.location;
    }

    if (filters.interests && filters.interests.length > 0) {
      filter.interests = filters.interests;
    }

    if (filters.bio) {
      filter.bio = filters.bio;
    }

    // keywords filter (new)
    if (filters.keywords) {
      filter.keywords = filters.keywords;
    }

    if (filters.hasContactDetails !== undefined) {
      filter.hasContactDetails = filters.hasContactDetails;
    }

    if (filters.isVerified !== undefined) {
      filter.isVerified = filters.isVerified;
    }

    if (filters.accountTypes && filters.accountTypes.length > 0) {
      filter.accountTypes = filters.accountTypes;
    }

    // brands filter (replaces partnerships)
    if (filters.brands && filters.brands.length > 0) {
      filter.brands = filters.brands;
    }

    // hasSponsoredPosts filter (new)
    if (filters.hasSponsoredPosts !== undefined) {
      filter.hasSponsoredPosts = filters.hasSponsoredPosts;
    }

    // followersGrowthRate filter (new)
    if (filters.followersGrowthRate) {
      filter.followersGrowthRate = filters.followersGrowthRate;
    }

    if (filters.language) {
      filter.language = filters.language;
    }

    if (filters.gender) {
      filter.gender = filters.gender;
    }

    if (filters.age) {
      filter.age = filters.age;
    }

    if (filters.lastposted !== undefined) {
      filter.lastposted = filters.lastposted;
    }

    if (filters.textTags && filters.textTags.length > 0) {
      filter.textTags = filters.textTags;
    }

    if (filters.relevance && filters.relevance.length > 0) {
      filter.relevance = filters.relevance;
    }

    if (filters.audienceRelevance && filters.audienceRelevance.length > 0) {
      filter.audienceRelevance = filters.audienceRelevance;
    }

    if (filters.hasYouTube !== undefined) {
      filter.hasYouTube = filters.hasYouTube;
    }

    if (filters.username) {
      filter.username = filters.username;
    }

    return filter;
  }

  private buildAudienceFilter(filters: AudienceFiltersDto): any {
    const audienceFilter: any = {};

    if (filters.location && filters.location.length > 0) {
      audienceFilter.location = filters.location;
    }

    if (filters.gender) {
      audienceFilter.gender = filters.gender;
    }

    if (filters.age && filters.age.length > 0) {
      audienceFilter.age = filters.age;
    }

    if (filters.interests && filters.interests.length > 0) {
      audienceFilter.interests = filters.interests;
    }

    if (filters.language) {
      audienceFilter.language = filters.language;
    }

    if (filters.credibility !== undefined) {
      audienceFilter.credibility = filters.credibility;
    }

    return audienceFilter;
  }

  private async logApiCall(data: {
    userId?: string;
    endpoint: string;
    httpMethod: string;
    platform?: PlatformType;
    requestPayload?: any;
    responseStatusCode?: number;
    responseTimeMs?: number;
    modashCreditsConsumed?: number;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const log = this.apiLogRepository.create({
        userId: data.userId ?? null,
        endpoint: data.endpoint,
        httpMethod: data.httpMethod,
        platform: data.platform,
        requestPayload: data.requestPayload,
        responseStatusCode: data.responseStatusCode,
        responseTimeMs: data.responseTimeMs,
        modashCreditsConsumed: data.modashCreditsConsumed,
        errorMessage: data.errorMessage ?? null,
      });

      await this.apiLogRepository.save(log);
    } catch (error) {
      this.logger.error(`Failed to log Modash API call: ${error.message}`);
    }
  }
}
