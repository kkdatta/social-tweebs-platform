import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Hash, AtSign, MessageCircle, Calendar, AlertCircle, 
  Instagram, Loader, Info, X
} from 'lucide-react';
import { mentionTrackingApi } from '../../services/api';

type PlatformType = 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';

export const MentionTrackingCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [hashtagMatchMode, setHashtagMatchMode] = useState<'any' | 'all'>('any');
  const [keywordMatchMode, setKeywordMatchMode] = useState<'any' | 'all'>('any');
  const [sponsoredOnly, setSponsoredOnly] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  const isYouTubeSelected = platforms.includes('YOUTUBE');
  const isTikTokSelected = platforms.includes('TIKTOK');
  const isInstagramSelected = platforms.includes('INSTAGRAM');

  const canSelectYouTube = platforms.length === 0 || (platforms.length === 1 && platforms[0] === 'YOUTUBE');
  const canSelectOther = !isYouTubeSelected;

  const handlePlatformChange = (platform: PlatformType) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
    } else {
      if (platform === 'YOUTUBE') {
        setPlatforms(['YOUTUBE']);
        setHashtags([]);
        setUsernames([]);
      } else {
        if (!isYouTubeSelected) {
          setPlatforms([...platforms, platform]);
        }
      }
    }
  };

  const addHashtag = () => {
    if (!hashtagInput.trim()) return;
    const raw = hashtagInput.trim();
    const tags = raw.split(/[,\s]+/).filter(Boolean);
    const newHashtags = [...hashtags];
    for (const t of tags) {
      const tag = t.startsWith('#') ? t : `#${t}`;
      if (!newHashtags.includes(tag)) newHashtags.push(tag);
    }
    setHashtags(newHashtags);
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
    const kw = keywordInput.trim();
    if (!keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
    }
    setKeywordInput('');
  };

  const removeHashtag = (tag: string) => setHashtags(hashtags.filter(h => h !== tag));
  const removeUsername = (user: string) => setUsernames(usernames.filter(u => u !== user));
  const removeKeyword = (kw: string) => setKeywords(keywords.filter(k => k !== kw));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
        hashtagMatchMode: hashtags.length > 1 ? hashtagMatchMode : undefined,
        keywordMatchMode: keywords.length > 1 ? keywordMatchMode : undefined,
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
          <h1 className="text-2xl font-bold text-gray-900">New Mention Tracking</h1>
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

        {/* Row 1: Report Name + Date Range */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Brand Campaign Q1 2026"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Period</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={dateRangeEnd}
                  readOnly
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed text-sm"
                />
              </div>
              <div className="flex gap-1.5 mt-2">
                {([1, 2, 3] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTrackingPeriodMonths(m)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      trackingPeriodMonths === m
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {m} Month{m > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Hashtags + Usernames */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Hashtags */}
            {!isYouTubeSelected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-500" />
                  Hashtags
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 min-h-[42px] bg-white">
                    {hashtags.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-0.5 pl-2.5 pr-1 py-0.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {tag}
                        <button type="button" onClick={() => removeHashtag(tag)} className="p-0.5 hover:bg-blue-200 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addHashtag(); }
                        if (e.key === 'Backspace' && !hashtagInput && hashtags.length > 0) {
                          removeHashtag(hashtags[hashtags.length - 1]);
                        }
                      }}
                      placeholder={hashtags.length === 0 ? '#brandname' : ''}
                      className="flex-1 min-w-[80px] outline-none text-sm py-1 bg-transparent"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">Press enter to add</p>
              </div>
            )}

            {/* Usernames */}
            {!isYouTubeSelected && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AtSign className="w-4 h-4 text-purple-500" />
                  Usernames
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 min-h-[42px] bg-white">
                    {usernames.map(user => (
                      <span key={user} className="inline-flex items-center gap-0.5 pl-2.5 pr-1 py-0.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                        {user}
                        <button type="button" onClick={() => removeUsername(user)} className="p-0.5 hover:bg-purple-200 rounded-full">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addUsername(); }
                        if (e.key === 'Backspace' && !usernameInput && usernames.length > 0) {
                          removeUsername(usernames[usernames.length - 1]);
                        }
                      }}
                      placeholder={usernames.length === 0 ? '@brandname' : ''}
                      className="flex-1 min-w-[80px] outline-none text-sm py-1 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 3: Keywords */}
        {!isTikTokSelected && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-orange-500" />
              Keywords
            </label>
            <div className="flex-1 flex flex-wrap items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-500 min-h-[42px] bg-white mb-2">
              {keywords.map(kw => (
                <span key={kw} className="inline-flex items-center gap-0.5 pl-2.5 pr-1 py-0.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {kw}
                  <button type="button" onClick={() => removeKeyword(kw)} className="p-0.5 hover:bg-orange-200 rounded-full">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addKeyword(); }
                  if (e.key === 'Backspace' && !keywordInput && keywords.length > 0) {
                    removeKeyword(keywords[keywords.length - 1]);
                  }
                }}
                placeholder={keywords.length === 0 ? 'Mention keywords related to your campaign, press enter to add more' : ''}
                className="flex-1 min-w-[120px] outline-none text-sm py-1 bg-transparent"
              />
            </div>

            {(hashtags.length > 0 || keywords.length > 0) && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  You can search for posts by hashtags or mentioned usernames. If keywords are entered, we filter the crawled posts by them.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Row 4: Match Mode Options (shown when multiple hashtags or keywords) */}
        {(hashtags.length > 1 || keywords.length > 1) && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            {hashtags.length > 1 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  You've entered multiple hashtags, should the crawler fetch posts that contain all of them or any of them?
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hashtagMatchMode"
                      checked={hashtagMatchMode === 'any'}
                      onChange={() => setHashtagMatchMode('any')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Any of them</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hashtagMatchMode"
                      checked={hashtagMatchMode === 'all'}
                      onChange={() => setHashtagMatchMode('all')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">All of them</span>
                  </label>
                </div>
              </div>
            )}

            {keywords.length > 1 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  You've entered multiple keywords, should the crawler fetch posts that contain all of them or any of them?
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keywordMatchMode"
                      checked={keywordMatchMode === 'any'}
                      onChange={() => setKeywordMatchMode('any')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Any of them</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="keywordMatchMode"
                      checked={keywordMatchMode === 'all'}
                      onChange={() => setKeywordMatchMode('all')}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">All of them</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Platform Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Social Networks *
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
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            YouTube cannot be combined with other platforms
          </p>
        </div>

        {/* Options */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Only Sponsored Posts?</span>
            </div>
            <div className={`relative w-11 h-6 rounded-full transition-colors ${sponsoredOnly ? 'bg-purple-600' : 'bg-gray-300'}`} onClick={() => setSponsoredOnly(!sponsoredOnly)}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sponsoredOnly ? 'translate-x-5' : ''}`} />
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
              'Continue →'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
