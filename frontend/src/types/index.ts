// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUB_USER';
  credits: number;
  /** Enabled feature keys from the API (e.g. INFLUENCER_DISCOVERY). Omitted for older stored sessions. */
  featureAccess?: string[];
  parentId?: string;
  phone?: string;
  businessName?: string;
  status?: string;
  accountExpiresAt?: string;
  daysRemaining?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  creditBalance?: number;
  accountExpiresAt?: string;
  daysRemaining?: number;
}

// Profile Types
export interface ProfileData {
  id: string;
  email: string;
  name: string;
  phone: string;
  businessName: string;
  role: string;
  status: string;
  creditBalance: number;
  accountValidUntil: string | null;
  daysRemaining: number;
  createdAt: string;
}

export interface NotificationPreferences {
  notifyDiscoveryExport: boolean;
  notifyCollabExport: boolean;
  notifyOverlapReport: boolean;
  notifyContentDiscovery: boolean;
  notifyGroupImport: boolean;
  notifyCampaignImport: boolean;
  notifyReportShared: boolean;
}

export interface AccountExpiry {
  expiresAt: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

// Influencer Types
export type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK' | 'LINKEDIN';

export interface InfluencerProfile {
  id: string;
  platformUserId: string;
  platform: Platform;
  username: string;
  fullName?: string;
  profilePictureUrl?: string;
  biography?: string;
  followerCount: number;
  followingCount?: number;
  postCount?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
  avgViews?: number;
  avgReelsPlays?: number;
  isVerified: boolean;
  isBusinessAccount?: boolean;
  locationCountry?: string;
  locationCity?: string;
  category?: string;
  audienceCredibility?: number;
  followersGrowthRate?: number;
  hasSponsoredPosts?: boolean;
  isBlurred?: boolean;
  lastUpdatedAt: string;
  match?: {
    influencer?: any;
    audience?: any;
  };
}

// ============ NEW: Text Tag Filter ============
export interface TextTagFilter {
  type: 'hashtag' | 'mention';
  value: string;
}

// ============ NEW: Followers Growth Rate Filter ============
export interface FollowersGrowthRateFilter {
  interval: 'i1month' | 'i2months' | 'i3months' | 'i4months' | 'i5months' | 'i6months';
  value: number;
  operator: 'gte' | 'gt' | 'lt' | 'lte';
}

// ============ NEW: Contact Details Filter ============
export interface ContactDetailsFilter {
  contactType: string;
  filterAction?: 'must' | 'should' | 'not';
}

// ============ NEW: Filter Operation ============
export interface FilterOperation {
  operator: 'and' | 'or' | 'not';
  filter: string;
}

// ============ COMPLETE Search Filters Interface ============
export interface SearchFilters {
  platform: Platform;
  influencer?: {
    // Basic Metrics
    followers?: { min?: number; max?: number };
    engagementRate?: number;
    engagements?: { min?: number; max?: number };
    reelsPlays?: { min?: number; max?: number };

    // Location & Language
    location?: number[];
    language?: string;

    // Demographics
    gender?: 'MALE' | 'FEMALE' | 'KNOWN' | 'UNKNOWN';
    age?: { min?: number; max?: number };

    // Content & Activity
    lastposted?: number;
    bio?: string;
    keywords?: string;
    textTags?: TextTagFilter[];
    relevance?: string[];
    audienceRelevance?: string[];

    // Account Properties
    isVerified?: boolean;
    accountTypes?: number[];
    hasSponsoredPosts?: boolean;
    hasYouTube?: boolean;

    // Contact Details
    hasContactDetails?: ContactDetailsFilter[];

    // Brands & Interests
    brands?: number[];
    interests?: number[];

    // Growth Metrics
    followersGrowthRate?: FollowersGrowthRateFilter;

    // Advanced Filter Operations
    filterOperations?: FilterOperation[];

    // Legacy fields
    username?: string;
    categories?: string[];
  };
  audience?: {
    location?: { id: number; weight?: number }[];
    gender?: { id: 'MALE' | 'FEMALE'; weight?: number };
    age?: { id: '13-17' | '18-24' | '25-34' | '35-44' | '45-64' | '65-'; weight?: number }[];
    ageRange?: { min?: string; max?: string; weight?: number };
    interests?: { id: number; weight?: number }[];
    language?: { id: string; weight?: number };
    credibility?: number;
  };
  sort?: {
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
    direction: 'asc' | 'desc';
    value?: number;
  };
  page?: number;
  calculationMethod?: 'median' | 'average';
}

export interface SearchResponse {
  total: number;
  page: number;
  influencers: InfluencerProfile[];
  creditsUsed: number;
  isExactMatch?: boolean;
}

export interface AudienceData {
  type: string;
  categoryKey: string;
  percentage: number;
  affinityScore?: number;
}

export interface InfluencerInsights extends InfluencerProfile {
  audienceData: AudienceData[];
  wordCloud?: { word: string; count: number }[];
  lookalikes?: InfluencerProfile[];
  audienceLookalikes?: InfluencerProfile[];
  brandAffinity?: { brand: string; percentage: number }[];
  interests?: { interest: string; percentage: number }[];
  topPosts?: {
    id: string;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    postedAt: string;
  }[];
  recentPosts?: {
    id: string;
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    postedAt: string;
  }[];
}

// Credit Types
export interface CreditAccount {
  id: string;
  userId: string;
  balance: number;
  totalCreditsAdded: number;
  totalCreditsUsed: number;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  actionType: string;
  description?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dictionary Types
export interface LocationOption {
  id: number;
  name: string;
  type?: 'country' | 'city' | 'state';
  code?: string;
}

export interface InterestOption {
  id: number;
  name: string;
  category?: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface BrandOption {
  id: number;
  name: string;
  logoUrl?: string;
}

export interface TopicOption {
  id: number;
  name: string;
}

export interface HashtagOption {
  id: string;
  name: string;
  postCount?: number;
}

// Contact Types for hasContactDetails filter
export const CONTACT_TYPES = [
  { value: 'email', label: 'Email' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'snapchat', label: 'Snapchat' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'tumblr', label: 'Tumblr' },
  { value: 'twitchtv', label: 'Twitch' },
  { value: 'vk', label: 'VK' },
  { value: 'wechat', label: 'WeChat' },
  { value: 'linktree', label: 'Linktree' },
  { value: 'kik', label: 'Kik' },
  { value: 'skype', label: 'Skype' },
] as const;

// Account Types
export const ACCOUNT_TYPES = [
  { value: 1, label: 'Regular' },
  { value: 2, label: 'Business' },
  { value: 3, label: 'Creator' },
] as const;

// Growth Rate Intervals
export const GROWTH_INTERVALS = [
  { value: 'i1month', label: '1 Month' },
  { value: 'i2months', label: '2 Months' },
  { value: 'i3months', label: '3 Months' },
  { value: 'i4months', label: '4 Months' },
  { value: 'i5months', label: '5 Months' },
  { value: 'i6months', label: '6 Months' },
] as const;

// Age Groups
export const AGE_GROUPS = [
  { value: '13-17', label: '13-17' },
  { value: '18-24', label: '18-24' },
  { value: '25-34', label: '25-34' },
  { value: '35-44', label: '35-44' },
  { value: '45-64', label: '45-64' },
  { value: '65-', label: '65+' },
] as const;

// Sort Fields
export const SORT_FIELDS = [
  { value: 'followers', label: 'Followers', requiresFilter: false },
  { value: 'engagements', label: 'Engagements', requiresFilter: false },
  { value: 'engagementRate', label: 'Engagement Rate', requiresFilter: false },
  { value: 'keywords', label: 'Keyword Match', requiresFilter: true },
  { value: 'relevance', label: 'Relevance', requiresFilter: true },
  { value: 'followersGrowth', label: 'Followers Growth', requiresFilter: true },
  { value: 'reelsPlays', label: 'Reels Plays', requiresFilter: false },
  { value: 'audienceGeo', label: 'Audience Location Match', requiresFilter: true },
  { value: 'audienceLang', label: 'Audience Language Match', requiresFilter: true },
  { value: 'audienceGender', label: 'Audience Gender Match', requiresFilter: true },
  { value: 'audienceAge', label: 'Audience Age Match', requiresFilter: true },
  { value: 'audienceInterest', label: 'Audience Interest Match', requiresFilter: true },
  { value: 'audienceRelevance', label: 'Audience Relevance', requiresFilter: true },
] as const;
