import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, RefreshCw, Trash2, Copy, MoreVertical,
  FileText, Heart, Eye, MessageCircle, Share, TrendingUp, Users,
  CheckCircle, Clock, AlertCircle, Loader, ExternalLink, Calendar, Tag
} from 'lucide-react';
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
}

export const CollabCheckDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadReport();
  }, [id]);

  const loadReport = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
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
  };

  const handleSaveTitle = async () => {
    if (!id || !editTitle.trim()) return;
    
    try {
      await collabCheckApi.update(id, { title: editTitle });
      setReport(prev => prev ? { ...prev, title: editTitle } : null);
      setEditing(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };

  const handleRetry = async () => {
    if (!id || !confirm('Retry this report? This will cost credits.')) return;
    
    try {
      await collabCheckApi.retry(id);
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Delete this report? This action cannot be undone.')) return;
    
    try {
      await collabCheckApi.delete(id);
      navigate('/collab-check');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
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
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold border-b-2 border-purple-500 focus:outline-none"
                  autoFocus
                />
                <button onClick={handleSaveTitle} className="text-green-600 hover:text-green-700">Save</button>
                <button onClick={() => { setEditing(false); setEditTitle(report.title); }} className="text-gray-500">Cancel</button>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {report.title}
                <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-gray-600">
                  <Edit3 className="w-4 h-4" />
                </button>
              </h1>
            )}
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
                onClick={() => { setEditing(true); setMenuOpen(false); }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Report
              </button>
              {report.status === 'FAILED' && (
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
                Copy URL
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

      {/* Chart Placeholder */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Posts Over Time</h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-gray-400">
              Chart visualization (showing {chartData.length} data points)
            </div>
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
              ? 'Your report is in the queue and will be processed shortly.'
              : 'Analyzing posts and calculating metrics. This may take a few minutes.'}
          </p>
        </div>
      )}
    </div>
  );
};
