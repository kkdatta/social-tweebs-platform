import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformType } from '../../../common/enums';

// ============ BASIC FILTER DTOs ============

class RangeFilter {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  min?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max?: number;
}

class LocationFilter {
  @ApiProperty({ description: 'Location ID from the locations dictionary' })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'Weight for audience filters (0-1)', default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class InterestFilter {
  @ApiProperty({ description: 'Interest ID from the interests dictionary' })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ description: 'Weight for audience filters (0-1)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class GenderFilter {
  @ApiProperty({ enum: ['MALE', 'FEMALE'], description: 'Gender code' })
  @IsString()
  id: 'MALE' | 'FEMALE';

  @ApiPropertyOptional({ description: 'Weight for audience filters (0-1)', default: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class AgeFilter {
  @ApiProperty({ enum: ['13-17', '18-24', '25-34', '35-44', '45-64', '65-'], description: 'Age range code' })
  @IsString()
  id: '13-17' | '18-24' | '25-34' | '35-44' | '45-64' | '65-';

  @ApiPropertyOptional({ description: 'Weight for audience filters (0-1)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class AgeRangeFilter {
  @ApiPropertyOptional({ enum: ['13', '18', '25', '35', '45', '65'], description: 'Minimum age' })
  @IsOptional()
  @IsString()
  min?: '13' | '18' | '25' | '35' | '45' | '65';

  @ApiPropertyOptional({ enum: ['17', '24', '34', '44', '64'], description: 'Maximum age' })
  @IsOptional()
  @IsString()
  max?: '17' | '24' | '34' | '44' | '64';

  @ApiPropertyOptional({ description: 'Weight (0-1)', default: 0.3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class LanguageFilter {
  @ApiProperty({ description: 'Language code (e.g., "en", "hi")' })
  @IsString()
  id: string;

  @ApiPropertyOptional({ description: 'Weight for audience filters (0-1)', default: 0.2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weight?: number;
}

class BrandFilter {
  @ApiProperty({ description: 'Brand ID from the brands dictionary' })
  @IsNumber()
  id: number;
}

// ============ NEW: TEXT TAGS FILTER ============
class TextTagFilter {
  @ApiProperty({ enum: ['hashtag', 'mention'], description: 'Type of tag' })
  @IsString()
  type: 'hashtag' | 'mention';

  @ApiProperty({ description: 'The hashtag or mention value without # or @' })
  @IsString()
  value: string;
}

// ============ NEW: FOLLOWERS GROWTH RATE FILTER ============
class FollowersGrowthRateFilter {
  @ApiProperty({ 
    enum: ['i1month', 'i2months', 'i3months', 'i4months', 'i5months', 'i6months'],
    description: 'Time interval for growth measurement' 
  })
  @IsString()
  interval: 'i1month' | 'i2months' | 'i3months' | 'i4months' | 'i5months' | 'i6months';

  @ApiProperty({ description: 'Growth rate value (e.g., 0.01 for 1%)' })
  @IsNumber()
  value: number;

  @ApiProperty({ enum: ['gte', 'gt', 'lt', 'lte'], description: 'Comparison operator' })
  @IsString()
  operator: 'gte' | 'gt' | 'lt' | 'lte';
}

// ============ NEW: CONTACT DETAILS FILTER ============
class ContactDetailsFilter {
  @ApiProperty({ 
    enum: ['email', 'facebook', 'instagram', 'youtube', 'tiktok', 'twitter', 'snapchat', 'linkedin', 'pinterest', 'tumblr', 'twitch', 'vk', 'wechat', 'linktree', 'kik', 'skype', 'bbm', 'kakao', 'lineid', 'sarahah', 'sayat', 'itunes'],
    description: 'Type of contact channel' 
  })
  @IsString()
  contactType: string;

  @ApiPropertyOptional({ 
    enum: ['must', 'should', 'not'], 
    description: 'Filter condition - must include, should include, or must not include',
    default: 'must'
  })
  @IsOptional()
  @IsString()
  filterAction?: 'must' | 'should' | 'not';
}

// ============ NEW: FILTER OPERATIONS (AND/OR/NOT) ============
class FilterOperationDto {
  @ApiProperty({ 
    enum: ['and', 'or', 'not'], 
    description: 'Logical operation to apply' 
  })
  @IsString()
  operator: 'and' | 'or' | 'not';

  @ApiProperty({ 
    enum: ['followers', 'engagements', 'engagementRate', 'lastposted', 'bio', 'keywords', 'relevance', 'language', 'gender', 'age', 'location', 'isVerified', 'interests', 'brands', 'accountTypes', 'hasSponsoredPosts', 'textTags'],
    description: 'Filter to apply the operation on' 
  })
  @IsString()
  filter: string;
}

// ============ INFLUENCER FILTERS (Complete Modash API) ============
export class InfluencerFiltersDto {
  // Basic Metrics
  @ApiPropertyOptional({ type: RangeFilter, description: 'Follower count range' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeFilter)
  followers?: RangeFilter;

  @ApiPropertyOptional({ description: 'Engagement rate: number for >= (e.g. 0.02 for 2%), or {min,max} range' })
  @IsOptional()
  engagementRate?: number | RangeFilter;

  @ApiPropertyOptional({ type: RangeFilter, description: 'Engagements count range (NEW)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeFilter)
  engagements?: RangeFilter;

  @ApiPropertyOptional({ type: RangeFilter, description: 'Reels plays range - Instagram only (NEW)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeFilter)
  reelsPlays?: RangeFilter;

  // Location & Language
  @ApiPropertyOptional({ type: [Number], description: 'Array of location IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  location?: number[];

  @ApiPropertyOptional({ description: 'Language code (e.g., "en")' })
  @IsOptional()
  @IsString()
  language?: string;

  // Demographics
  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'KNOWN', 'UNKNOWN'], description: 'Influencer gender' })
  @IsOptional()
  @IsString()
  gender?: 'MALE' | 'FEMALE' | 'KNOWN' | 'UNKNOWN';

  @ApiPropertyOptional({ type: RangeFilter, description: 'Influencer age range (values: 18, 25, 35, 45, 65)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RangeFilter)
  age?: RangeFilter;

  // Content & Activity
  @ApiPropertyOptional({ description: 'Days since last post (min 30) - Find active influencers (NEW)' })
  @IsOptional()
  @IsNumber()
  @Min(30)
  lastposted?: number;

  @ApiPropertyOptional({ description: 'Search in bio description and/or full name' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Keyword phrase used in post captions (NEW)' })
  @IsOptional()
  @IsString()
  keywords?: string;

  @ApiPropertyOptional({ 
    type: [TextTagFilter], 
    description: 'Filter by hashtags or mentions used in posts (NEW)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TextTagFilter)
  textTags?: TextTagFilter[];

  @ApiPropertyOptional({ 
    type: [String], 
    description: 'Relevance/lookalike by topic - hashtags (#cars) or usernames (@topgear) (NEW)' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relevance?: string[];

  @ApiPropertyOptional({ 
    type: [String], 
    description: 'Audience similarity lookalike - usernames like @topgear (NEW)' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audienceRelevance?: string[];

  // Account Properties
  @ApiPropertyOptional({ description: 'Filter by verified accounts only' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ 
    type: [Number], 
    description: 'Account types: 1=Regular, 2=Business, 3=Creator' 
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  accountTypes?: number[];

  @ApiPropertyOptional({ description: 'Filter by influencers with sponsored posts (NEW)' })
  @IsOptional()
  @IsBoolean()
  hasSponsoredPosts?: boolean;

  @ApiPropertyOptional({ description: 'Filter by influencers with YouTube channel (NEW)' })
  @IsOptional()
  @IsBoolean()
  hasYouTube?: boolean;

  // Contact Details
  @ApiPropertyOptional({ 
    type: [ContactDetailsFilter], 
    description: 'Filter by specific contact channel types (NEW)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDetailsFilter)
  hasContactDetails?: ContactDetailsFilter[];

  // Brands & Interests
  @ApiPropertyOptional({ type: [Number], description: 'Array of brand IDs the influencer has worked with' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  brands?: number[];

  @ApiPropertyOptional({ type: [Number], description: 'Array of interest IDs' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  interests?: number[];

  // Growth Metrics
  @ApiPropertyOptional({ 
    type: FollowersGrowthRateFilter, 
    description: 'Filter by followers growth rate over time (NEW)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FollowersGrowthRateFilter)
  followersGrowthRate?: FollowersGrowthRateFilter;

  // Advanced: Filter Operations
  @ApiPropertyOptional({ 
    type: [FilterOperationDto], 
    description: 'Combine filters with AND/OR/NOT logic (NEW)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterOperationDto)
  filterOperations?: FilterOperationDto[];

  // Legacy/additional fields for backward compatibility
  @ApiPropertyOptional({ description: 'Search by username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ type: [String], description: 'Filter by influencer category' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

// ============ AUDIENCE FILTERS (Complete Modash API) ============
export class AudienceFiltersDto {
  @ApiPropertyOptional({ 
    type: [LocationFilter], 
    description: 'Audience location with weight (default 0.2)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationFilter)
  location?: LocationFilter[];

  @ApiPropertyOptional({ 
    type: GenderFilter, 
    description: 'Audience gender (followers) with weight (default 0.5)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenderFilter)
  gender?: GenderFilter;

  @ApiPropertyOptional({ 
    type: GenderFilter, 
    description: 'Engagers gender with weight (default 0.5)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GenderFilter)
  engagersGender?: GenderFilter;

  @ApiPropertyOptional({ 
    type: [AgeFilter], 
    description: 'Audience age groups with weight (default 0.3)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgeFilter)
  age?: AgeFilter[];

  @ApiPropertyOptional({ 
    type: AgeRangeFilter, 
    description: 'Custom audience age range - alternative to age[] (NEW)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgeRangeFilter)
  ageRange?: AgeRangeFilter;

  @ApiPropertyOptional({ 
    type: [InterestFilter], 
    description: 'Audience interests with weight (default 0.3)' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InterestFilter)
  interests?: InterestFilter[];

  @ApiPropertyOptional({ 
    type: LanguageFilter, 
    description: 'Audience language with weight (default 0.2)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LanguageFilter)
  language?: LanguageFilter;

  @ApiPropertyOptional({ 
    description: 'Audience credibility - inverse of fake followers (e.g., 0.75 = 25% fake) (NEW)',
    minimum: 0,
    maximum: 1 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  credibility?: number;
}

// ============ SORT OPTIONS (Complete Modash API) ============
export class SortOptionsDto {
  @ApiProperty({ 
    enum: [
      'followers', 'engagements', 'engagementRate', 
      'keywords', 'relevance', 'followersGrowth', 'reelsPlays',
      'audienceGeo', 'audienceLang', 'audienceGender', 'audienceAge', 
      'audienceInterest', 'audienceRelevance'
    ],
    description: 'Sort field - some require corresponding filter to be applied' 
  })
  @IsString()
  field: 
    | 'followers' 
    | 'engagements' 
    | 'engagementRate'
    | 'keywords'
    | 'relevance'
    | 'followersGrowth'
    | 'reelsPlays'
    | 'audienceGeo'
    | 'audienceLang'
    | 'audienceGender'
    | 'audienceAge'
    | 'audienceInterest'
    | 'audienceRelevance';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  direction?: 'asc' | 'desc';

  @ApiPropertyOptional({ 
    description: 'Required for audienceGeo and audienceInterest sorting - the ID to sort by' 
  })
  @IsOptional()
  @IsNumber()
  value?: number;
}

// ============ MAIN SEARCH REQUEST DTO ============
export class SearchInfluencersDto {
  @ApiProperty({ enum: PlatformType, description: 'Platform to search on' })
  @IsEnum(PlatformType)
  platform: PlatformType;

  @ApiPropertyOptional({ type: InfluencerFiltersDto, description: 'Influencer profile filters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => InfluencerFiltersDto)
  influencer?: InfluencerFiltersDto;

  @ApiPropertyOptional({ type: AudienceFiltersDto, description: 'Audience demographic filters' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceFiltersDto)
  audience?: AudienceFiltersDto;

  @ApiPropertyOptional({ type: SortOptionsDto, description: 'Sorting options' })
  @IsOptional()
  @ValidateNested()
  @Type(() => SortOptionsDto)
  sort?: SortOptionsDto;

  @ApiPropertyOptional({ default: 0, description: 'Page number (0-indexed)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({ 
    enum: ['median', 'average'], 
    description: 'Method for computing average-based metrics (NEW)' 
  })
  @IsOptional()
  @IsString()
  calculationMethod?: 'median' | 'average';
}

// ============ SEARCH RESPONSE DTOs ============
export class InfluencerResultDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platformUserId: string;

  @ApiProperty({ enum: PlatformType })
  platform: PlatformType;

  @ApiPropertyOptional()
  username?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  profilePictureUrl?: string;

  @ApiPropertyOptional()
  biography?: string;

  @ApiProperty()
  followerCount: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  avgLikes?: number;

  @ApiPropertyOptional()
  avgComments?: number;

  @ApiPropertyOptional()
  avgViews?: number;

  @ApiPropertyOptional({ description: 'Average reels plays (Instagram)' })
  avgReelsPlays?: number;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional()
  locationCountry?: string;

  @ApiPropertyOptional()
  locationCity?: string;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Followers growth rate' })
  followersGrowthRate?: number;

  @ApiPropertyOptional({ description: 'Has sponsored posts' })
  hasSponsoredPosts?: boolean;

  @ApiProperty()
  isBlurred: boolean;

  @ApiProperty()
  rankPosition: number;

  // Match data (returned when using certain filters)
  @ApiPropertyOptional({ description: 'Match data for the applied filters' })
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

export class SearchResponseDto {
  @ApiProperty()
  searchId: string;

  @ApiProperty()
  platform: PlatformType;

  @ApiProperty({ type: [InfluencerResultDto] })
  results: InfluencerResultDto[];

  @ApiProperty()
  resultCount: number;

  @ApiProperty()
  totalAvailable: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  hasMore: boolean;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  remainingBalance: number;

  @ApiPropertyOptional({ description: 'Whether results exactly match filters or are similar' })
  isExactMatch?: boolean;
}

// ============ SEARCH HISTORY ============
export class SearchHistoryItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  platform: PlatformType;

  @ApiProperty()
  filtersApplied: Record<string, any>;

  @ApiProperty()
  resultCount: number;

  @ApiProperty()
  creditsUsed: number;

  @ApiProperty()
  createdAt: Date;
}

export class SearchHistoryResponseDto {
  @ApiProperty({ type: [SearchHistoryItemDto] })
  searches: SearchHistoryItemDto[];

  @ApiProperty()
  total: number;
}
