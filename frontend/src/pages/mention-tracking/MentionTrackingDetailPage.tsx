import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Download, RefreshCw, Hash, AtSign,
  Users, FileText, Heart, Eye, MessageCircle, Share,
  Calendar, Clock, CheckCircle, AlertCircle, Loader,
  TrendingUp, Filter, ChevronDown
} from 'lucide-react';
import { mentionTrackingApi } from '../../services/api';

interface Report {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  errorMessage?: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  hashtags: string[];
  usernames: string[];
  keywords: string[];
  sponsoredOnly: boolean;
  autoRefreshEnabled: boolean;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
  totalFollowers: number;
  influencers: any[];
  posts: any[];
  categorization: any[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}

interface ChartData {
  date: string;
  postsCount: number;
  influencersCount: number;
  likesCount: number;
  viewsCount: number;
}

export const MentionTrackingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'posts'>('overview');
  const [sponsoredFilter, setSponsoredFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('likes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [reportData, chartDataResponse] = await Promise.all([
        mentionTrackingApi.getById(id!),
        mentionTrackingApi.getChartData(id!).catch(() => []),
      ]);
      setReport(reportData);
      setChartData(chartDataResponse);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const result = await mentionTrackingApi.share(id!, {});
      if (result.shareUrl) {
        navigator.clipboard.writeText(window.location.origin + result.shareUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to share');
    }
  };

  const handleRetry = async () => {
    if (!confirm('Retry this report? This will cost 1 credit.')) return;
    try {
      await mentionTrackingApi.retry(id!);
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry');
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
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>Report not found</p>
      </div>
    );
  }

  const filteredInfluencers = report.influencers
    .filter(inf => categoryFilter === 'ALL' || inf.category === categoryFilter)
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'likes': return multiplier * (a.likesCount - b.likesCount);
        case 'followers': return multiplier * (a.followerCount - b.followerCount);
        case 'comments': return multiplier * (a.commentsCount - b.commentsCount);
        case 'credibility': return multiplier * ((a.audienceCredibility || 0) - (b.audienceCredibility || 0));
        case 'engagement': return multiplier * ((a.avgEngagementRate || 0) - (b.avgEngagementRate || 0));
        default: return 0;
      }
    });

  const filteredPosts = report.posts
    .filter(post => !sponsoredFilter || post.isSponsored)
    .sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'likes': return multiplier * (a.likesCount - b.likesCount);
        case 'views': return multiplier * (a.viewsCount - b.viewsCount);
        case 'comments': return multiplier * (a.commentsCount - b.commentsCount);
        case 'recent': return multiplier * (new Date(a.postDate || 0).getTime() - new Date(b.postDate || 0).getTime());
        default: return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/mention-tracking')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {report.dateRangeStart} to {report.dateRangeEnd}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Created {new Date(report.createdAt).toLocaleDateString()}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                report.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                report.status === 'PROCESSING' ? 'bg-blue-100 text-blue-700' :
                report.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {report.status === 'COMPLETED' && <CheckCircle className="w-3 h-3" />}
                {report.status === 'PROCESSING' && <Loader className="w-3 h-3 animate-spin" />}
                {report.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                {report.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {report.status === 'FAILED' && (
            <button onClick={handleRetry} className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
          <button onClick={handleShare} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search Criteria Tags */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
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
          {report.sponsoredOnly && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
              Sponsored Only
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {report.status === 'COMPLETED' && (
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
      )}

      {/* Tabs */}
      {report.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {(['overview', 'influencers', 'posts'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize border-b-2 ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Categorization Table */}
              <div>
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
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
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
                          <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(cat.commentsCount)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-purple-600">{cat.engagementRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Influencers Tab */}
          {activeTab === 'influencers' && (
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="NANO">Nano</option>
                  <option value="MICRO">Micro</option>
                  <option value="MACRO">Macro</option>
                  <option value="MEGA">Mega</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="likes">Sort by Likes</option>
                  <option value="followers">Sort by Followers</option>
                  <option value="comments">Sort by Comments</option>
                  <option value="credibility">Sort by Credibility</option>
                  <option value="engagement">Sort by ER</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-1"
                >
                  {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credibility</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ER %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInfluencers.map(inf => (
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
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(inf.viewsCount)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{formatNumber(inf.commentsCount)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{inf.audienceCredibility?.toFixed(0)}%</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-purple-600">{inf.avgEngagementRate?.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sponsoredFilter}
                    onChange={(e) => setSponsoredFilter(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Sponsored Only</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="likes">Sort by Likes</option>
                  <option value="views">Sort by Views</option>
                  <option value="comments">Sort by Comments</option>
                  <option value="recent">Sort by Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-1"
                >
                  {sortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPosts.map(post => (
                  <div key={post.id} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative">
                      <img
                        src={post.thumbnailUrl || 'https://via.placeholder.com/400'}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {post.isSponsored && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 text-white rounded text-xs">
                          Sponsored
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        @{post.influencerUsername} • {post.postDate}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {formatNumber(post.likesCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(post.viewsCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {formatNumber(post.commentsCount)}
                        </span>
                      </div>
                      {post.matchedHashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.matchedHashtags.slice(0, 3).map((tag: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing/Failed State */}
      {report.status !== 'COMPLETED' && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          {report.status === 'PROCESSING' || report.status === 'PENDING' ? (
            <>
              <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report is being processed</h3>
              <p className="text-gray-500">This may take a few minutes. You'll be notified when it's ready.</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Report failed</h3>
              <p className="text-gray-500 mb-4">{report.errorMessage || 'An error occurred while processing this report.'}</p>
              <button onClick={handleRetry} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Retry Report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
