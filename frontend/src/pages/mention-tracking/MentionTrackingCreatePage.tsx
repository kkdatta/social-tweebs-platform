import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Hash, AtSign, MessageCircle, Calendar, AlertCircle, 
  Instagram, Loader, Info
} from 'lucide-react';
import { mentionTrackingApi } from '../../services/api';

type PlatformType = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';

export const MentionTrackingCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [platforms, setPlatforms] = useState<PlatformType[]>(['INSTAGRAM']);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [trackingPeriodMonths, setTrackingPeriodMonths] = useState<1 | 2 | 3>(1);
  const [datesInitialized, setDatesInitialized] = useState(false);

  const addCalendarMonths = (isoDate: string, months: number): string => {
    const d = new Date(isoDate + 'T12:00:00');
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    setDateRangeStart(start);
    setDateRangeEnd(addCalendarMonths(start, 1));
    setDatesInitialized(true);
  }, []);

  useEffect(() => {
    if (!datesInitialized || !dateRangeStart) return;
    setDateRangeEnd(addCalendarMonths(dateRangeStart, trackingPeriodMonths));
  }, [trackingPeriodMonths, dateRangeStart, datesInitialized]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [usernames, setUsernames] = useState<string[]>([]);
  const [usernameInput, setUsernameInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [sponsoredOnly, setSponsoredOnly] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  // Platform rules validation
  const isYouTubeSelected = platforms.includes('YOUTUBE');
  const isTikTokSelected = platforms.includes('TIKTOK');
  const isInstagramSelected = platforms.includes('INSTAGRAM');

  // YouTube cannot be combined with other platforms
  const canSelectYouTube = platforms.length === 0 || (platforms.length === 1 && platforms[0] === 'YOUTUBE');
  const canSelectOther = !isYouTubeSelected;

  const handlePlatformChange = (platform: PlatformType) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      if (platform === 'YOUTUBE') {
        // YouTube can only be selected alone
        setPlatforms(['YOUTUBE']);
        // Clear hashtags and usernames for YouTube
        setHashtags([]);
        setUsernames([]);
      } else {
        // Other platforms can be combined (except with YouTube)
        if (!isYouTubeSelected) {
          setPlatforms([...platforms, platform]);
        }
      }
    }
  };

  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    const tag = hashtagInput.startsWith('#') ? hashtagInput : `#${hashtagInput}`;
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      // Clear keywords if hashtag is added (mutual exclusion)
      setKeywords([]);
    }
    setHashtagInput('');
  };

  const addUsername = () => {
    if (!usernameInput.trim()) return;
    const user = usernameInput.startsWith('@') ? usernameInput : `@${usernameInput}`;
    if (!usernames.includes(user)) {
      setUsernames([...usernames, user]);
    }
    setUsernameInput('');
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    if (!keywords.includes(keywordInput.trim())) {
      setKeywords([...keywords, keywordInput.trim()]);
      // Clear hashtags if keyword is added (mutual exclusion)
      setHashtags([]);
    }
    setKeywordInput('');
  };

  const removeHashtag = (tag: string) => setHashtags(hashtags.filter(h => h !== tag));
  const removeUsername = (user: string) => setUsernames(usernames.filter(u => u !== user));
  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (platforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!dateRangeStart || !dateRangeEnd) {
      setError('Please select a date range');
      return;
    }

    if (hashtags.length === 0 && usernames.length === 0 && keywords.length === 0) {
      setError('Please add at least one hashtag, username, or keyword');
      return;
    }

    // Platform-specific validation
    if (isYouTubeSelected && (hashtags.length > 0 || usernames.length > 0)) {
      setError('YouTube only supports keyword search');
      return;
    }

    if (isTikTokSelected && keywords.length > 0) {
      setError('TikTok does not support keyword search');
      return;
    }

    try {
      setLoading(true);
      const result = await mentionTrackingApi.create({
        title: title || undefined,
        platforms,
        dateRangeStart,
        dateRangeEnd,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        usernames: usernames.length > 0 ? usernames : undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        sponsoredOnly,
        autoRefreshEnabled,
      });

      if (result.success && result.report) {
        navigate(`/mention-tracking/${result.report.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/mention-tracking')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Mention Tracking Report</h1>
          <p className="text-sm text-gray-600">Track posts by hashtags, mentions, or keywords (1 credit)</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Report Name */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Name (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Brand Campaign Q1 2026"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Platform Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Select Platforms *
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handlePlatformChange('INSTAGRAM')}
              disabled={!canSelectOther && !isInstagramSelected}
              className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                isInstagramSelected
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-pink-300 text-gray-600'
              } ${!canSelectOther && !isInstagramSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Instagram className="w-8 h-8" />
              <span className="text-sm font-medium">Instagram</span>
              <span className="text-xs text-gray-500">All search types</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlatformChange('TIKTOK')}
              disabled={!canSelectOther && !isTikTokSelected}
              className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                isTikTokSelected
                  ? 'border-gray-800 bg-gray-100 text-gray-900'
                  : 'border-gray-200 hover:border-gray-400 text-gray-600'
              } ${!canSelectOther && !isTikTokSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl font-bold">TT</span>
              <span className="text-sm font-medium">TikTok</span>
              <span className="text-xs text-gray-500">No keywords</span>
            </button>

            <button
              type="button"
              onClick={() => handlePlatformChange('YOUTUBE')}
              disabled={!canSelectYouTube}
              className={`flex-1 p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                isYouTubeSelected
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 hover:border-red-300 text-gray-600'
              } ${!canSelectYouTube ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl font-bold">YT</span>
              <span className="text-sm font-medium">YouTube</span>
              <span className="text-xs text-gray-500">Keywords only</span>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            YouTube cannot be combined with other platforms
          </p>
        </div>

        {/* Date Range & Tracking Period */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Tracking window *
            </label>
            <button
              type="button"
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setDateRangeStart(today);
                setTrackingPeriodMonths(1);
                setDateRangeEnd(addCalendarMonths(today, 1));
              }}
              className="text-sm text-purple-600 hover:text-purple-700 self-start"
            >
              Reset to today → +1 month
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Tracking period</label>
            <p className="text-xs text-gray-500 mb-2">
              Default is one month forward from the start date. You can extend up to three months; the end date updates automatically.
            </p>
            <select
              value={trackingPeriodMonths}
              onChange={(e) => setTrackingPeriodMonths(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full sm:max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value={1}>1 Month</option>
              <option value={2}>2 Months</option>
              <option value={3}>3 Months</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End date (from period)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRangeEnd}
                  readOnly
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search Criteria */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Search Criteria</h3>
          
          {/* Hashtags (not for YouTube) */}
          {!isYouTubeSelected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-500" />
                Hashtags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                  placeholder="#brandname"
                  disabled={keywords.length > 0}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={addHashtag}
                  disabled={keywords.length > 0}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    {tag}
                    <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-blue-900">&times;</button>
                  </span>
                ))}
              </div>
              {keywords.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">Cannot use hashtags when keywords are set</p>
              )}
            </div>
          )}

          {/* Usernames/Mentions (not for YouTube) */}
          {!isYouTubeSelected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <AtSign className="w-4 h-4 text-purple-500" />
                Usernames (Mentions)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUsername())}
                  placeholder="@brandname"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addUsername}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {usernames.map(user => (
                  <span key={user} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                    {user}
                    <button type="button" onClick={() => removeUsername(user)} className="hover:text-purple-900">&times;</button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Keywords (not for TikTok) */}
          {!isTikTokSelected && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-gray-500" />
                Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  placeholder="brand name, product"
                  disabled={hashtags.length > 0 && !isYouTubeSelected}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  disabled={hashtags.length > 0 && !isYouTubeSelected}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-gray-900">&times;</button>
                  </span>
                ))}
              </div>
              {hashtags.length > 0 && !isYouTubeSelected && (
                <p className="mt-1 text-xs text-gray-500">Cannot use keywords when hashtags are set</p>
              )}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Options</h3>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sponsoredOnly}
              onChange={(e) => setSponsoredOnly(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Only Sponsored Posts</span>
              <p className="text-xs text-gray-500">Only track posts that are marked as sponsored</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Auto-Refresh Daily</span>
              <p className="text-xs text-gray-500">Automatically refresh report every day to track new posts</p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/mention-tracking')}
            className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Report (1 Credit)'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
