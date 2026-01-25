import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Hash, AtSign, Users, FileText, Heart, Eye, MessageCircle, Share,
  Calendar, Clock, CheckCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { mentionTrackingApi } from '../../services/api';

interface Report {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  hashtags: string[];
  usernames: string[];
  keywords: string[];
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  influencers: any[];
  posts: any[];
  categorization: any[];
  createdAt: string;
}

export const MentionTrackingSharedPage = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadReport();
    }
  }, [token]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await mentionTrackingApi.getSharedReport(token!);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Report not found or not publicly shared');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      NANO: 'bg-green-100 text-green-700',
      MICRO: 'bg-blue-100 text-blue-700',
      MACRO: 'bg-purple-100 text-purple-700',
      MEGA: 'bg-orange-100 text-orange-700',
    };
    return styles[category] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>{error || 'Report not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {report.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {report.dateRangeStart} to {report.dateRangeEnd}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Created {new Date(report.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Search Criteria */}
          <div className="mt-4 flex flex-wrap gap-4">
            {report.hashtags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Hashtags:</span>
                {report.hashtags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    <Hash className="w-3 h-3" />
                    {tag.replace('#', '')}
                  </span>
                ))}
              </div>
            )}
            {report.usernames.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Mentions:</span>
                {report.usernames.map((user, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                    <AtSign className="w-3 h-3" />
                    {user.replace('@', '')}
                  </span>
                ))}
              </div>
            )}
            {report.keywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Keywords:</span>
                {report.keywords.map((kw, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-purple-600 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalInfluencers)}</div>
            <div className="text-sm text-gray-500">Influencers</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalPosts)}</div>
            <div className="text-sm text-gray-500">Posts</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-red-500 mb-2">
              <Heart className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalLikes)}</div>
            <div className="text-sm text-gray-500">Likes</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-cyan-600 mb-2">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalViews)}</div>
            <div className="text-sm text-gray-500">Views</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalComments)}</div>
            <div className="text-sm text-gray-500">Comments</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <Share className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalShares)}</div>
            <div className="text-sm text-gray-500">Shares</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{report.avgEngagementRate?.toFixed(2)}%</div>
            <div className="text-sm text-gray-500">Avg ER</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-pink-600 mb-2">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{report.engagementViewsRate?.toFixed(2)}%</div>
            <div className="text-sm text-gray-500">Eng/Views</div>
          </div>
        </div>

        {/* Categorization Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Influencer Categorization</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accounts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ER %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.categorization.map(cat => (
                  <tr key={cat.category} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryBadge(cat.category)}`}>
                        {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.accountsCount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.followersCount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.postsCount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.likesCount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.viewsCount)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-purple-600">{cat.engagementRate.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Influencers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Influencers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ER %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.influencers.slice(0, 10).map(inf => (
                  <tr key={inf.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                          alt={inf.influencerName}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{inf.influencerName}</div>
                          <div className="text-xs text-gray-500">@{inf.influencerUsername}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getCategoryBadge(inf.category)}`}>
                          {inf.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(inf.followerCount)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{inf.postsCount}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(inf.likesCount)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-purple-600">{inf.avgEngagementRate?.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          Powered by SocialTweebs
        </div>
      </div>
    </div>
  );
};
