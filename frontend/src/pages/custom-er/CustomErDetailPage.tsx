import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Trash2, ExternalLink,
  CheckCircle, Clock, AlertCircle, Loader, Instagram,
  Heart, Eye, MessageSquare, Send, Calendar, Users, TrendingUp
} from 'lucide-react';
import { customErApi } from '../../services/api';

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

  const formatNumber = (num: number) => {
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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/custom-er')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="relative">
            <img
              src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName}`}
              alt={report.influencerName}
              className="w-14 h-14 rounded-full"
            />
            <Instagram className="absolute -bottom-1 -right-1 w-5 h-5 text-pink-500 bg-white rounded-full p-0.5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.influencerName}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {report.influencerUsername && <span>@{report.influencerUsername}</span>}
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {formatNumber(report.followerCount)} followers
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          <button onClick={handleShare} className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 text-gray-600">
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

      {/* Metrics Sections */}
      {report.status === 'COMPLETED' && (
        <>
          {/* All Posts Metrics */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Posts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <MetricCard icon={<TrendingUp />} label="Posts" value={report.allPostsMetrics.postsCount} />
              <MetricCard icon={<Heart />} label="Likes" value={formatNumber(report.allPostsMetrics.likesCount)} color="text-red-500" />
              <MetricCard icon={<Eye />} label="Views" value={formatNumber(report.allPostsMetrics.viewsCount)} color="text-blue-500" />
              <MetricCard icon={<MessageSquare />} label="Comments" value={formatNumber(report.allPostsMetrics.commentsCount)} color="text-green-500" />
              <MetricCard icon={<Send />} label="Shares" value={formatNumber(report.allPostsMetrics.sharesCount)} color="text-purple-500" />
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
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sponsored Posts</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <MetricCard icon={<TrendingUp />} label="Posts" value={report.sponsoredPostsMetrics.postsCount} />
                <MetricCard icon={<Heart />} label="Likes" value={formatNumber(report.sponsoredPostsMetrics.likesCount)} color="text-red-500" />
                <MetricCard icon={<Eye />} label="Views" value={formatNumber(report.sponsoredPostsMetrics.viewsCount)} color="text-blue-500" />
                <MetricCard icon={<MessageSquare />} label="Comments" value={formatNumber(report.sponsoredPostsMetrics.commentsCount)} color="text-green-500" />
                <MetricCard icon={<Send />} label="Shares" value={formatNumber(report.sponsoredPostsMetrics.sharesCount)} color="text-purple-500" />
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

          {/* Posts List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Posts</h2>
              {report.hasSponsoredPosts && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSponsoredOnly}
                    onChange={(e) => setShowSponsoredOnly(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">Show Sponsored Only</span>
                </label>
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

// Metric Card Component
const MetricCard = ({ icon, label, value, color, highlight }: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
  highlight?: boolean;
}) => (
  <div className={`p-4 rounded-lg ${highlight ? 'bg-purple-100' : 'bg-gray-50'}`}>
    <div className="flex items-center gap-2 mb-1">
      {icon && <span className={color || 'text-gray-400'}>{icon}</span>}
      <span className="text-xs text-gray-500 uppercase">{label}</span>
    </div>
    <div className={`text-xl font-bold ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>
      {value}
    </div>
  </div>
);

// Post Card Component
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
          {formatNumber(post.likesCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          {formatNumber(post.commentsCount)}
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-4 h-4 text-gray-400" />
          {formatNumber(post.viewsCount)}
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

// Helper function for PostCard
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};
