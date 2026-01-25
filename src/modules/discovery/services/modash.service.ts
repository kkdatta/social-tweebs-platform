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

    this.logger.log(`Modash API Integration: ${this.isEnabled ? 'ENABLED' : 'DISABLED (using local DB)'}`);
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
      const response = await this.makeRequest<ModashReportResponse>(
        'GET',
        endpoint,
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

  // ============ GET DICTIONARIES (Passthrough) ============
  async getLocations(query?: string): Promise<any> {
    const endpoint = `/dictionaries/locations${query ? `?query=${encodeURIComponent(query)}` : ''}`;
    return this.makeRequest('GET', endpoint);
  }

  async getInterests(platform: PlatformType): Promise<any> {
    const platformPath = this.getPlatformPath(platform);
    const endpoint = `/${platformPath}/dictionaries/interests`;
    return this.makeRequest('GET', endpoint);
  }

  async getLanguages(): Promise<any> {
    const endpoint = `/dictionaries/languages`;
    return this.makeRequest('GET', endpoint);
  }

  async getBrands(query?: string): Promise<any> {
    const endpoint = `/dictionaries/brands${query ? `?query=${encodeURIComponent(query)}` : ''}`;
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
