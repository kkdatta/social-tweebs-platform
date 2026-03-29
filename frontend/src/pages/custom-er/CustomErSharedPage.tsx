import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, Eye, MessageSquare, Send, Calendar, Users, TrendingUp,
  CheckCircle, AlertCircle, Loader, Clock,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { customErApi } from '../../services/api';

interface Post {
  id: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  description?: string;
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
  createdAt: string;
}

function fmtNum(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

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
        <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
      )}
      {post.isSponsored && (
        <span className="absolute top-2 left-2 px-2 py-1 bg-purple-600 text-white text-xs rounded">Sponsored</span>
      )}
      {post.postType && (
        <span className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">{post.postType}</span>
      )}
    </div>
    <div className="p-3">
      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.description || 'No description'}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-red-500" />
          {fmtNum(post.likesCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          {fmtNum(post.commentsCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-gray-400" />
          {fmtNum(post.viewsCount)}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-400">{new Date(post.postDate).toLocaleDateString()}</div>
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

export const CustomErSharedPage = () => {
  const { token } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSponsoredOnly, setShowSponsoredOnly] = useState(false);

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await customErApi.getSharedReport(token);
      setReport(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Report not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = report?.posts.filter((p) => (showSponsoredOnly ? p.isSponsored : true)) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This report may have been deleted or is no longer shared.'}</p>
          <Link to="/login" className="text-purple-600 hover:text-purple-700">
            Sign in to SocialTweebs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span className="font-bold text-lg">SocialTweebs</span>
          </div>
          <Link
            to="/login"
            className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Shared Custom ER Report</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName}`}
              alt={report.influencerName}
              className="w-16 h-16 rounded-full shrink-0"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{report.influencerName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                {report.influencerUsername && <span>@{report.influencerUsername}</span>}
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {fmtNum(report.followerCount)} followers
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-gray-600 text-sm mt-4">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>
              {new Date(report.dateRangeStart).toLocaleDateString()} – {new Date(report.dateRangeEnd).toLocaleDateString()}
            </span>
            <span className="text-gray-400">|</span>
            <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {report.status === 'FAILED' && report.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <strong>Error:</strong> {report.errorMessage}
          </div>
        )}

        {(report.status === 'PENDING' || report.status === 'PROCESSING') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            {report.status === 'PROCESSING' ? (
              <Loader className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            ) : (
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
            </h3>
            <p className="text-blue-600">
              {report.status === 'PENDING'
                ? 'This report is in the queue.'
                : 'Engagement metrics are being calculated.'}
            </p>
          </div>
        )}

        {report.status === 'COMPLETED' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Posts</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                <MetricCard icon={<TrendingUp />} label="Posts" value={report.allPostsMetrics.postsCount} />
                <MetricCard icon={<Heart />} label="Likes" value={fmtNum(report.allPostsMetrics.likesCount)} color="text-red-500" />
                <MetricCard icon={<Eye />} label="Views" value={fmtNum(report.allPostsMetrics.viewsCount)} color="text-blue-500" />
                <MetricCard icon={<MessageSquare />} label="Comments" value={fmtNum(report.allPostsMetrics.commentsCount)} color="text-green-500" />
                <MetricCard icon={<Send />} label="Shares" value={fmtNum(report.allPostsMetrics.sharesCount)} color="text-purple-500" />
                <MetricCard label="Avg ER" value={`${report.allPostsMetrics.avgEngagementRate?.toFixed(2) || '0'}%`} highlight />
                <MetricCard label="Eng/Views" value={`${report.allPostsMetrics.engagementViewsRate?.toFixed(2) || '0'}%`} />
              </div>
            </div>

            {report.hasSponsoredPosts && report.sponsoredPostsMetrics && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Sponsored Posts</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                  <MetricCard icon={<TrendingUp />} label="Posts" value={report.sponsoredPostsMetrics.postsCount} />
                  <MetricCard icon={<Heart />} label="Likes" value={fmtNum(report.sponsoredPostsMetrics.likesCount)} color="text-red-500" />
                  <MetricCard icon={<Eye />} label="Views" value={fmtNum(report.sponsoredPostsMetrics.viewsCount)} color="text-blue-500" />
                  <MetricCard icon={<MessageSquare />} label="Comments" value={fmtNum(report.sponsoredPostsMetrics.commentsCount)} color="text-green-500" />
                  <MetricCard icon={<Send />} label="Shares" value={fmtNum(report.sponsoredPostsMetrics.sharesCount)} color="text-purple-500" />
                  <MetricCard label="Avg ER" value={`${report.sponsoredPostsMetrics.avgEngagementRate?.toFixed(2) || '0'}%`} highlight />
                  <MetricCard label="Eng/Views" value={`${report.sponsoredPostsMetrics.engagementViewsRate?.toFixed(2) || '0'}%`} />
                </div>
              </div>
            )}

            {report.postsChartData && report.postsChartData.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Posts vs Dates</h2>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.postsChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                        contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="regularPosts" name="Regular Posts" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="sponsoredPosts" name="Sponsored Posts" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
                {report.hasSponsoredPosts && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">All Posts</span>
                    <button
                      type="button"
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

        <div className="text-center py-8 text-gray-500 text-sm">
          <p>
            This report was generated by <strong>SocialTweebs</strong>
          </p>
          <Link to="/signup" className="text-purple-600 hover:text-purple-700">
            Create your free account →
          </Link>
        </div>
      </div>
    </div>
  );
};
