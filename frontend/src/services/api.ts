import axios from 'axios';
import type { 
  AuthResponse, 
  SearchFilters, 
  SearchResponse, 
  InfluencerInsights,
  CreditAccount,
  Platform,
  LocationOption,
  InterestOption,
  LanguageOption,
  BrandOption,
  TopicOption,
  HashtagOption,
  ProfileData,
  NotificationPreferences,
  AccountExpiry,
} from '../types';

// Use relative URL so Vite proxy handles it (works for both localhost and tunnel)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post('/api/v1/auth/login', { email, password });
    return data;
  },
  
  signup: async (userData: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    businessName: string;
    campaignFrequency: '10-100' | '100-1000' | '1000+';
    message?: string;
  }): Promise<{ message: string }> => {
    const { data } = await api.post('/api/v1/auth/signup', userData);
    return data;
  },
  
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post('/api/v1/auth/forgot-password', { email });
    return data;
  },
  
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const { data } = await api.post('/api/v1/auth/reset-password', { token, newPassword: password, password });
    return data;
  },
  
  getProfile: async () => {
    const { data } = await api.get('/api/v1/profile');
    return data;
  },

  getSignupRequests: async (status?: string): Promise<any[]> => {
    const params = status ? { status } : {};
    const { data } = await api.get('/api/v1/auth/signup-requests', { params });
    return data;
  },

  approveSignup: async (id: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post(`/api/v1/auth/approve-signup/${id}`);
    return data;
  },

  rejectSignup: async (id: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.post(`/api/v1/auth/reject-signup/${id}`, { reason });
    return data;
  },
};

// Profile APIs
export const profileApi = {
  getProfile: async (): Promise<ProfileData> => {
    const { data } = await api.get('/api/v1/profile');
    return data;
  },

  updateProfile: async (profileData: { name?: string; phone?: string }): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.put('/api/v1/profile', profileData);
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.put('/api/v1/profile/password', { currentPassword, newPassword });
    return data;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const { data } = await api.get('/api/v1/profile/preferences');
    return data;
  },

  updatePreferences: async (preferences: Partial<NotificationPreferences>): Promise<{ success: boolean; message: string }> => {
    const { data } = await api.put('/api/v1/profile/preferences', preferences);
    return data;
  },

  getAccountExpiry: async (): Promise<AccountExpiry> => {
    const { data } = await api.get('/api/v1/profile/account-expiry');
    return data;
  },
};

