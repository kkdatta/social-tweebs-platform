import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Trash2, ExternalLink,
  CheckCircle, Clock, AlertCircle, Loader, Instagram,
  Heart, Eye, MessageSquare, Send, Calendar, Users, TrendingUp,
  Download, MoreVertical, Link2, Pencil,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import { customErApi } from '../../services/api';
import { saveAs } from 'file-saver';

interface Post {
  id: string;
  postId?: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  description?: string;
  hashtags?: string[];
  mentions?: string[];
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate?: number;
  isSponsored: boolean;
  postDate: string;
}

interface EngagementMetrics {
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  avgEngagementRate?: number;
  engagementViewsRate?: number;
}

interface ReportDetail {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  influencerAvatarUrl?: string;
  followerCount: number;
  platform: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  errorMessage?: string;
  allPostsMetrics: EngagementMetrics;
  sponsoredPostsMetrics?: EngagementMetrics;
  hasSponsoredPosts: boolean;
  posts: Post[];
  postsChartData: { date: string; regularPosts: number; sponsoredPosts: number }[];
  isPublic: boolean;
  shareUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export const CustomErDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSponsoredOnly, setShowSponsoredOnly] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editReportName, setEditReportName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await customErApi.getById(id!);
      setReport(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (!report) return;
    setEditReportName(report.influencerName);
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleSaveReportName = async () => {
    if (!report || !editReportName.trim()) return;
    try {
      setSavingEdit(true);
      await customErApi.update(report.id, { influencerName: editReportName.trim() });
      await loadReport();
      setShowEditModal(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to rename report');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm(`Are you sure you want to delete this report?`)) return;
    try {
      await customErApi.delete(report.id);
      navigate('/custom-er');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      const result = await customErApi.share(report.id);
      navigator.clipboard.writeText(result.shareUrl);
      alert('Share URL copied to clipboard!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate share URL');
    }
  };

  const handleCopyUrl = () => {
    const url = report?.shareUrl
      ? `${window.location.origin}${report.shareUrl}`
      : window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXlsx = async () => {
    if (!report) return;
    try {
      setDownloadingXlsx(true);
      const response = await customErApi.downloadReport(report.id);
      const disposition = response.headers?.['content-disposition'];
      let filename = `ER_Report_${report.influencerUsername || report.influencerName}.xlsx`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }
      saveAs(response.data, filename);
    } catch (err: any) {
      alert('Failed to download report');
    } finally {
      setDownloadingXlsx(false);
    }
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

  const fmtNum = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const filteredPosts = report?.posts.filter(p =>
    showSponsoredOnly ? p.isSponsored : true
  ) || [];

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
        <button onClick={() => navigate('/custom-er')} className="mt-4 text-purple-600 hover:text-purple-700">
          Back to reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <button onClick={() => navigate('/custom-er')} className="p-2 hover:bg-gray-100 rounded-lg self-start">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <img
              src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName}`}
              alt={report.influencerName}
              className="w-14 h-14 rounded-full"
            />
            <Instagram className="absolute -bottom-1 -right-1 w-5 h-5 text-pink-500 bg-white rounded-full p-0.5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{report.influencerName}</h1>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-500">
              {report.influencerUsername && <span>@{report.influencerUsername}</span>}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {fmtNum(report.followerCount)} followers
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {getStatusBadge(report.status)}

          {/* Three-dots menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => { handleShare(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Share2 className="w-4 h-4" /> Share Report
                  </button>
                  <button
                    onClick={() => { handleCopyUrl(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Link2 className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                  <button
                    onClick={() => { handleDownloadXlsx(); setShowMenu(false); }}
                    disabled={downloadingXlsx || report.status !== 'COMPLETED'}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> {downloadingXlsx ? 'Downloading...' : 'Download XLSX'}
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm sm:text-base">
        <Calendar className="w-5 h-5" />
        <span>
          Analysis Period: {new Date(report.dateRangeStart).toLocaleDateString()} - {new Date(report.dateRangeEnd).toLocaleDateString()}
        </span>
        <span className="text-gray-400">|</span>
        <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
      </div>

      {/* Error Message */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <strong>Error:</strong> {report.errorMessage}
        </div>
      )}

      {/* Metrics + Chart + Posts */}
      {report.status === 'COMPLETED' && (
        <>
          {/* All Posts Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Posts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
              <MetricCard icon={<TrendingUp />} label="Posts" value={report.allPostsMetrics.postsCount} />
              <MetricCard icon={<Heart />} label="Likes" value={fmtNum(report.allPostsMetrics.likesCount)} color="text-red-500" />
              <MetricCard icon={<Eye />} label="Views" value={fmtNum(report.allPostsMetrics.viewsCount)} color="text-blue-500" />
              <MetricCard icon={<MessageSquare />} label="Comments" value={fmtNum(report.allPostsMetrics.commentsCount)} color="text-green-500" />
              <MetricCard icon={<Send />} label="Shares" value={fmtNum(report.allPostsMetrics.sharesCount)} color="text-purple-500" />
              <MetricCard
                label="Avg ER"
                value={`${report.allPostsMetrics.avgEngagementRate?.toFixed(2) || '0'}%`}
                highlight
              />
              <MetricCard
                label="Eng/Views"
                value={`${report.allPostsMetrics.engagementViewsRate?.toFixed(2) || '0'}%`}
              />
            </div>
          </div>

          {/* Sponsored Posts Metrics */}
          {report.hasSponsoredPosts && report.sponsoredPostsMetrics && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sponsored Posts</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                <MetricCard icon={<TrendingUp />} label="Posts" value={report.sponsoredPostsMetrics.postsCount} />
                <MetricCard icon={<Heart />} label="Likes" value={fmtNum(report.sponsoredPostsMetrics.likesCount)} color="text-red-500" />
                <MetricCard icon={<Eye />} label="Views" value={fmtNum(report.sponsoredPostsMetrics.viewsCount)} color="text-blue-500" />
                <MetricCard icon={<MessageSquare />} label="Comments" value={fmtNum(report.sponsoredPostsMetrics.commentsCount)} color="text-green-500" />
                <MetricCard icon={<Send />} label="Shares" value={fmtNum(report.sponsoredPostsMetrics.sharesCount)} color="text-purple-500" />
                <MetricCard
                  label="Avg ER"
                  value={`${report.sponsoredPostsMetrics.avgEngagementRate?.toFixed(2) || '0'}%`}
                  highlight
                />
                <MetricCard
                  label="Eng/Views"
                  value={`${report.sponsoredPostsMetrics.engagementViewsRate?.toFixed(2) || '0'}%`}
                />
              </div>
            </div>
          )}

          {/* Posts vs Dates Chart */}
          {report.postsChartData && report.postsChartData.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Posts vs Dates</h2>
              <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={report.postsChartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val: string) => {
                        const d = new Date(val);
                        return `${d.getMonth() + 1}/${d.getDate()}`;
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="regularPosts"
                      name="Regular Posts"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sponsoredPosts"
                      name="Sponsored Posts"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Posts List with Toggle */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
              {report.hasSponsoredPosts && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">All Posts</span>
                  <button
                    onClick={() => setShowSponsoredOnly(!showSponsoredOnly)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      showSponsoredOnly ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                    role="switch"
                    aria-checked={showSponsoredOnly}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showSponsoredOnly ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">Sponsored Only</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                {showSponsoredOnly ? 'No sponsored posts found' : 'No posts found'}
              </div>
            )}
          </div>
        </>
      )}

      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            role="dialog"
            aria-labelledby="edit-report-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-report-title" className="text-lg font-semibold text-gray-900">
              Rename report
            </h2>
            <div>
              <label htmlFor="report-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                Report name
              </label>
              <input
                id="report-name-input"
                type="text"
                value={editReportName}
                onChange={(e) => setEditReportName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveReportName();
                  if (e.key === 'Escape') setShowEditModal(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReportName}
                disabled={savingEdit || !editReportName.trim()}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {(report.status === 'PENDING' || report.status === 'PROCESSING') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <Loader className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
          </h3>
          <p className="text-blue-600">
            {report.status === 'PENDING'
              ? 'Your report is in queue and will be processed shortly.'
              : 'Fetching posts and calculating engagement metrics...'}
          </p>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ icon, label, value, color, highlight }: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
}) => (
  <div className={`p-3 sm:p-4 rounded-lg ${highlight ? 'bg-purple-100' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className={color || 'text-gray-400'}>{icon}</span>}
      <span className="text-xs text-gray-500 uppercase">{label}</span>
    </div>
    <div className={`text-lg sm:text-xl font-bold ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);

const PostCard = ({ post }: { post: Post }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
    <div className="aspect-square relative bg-gray-100">
      {post.thumbnailUrl ? (
        <img src={post.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No image
        </div>
      )}
      {post.isSponsored && (
        <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">
          Sponsored
        </span>
      )}
      {post.postType && (
        <span className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
          {post.postType}
        </span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
        {post.description || 'No description'}
      </p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" />
          {fmtNumHelper(post.likesCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          {fmtNumHelper(post.commentsCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-gray-400" />
          {fmtNumHelper(post.viewsCount)}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {new Date(post.postDate).toLocaleDateString()}
      </div>
      {post.postUrl && (
        <a
          href={post.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
        >
          View Post <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  </div>
);

function fmtNumHelper(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
