import { PlatformType } from '../../../common/enums';
declare class RangeFilter {
    min?: number;
    max?: number;
}
declare class LocationFilter {
    id: number;
    weight?: number;
}
declare class InterestFilter {
    id: number;
    weight?: number;
}
declare class GenderFilter {
    id: 'MALE' | 'FEMALE';
    weight?: number;
}
declare class AgeFilter {
    id: '13-17' | '18-24' | '25-34' | '35-44' | '45-64' | '65-';
    weight?: number;
}
declare class AgeRangeFilter {
    min?: '13' | '18' | '25' | '35' | '45' | '65';
    max?: '17' | '24' | '34' | '44' | '64';
    weight?: number;
}
declare class LanguageFilter {
    id: string;
    weight?: number;
}
declare class TextTagFilter {
    type: 'hashtag' | 'mention';
    value: string;
}
declare class FollowersGrowthRateFilter {
    interval: 'i1month' | 'i2months' | 'i3months' | 'i4months' | 'i5months' | 'i6months';
    value: number;
    operator: 'gte' | 'gt' | 'lt' | 'lte';
}
declare class ContactDetailsFilter {
    contactType: string;
    filterAction?: 'must' | 'should' | 'not';
}
declare class FilterOperationDto {
    operator: 'and' | 'or' | 'not';
    filter: string;
}
export declare class InfluencerFiltersDto {
    followers?: RangeFilter;
    engagementRate?: number | RangeFilter;
    engagements?: RangeFilter;
    reelsPlays?: RangeFilter;
    location?: number[];
    language?: string;
    gender?: 'MALE' | 'FEMALE' | 'KNOWN' | 'UNKNOWN';
    age?: RangeFilter;
    lastposted?: number;
    bio?: string;
    bioMatchType?: 'must' | 'should' | 'not';
    excludeLocations?: boolean;
    keywords?: string;
    excludeKeywords?: boolean;
    textTagAction?: 'should' | 'should_not';
    textTags?: TextTagFilter[];
    relevance?: string[];
    audienceRelevance?: string[];
    isVerified?: boolean;
    accountTypes?: number[];
    hasSponsoredPosts?: boolean;
    hasYouTube?: boolean;
    hasContactDetails?: ContactDetailsFilter[];
    brands?: number[];
    interests?: number[];
    followersGrowthRate?: FollowersGrowthRateFilter;
    filterOperations?: FilterOperationDto[];
    username?: string;
    categories?: string[];
}
export declare class AudienceFiltersDto {
    location?: LocationFilter[];
    gender?: GenderFilter;
    engagersGender?: GenderFilter;
    age?: AgeFilter[];
    ageRange?: AgeRangeFilter;
    interests?: InterestFilter[];
    language?: LanguageFilter;
    credibility?: number;
}
export declare class SortOptionsDto {
    field: 'followers' | 'engagements' | 'engagementRate' | 'keywords' | 'relevance' | 'followersGrowth' | 'reelsPlays' | 'audienceGeo' | 'audienceLang' | 'audienceGender' | 'audienceAge' | 'audienceInterest' | 'audienceRelevance';
    direction?: 'asc' | 'desc';
    value?: number;
}
export declare class SearchInfluencersDto {
    platform: PlatformType;
    influencer?: InfluencerFiltersDto;
    audience?: AudienceFiltersDto;
    sort?: SortOptionsDto;
    page?: number;
    calculationMethod?: 'median' | 'average';
}
export declare class InfluencerResultDto {
    id: string;
    platformUserId: string;
    platform: PlatformType;
    username?: string;
    fullName?: string;
    profilePictureUrl?: string;
    biography?: string;
    followerCount: number;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgViews?: number;
    avgReelsPlays?: number;
    isVerified: boolean;
    locationCountry?: string;
    locationCity?: string;
    category?: string;
    followersGrowthRate?: number;
    hasSponsoredPosts?: boolean;
    isBlurred: boolean;
    rankPosition: number;
    match?: {
        influencer?: {
            geo?: any;
            language?: any;
            relevance?: number;
            gender?: string;
            age?: string;
            followersGrowthRate?: number;
            brands?: any[];
            interests?: any[];
            audienceRelevance?: number;
        };
        audience?: {
            ages?: any[];
            ageRange?: any;
            credibility?: number;
            geo?: any;
            interests?: any[];
            languages?: any[];
            genders?: any[];
        };
    };
}
export declare class SearchResponseDto {
    searchId: string;
    platform: PlatformType;
    results: InfluencerResultDto[];
    resultCount: number;
    totalAvailable: number;
    page: number;
    hasMore: boolean;
    creditsUsed: number;
    remainingBalance: number;
    isExactMatch?: boolean;
}
export declare class SearchHistoryItemDto {
    id: string;
    platform: PlatformType;
    filtersApplied: Record<string, any>;
    resultCount: number;
    creditsUsed: number;
    createdAt: Date;
}
export declare class SearchHistoryResponseDto {
    searches: SearchHistoryItemDto[];
    total: number;
}
export {};