// Discovery APIs
export const discoveryApi = {
  search: async (filters: SearchFilters): Promise<SearchResponse> => {
    console.log('Sending search request:', JSON.stringify(filters, null, 2));
    const { data } = await api.post('/api/v1/discovery/search', filters);
    // Map the response to our expected format
    return {
      total: data.totalAvailable || 0,
      page: data.page || 0,
      influencers: (data.results || []).map((r: any) => ({
        id: r.id,
        platformUserId: r.platformUserId,
        platform: r.platform,
        username: r.username,
        fullName: r.fullName,
        profilePictureUrl: r.profilePictureUrl,
        biography: r.biography,
        followerCount: r.followerCount,
        engagementRate: r.engagementRate,
        avgLikes: r.avgLikes,
        avgComments: r.avgComments,
        avgViews: r.avgViews,
        avgReelsPlays: r.avgReelsPlays,
        isVerified: r.isVerified,
        locationCountry: r.locationCountry,
        locationCity: r.locationCity,
        category: r.category,
        followersGrowthRate: r.followersGrowthRate,
        hasSponsoredPosts: r.hasSponsoredPosts,
        isBlurred: r.isBlurred,
        lastUpdatedAt: new Date().toISOString(),
        match: r.match,
      })),
      creditsUsed: data.creditsUsed || 0,
      remainingBalance: data.remainingBalance,
      hasMore: data.hasMore,
      isExactMatch: data.isExactMatch,
    };
  },
  
  getInfluencer: async (id: string): Promise<InfluencerInsights> => {
    const { data } = await api.get(`/api/v1/discovery/influencer/${id}`);
    return data;
  },
  
  unblur: async (profileIds: string[], platform: string): Promise<{ 
    unblurredCount: number; 
    creditsUsed: number;
    profiles: InfluencerInsights[];
  }> => {
    const { data } = await api.post('/api/v1/discovery/unblur', { profileIds, platform });
    return data;
  },
  
  viewInsights: async (
    profileId: string,
  ): Promise<InfluencerInsights & { insightId: string }> => {
    const { data } = await api.get(`/api/v1/discovery/insights/${profileId}`);
    return data;
  },
  
  refreshInsights: async (profileId: string): Promise<InfluencerInsights> => {
    const { data } = await api.post(`/api/v1/discovery/influencer/${profileId}/refresh`);
    return data;
  },
  
  export: async (params: {
    profileIds: string[];
    format?: 'csv' | 'xlsx' | 'json';
    fileName?: string;
    excludePreviouslyExported?: boolean;
  }): Promise<{ 
    success: boolean;
    exportedCount: number;
    creditsUsed: number;
    remainingBalance: number;
    downloadUrl?: string;
    data?: any[];
  }> => {
    const { data } = await api.post('/api/v1/discovery/export', {
      profileIds: params.profileIds,
      format: params.format || 'csv',
      fileName: params.fileName,
      excludePreviouslyExported: params.excludePreviouslyExported || false,
    });
    return data;
  },

  getExportHistory: async (): Promise<{
    exports: { id: string; fileName: string; exportedCount: number; creditsUsed: number; createdAt: string; profileIds: string[] }[];
    total: number;
    allExportedProfileIds: string[];
  }> => {
    const { data } = await api.get('/api/v1/discovery/export-history');
    return data;
  },

  getExportCostEstimate: async (profileIds: string[], excludePreviouslyExported = false): Promise<{
    count: number;
    creditCost: number;
    previouslyExportedCount: number;
    newExportCount: number;
  }> => {
    const { data } = await api.post('/api/v1/discovery/export-cost-estimate', {
      profileIds,
      excludePreviouslyExported,
    });
    return data;
  },

  checkInsightsAccess: async (profileId: string): Promise<{
    hasAccess: boolean;
    creditCost: number;
    firstAccessedAt?: string;
    insightId?: string;
  }> => {
    const { data } = await api.get(`/api/v1/discovery/insights-check/${profileId}`);
    return data;
  },
  
  getSearchHistory: async (page = 1, limit = 10) => {
    const { data } = await api.get('/api/v1/discovery/search/history', { params: { page, limit } });
    return data;
  },
  
  // ============ DICTIONARY ENDPOINTS ============
  
  getLocations: async (query?: string, limit = 100): Promise<LocationOption[]> => {
    const { data } = await api.get('/api/v1/discovery/locations', { 
      params: { query, limit } 
    });
    return data?.locations || data?.data || [];
  },
  
  getInterests: async (platform: Platform): Promise<InterestOption[]> => {
    const { data } = await api.get(`/api/v1/discovery/interests/${platform.toLowerCase()}`);
    return data?.interests || data?.data || [];
  },
  
  getLanguages: async (): Promise<LanguageOption[]> => {
    const { data } = await api.get('/api/v1/discovery/languages');
    return data?.languages || data?.data || [];
  },
  
  getBrands: async (query?: string, limit = 100): Promise<BrandOption[]> => {
    const { data } = await api.get('/api/v1/discovery/brands', { 
      params: { query, limit } 
    });
    return data?.brands || data?.data || [];
  },

  // NEW: Topics endpoint
  getTopics: async (platform: Platform, query?: string): Promise<TopicOption[]> => {
    const { data } = await api.get(`/api/v1/discovery/topics/${platform.toLowerCase()}`, {
      params: { query }
    });
    return data?.topics || data?.data || [];
  },

  // NEW: Hashtags endpoint
  getHashtags: async (platform: Platform, query?: string): Promise<HashtagOption[]> => {
    const { data } = await api.get(`/api/v1/discovery/hashtags/${platform.toLowerCase()}`, {
      params: { query }
    });
    return data?.hashtags || data?.data || [];
  },

  // NEW: Users/Influencers lookup (for lookalike search)
  getUsers: async (platform: Platform, query?: string): Promise<{ userId: string; username: string; fullName?: string; picture?: string }[]> => {
    const { data } = await api.get(`/api/v1/discovery/users/${platform.toLowerCase()}`, {
      params: { query }
    });
    return data?.users || data?.data || [];
  },

  // NEW: AI Search endpoints
  aiTextSearch: async (platform: Platform, query: string, filters?: SearchFilters): Promise<SearchResponse> => {
    const { data } = await api.post(`/api/v1/discovery/ai/${platform.toLowerCase()}/text-search`, {
      query,
      ...filters
    });
    return {
      total: data.totalAvailable || 0,
      page: data.page || 0,
      influencers: data.results || [],
      creditsUsed: data.creditsUsed || 0,
    };
  },

  aiImageSearch: async (platform: Platform, imageUrl: string, filters?: SearchFilters): Promise<SearchResponse> => {
    const { data } = await api.post(`/api/v1/discovery/ai/${platform.toLowerCase()}/image-search`, {
      imageUrl,
      ...filters
    });
    return {
      total: data.totalAvailable || 0,
      page: data.page || 0,
      influencers: data.results || [],
      creditsUsed: data.creditsUsed || 0,
    };
  },

  // NEW: Audience Overlap
  getAudienceOverlap: async (platform: Platform, userIds: string[]): Promise<{
    overlap: number;
    users: any[];
  }> => {
    const { data } = await api.post(`/api/v1/discovery/${platform.toLowerCase()}/audience-overlap`, {
      userIds
    });
    return data;
  },

  // NEW: Collaborations
  getCollaborationPosts: async (params: {
    platform?: Platform;
    influencerIds?: string[];
    brandIds?: number[];
    startDate?: string;
    endDate?: string;
    page?: number;
  }): Promise<{ posts: any[]; total: number }> => {
    const { data } = await api.post('/api/v1/discovery/collaborations/posts', params);
    return data;
  },

  getCollaborationSummary: async (params: {
    platform?: Platform;
    influencerIds?: string[];
    brandIds?: number[];
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalLikes: number;
    totalShares: number;
    totalViews: number;
    totalCollects: number;
    totalPlays: number;
    perBrand?: any[];
    perInfluencer?: any[];
  }> => {
    const { data } = await api.post('/api/v1/discovery/collaborations/summary', params);
    return data;
  },

  // NEW: Email Search
  searchByEmail: async (emails: string[]): Promise<{
    results: { email: string; accounts: { platform: Platform; userId: string; username: string }[] }[];
    creditsUsed: number;
  }> => {
    const { data } = await api.post('/api/v1/discovery/email-search', { emails });
    return data;
  },
};

// Credits APIs
export const creditsApi = {
  getBalance: async (): Promise<CreditAccount> => {
    const { data } = await api.get('/api/v1/credits/balance');
    return data;
  },
  
  getTransactions: async (params?: {
    module?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/credits/transactions', { params });
    return data;
  },

  getUsageChart: async (days = 30): Promise<{
    labels: string[];
    credits: number[];
    debits: number[];
  }> => {
    const { data } = await api.get('/api/v1/credits/usage-chart', { params: { days } });
    return data;
  },

  getCreditGuide: async (): Promise<{
    rules: { action: string; description: string; creditCost: string; notes?: string }[];
    generalInfo: { creditValue: string; refreshInfo: string; reportInfo: string };
  }> => {
    const { data } = await api.get('/api/v1/credits/guide');
    return data;
  },

  // Analytics / Usage Logs (Admin only)
  getAnalyticsSummary: async (): Promise<{
    totalTeamMembers: number;
    totalCreditsAllocated: number;
    totalCreditsUsed: number;
    activeUsers: number;
    usageByModule: Record<string, number>;
  }> => {
    const { data } = await api.get('/api/v1/credits/analytics/summary');
    return data;
  },

  getUsageLogs: async (params?: {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: Array<{
      userId: string;
      name: string;
      email: string;
      country: string;
      currentBalance: number;
      totalCreditsAdded: number;
      discoveryUsage: number;
      insightsUsage: number;
      otherUsage: number;
      lastActiveAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const { data } = await api.get('/api/v1/credits/usage-logs', { params });
    return data;
  },

  getUserCreditDetail: async (userId: string, params?: {
    transactionType?: 'CREDIT' | 'DEBIT' | 'ALL';
    moduleType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    user: {
      userId: string;
      name: string;
      email: string;
      currentBalance: number;
      totalCreditsAdded: number;
      totalCreditsUsed: number;
      accountValidUntil: string;
      daysRemaining: number;
    };
    monthlyBreakdown: Array<{
      month: string;
      moduleType: string;
      transactionType: string;
      totalAmount: number;
      transactionCount: number;
    }>;
    transactions: Array<{
      id: string;
      transactionType: string;
      amount: number;
      moduleType: string;
      actionType: string;
      comment: string;
      balanceBefore: number;
      balanceAfter: number;
      createdAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> => {
    const { data } = await api.get(`/api/v1/credits/usage-logs/${userId}`, { params });
    return data;
  },
};

// Insights APIs
export const insightsApi = {
  // List user's unlocked insights
  list: async (params?: {
    platform?: Platform;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: Array<{
      id: string;
      platform: Platform;
      username: string;
      fullName?: string;
      profilePictureUrl?: string;
      followerCount: number;
      engagementRate?: number;
      isVerified: boolean;
      unlockedAt: string;
      lastRefreshedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
  }> => {
    const { data } = await api.get('/api/v1/insights', { params });
    return data;
  },

  // Search and unlock a new insight
  search: async (platform: Platform, username: string): Promise<{
    success: boolean;
    isNew: boolean;
    creditsUsed: number;
    remainingBalance?: number;
    insight: any;
  }> => {
    const { data } = await api.post('/api/v1/insights/search', { platform, username });
    return data;
  },

  // Get full insight details
  getById: async (id: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/insights/${id}`);
    return data;
  },

  // Force refresh insight (costs 1 credit)
  refresh: async (id: string): Promise<{
    success: boolean;
    creditsUsed: number;
    remainingBalance: number;
    insight: any;
  }> => {
    const { data } = await api.post(`/api/v1/insights/${id}/refresh`);
    return data;
  },

  // Get cache TTL config
  getCacheTTL: async (): Promise<{ ttlDays: number }> => {
    const { data } = await api.get('/api/v1/insights/config/cache-ttl');
    return data;
  },
};

// Campaigns APIs
export const campaignsApi = {
  list: async (params?: {
    tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me' | 'sample_public';
    status?: string;
    platform?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    campaigns: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const { data } = await api.get('/api/v1/campaigns', { params });
    return data;
  },

  getDashboard: async (): Promise<any> => {
    const { data } = await api.get('/api/v1/campaigns/dashboard');
    return data;
  },

  getCreditNotification: async (): Promise<{ showWarning: boolean; message: string; balance: number }> => {
    const { data } = await api.get('/api/v1/campaigns/credit-notification');
    return data;
  },

  uploadLogo: async (file: File): Promise<{ success: boolean; path: string; logoUrl: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await api.post('/api/v1/campaigns/upload/logo', formData);
    return data;
  },

  getById: async (id: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/campaigns/${id}`);
    return data;
  },

  create: async (campaignData: {
    name: string;
    description?: string;
    logoUrl?: string;
    platform: string;
    objective?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    currency?: string;
    hashtags?: string[];
    mentions?: string[];
    targetAudience?: Record<string, any>;
  }): Promise<{ success: boolean; campaign: any }> => {
    const { data } = await api.post('/api/v1/campaigns', campaignData);
    return data;
  },

  update: async (id: string, campaignData: Partial<{
    name: string;
    description: string;
    logoUrl: string;
    platform: string;
    status: string;
    objective: string;
    startDate: string;
    endDate: string;
    budget: number;
    currency: string;
    hashtags: string[];
    mentions: string[];
  }>): Promise<{ success: boolean; campaign: any }> => {
    const { data } = await api.patch(`/api/v1/campaigns/${id}`, campaignData);
    return data;
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/v1/campaigns/${id}`);
    return data;
  },

  addInfluencer: async (campaignId: string, influencerData: {
    influencerProfileId?: string;
    influencerName: string;
    influencerUsername?: string;
    platform: string;
    followerCount?: number;
    budgetAllocated?: number;
    notes?: string;
  }): Promise<{ success: boolean; influencer: any }> => {
    const { data } = await api.post(`/api/v1/campaigns/${campaignId}/influencers`, influencerData);
    return data;
  },

  getInfluencers: async (campaignId: string, params?: {
    platform?: string;
    publishStatus?: string;
    search?: string;
  }): Promise<{ success: boolean; influencers: any[]; count: number }> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/influencers`, { params });
    return data;
  },

  updateInfluencer: async (campaignId: string, influencerId: string, updateData: any): Promise<{ success: boolean; influencer: any }> => {
    const { data } = await api.patch(`/api/v1/campaigns/${campaignId}/influencers/${influencerId}`, updateData);
    return data;
  },

  removeInfluencer: async (campaignId: string, influencerId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/v1/campaigns/${campaignId}/influencers/${influencerId}`);
    return data;
  },

  addPost: async (campaignId: string, postData: any): Promise<{ success: boolean; post: any }> => {
    const { data } = await api.post(`/api/v1/campaigns/${campaignId}/posts`, postData);
    return data;
  },

  getPosts: async (campaignId: string, params?: {
    platform?: string;
    postType?: string;
    publishStatus?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; posts: any[]; total: number }> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/posts`, { params });
    return data;
  },

  removePost: async (campaignId: string, postId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/v1/campaigns/${campaignId}/posts/${postId}`);
    return data;
  },

  createDeliverable: async (campaignId: string, deliverableData: any): Promise<{ success: boolean; deliverable: any }> => {
    const { data } = await api.post(`/api/v1/campaigns/${campaignId}/deliverables`, deliverableData);
    return data;
  },

  getDeliverables: async (campaignId: string): Promise<{ success: boolean; deliverables: any[]; count: number }> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/deliverables`);
    return data;
  },

  updateDeliverable: async (campaignId: string, deliverableId: string, updateData: any): Promise<{ success: boolean; deliverable: any }> => {
    const { data } = await api.patch(`/api/v1/campaigns/${campaignId}/deliverables/${deliverableId}`, updateData);
    return data;
  },

  deleteDeliverable: async (campaignId: string, deliverableId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/v1/campaigns/${campaignId}/deliverables/${deliverableId}`);
    return data;
  },

  recordMetrics: async (campaignId: string, metricsData: any): Promise<{ success: boolean; metric: any }> => {
    const { data } = await api.post(`/api/v1/campaigns/${campaignId}/metrics`, metricsData);
    return data;
  },

  getMetrics: async (campaignId: string): Promise<{ success: boolean; metrics: any }> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/metrics`);
    return data;
  },

  getAnalytics: async (campaignId: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/analytics`);
    return data;
  },

  getExportData: async (campaignId: string, reportType: 'basic' | 'advanced' = 'basic'): Promise<any> => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}/export`, { params: { type: reportType } });
    return data;
  },

  share: async (campaignId: string, shareData: {
    sharedWithUserId: string;
    permissionLevel?: 'VIEW' | 'EDIT' | 'ADMIN';
  }): Promise<{ success: boolean; share: any }> => {
    const { data } = await api.post(`/api/v1/campaigns/${campaignId}/share`, shareData);
    return data;
  },

  removeShare: async (campaignId: string, shareId: string): Promise<{ success: boolean }> => {
    const { data } = await api.delete(`/api/v1/campaigns/${campaignId}/share/${shareId}`);
    return data;
  },
};

// Team APIs
export const teamApi = {
  getMembers: async (params?: { search?: string; status?: string; roleType?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/api/v1/team/members', { params });
    return data;
  },

  getMember: async (id: string) => {
    const { data } = await api.get(`/api/v1/team/members/${id}`);
    return data;
  },

  createMember: async (memberData: {
    name: string;
    email: string;
    password: string;
    roleType: 'CLIENT' | 'BUSINESS_TEAM' | 'FINANCE_TEAM' | 'SALES_TEAM' | 'SUPPORT_TEAM' | 'TECHNICAL_TEAM';
    validityStart: string;
    validityEnd: string;
    phone?: string;
    country?: string;
    enabledFeatures?: string[];
    enabledActions?: string[];
    initialCredits?: number;
    creditComment?: string;
    validityNotificationEnabled?: boolean;
  }) => {
    const { data } = await api.post('/api/v1/team/members', memberData);
    return data;
  },

  updateMember: async (id: string, memberData: Partial<{
    name: string;
    phone: string;
    country: string;
    roleType: string;
    validityStart: string;
    validityEnd: string;
    validityNotificationEnabled: boolean;
    status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'EXPIRED';
  }>) => {
    const { data } = await api.put(`/api/v1/team/members/${id}`, memberData);
    return data;
  },

  deleteMember: async (id: string) => {
    const { data } = await api.delete(`/api/v1/team/members/${id}`);
    return data;
  },

  getFeatures: async (memberId: string) => {
    const { data } = await api.get(`/api/v1/team/members/${memberId}/features`);
    return data;
  },

  updateFeatures: async (memberId: string, features: { featureName: string; isEnabled: boolean }[]) => {
    const { data } = await api.put(`/api/v1/team/members/${memberId}/features`, { features });
    return data;
  },

  getActions: async (memberId: string) => {
    const { data } = await api.get(`/api/v1/team/members/${memberId}/actions`);
    return data;
  },

  updateActions: async (memberId: string, actions: { actionName: string; isEnabled: boolean }[]) => {
    const { data } = await api.put(`/api/v1/team/members/${memberId}/actions`, { actions });
    return data;
  },

  allocateCredits: async (memberId: string, creditData: { amount: number; moduleType?: string; comment?: string }) => {
    const { data } = await api.post(`/api/v1/team/members/${memberId}/credits/allocate`, creditData);
    return data;
  },

  impersonate: async (memberId: string) => {
    const { data } = await api.post(`/api/v1/team/members/${memberId}/impersonate`);
    return data;
  },

  exitImpersonation: async (impersonationId: string) => {
    const { data } = await api.post('/api/v1/team/impersonation/exit', { impersonationId });
    return data;
  },

  getCreditLogs: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await api.get('/api/v1/team/credit-logs', { params });
    return data;
  },

  getCreditDetails: async (userId: string, params?: { transactionType?: string; moduleType?: string; page?: number; limit?: number }) => {
    const { data } = await api.get(`/api/v1/team/credit-logs/${userId}`, { params });
    return data;
  },
};

// Content APIs (FAQs, Privacy Policy, Terms)
export const contentApi = {
  // FAQs
  getAllFaqs: async () => {
    const { data } = await api.get('/api/v1/content/faqs');
    return data;
  },

  getFaqCategories: async () => {
    const { data } = await api.get('/api/v1/content/faqs/categories');
    return data;
  },

  getFaqsByCategory: async (slug: string) => {
    const { data } = await api.get(`/api/v1/content/faqs/category/${slug}`);
    return data;
  },

  searchFaqs: async (query: string) => {
    const { data } = await api.get('/api/v1/content/faqs/search', { params: { q: query } });
    return data;
  },

  // Static Pages
  getPrivacyPolicy: async () => {
    const { data } = await api.get('/api/v1/content/privacy-policy');
    return data;
  },

  getTermsConditions: async () => {
    const { data } = await api.get('/api/v1/content/terms-conditions');
    return data;
  },

  getStaticPage: async (slug: string) => {
    const { data } = await api.get(`/api/v1/content/page/${slug}`);
    return data;
  },
};

// Audience Overlap APIs
export const audienceOverlapApi = {
  // Reports
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/audience-overlap', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/audience-overlap/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/audience-overlap/${id}`);
    return data;
  },

  create: async (reportData: {
    title?: string;
    platform: string;
    influencerIds: string[];
  }) => {
    const { data } = await api.post('/api/v1/audience-overlap', reportData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/audience-overlap/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/audience-overlap/${id}`);
    return data;
  },

  retry: async (id: string) => {
    const { data } = await api.post(`/api/v1/audience-overlap/${id}/retry`);
    return data;
  },

  downloadReport: async (id: string) => {
    const response = await api.get(`/api/v1/audience-overlap/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/audience-overlap/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/audience-overlap/shared/${token}`);
    return data;
  },

  searchInfluencers: async (platform: string, query: string, limit?: number) => {
    const { data } = await api.get('/api/v1/audience-overlap/search/influencers', {
      params: { platform, q: query, limit: limit || 10 },
    });
    return data;
  },
};

// Custom ER Calculator APIs
export const customErApi = {
  // Reports
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/custom-er', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/custom-er/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/custom-er/${id}`);
    return data;
  },

  getPosts: async (id: string, sponsoredOnly?: boolean) => {
    const { data } = await api.get(`/api/v1/custom-er/${id}/posts`, {
      params: sponsoredOnly ? { sponsoredOnly: 'true' } : {},
    });
    return data;
  },

  create: async (reportData: {
    influencerProfileId: string;
    platform: string;
    dateRangeStart: string;
    dateRangeEnd: string;
  }) => {
    const { data } = await api.post('/api/v1/custom-er', reportData);
    return data;
  },

  uploadExcel: async (file: File, platform: string, dateRangeStart: string, dateRangeEnd: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('platform', platform);
    formData.append('dateRangeStart', dateRangeStart);
    formData.append('dateRangeEnd', dateRangeEnd);
    const { data } = await api.post('/api/v1/custom-er/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  downloadSampleFile: async () => {
    const response = await api.get('/api/v1/custom-er/sample-file', {
      responseType: 'blob',
    });
    return response.data;
  },

  downloadReport: async (id: string) => {
    const response = await api.get(`/api/v1/custom-er/${id}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  update: async (id: string, updateData: { isPublic?: boolean; influencerName?: string }) => {
    const { data } = await api.patch(`/api/v1/custom-er/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/custom-er/${id}`);
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/custom-er/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/custom-er/shared/${token}`);
    return data;
  },
};

// Social Sentiments APIs
export const sentimentsApi = {
  list: async (params?: {
    platform?: string;
    reportType?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/sentiments', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/sentiments/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/sentiments/${id}`);
    return data;
  },

  create: async (reportData: {
    title?: string;
    reportType: string;
    platform: string;
    urls: string[];
    deepBrandAnalysis?: boolean;
    brandName?: string;
    brandUsername?: string;
    productName?: string;
  }) => {
    const { data } = await api.post('/api/v1/sentiments', reportData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/sentiments/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/sentiments/${id}`);
    return data;
  },

  bulkDelete: async (reportIds: string[]) => {
    const { data } = await api.post('/api/v1/sentiments/bulk-delete', { reportIds });
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/sentiments/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/sentiments/shared/${token}`);
    return data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/api/v1/sentiments/${id}/download-pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  retry: async (id: string) => {
    const { data } = await api.post(`/api/v1/sentiments/${id}/retry`);
    return data;
  },

  getTeamMembers: async () => {
    const { data } = await api.get('/api/v1/team/members');
    return data;
  },
};

// Influencer Collab Check APIs
export const collabCheckApi = {
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/collab-check', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/collab-check/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/collab-check/${id}`);
    return data;
  },

  getChartData: async (id: string) => {
    const { data } = await api.get(`/api/v1/collab-check/${id}/chart-data`);
    return data;
  },

  create: async (reportData: {
    title?: string;
    platform: string;
    timePeriod: string;
    queries: string[];
    influencers: string[];
    multipleInfluencers?: boolean;
  }) => {
    const { data } = await api.post('/api/v1/collab-check', reportData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/collab-check/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/collab-check/${id}`);
    return data;
  },

  retry: async (id: string) => {
    const { data } = await api.post(`/api/v1/collab-check/${id}/retry`);
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/collab-check/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/collab-check/shared/${token}`);
    return data;
  },

  searchInfluencers: async (platform: string, query: string, limit?: number) => {
    const { data } = await api.get('/api/v1/collab-check/search/influencers', {
      params: { platform, q: query, limit: limit || 10 },
    });
    return data;
  },
};

// Influencer Tie Breaker APIs
export const tieBreakerApi = {
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/tie-breaker', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/tie-breaker/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/tie-breaker/${id}`);
    return data;
  },

  create: async (comparisonData: {
    title?: string;
    platform: string;
    influencerIds: string[];
    searchQuery?: string;
  }) => {
    const { data } = await api.post('/api/v1/tie-breaker', comparisonData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/tie-breaker/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/tie-breaker/${id}`);
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; permissionLevel?: string; makePublic?: boolean }) => {
    const { data } = await api.post(`/api/v1/tie-breaker/${id}/share`, shareData || {});
    return data;
  },

  getSharedComparison: async (token: string) => {
    const { data } = await api.get(`/api/v1/tie-breaker/shared/${token}`);
    return data;
  },

  searchInfluencers: async (platform: string, query: string, limit?: number) => {
    const { data } = await api.get('/api/v1/tie-breaker/search/influencers', {
      params: { platform, q: query, limit: limit || 20 },
    });
    return data;
  },

  downloadPdf: async (id: string) => {
    const { data } = await api.get(`/api/v1/tie-breaker/${id}/download`);
    return data;
  },
};

// Paid Collaboration APIs
export const paidCollaborationApi = {
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/paid-collaboration', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/paid-collaboration/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/paid-collaboration/${id}`);
    return data;
  },

  getChartData: async (id: string) => {
    const { data } = await api.get(`/api/v1/paid-collaboration/${id}/chart-data`);
    return data;
  },

  getPosts: async (id: string, params?: {
    sponsoredOnly?: boolean;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get(`/api/v1/paid-collaboration/${id}/posts`, { params });
    return data;
  },

  getInfluencers: async (id: string, params?: {
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get(`/api/v1/paid-collaboration/${id}/influencers`, { params });
    return data;
  },

  create: async (reportData: {
    title: string;
    platform: string;
    hashtags?: string[];
    mentions?: string[];
    queryLogic?: 'AND' | 'OR';
    dateRangeStart: string;
    dateRangeEnd: string;
  }) => {
    const { data } = await api.post('/api/v1/paid-collaboration', reportData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/paid-collaboration/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/paid-collaboration/${id}`);
    return data;
  },

  retry: async (id: string) => {
    const { data } = await api.post(`/api/v1/paid-collaboration/${id}/retry`);
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; sharedWithEmail?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/paid-collaboration/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/paid-collaboration/shared/${token}`);
    return data;
  },
};

// Influencer Groups APIs
export const influencerGroupsApi = {
  // Get groups list
  list: async (params?: {
    tab?: 'created_by_me' | 'created_by_team' | 'shared_with_me';
    platforms?: string[];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    groups: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const { data } = await api.get('/api/v1/influencer-groups', { params });
    return data;
  },

  // Get dashboard stats
  getDashboard: async (): Promise<{
    totalGroups: number;
    totalInfluencers: number;
    pendingApplications: number;
    groupsByPlatform: Record<string, number>;
    recentGroups: any[];
  }> => {
    const { data } = await api.get('/api/v1/influencer-groups/dashboard');
    return data;
  },

  // Get group by ID
  getById: async (id: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/influencer-groups/${id}`);
    return data;
  },

  // Create group
  create: async (groupData: {
    name: string;
    description?: string;
    platforms: string[];
  }): Promise<{ id: string; name: string }> => {
    const { data } = await api.post('/api/v1/influencer-groups', groupData);
    return data;
  },

  // Update group
  update: async (id: string, groupData: Partial<{
    name: string;
    description: string;
    platforms: string[];
  }>): Promise<any> => {
    const { data } = await api.patch(`/api/v1/influencer-groups/${id}`, groupData);
    return data;
  },

  // Delete group
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/influencer-groups/${id}`);
  },

  // Get group members
  getMembers: async (groupId: string, params?: {
    platform?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    members: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const { data } = await api.get(`/api/v1/influencer-groups/${groupId}/members`, { params });
    return data;
  },

  // Add influencer to group (requires influencerName and/or influencerProfileId and/or platformUserId)
  addInfluencer: async (groupId: string, influencerData: {
    influencerProfileId?: string;
    platformUserId?: string;
    influencerName?: string;
    influencerUsername?: string;
    platform?: string;
    profilePictureUrl?: string;
    followerCount?: number;
    audienceCredibility?: number;
    engagementRate?: number;
    avgLikes?: number;
    avgViews?: number;
  }): Promise<any> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/members`, influencerData);
    return data;
  },

  // Bulk add influencers (XLSX import)
  bulkAddInfluencers: async (groupId: string, bulkData: {
    influencers: Array<{
      influencerProfileId?: string;
      platformUserId?: string;
      influencerName?: string;
      influencerUsername?: string;
      platform?: string;
      profilePictureUrl?: string;
      followerCount?: number;
    }>;
  }): Promise<{ added: number; skipped: number }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/members/bulk`, bulkData);
    return data;
  },

  // Import from another group
  importFromGroup: async (groupId: string, importData: {
    sourceGroupId: string;
    memberIds?: string[];
  }): Promise<{ importedCount: number }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/members/import`, importData);
    return data;
  },

  // Copy influencers to another group
  copyToGroup: async (groupId: string, copyData: {
    targetGroupId: string;
    memberIds: string[];
  }): Promise<{ copiedCount: number }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/members/copy`, copyData);
    return data;
  },

  // Remove influencers from group
  removeMembers: async (groupId: string, removeData: {
    memberIds: string[];
  }): Promise<{ removedCount: number }> => {
    const { data } = await api.delete(`/api/v1/influencer-groups/${groupId}/members`, { data: removeData });
    return data;
  },

  // Share group
  share: async (groupId: string, shareData: {
    sharedWithUserId?: string;
    sharedWithEmail?: string;
    permissionLevel?: 'VIEW' | 'EDIT';
    makePublic?: boolean;
  }): Promise<any> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/share`, shareData);
    return data;
  },

  // Remove share
  removeShare: async (groupId: string, shareId: string): Promise<void> => {
    await api.delete(`/api/v1/influencer-groups/${groupId}/share/${shareId}`);
  },

  // Get shared group (public)
  getSharedGroup: async (token: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/influencer-groups/shared/${token}`);
    return data;
  },

  // ============ INVITATION ENDPOINTS ============

  // Create invitation
  createInvitation: async (groupId: string, invitationData: {
    invitationName: string;
    invitationType: 'LANDING_PAGE' | 'FORM_ONLY';
    urlSlug: string;
    landingHeader?: string;
    landingContent?: string;
    landingButtonText?: string;
    formHeader?: string;
    formContent?: string;
    formPlatforms?: string[];
    collectPhone?: boolean;
    collectEmail?: boolean;
    pricingOptions?: string[];
    pricingCurrency?: string;
    formButtonText?: string;
    thankyouHeader?: string;
    thankyouContent?: string;
    logoUrl?: string;
    backgroundColor?: string;
    titleColor?: string;
    textColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    notifyOnSubmission?: boolean;
  }): Promise<any> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/invitations`, invitationData);
    return data;
  },

  // Get invitation
  getInvitation: async (groupId: string, invitationId: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/influencer-groups/${groupId}/invitations/${invitationId}`);
    return data;
  },

  // Update invitation
  updateInvitation: async (groupId: string, invitationId: string, updateData: Partial<{
    invitationName: string;
    isActive: boolean;
    landingHeader: string;
    landingContent: string;
    formHeader: string;
    formContent: string;
    formPlatforms: string[];
    collectPhone: boolean;
    collectEmail: boolean;
    pricingOptions: string[];
    thankyouHeader: string;
    thankyouContent: string;
    notifyOnSubmission: boolean;
  }>): Promise<any> => {
    const { data } = await api.patch(`/api/v1/influencer-groups/${groupId}/invitations/${invitationId}`, updateData);
    return data;
  },

  // Delete invitation
  deleteInvitation: async (groupId: string, invitationId: string): Promise<void> => {
    await api.delete(`/api/v1/influencer-groups/${groupId}/invitations/${invitationId}`);
  },

  // Get invitation by slug (public)
  getInvitationBySlug: async (slug: string): Promise<any> => {
    const { data } = await api.get(`/api/v1/influencer-groups/invite/${slug}`);
    return data;
  },

  // Submit application (public)
  submitApplication: async (slug: string, applicationData: {
    influencerName?: string;
    platform: string;
    platformUsername: string;
    platformUrl?: string;
    followerCount?: number;
    phoneNumber?: string;
    email?: string;
    address?: string;
    photoPrice?: number;
    videoPrice?: number;
    storyPrice?: number;
    carouselPrice?: number;
    pricingCurrency?: string;
    additionalData?: Record<string, any>;
  }): Promise<{ success: boolean; applicationId: string }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/invite/${slug}/apply`, applicationData);
    return data;
  },

  // ============ APPLICATION ENDPOINTS ============

  // Get applications
  getApplications: async (groupId: string, invitationId: string, params?: {
    status?: string;
    platform?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    applications: any[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> => {
    const { data } = await api.get(`/api/v1/influencer-groups/${groupId}/invitations/${invitationId}/applications`, { params });
    return data;
  },

  // Approve application
  approveApplication: async (groupId: string, applicationId: string): Promise<{ success: boolean; memberId: string }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/applications/${applicationId}/approve`);
    return data;
  },

  // Bulk approve applications
  bulkApproveApplications: async (groupId: string, applicationIds: string[]): Promise<{ approvedCount: number }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/applications/bulk-approve`, { applicationIds });
    return data;
  },

  // Reject application
  rejectApplication: async (groupId: string, applicationId: string, reason?: string): Promise<{ success: boolean }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/applications/${applicationId}/reject`, { reason });
    return data;
  },

  // Bulk reject applications
  bulkRejectApplications: async (groupId: string, applicationIds: string[], reason?: string): Promise<{ rejectedCount: number }> => {
    const { data } = await api.post(`/api/v1/influencer-groups/${groupId}/applications/bulk-reject`, { applicationIds, reason });
    return data;
  },
};

