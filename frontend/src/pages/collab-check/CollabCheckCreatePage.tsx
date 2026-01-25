import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, X, Search, Instagram, Hash, AtSign, Tag, Calendar, Users, AlertCircle
} from 'lucide-react';
import { collabCheckApi } from '../../services/api';

interface InfluencerOption {
  id: string;
  username: string;
  fullName: string;
  followers: number;
  profilePicture: string;
}

export const CollabCheckCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('INSTAGRAM');
  const [timePeriod, setTimePeriod] = useState('1_MONTH');
  const [queries, setQueries] = useState<string[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  
  // Influencer search
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<InfluencerOption[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearchInfluencers = async () => {
    if (!influencerSearch.trim()) return;
    
    setSearching(true);
    try {
      const results = await collabCheckApi.searchInfluencers(platform, influencerSearch, 10);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  };

  const addQuery = () => {
    const trimmed = queryInput.trim();
    if (trimmed && !queries.includes(trimmed)) {
      setQueries([...queries, trimmed]);
      setQueryInput('');
    }
  };

  const removeQuery = (query: string) => {
    setQueries(queries.filter(q => q !== query));
  };

  const toggleInfluencer = (username: string) => {
    if (selectedInfluencers.includes(username)) {
      setSelectedInfluencers(selectedInfluencers.filter(i => i !== username));
    } else if (selectedInfluencers.length < 10) {
      setSelectedInfluencers([...selectedInfluencers, username]);
    } else {
      alert('Maximum 10 influencers allowed');
    }
  };

  const addInfluencerFromInput = () => {
    const username = influencerSearch.trim().replace('@', '');
    if (username && !selectedInfluencers.includes(username)) {
      if (selectedInfluencers.length < 10) {
        setSelectedInfluencers([...selectedInfluencers, username]);
        setInfluencerSearch('');
        setSearchResults([]);
      } else {
        alert('Maximum 10 influencers allowed');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (queries.length === 0) {
      setError('At least one query (hashtag, mention, or keyword) is required');
      return;
    }

    if (selectedInfluencers.length === 0) {
      setError('At least one influencer is required');
      return;
    }

    const creditCost = selectedInfluencers.length;
    if (!confirm(`This will cost ${creditCost} credit(s). Continue?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await collabCheckApi.create({
        title: title || undefined,
        platform,
        timePeriod,
        queries,
        influencers: selectedInfluencers,
        multipleInfluencers: selectedInfluencers.length > 1,
      });
      navigate(`/collab-check/${result.report.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  const creditCost = selectedInfluencers.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/collab-check')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Collab Check Report</h1>
          <p className="text-gray-600">Analyze influencer brand collaborations</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Title (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Nike Campaign Q1 2026"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform *
          </label>
          <div className="flex gap-4">
            <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer ${
              platform === 'INSTAGRAM' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="platform"
                value="INSTAGRAM"
                checked={platform === 'INSTAGRAM'}
                onChange={(e) => setPlatform(e.target.value)}
                className="sr-only"
              />
              <Instagram className="w-5 h-5 text-pink-500" />
              <span className="font-medium">Instagram</span>
            </label>
            <label className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer opacity-50 ${
              platform === 'TIKTOK' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="platform"
                value="TIKTOK"
                disabled
                className="sr-only"
              />
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="font-medium">TikTok (Coming Soon)</span>
            </label>
          </div>
        </div>

        {/* Time Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Time Period *
          </label>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="1_MONTH">Last 1 Month</option>
            <option value="3_MONTHS">Last 3 Months</option>
            <option value="6_MONTHS">Last 6 Months</option>
            <option value="1_YEAR">Last 1 Year</option>
          </select>
        </div>

        {/* Search Queries */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Search Queries * (Hashtags, Mentions, Keywords)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addQuery())}
              placeholder="#hashtag, @mention, or keyword"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={addQuery}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {queries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {queries.map((query, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                  {query.startsWith('#') && <Hash className="w-3 h-3" />}
                  {query.startsWith('@') && <AtSign className="w-3 h-3" />}
                  {query}
                  <button type="button" onClick={() => removeQuery(query)} className="ml-1 hover:text-purple-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Add hashtags (e.g., #nike), mentions (e.g., @nike), or keywords to search for in posts
          </p>
        </div>

        {/* Influencer Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-1" />
            Select Influencers * (1-10)
          </label>
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={influencerSearch}
                onChange={(e) => setInfluencerSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchInfluencers();
                  }
                }}
                placeholder="Search by username or enter directly"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSearchInfluencers}
              disabled={searching}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              {searching ? <Loader className="w-5 h-5 animate-spin" /> : 'Search'}
            </button>
            <button
              type="button"
              onClick={addInfluencerFromInput}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto mb-3">
              {searchResults.map((inf) => (
                <button
                  key={inf.id}
                  type="button"
                  onClick={() => toggleInfluencer(inf.username)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 ${
                    selectedInfluencers.includes(inf.username) ? 'bg-purple-50' : ''
                  }`}
                >
                  <img
                    src={inf.profilePicture}
                    alt={inf.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <div className="font-medium">@{inf.username}</div>
                    <div className="text-sm text-gray-500">{inf.fullName} • {(inf.followers / 1000).toFixed(1)}K followers</div>
                  </div>
                  {selectedInfluencers.includes(inf.username) && (
                    <span className="text-purple-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Selected Influencers */}
          {selectedInfluencers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedInfluencers.map((username, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                  @{username}
                  <button type="button" onClick={() => toggleInfluencer(username)} className="ml-1 hover:text-gray-900">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            {selectedInfluencers.length}/10 influencers selected
          </p>
        </div>

        {/* Credit Cost */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-purple-900">Credit Cost</div>
              <div className="text-sm text-purple-700">1 credit per influencer</div>
            </div>
            <div className="text-2xl font-bold text-purple-600">{creditCost} credits</div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/collab-check')}
            className="px-6 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || queries.length === 0 || selectedInfluencers.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            Create Report
          </button>
        </div>
      </form>
    </div>
  );
};

// Loader component for search
const Loader = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
