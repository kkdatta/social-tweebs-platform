import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft,
  Download,
  RefreshCw,
  Share2,
  Users,
  Heart,
  MessageCircle,
  Eye,
  MapPin,
  BadgeCheck,
  TrendingUp,
  Globe,
  Calendar,
  ExternalLink,
  BarChart3,
  PieChart,
  Instagram,
  Youtube,
  Sparkles,
  Play,
  AlertCircle,
  Hash,
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { insightsApi } from '../../services/api';

interface InsightData {
  id: string;
  platform: string;
  username: string;
  fullName?: string;
  profilePictureUrl?: string;
  bio?: string;
  isVerified: boolean;
  locationCountry?: string;
  stats: {
    followerCount: number;
    followingCount: number;
    postCount: number;
    engagementRate?: number;
    avgLikes?: number;
    avgComments?: number;
    avgViews?: number;
    avgReelViews?: number;
    avgReelLikes?: number;
    avgReelComments?: number;
    brandPostER?: number;
    postsWithHiddenLikesPct?: number;
  };
  audience: {
    credibility?: number;
    notableFollowersPct?: number;
    genderSplit?: { male: number; female: number };
    ageGroups?: Array<{ range: string; percentage: number; male: number; female: number }>;
    topCountries?: Array<{ country: string; percentage: number; followers: number }>;
    topCities?: Array<{ city: string; percentage: number; followers: number }>;
    languages?: Array<{ language: string; percentage: number }>;
    interests?: Array<{ category: string; percentage: number }>;
    brandAffinity?: Array<{ brand: string; percentage: number }>;
    reachability?: { below500: number; '500to1000': number; '1000to1500': number; above1500: number };
  };
  engagement: {
    rateDistribution?: Array<{ range: string; count: number }>;
    likesSpread?: Array<{ date: string; likes: number }>;
    commentsSpread?: Array<{ date: string; comments: number }>;
    topHashtags?: Array<{ tag: string; usagePercentage: number; count: number }>;
  };
  growth: {
    last6Months?: Array<{ month: string; followers: number; following: number }>;
  };
  lookalikes: {
    influencer?: Array<{ username: string; followers: number; similarity: number }>;
    audience?: Array<{ username: string; followers: number; overlap: number }>;
  };
  brandAffinity?: any[];
  interests?: any[];
  wordCloud?: any[];
  posts?: {
    recent: any[];
    popular: any[];
    sponsored: any[];
  };
  reels?: {
    recent: any[];
    popular: any[];
    sponsored: any[];
  };
  lastRefreshedAt: string;
  dataFreshnessStatus: 'FRESH' | 'STALE';
}

const InsightsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [error, setError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInsight();
    }
  }, [id]);

  const fetchInsight = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await insightsApi.getById(id!);
      setInsights(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load insight');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!confirm('Refreshing this insight will cost 1 credit. Continue?')) {
      return;
    }

    try {
      setIsRefreshing(true);
      const result = await insightsApi.refresh(id!);
      setInsights(result.insight);
      
      // Update user credits in header
      if (user && result.remainingBalance !== undefined) {
        updateUser({ ...user, credits: result.remainingBalance });
      }
      
      // Show success message with credit info
      if (result.creditsUsed > 0) {
        alert(`Insight refreshed successfully! ${result.creditsUsed} credit used. Remaining: ${result.remainingBalance}`);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to refresh insight');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out insights for @${insights?.username} on ${insights?.platform}`;

    // Try using Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${insights?.fullName || insights?.username} - Influencer Insights`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to clipboard
        console.log('Share cancelled or failed:', err);
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Manual fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Link copied to clipboard!');
      } catch (e) {
        alert('Failed to copy link. Please copy manually: ' + shareUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleExportJSON = () => {
    if (!insights) return;

    // Create comprehensive export data
    const exportData = {
      profile: {
        platform: insights.platform,
        username: insights.username,
        fullName: insights.fullName,
        isVerified: insights.isVerified,
        bio: insights.bio,
        locationCountry: insights.locationCountry,
      },
      stats: insights.stats,
      audience: {
        credibility: insights.audience.credibility,
        notableFollowersPct: insights.audience.notableFollowersPct,
        genderSplit: insights.audience.genderSplit,
        ageGroups: insights.audience.ageGroups,
        topCountries: insights.audience.topCountries,
        topCities: insights.audience.topCities,
        languages: insights.audience.languages,
        reachability: insights.audience.reachability,
      },
      engagement: {
        rateDistribution: insights.engagement.rateDistribution,
        topHashtags: insights.engagement.topHashtags,
      },
      growth: insights.growth,
      brandAffinity: insights.brandAffinity,
      interests: insights.interests,
      exportedAt: new Date().toISOString(),
      exportedBy: 'SocialTweebs Platform',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${insights.username}_insight_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert('Insight data exported successfully!');
  };

  const handleExportPDF = () => {
    // Use browser's print dialog to save as PDF
    window.print();
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showExportMenu]);

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Mock growth data if not available
  const growthData = insights?.growth?.last6Months || [
    { month: 'Aug', followers: 980000 },
    { month: 'Sep', followers: 1050000 },
    { month: 'Oct', followers: 1120000 },
    { month: 'Nov', followers: 1180000 },
    { month: 'Dec', followers: 1220000 },
    { month: 'Jan', followers: insights?.stats?.followerCount || 1250000 },
  ];

  const genderData = insights?.audience?.genderSplit
    ? [
        { name: 'Female', value: insights.audience.genderSplit.female || 0 },
        { name: 'Male', value: insights.audience.genderSplit.male || 0 },
      ]
    : [];

  const ageData = insights?.audience?.ageGroups?.map(g => ({
    name: g.range,
    value: g.percentage,
  })) || [];

  const locationData = insights?.audience?.topCountries?.slice(0, 5).map(l => ({
    name: l.country,
    value: l.percentage,
  })) || [];

  const hashtagsData = insights?.engagement?.topHashtags?.slice(0, 5) || [];

  const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'posts', label: 'Posts', icon: Instagram },
    { id: 'reels', label: 'Reels', icon: Play },
  ];

  const getPlatformIcon = () => {
    switch (insights?.platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4" />;
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">{error}</h3>
          <button onClick={() => navigate('/insights')} className="btn btn-primary mt-4">
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">Insight not found</h3>
          <button onClick={() => navigate('/insights')} className="btn btn-primary mt-4">
            Back to Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate('/insights')}
          className="no-print flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Insights
        </button>
        <div className="no-print flex flex-wrap items-center gap-2 sm:gap-3">
          {insights.dataFreshnessStatus === 'STALE' && (
            <span className="text-xs sm:text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Data may be outdated</span>
            </span>
          )}
          <button onClick={handleShare} className="btn btn-secondary text-sm py-2">
            <Share2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)} 
              className="btn btn-secondary text-sm py-2"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export as JSON
                </button>
                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"
                >
                  <Download className="w-4 h-4" />
                  Save as PDF
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-primary disabled:opacity-50 text-sm py-2"
          >
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="hidden sm:inline">Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh (1 Credit)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Profile Info */}
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative shrink-0">
              <img
                src={insights.profilePictureUrl || `https://ui-avatars.com/api/?name=${insights.username}&background=6366f1&color=fff`}
                alt={insights.username}
                className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover ring-2 sm:ring-4 ring-primary-100"
              />
              {insights.isVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <BadgeCheck className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{insights.fullName || insights.username}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                  insights.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' :
                  insights.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {getPlatformIcon()}
                  <span className="ml-1 hidden xs:inline">{insights.platform}</span>
                </span>
              </div>
              <p className="text-sm text-gray-500">@{insights.username}</p>
              {insights.bio && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-none">{insights.bio}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
                {insights.locationCountry && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                    {insights.locationCountry}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Updated: </span>{new Date(insights.lastRefreshedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatNumber(insights.stats.followerCount)}</p>
              <p className="text-xs sm:text-sm text-gray-500">Followers</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {insights.stats.engagementRate ? `${insights.stats.engagementRate.toFixed(2)}%` : 'N/A'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Engagement</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatNumber(insights.stats.avgLikes)}</p>
              <p className="text-xs sm:text-sm text-gray-500">Avg Likes</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-xl">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {insights.audience.credibility ? `${(insights.audience.credibility * 100).toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">Credibility</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <nav className="flex min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:pb-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Growth (6 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Area type="monotone" dataKey="followers" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="font-medium">Average Likes</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(insights.stats.avgLikes)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">Average Comments</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(insights.stats.avgComments)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Average Views</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(insights.stats.avgViews)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Instagram className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium">Total Posts</span>
                </div>
                <span className="text-lg font-bold">{formatNumber(insights.stats.postCount)}</span>
              </div>
            </div>
          </div>

          {/* Brand Affinity */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Affinity</h3>
            {insights.audience.brandAffinity && insights.audience.brandAffinity.length > 0 ? (
              <div className="space-y-3">
                {insights.audience.brandAffinity.slice(0, 5).map((brand, index) => (
                  <div key={brand.brand} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 truncate">{brand.brand}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(brand.percentage * 2, 100)}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{brand.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No brand affinity data available</p>
            )}
          </div>

          {/* Interests */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Interests</h3>
            {insights.audience.interests && insights.audience.interests.length > 0 ? (
              <div className="space-y-3">
                {insights.audience.interests.slice(0, 5).map((interest, index) => (
                  <div key={interest.category} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 truncate">{interest.category}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(interest.percentage * 2, 100)}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-12 text-right">{interest.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No interest data available</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'engagement' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Rate Card */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Rate</h3>
            <div className="text-center py-8">
              <div className="w-32 h-32 mx-auto mb-4 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="12" fill="none" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#6366f1"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(insights.stats.engagementRate || 0) * 35} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {insights.stats.engagementRate ? `${insights.stats.engagementRate.toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <p className="text-gray-600">
                {insights.stats.engagementRate && insights.stats.engagementRate > 3
                  ? 'Above average engagement'
                  : insights.stats.engagementRate && insights.stats.engagementRate > 1
                  ? 'Average engagement'
                  : 'Below average engagement'}
              </p>
            </div>
          </div>

          {/* Top Hashtags */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Hashtags</h3>
            {hashtagsData.length > 0 ? (
              <div className="space-y-3">
                {hashtagsData.map((hashtag, index) => (
                  <div key={hashtag.tag} className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 flex-1">{hashtag.tag}</span>
                    <span className="text-sm font-medium">{hashtag.usagePercentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hashtag data available</p>
            )}
          </div>

          {/* Brand Post Performance */}
          <div className="card p-6 col-span-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sponsored Content Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-4xl font-bold text-purple-600">
                  {insights.stats.brandPostER ? `${insights.stats.brandPostER.toFixed(2)}%` : 'N/A'}
                </p>
                <p className="font-semibold text-gray-900 mt-2">Brand Post ER</p>
                <p className="text-sm text-gray-500 mt-1">Engagement on sponsored posts</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-4xl font-bold text-blue-600">
                  {formatNumber(insights.stats.avgReelViews)}
                </p>
                <p className="font-semibold text-gray-900 mt-2">Avg Reel Views</p>
                <p className="text-sm text-gray-500 mt-1">Average views per reel</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl">
                <p className="text-4xl font-bold text-pink-600">
                  {insights.stats.postsWithHiddenLikesPct 
                    ? `${insights.stats.postsWithHiddenLikesPct.toFixed(1)}%`
                    : 'N/A'}
                </p>
                <p className="font-semibold text-gray-900 mt-2">Hidden Likes</p>
                <p className="text-sm text-gray-500 mt-1">Posts with likes hidden</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audience' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gender Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution</h3>
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-16">No gender data available</p>
            )}
          </div>

          {/* Age Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution</h3>
            {ageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-16">No age data available</p>
            )}
          </div>

          {/* Location Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
            {locationData.length > 0 ? (
              <div className="space-y-3">
                {locationData.map((loc, index) => (
                  <div key={loc.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-gray-500" />
                    </div>
                    <span className="text-sm text-gray-700 flex-1">{loc.name}</span>
                    <span className="text-sm font-semibold">{loc.value}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-16">No location data available</p>
            )}
          </div>

          {/* Audience Quality */}
          <div className="card p-6 col-span-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Quality</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="35" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="40"
                      cy="40"
                      r="35"
                      stroke="#22c55e"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(insights.audience.credibility || 0) * 220} 220`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-600">
                    {insights.audience.credibility 
                      ? `${(insights.audience.credibility * 100).toFixed(0)}%`
                      : 'N/A'}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">Audience Credibility</p>
                <p className="text-sm text-gray-500 mt-1">Real, engaged followers</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <p className="text-4xl font-bold text-blue-600">
                  {insights.audience.notableFollowersPct 
                    ? `${insights.audience.notableFollowersPct.toFixed(1)}%`
                    : 'N/A'}
                </p>
                <p className="font-semibold text-gray-900 mt-2">Notable Followers</p>
                <p className="text-sm text-gray-500 mt-1">Followers who are influencers</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <p className="text-4xl font-bold text-purple-600">
                  {insights.audience.reachability?.below500 
                    ? `${insights.audience.reachability.below500}%`
                    : 'N/A'}
                </p>
                <p className="font-semibold text-gray-900 mt-2">Reachability</p>
                <p className="text-sm text-gray-500 mt-1">Follow &lt;500 accounts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-6">
          {insights.posts?.popular && insights.posts.popular.length > 0 ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Posts</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {insights.posts.popular.slice(0, 6).map((post: any) => (
                    <div key={post.id} className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                      <div className="relative aspect-square bg-gray-100">
                        {post.imageUrl || post.thumbnail ? (
                          <img src={post.imageUrl || post.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Instagram className="w-12 h-12 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <div className="text-white text-center">
                            <Heart className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold">{formatNumber(post.likes)}</p>
                          </div>
                          <div className="text-white text-center">
                            <MessageCircle className="w-6 h-6 mx-auto mb-1" />
                            <p className="font-semibold">{formatNumber(post.comments)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-600 line-clamp-2">{post.caption || 'No caption'}</p>
                        <p className="text-xs text-gray-400 mt-2">{post.postedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-12 text-center">
              <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No posts data available</h3>
              <p className="text-gray-500 mt-2">Posts data will be available after refresh</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reels' && (
        <div className="space-y-6">
          {insights.reels?.recent && insights.reels.recent.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reels</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.reels.recent.slice(0, 6).map((reel: any) => (
                  <div key={reel.id} className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="relative aspect-[9/16] bg-gray-100">
                      {reel.thumbnail ? (
                        <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <div className="text-white text-center">
                          <Eye className="w-6 h-6 mx-auto mb-1" />
                          <p className="font-semibold">{formatNumber(reel.views)}</p>
                        </div>
                        <div className="text-white text-center">
                          <Heart className="w-6 h-6 mx-auto mb-1" />
                          <p className="font-semibold">{formatNumber(reel.likes)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{reel.caption || 'No caption'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No reels data available</h3>
              <p className="text-gray-500 mt-2">Reels data will be available after refresh</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