// Generated Reports APIs
export const generatedReportsApi = {
  list: async (params?: {
    tab?: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION';
    platform?: string;
    status?: string;
    createdBy?: 'ALL' | 'ME' | 'TEAM';
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/generated-reports', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/generated-reports/dashboard');
    return data;
  },

  getById: async (tab: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION', id: string) => {
    const { data } = await api.get(`/api/v1/generated-reports/${tab}/${id}`);
    return data;
  },

  rename: async (
    tab: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION',
    id: string,
    title: string,
  ) => {
    const { data } = await api.patch(`/api/v1/generated-reports/${tab}/${id}/rename`, { title });
    return data;
  },

  delete: async (tab: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION', id: string) => {
    const { data } = await api.delete(`/api/v1/generated-reports/${tab}/${id}`);
    return data;
  },

  bulkDelete: async (
    tab: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION',
    reportIds: string[],
  ) => {
    const { data } = await api.post('/api/v1/generated-reports/bulk-delete', {
      tab,
      reportIds,
    });
    return data;
  },

  download: async (tab: 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION', id: string) => {
    const { data } = await api.post(`/api/v1/generated-reports/${tab}/${id}/download`);
    return data;
  },
};

// Mention Tracking APIs
export const mentionTrackingApi = {
  list: async (params?: {
    platform?: string;
    status?: string;
    createdBy?: 'ALL' | 'ME' | 'TEAM' | 'SHARED' | 'PUBLIC';
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get('/api/v1/mention-tracking', { params });
    return data;
  },

  getDashboard: async () => {
    const { data } = await api.get('/api/v1/mention-tracking/dashboard');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await api.get(`/api/v1/mention-tracking/${id}`);
    return data;
  },

  getChartData: async (id: string) => {
    const { data } = await api.get(`/api/v1/mention-tracking/${id}/chart-data`);
    return data;
  },

  getPosts: async (id: string, params?: {
    sponsoredOnly?: boolean;
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get(`/api/v1/mention-tracking/${id}/posts`, { params });
    return data;
  },

  getInfluencers: async (id: string, params?: {
    category?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const { data } = await api.get(`/api/v1/mention-tracking/${id}/influencers`, { params });
    return data;
  },

  create: async (reportData: {
    title?: string;
    platforms: string[];
    dateRangeStart: string;
    dateRangeEnd: string;
    hashtags?: string[];
    usernames?: string[];
    keywords?: string[];
    sponsoredOnly?: boolean;
    autoRefreshEnabled?: boolean;
  }) => {
    const { data } = await api.post('/api/v1/mention-tracking', reportData);
    return data;
  },

  update: async (id: string, updateData: { title?: string; isPublic?: boolean }) => {
    const { data } = await api.patch(`/api/v1/mention-tracking/${id}`, updateData);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/api/v1/mention-tracking/${id}`);
    return data;
  },

  bulkDelete: async (reportIds: string[]) => {
    const { data } = await api.post('/api/v1/mention-tracking/bulk-delete', { reportIds });
    return data;
  },

  retry: async (id: string) => {
    const { data } = await api.post(`/api/v1/mention-tracking/${id}/retry`);
    return data;
  },

  share: async (id: string, shareData?: { sharedWithUserId?: string; sharedWithEmail?: string; permissionLevel?: string }) => {
    const { data } = await api.post(`/api/v1/mention-tracking/${id}/share`, shareData || {});
    return data;
  },

  getSharedReport: async (token: string) => {
    const { data } = await api.get(`/api/v1/mention-tracking/shared/${token}`);
    return data;
  },
};

export default api;
