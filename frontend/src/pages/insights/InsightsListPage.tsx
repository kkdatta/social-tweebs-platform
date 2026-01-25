import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Plus,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  Users,
  BadgeCheck,
  Instagram,
  Youtube,
  X,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { insightsApi } from '../../services/api';
import type { Platform } from '../../types';

interface InsightItem {
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
}

const InsightsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'ALL'>('ALL');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCreditPopup, setShowCreditPopup] = useState(true);
  const [dontRemind, setDontRemind] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // New insight search state
  const [searchPlatform, setSearchPlatform] = useState<Platform>('INSTAGRAM');
  const [searchUsername, setSearchUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    // Check if user already dismissed popup
    const dismissed = localStorage.getItem('insightsCreditPopupDismissed');
    if (dismissed === 'true') {
      setShowCreditPopup(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [platformFilter, searchTerm, page]);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);
      const response = await insightsApi.list({
        platform: platformFilter !== 'ALL' ? platformFilter : undefined,
        search: searchTerm || undefined,
        page,
        limit: 20,
      });
      setInsights(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismissPopup = () => {
    if (dontRemind) {
      localStorage.setItem('insightsCreditPopupDismissed', 'true');
    }
    setShowCreditPopup(false);
  };

  const handleSearchInfluencer = async () => {
    if (!searchUsername.trim()) {
      setSearchError('Please enter a username');
      return;
    }

    setIsSearching(true);
    setSearchError('');

    try {
      const result = await insightsApi.search(searchPlatform, searchUsername.trim());
      
      if (result.success) {
        // Update user credits in header if credits were used
        if (user && result.remainingBalance !== undefined) {
          updateUser({ ...user, credits: result.remainingBalance });
        }
        
        // Show message if new insight was unlocked
        if (result.isNew && result.creditsUsed > 0) {
          alert(`New insight unlocked! ${result.creditsUsed} credit used. Remaining: ${result.remainingBalance}`);
        }
        
        // Navigate to the insight detail page
        navigate(`/insights/${result.insight.id}`);
        setShowSearchModal(false);
      }
    } catch (error: any) {
      setSearchError(error.response?.data?.message || 'Failed to search influencer');
    } finally {
      setIsSearching(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4" />;
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: Platform) => {
    switch (platform) {
      case 'INSTAGRAM':
        return 'bg-pink-100 text-pink-700';
      case 'YOUTUBE':
        return 'bg-red-100 text-red-700';
      case 'TIKTOK':
        return 'bg-gray-900 text-white';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Credit Info Popup */}
      {showCreditPopup && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Credit Deduction Info</h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Searching for a new influencer costs <strong>1 credit</strong>.
                Once unlocked, you can view for free. Auto-refresh after 7 days.
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 sm:mt-3">
                <label className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dontRemind}
                    onChange={(e) => setDontRemind(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Don't remind
                </label>
                <button
                  onClick={handleDismissPopup}
                  className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
            <button onClick={handleDismissPopup} className="text-gray-400 hover:text-gray-600 shrink-0">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Influencer Insights</h1>
          <p className="text-gray-500 text-sm mt-1 hidden sm:block">
            View detailed analytics for influencers you've unlocked
          </p>
        </div>
        <button
          onClick={() => setShowSearchModal(true)}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Search Influencer
        </button>
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by username or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Platform Filter & Refresh */}
          <div className="flex gap-2 sm:gap-3">
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value as Platform | 'ALL')}
                className="flex-1 sm:flex-initial px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="ALL">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchInsights}
              className="btn btn-secondary py-2.5 px-3 sm:px-4"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Insights List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading insights...</p>
          </div>
        </div>
      ) : insights.length === 0 ? (
        <div className="card p-12 text-center">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No insights yet</h3>
          <p className="text-gray-500 mt-2">
            Search for an influencer to unlock their detailed insights
          </p>
          <button
            onClick={() => setShowSearchModal(true)}
            className="btn btn-primary mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Search Influencer
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="card p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/insights/${insight.id}`)}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={insight.profilePictureUrl || `https://ui-avatars.com/api/?name=${insight.username}&background=6366f1&color=fff`}
                      alt={insight.username}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
                    />
                    {insight.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <BadgeCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                        {insight.fullName || insight.username}
                      </h3>
                      <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium shrink-0 ${getPlatformColor(insight.platform)}`}>
                        {getPlatformIcon(insight.platform)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">@{insight.username}</p>
                    <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2 text-xs sm:text-sm">
                      <span className="flex items-center gap-1 text-gray-600">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        {formatNumber(insight.followerCount)}
                      </span>
                      {insight.engagementRate && (
                        <span className="text-green-600 font-medium">
                          {insight.engagementRate.toFixed(1)}% ER
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Added {new Date(insight.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-gray-400">
                    Updated: {new Date(insight.lastRefreshedAt).toLocaleDateString()}
                  </span>
                  <button className="text-primary-600 hover:text-primary-700 text-xs sm:text-sm font-medium flex items-center gap-1">
                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-fadeIn">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Search Influencer</h2>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] as Platform[]).map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSearchPlatform(platform)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          searchPlatform === platform
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getPlatformIcon(platform)}
                        <span className="text-sm font-medium">{platform}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username / Handle
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username (without @)"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchInfluencer()}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Error Message */}
                {searchError && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {searchError}
                  </div>
                )}

                {/* Credit Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This will cost <strong>1 credit</strong> if the
                    influencer hasn't been unlocked before.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSearchInfluencer}
                    disabled={isSearching}
                    className="flex-1 btn btn-primary disabled:opacity-50"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Go
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsListPage;
