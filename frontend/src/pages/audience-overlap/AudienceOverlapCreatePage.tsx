import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Plus, X, Instagram, Youtube, Users, AlertCircle } from 'lucide-react';
import { audienceOverlapApi, discoveryApi } from '../../services/api';

interface SelectedInfluencer {
  id: string;
  username: string;
  fullName: string;
  profilePictureUrl?: string;
  followerCount: number;
}

type OverlapNavState = {
  overlapMembers?: { username: string; platform: string }[];
};

export const AudienceOverlapCreatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const overlapPrefillApplied = useRef(false);
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'YOUTUBE'>('INSTAGRAM');
  const [title, setTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<SelectedInfluencer[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);

  useEffect(() => {
    loadQuota();
  }, []);

  useEffect(() => {
    if (overlapPrefillApplied.current) return;
    const state = location.state as OverlapNavState | null;
    const members = state?.overlapMembers;
    if (!members?.length) return;
    overlapPrefillApplied.current = true;

    let cancelled = false;
    (async () => {
      const resolved: SelectedInfluencer[] = [];
      try {
        for (const m of members.slice(0, 10)) {
          const username = (m.username || '').replace(/^@/, '').trim().split(/[/?#]/)[0];
          if (!username) continue;
          const plat = (m.platform || 'INSTAGRAM').toUpperCase();
          const searchPlatform = plat === 'YOUTUBE' ? 'YOUTUBE' : 'INSTAGRAM';
          try {
            const result = await discoveryApi.search({
              platform: searchPlatform,
              influencer: { keywords: username },
            });
            const list = result.influencers || [];
            const match =
              list.find((i: { username?: string }) => i.username?.toLowerCase() === username.toLowerCase()) ||
              list[0];
            if (match && !resolved.find((r) => r.id === match.id)) {
              resolved.push({
                id: match.id,
                username: match.username,
                fullName: match.fullName || match.username,
                profilePictureUrl: match.profilePictureUrl,
                followerCount: match.followerCount,
              });
            }
          } catch {
            /* skip failed lookups */
          }
          if (cancelled) return;
        }
        if (!cancelled) {
          if (resolved.length > 0) {
            const firstPlat =
              (members[0].platform || 'INSTAGRAM').toUpperCase() === 'YOUTUBE' ? 'YOUTUBE' : 'INSTAGRAM';
            setPlatform(firstPlat);
            setSelectedInfluencers(resolved);
          } else {
            setError('Could not resolve selected influencers from search. Add them manually below.');
          }
        }
      } finally {
        if (!cancelled) {
          navigate(location.pathname, { replace: true, state: {} });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.state, navigate]);

  const loadQuota = async () => {
    try {
      const stats = await audienceOverlapApi.getDashboard();
      setRemainingQuota(stats.remainingQuota);
    } catch (err) {
      console.error('Failed to load quota:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setSearching(true);
      setError(null);
      // Use discovery search API
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

  const addInfluencer = (influencer: any) => {
    if (selectedInfluencers.find(i => i.id === influencer.id)) return;
    if (selectedInfluencers.length >= 10) {
      alert('Maximum 10 influencers per report');
      return;
    }
    setSelectedInfluencers([
      ...selectedInfluencers,
      {
        id: influencer.id,
        username: influencer.username,
        fullName: influencer.fullName || influencer.username,
        profilePictureUrl: influencer.profilePictureUrl,
        followerCount: influencer.followerCount,
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInfluencer = (id: string) => {
    setSelectedInfluencers(selectedInfluencers.filter(i => i.id !== id));
  };

  const handleCreate = async () => {
    if (selectedInfluencers.length < 2) {
      setError('Please select at least 2 influencers');
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const result = await audienceOverlapApi.create({
        title: title || 'Untitled',
        platform,
        influencerIds: selectedInfluencers.map(i => i.id),
      });
      navigate(`/audience-overlap/${result.report.id}`);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/audience-overlap')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Audience Overlap Report</h1>
          <p className="text-gray-600">Compare audience overlap between multiple influencers</p>
        </div>
      </div>

      {/* Quota Info */}
      {remainingQuota !== null && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span className="text-purple-800">
              You can create <strong>{remainingQuota}</strong> more reports this month
            </span>
          </div>
          <div className="text-sm text-purple-600">1 credit per report</div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Report Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this report..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setPlatform('INSTAGRAM');
                setSelectedInfluencers([]);
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
                setPlatform('YOUTUBE');
                setSelectedInfluencers([]);
                setSearchResults([]);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-colors ${
                platform === 'YOUTUBE'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Youtube className="w-5 h-5" />
              YouTube
            </button>
          </div>
        </div>

        {/* Search Influencers */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Influencers (Min 2, Max 10)
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search influencers by name or username..."
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

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((influencer) => (
                  <button
                    key={influencer.id}
                    onClick={() => addInfluencer(influencer)}
                    disabled={selectedInfluencers.find(i => i.id === influencer.id) !== undefined}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    {selectedInfluencers.find(i => i.id === influencer.id) ? (
                      <span className="text-xs text-green-600">Added</span>
                    ) : (
                      <Plus className="w-5 h-5 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Influencers */}
        {selectedInfluencers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Influencers ({selectedInfluencers.length})
            </label>
            <div className="space-y-2">
              {selectedInfluencers.map((influencer) => (
                <div
                  key={influencer.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.username}`}
                    alt={influencer.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{influencer.fullName}</div>
                    <div className="text-sm text-gray-500">@{influencer.username} • {formatNumber(influencer.followerCount)} followers</div>
                  </div>
                  <button
                    onClick={() => removeInfluencer(influencer.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {selectedInfluencers.length < 2 ? (
              <span className="text-amber-600">Select at least 2 influencers to compare</span>
            ) : (
              <span className="text-green-600">Ready to create report (1 credit will be deducted)</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/audience-overlap')}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={selectedInfluencers.length < 2 || creating}
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
