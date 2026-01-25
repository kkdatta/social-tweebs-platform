import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Instagram, Calendar, AlertCircle, Gift } from 'lucide-react';
import { customErApi, discoveryApi } from '../../services/api';

interface SelectedInfluencer {
  id: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  followerCount: number;
}

export const CustomErCreatePage = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK'>('INSTAGRAM');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<SelectedInfluencer | null>(null);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate max date (today) and min date (1 year ago)
  const today = new Date().toISOString().split('T')[0];
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const minDate = oneYearAgo.toISOString().split('T')[0];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      const result = await discoveryApi.search({
        platform,
        influencer: {
          keywords: searchQuery,
        },
      });
      setSearchResults(result.influencers || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectInfluencer = (influencer: any) => {
    setSelectedInfluencer({
      id: influencer.id,
      username: influencer.username,
      fullName: influencer.fullName || influencer.username,
      profilePictureUrl: influencer.profilePictureUrl,
      followerCount: influencer.followerCount,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCreate = async () => {
    if (!selectedInfluencer) {
      setError('Please select an influencer');
      return;
    }
    if (!dateRangeStart || !dateRangeEnd) {
      setError('Please select a date range');
      return;
    }
    if (new Date(dateRangeEnd) < new Date(dateRangeStart)) {
      setError('End date must be after start date');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const result = await customErApi.create({
        influencerProfileId: selectedInfluencer.id,
        platform,
        dateRangeStart,
        dateRangeEnd,
      });
      navigate(`/custom-er/${result.report.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/custom-er')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create ER Report</h1>
          <p className="text-gray-600">Calculate custom engagement rate for an influencer</p>
        </div>
      </div>

      {/* Free Badge */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
        <Gift className="w-6 h-6 text-green-600" />
        <div>
          <div className="font-medium text-green-800">This report is FREE!</div>
          <div className="text-sm text-green-600">No credits will be deducted for Custom ER reports</div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setPlatform('INSTAGRAM');
                setSelectedInfluencer(null);
                setSearchResults([]);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-colors ${
                platform === 'INSTAGRAM'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Instagram className="w-5 h-5" />
              Instagram
            </button>
            <button
              onClick={() => {
                setPlatform('TIKTOK');
                setSelectedInfluencer(null);
                setSearchResults([]);
              }}
              disabled
              className="flex items-center gap-2 px-6 py-3 rounded-lg border-2 border-gray-200 text-gray-400 cursor-not-allowed"
            >
              TikTok (Coming Soon)
            </button>
          </div>
        </div>

        {/* Influencer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Influencer</label>
          
          {selectedInfluencer ? (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <img
                src={selectedInfluencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${selectedInfluencer.username}`}
                alt={selectedInfluencer.username}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{selectedInfluencer.fullName}</div>
                <div className="text-sm text-gray-500">
                  @{selectedInfluencer.username} • {formatNumber(selectedInfluencer.followerCount)} followers
                </div>
              </div>
              <button
                onClick={() => setSelectedInfluencer(null)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search influencer by name or username..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((influencer) => (
                    <button
                      key={influencer.id}
                      onClick={() => selectInfluencer(influencer)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50"
                    >
                      <img
                        src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.username}`}
                        alt={influencer.username}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{influencer.fullName || influencer.username}</div>
                        <div className="text-sm text-gray-500">@{influencer.username}</div>
                      </div>
                      <div className="text-sm text-gray-600">{formatNumber(influencer.followerCount)} followers</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </span>
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                min={minDate}
                max={today}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <span className="text-gray-400 mt-6">to</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                min={dateRangeStart || minDate}
                max={today}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Maximum date range is 1 year from today</p>
        </div>

        {/* Create Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {!selectedInfluencer ? (
              <span className="text-amber-600">Select an influencer to continue</span>
            ) : !dateRangeStart || !dateRangeEnd ? (
              <span className="text-amber-600">Select date range to continue</span>
            ) : (
              <span className="text-green-600">Ready to create report</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/custom-er')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!selectedInfluencer || !dateRangeStart || !dateRangeEnd || creating}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? 'Creating...' : 'Create Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
