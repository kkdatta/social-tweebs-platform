import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Instagram, Hash, AtSign, Calendar, Info, Loader, AlertCircle, X
} from 'lucide-react';
import { paidCollaborationApi } from '../../services/api';

export const PaidCollaborationCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK'>('INSTAGRAM');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [mentionInput, setMentionInput] = useState('');
  const [queryLogic, setQueryLogic] = useState<'AND' | 'OR'>('OR');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');

  // Calculate max date (3 months ago from today)
  const today = new Date();
  const maxStartDate = today.toISOString().split('T')[0];
  const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3)).toISOString().split('T')[0];

  const validateDateRange = () => {
    if (!dateRangeStart || !dateRangeEnd) return true;
    
    const start = new Date(dateRangeStart);
    const end = new Date(dateRangeEnd);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= 90; // 3 months
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter(h => h !== tag));
  };

  const addMention = () => {
    const mention = mentionInput.trim().replace(/^@/, '');
    if (mention && !mentions.includes(mention)) {
      setMentions([...mentions, mention]);
    }
    setMentionInput('');
  };

  const removeMention = (mention: string) => {
    setMentions(mentions.filter(m => m !== mention));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Please enter a report title');
      return;
    }
    if (hashtags.length === 0 && mentions.length === 0) {
      setError('Please add at least one hashtag or mention');
      return;
    }
    if (!dateRangeStart || !dateRangeEnd) {
      setError('Please select a date range');
      return;
    }
    if (!validateDateRange()) {
      setError('Date range cannot exceed 3 months');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await paidCollaborationApi.create({
        title: title.trim(),
        platform,
        hashtags: hashtags.map(h => `#${h}`),
        mentions: mentions.map(m => `@${m}`),
        queryLogic,
        dateRangeStart,
        dateRangeEnd,
      });
      
      if (result.success && result.report) {
        navigate(`/paid-collaboration/${result.report.id}`);
      } else {
        throw new Error('Failed to create report');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/paid-collaboration')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Paid Collaboration Report</h1>
          <p className="text-gray-600">Discover sponsored posts by hashtags and mentions</p>
        </div>
      </div>

      {/* Credit Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Credit Cost</p>
          <p className="text-blue-600 text-sm">Creating a report costs 1 credit. Make sure your date range doesn't exceed 3 months.</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Report Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Nike Campaign Analysis Q1 2026"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform *
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setPlatform('INSTAGRAM')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-colors ${
                platform === 'INSTAGRAM'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Instagram className={`w-6 h-6 ${platform === 'INSTAGRAM' ? 'text-pink-500' : 'text-gray-400'}`} />
              <span className={platform === 'INSTAGRAM' ? 'text-pink-700 font-medium' : 'text-gray-600'}>
                Instagram
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('TIKTOK')}
              className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-colors ${
                platform === 'TIKTOK'
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-6 h-6 font-bold flex items-center justify-center ${platform === 'TIKTOK' ? 'text-black' : 'text-gray-400'}`}>
                TT
              </div>
              <span className={platform === 'TIKTOK' ? 'text-black font-medium' : 'text-gray-600'}>
                TikTok
              </span>
            </button>
          </div>
        </div>

        {/* Hashtags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hashtags
          </label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                placeholder="Enter hashtag (e.g., nike)"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={addHashtag}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
                >
                  <Hash className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeHashtag(tag)}
                    className="ml-1 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mentions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mentions
          </label>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={mentionInput}
                onChange={(e) => setMentionInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMention())}
                placeholder="Enter username (e.g., nike)"
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="button"
              onClick={addMention}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Add
            </button>
          </div>
          {mentions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {mentions.map((mention) => (
                <span
                  key={mention}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full"
                >
                  <AtSign className="w-3 h-3" />
                  {mention}
                  <button
                    type="button"
                    onClick={() => removeMention(mention)}
                    className="ml-1 hover:text-purple-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Query Logic (only show if both hashtags and mentions exist) */}
        {hashtags.length > 0 && mentions.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Match Logic
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setQueryLogic('OR')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  queryLogic === 'OR'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                OR (Any match)
              </button>
              <button
                type="button"
                onClick={() => setQueryLogic('AND')}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  queryLogic === 'AND'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                AND (All must match)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {queryLogic === 'OR'
                ? 'Posts matching any hashtag OR mention will be included'
                : 'Posts must match at least one hashtag AND one mention'}
            </p>
          </div>
        )}

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range * (Max 3 months)
          </label>
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                min={threeMonthsAgo}
                max={dateRangeEnd || maxStartDate}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <span className="text-gray-500">to</span>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                min={dateRangeStart || threeMonthsAgo}
                max={maxStartDate}
                className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          {dateRangeStart && dateRangeEnd && !validateDateRange() && (
            <p className="text-red-500 text-sm mt-1">Date range cannot exceed 3 months</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/paid-collaboration')}
            className="px-6 py-3 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Report (1 Credit)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
