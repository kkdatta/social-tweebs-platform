"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ModashService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModashService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const enums_1 = require("../../../common/enums");
const modash_api_log_entity_1 = require("../entities/modash-api-log.entity");
let ModashService = ModashService_1 = class ModashService {
    constructor(configService, apiLogRepository) {
        this.configService = configService;
        this.apiLogRepository = apiLogRepository;
        this.logger = new common_1.Logger(ModashService_1.name);
        this.isEnabled = this.configService.get('modash.enabled', false);
        this.baseUrl = this.configService.get('modash.apiUrl', 'https://api.modash.io/v1');
        this.apiKey = this.configService.get('modash.apiKey', '');
        const appMode = this.configService.get('app.mode', 'development');
        this.logger.log(`Modash API [APP_MODE=${appMode}]: ${this.isEnabled ? 'ENABLED (production DB + live API)' : 'DISABLED (dev DB + simulated data)'}`);
    }
    isModashEnabled() {
        return this.isEnabled;
    }
    async searchInfluencers(dto, userId) {
        const platform = this.getPlatformPath(dto.platform);
        const endpoint = `/${platform}/search`;
        const requestBody = this.buildSearchRequestBody(dto);
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage = undefined;
        try {
            const response = await this.makeRequest('POST', endpoint, requestBody);
            responseStatus = 200;
            return response;
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
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
    async getInfluencerReport(platform, platformUserId, userId) {
        const platformPath = this.getPlatformPath(platform);
        const endpoint = `/${platformPath}/profile/${platformUserId}/report`;
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage = undefined;
        try {
            const response = await this.makeRequest('GET', endpoint);
            responseStatus = 200;
            return (response.profile || response);
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
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
    async getCollaborationPosts(id, platform, options, userId) {
        const endpoint = '/collaborations/posts';
        const requestBody = { id, platform, ...options };
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage;
        try {
            const response = await this.makeRequest('POST', endpoint, requestBody);
            responseStatus = 200;
            return response;
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
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
    async getCollaborationSummary(id, platform, options, userId) {
        const endpoint = '/collaborations/summary';
        const requestBody = { id, platform, ...options };
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage;
        try {
            const response = await this.makeRequest('POST', endpoint, requestBody);
            responseStatus = 200;
            return response;
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
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
    async getAudienceOverlap(platform, influencers, userId) {
        const platformPath = this.getPlatformPath(platform);
        const endpoint = `/${platformPath}/reports/audience/overlap`;
        const requestBody = { influencers };
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage;
        try {
            const response = await this.makeRequest('POST', endpoint, requestBody);
            responseStatus = 200;
            return response;
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
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
    async searchByEmail(emails, userId) {
        const endpoint = '/email-search';
        const requestBody = { emails };
        const startTime = Date.now();
        let responseStatus = 0;
        let errorMessage;
        try {
            const response = await this.makeRequest('POST', endpoint, requestBody);
            responseStatus = 200;
            return response;
        }
        catch (error) {
            responseStatus = error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
            await this.logApiCall({
                userId,
                endpoint,
                httpMethod: 'POST',
                requestPayload: { emailCount: emails.length },
                responseStatusCode: responseStatus,
                responseTimeMs: Date.now() - startTime,
                modashCreditsConsumed: responseStatus === 200 ? emails.length * 0.02 : 0,
                errorMessage,
            });
        }
    }
    async getAccountInfo() {
        const endpoint = '/user/info';
        return this.makeRequest('GET', endpoint);
    }
    async getLocations(query, platform) {
        const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
        const qs = query ? `?query=${encodeURIComponent(query)}` : '';
        const endpoint = `/${platformPath}/locations${qs}`;
        return this.makeRequest('GET', endpoint);
    }
    async getInterests(platform) {
        const platformPath = this.getPlatformPath(platform);
        const endpoint = `/${platformPath}/interests`;
        return this.makeRequest('GET', endpoint);
    }
    async getLanguages(platform) {
        const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
        const endpoint = `/${platformPath}/languages`;
        return this.makeRequest('GET', endpoint);
    }
    async getBrands(query, platform) {
        const platformPath = platform ? this.getPlatformPath(platform) : 'instagram';
        const qs = query ? `?query=${encodeURIComponent(query)}` : '';
        const endpoint = `/${platformPath}/brands${qs}`;
        return this.makeRequest('GET', endpoint);
    }
    async makeRequest(method, endpoint, body) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
        };
        try {
            const options = {
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
                    throw new common_1.HttpException('Modash API rate limit exceeded. Please try again later.', common_1.HttpStatus.TOO_MANY_REQUESTS);
                }
                if (response.status === 401) {
                    throw new common_1.HttpException('Modash API authentication failed', common_1.HttpStatus.UNAUTHORIZED);
                }
                throw new common_1.HttpException(`Modash API error: ${response.statusText}`, common_1.HttpStatus.BAD_GATEWAY);
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            this.logger.error(`Modash API Request Failed: ${error.message}`);
            throw new common_1.HttpException('Failed to communicate with Modash API', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    getPlatformPath(platform) {
        const platformMap = {
            [enums_1.PlatformType.INSTAGRAM]: 'instagram',
            [enums_1.PlatformType.YOUTUBE]: 'youtube',
            [enums_1.PlatformType.TIKTOK]: 'tiktok',
            [enums_1.PlatformType.LINKEDIN]: 'linkedin',
        };
        return platformMap[platform] || 'instagram';
    }
    buildSearchRequestBody(dto) {
        const body = {
            page: dto.page || 0,
        };
        if (dto.influencer) {
            body.filter = this.buildInfluencerFilter(dto.influencer);
        }
        if (dto.audience) {
            body.audienceFilter = this.buildAudienceFilter(dto.audience);
        }
        if (dto.sort?.field) {
            body.sort = {
                field: dto.sort.field,
                direction: dto.sort.direction || 'desc',
            };
        }
        return body;
    }
    buildInfluencerFilter(filters) {
        const filter = {};
        if (filters.followers) {
            filter.followers = filters.followers;
        }
        if (filters.engagementRate) {
            filter.engagementRate = filters.engagementRate;
        }
        if (filters.engagements) {
            filter.engagements = filters.engagements;
        }
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
        if (filters.brands && filters.brands.length > 0) {
            filter.brands = filters.brands;
        }
        if (filters.hasSponsoredPosts !== undefined) {
            filter.hasSponsoredPosts = filters.hasSponsoredPosts;
        }
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
    buildAudienceFilter(filters) {
        const audienceFilter = {};
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
    async logApiCall(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to log Modash API call: ${error.message}`);
        }
    }
};
exports.ModashService = ModashService;
exports.ModashService = ModashService = ModashService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(modash_api_log_entity_1.ModashApiLog)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository])
], ModashService);
//# sourceMappingURL=modash.service.js.map