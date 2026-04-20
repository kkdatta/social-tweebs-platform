import { useState, useEffect, useCallback } from 'react';
import { useReportPolling } from '../../hooks/useReportPolling';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, RefreshCw, Trash2, Copy, MoreVertical,
  FileText, Heart, Eye, MessageCircle, Share, TrendingUp, Users,
  CheckCircle, Clock, AlertCircle, Loader, ExternalLink, Calendar, Tag,
  BarChart3, LineChart as LineChartIcon, Link2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { collabCheckApi } from '../../services/api';

interface Post {
  id: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  description?: string;
  matchedKeywords?: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate?: number;
  postDate?: string;
  influencerName?: string;
  influencerUsername?: string;
}

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  avgEngagementRate?: number;
}

interface ReportDetail {
  id: string;
  title: string;
  platform: string;
  status: string;
  errorMessage?: string;
  timePeriod: string;
  queries: string[];
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  totalFollowers: number;
  influencers: Influencer[];
  posts: Post[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}

interface ChartData {
  date: string;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount?: number;
}

export const CollabCheckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const loadReport = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(prev => prev === true ? true : false);
      const [reportData, chartDataResult] = await Promise.all([
        collabCheckApi.getById(id),
        collabCheckApi.getChartData(id).catch(() => []),
      ]);
      setReport(reportData);
      setChartData(chartDataResult);
      setEditTitle(reportData.title);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReport();
  }, [id, loadReport]);

  useReportPolling(report?.status, loadReport);

  const handleSaveTitle = async () => {
    if (!id || !editTitle.trim()) return;
    
    try {
      await collabCheckApi.update(id, { title: editTitle, isPublic: shareWithTeam });
      setReport(prev => prev ? { ...prev, title: editTitle, isPublic: shareWithTeam } : null);
      setEditModalOpen(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const openEditModal = async () => {
    if (!report) return;
    setEditTitle(report.title);
    setShareWithTeam(report.isPublic);
    setEditModalOpen(true);
    setMenuOpen(false);

    if (report.shareUrl) {
      setShareUrl(window.location.origin + report.shareUrl);
    } else if (id) {
      try {
        const result = await collabCheckApi.share(id, {});
        if (result.shareUrl) {
          setShareUrl(window.location.origin + result.shareUrl);
        }
      } catch {
        setShareUrl('');
      }
    }
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      alert('Shareable URL copied to clipboard!');
    }
  };

  const handleRetry = async () => {
    if (!id || !confirm('Retrying will deduct 1 credit. Do you want to continue?')) return;
    
    try {
      await collabCheckApi.retry(id);
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Report generation failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this report? This action cannot be undone.')) return;
    
    try {
      await collabCheckApi.delete(id);
      navigate('/collab-check');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const handleCopyUrl = async () => {
    if (!id) return;
    
    try {
      const result = await collabCheckApi.share(id, {});
      if (result.shareUrl) {
        navigator.clipboard.writeText(window.location.origin + result.shareUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to copy URL');
    }
    setMenuOpen(false);
  };

  const formatTimePeriod = (period: string) => {
    const map: Record<string, string> = {
      '1_MONTH': '1 Month',
      '3_MONTHS': '3 Months',
      '6_MONTHS': '6 Months',
      '1_YEAR': '1 Year',
    };
    return map[period] || period;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      PROCESSING: <Loader className="w-4 h-4 animate-spin" />,
      PENDING: <Clock className="w-4 h-4" />,
      FAILED: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords?.length) return text;
    
    let highlighted = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
    });
    return highlighted;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Report not found</p>
        <button onClick={() => navigate('/collab-check')} className="mt-4 text-purple-600">
          Back to list
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/collab-check')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {report.title}
              <button onClick={openEditModal} className="text-gray-400 hover:text-gray-600">
                <Edit3 className="w-4 h-4" />
              </button>
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span>{new Date(report.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {report.totalFollowers.toLocaleString()} followers
              </span>
              <span>•</span>
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={openEditModal}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Report
              </button>
              {(report.status === 'COMPLETED' || report.status === 'FAILED') && (
                <button
                  onClick={() => { handleRetry(); setMenuOpen(false); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Report
                </button>
              )}
              <button
                onClick={handleCopyUrl}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Report URL
              </button>
              <hr className="my-1" />
              <button
                onClick={() => { handleDelete(); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Report
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{report.errorMessage}</span>
          <button
            onClick={handleRetry}
            className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Report Info */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{formatTimePeriod(report.timePeriod)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {report.queries.map((q, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                  {q}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {report.status === 'COMPLETED' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Posts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{report.totalPosts.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Likes</span>
            </div>
            <div className="text-2xl font-bold text-pink-600">{report.totalLikes.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{report.totalViews.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Comments</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{report.totalComments.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Share className="w-4 h-4" />
              <span className="text-xs">Shares</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{report.totalShares.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Avg ER</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{report.avgEngagementRate?.toFixed(2) || '0'}%</div>
          </div>
        </div>
      )}

      {/* Influencers */}
      {report.influencers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Influencers ({report.influencers.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.influencers.map((inf) => (
              <div key={inf.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                    alt={inf.influencerName}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-medium">{inf.influencerName}</div>
                    {inf.influencerUsername && (
                      <div className="text-sm text-gray-500">@{inf.influencerUsername}</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Followers:</span>
                    <span className="ml-1 font-medium">{inf.followerCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Posts:</span>
                    <span className="ml-1 font-medium">{inf.postsCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Likes:</span>
                    <span className="ml-1 font-medium">{inf.likesCount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">ER:</span>
                    <span className="ml-1 font-medium">{inf.avgEngagementRate?.toFixed(2) || '0'}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts vs Date Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Posts vs Date</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-lg ${chartType === 'bar' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`p-2 rounded-lg ${chartType === 'line' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'}`}
                title="Line Chart"
              >
                <LineChartIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload as ChartData;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                          <div className="font-medium text-gray-900 mb-2">{new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                              <span className="text-gray-600">Posts:</span>
                              <span className="font-medium">{data.postsCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-pink-500 inline-block"></span>
                              <span className="text-gray-600">Likes:</span>
                              <span className="font-medium">{data.likesCount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                              <span className="text-gray-600">Comments:</span>
                              <span className="font-medium">{data.commentsCount?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Bar dataKey="postsCount" name="Posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0]?.payload as ChartData;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
                          <div className="font-medium text-gray-900 mb-2">{new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>
                              <span className="text-gray-600">Posts:</span>
                              <span className="font-medium">{data.postsCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-pink-500 inline-block"></span>
                              <span className="text-gray-600">Likes:</span>
                              <span className="font-medium">{data.likesCount?.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
                              <span className="text-gray-600">Comments:</span>
                              <span className="font-medium">{data.commentsCount?.toLocaleString() || '0'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="postsCount" name="Posts" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {report.posts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Posts ({report.posts.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.posts.map((post) => (
              <div key={post.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Thumbnail */}
                {post.thumbnailUrl && (
                  <img
                    src={post.thumbnailUrl}
                    alt="Post"
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-4">
                  {/* Description with highlighted keywords */}
                  {post.description && (
                    <p
                      className="text-sm text-gray-600 mb-3 line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: highlightKeywords(post.description, post.matchedKeywords || [])
                      }}
                    />
                  )}
                  
                  {/* Matched Keywords */}
                  {post.matchedKeywords && post.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.matchedKeywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likesCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {post.commentsCount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {post.viewsCount.toLocaleString()}
                    </span>
                  </div>
                  
                  {/* Engagement Rate */}
                  {post.engagementRate !== undefined && (
                    <div className="text-xs text-gray-500 mb-3">
                      ER: {post.engagementRate.toFixed(2)}%
                    </div>
                  )}
                  
                  {/* View Post Button */}
                  {post.postUrl && (
                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                    >
                      View Post
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing State */}
      {(report.status === 'PENDING' || report.status === 'PROCESSING') && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
          </h3>
          <p className="text-gray-500">
            {report.status === 'PENDING' 
              ? 'Your collab report has been created successfully.'
              : 'Analyzing posts and calculating metrics. This may take a few minutes.'}
          </p>
        </div>
      )}

      {/* Edit Report Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Edit Report</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Report Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Report title"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700">Share with Team</div>
                  <div className="text-xs text-gray-500">Allow team members to view this report</div>
                </div>
                <button
                  onClick={() => setShareWithTeam(!shareWithTeam)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${shareWithTeam ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${shareWithTeam ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {shareUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Shareable URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600 truncate"
                    />
                    <button
                      onClick={handleCopyShareUrl}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium whitespace-nowrap"
                    >
                      <Link2 className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTitle}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
