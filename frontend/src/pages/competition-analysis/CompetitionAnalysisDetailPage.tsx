import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Download,
  RefreshCw,
  MoreVertical,
  Users,
  FileText,
  Heart,
  Eye,
  MessageCircle,
  TrendingUp,
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Repeat,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import api from '../../services/api';

interface Brand {
  id: string;
  brandName: string;
  hashtags?: string[];
  username?: string;
  keywords?: string[];
  displayColor?: string;
  influencerCount: number;
  postsCount: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  totalFollowers: number;
  avgEngagementRate?: number;
  photoCount: number;
  videoCount: number;
  carouselCount: number;
  reelCount: number;
  nanoCount: number;
  microCount: number;
  macroCount: number;
  megaCount: number;
}

interface Influencer {
  id: string;
  brandId: string;
  brandName: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  category?: string;
  audienceCredibility?: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  avgEngagementRate?: number;
}

interface Post {
  id: string;
  brandId: string;
  brandName: string;
  platform: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  description?: string;
  matchedHashtags?: string[];
  matchedUsername?: string;
  matchedKeywords?: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate?: number;
  isSponsored: boolean;
  postDate?: string;
  influencerName?: string;
  influencerUsername?: string;
}

interface CategoryStats {
  category: string;
  label: string;
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
}

interface PostTypeStats {
  brandId: string;
  brandName: string;
  photoCount: number;
  videoCount: number;
  carouselCount: number;
  reelCount: number;
  photoPercentage: number;
  videoPercentage: number;
  carouselPercentage: number;
  reelPercentage: number;
}

interface ReportDetail {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  errorMessage?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  autoRefreshEnabled: boolean;
  totalBrands: number;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  totalFollowers: number;
  brands: Brand[];
  influencers: Influencer[];
  posts: Post[];
  categorization: CategoryStats[];
  postTypeBreakdown: PostTypeStats[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
}

interface ChartData {
  date: string;
  brandPosts: Record<string, number>;
  totalPosts: number;
}

const CATEGORY_COLORS = {
  NANO: '#22c55e',
  MICRO: '#3b82f6',
  MACRO: '#a855f7',
  MEGA: '#f97316',
};

const CompetitionAnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'posts'>('overview');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('likes');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchReport();
      fetchChartData();
    }
  }, [id]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/competition-analysis/${id}`);
      setReport(response.data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await api.get(`/competition-analysis/${id}/chart-data`);
      setChartData(response.data);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    }
  };

  const handleRetry = async () => {
    try {
      await api.post(`/competition-analysis/${id}/retry`);
      fetchReport();
    } catch (error) {
      console.error('Failed to retry report:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await api.post(`/competition-analysis/${id}/share`, {});
      if (response.data.shareUrl) {
        navigator.clipboard.writeText(response.data.shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="w-4 h-4 animate-spin" />, label: 'In Progress' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" />, label: 'Failed' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-500">Report not found</p>
        <button
          onClick={() => navigate('/competition-analysis')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  // Prepare chart lines
  const chartLines = report.brands.map((brand, index) => ({
    dataKey: brand.brandName,
    stroke: brand.displayColor || `hsl(${index * 60}, 70%, 50%)`,
    name: brand.brandName,
  }));

  // Transform chart data
  const transformedChartData = chartData.map(d => ({
    date: d.date,
    ...d.brandPosts,
    total: d.totalPosts,
  }));

  // Filter influencers and posts
  const filteredInfluencers = report.influencers.filter(inf => {
    if (selectedBrand && inf.brandId !== selectedBrand) return false;
    if (selectedCategory !== 'ALL' && inf.category !== selectedCategory) return false;
    return true;
  });

  const filteredPosts = report.posts.filter(post => {
    if (selectedBrand && post.brandId !== selectedBrand) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/competition-analysis')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-500">
                {report.dateRangeStart} - {report.dateRangeEnd}
              </span>
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Repeat className="w-4 h-4" />
              Retry
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* Error Message */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{report.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Brands</p>
          <p className="text-2xl font-bold text-gray-900">{report.totalBrands}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Influencers</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalInfluencers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Posts</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalPosts)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Likes</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalLikes)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Views</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalViews)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Comments</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalComments)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Shares</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalShares)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Avg ER</p>
          <p className="text-2xl font-bold text-indigo-600">
            {report.avgEngagementRate?.toFixed(2) || '0'}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {(['overview', 'influencers', 'posts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Brand Overview Table */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Influencers</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eng Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.brands.map((brand) => (
                        <tr key={brand.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: brand.displayColor }}
                              />
                              <span className="font-medium text-gray-900">{brand.brandName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <div className="flex flex-wrap gap-1">
                              {brand.hashtags?.map(h => (
                                <span key={h} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{h}</span>
                              ))}
                              {brand.username && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{brand.username}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{brand.influencerCount}</td>
                          <td className="px-4 py-3 text-right text-sm">{brand.postsCount}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatNumber(brand.totalLikes)}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatNumber(brand.totalViews)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-indigo-600">
                            {brand.avgEngagementRate?.toFixed(2) || '0'}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Posts Over Time Chart */}
              {transformedChartData.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts Over Time</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transformedChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        {chartLines.map((line) => (
                          <Line
                            key={line.dataKey}
                            type="monotone"
                            dataKey={line.dataKey}
                            stroke={line.stroke}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            name={line.name}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Post Type Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Type Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {report.postTypeBreakdown.map((breakdown) => (
                    <div key={breakdown.brandId} className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900 mb-3">{breakdown.brandName}</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Photo', value: breakdown.photoPercentage, color: '#3b82f6' },
                          { label: 'Video', value: breakdown.videoPercentage, color: '#ef4444' },
                          { label: 'Carousel', value: breakdown.carouselPercentage, color: '#10b981' },
                          { label: 'Reel', value: breakdown.reelPercentage, color: '#f97316' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className="w-20 text-xs text-gray-500">{item.label}</div>
                            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${item.value}%`,
                                  backgroundColor: item.color,
                                }}
                              />
                            </div>
                            <div className="w-12 text-xs text-right text-gray-500">{item.value.toFixed(0)}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Categorization</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accounts</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eng Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {report.categorization.map((cat) => (
                        <tr key={cat.category} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                backgroundColor: `${CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || '#6b7280'}20`,
                                color: CATEGORY_COLORS[cat.category as keyof typeof CATEGORY_COLORS] || '#6b7280',
                              }}
                            >
                              {cat.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{cat.accountsCount}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatNumber(cat.followersCount)}</td>
                          <td className="px-4 py-3 text-right text-sm">{cat.postsCount}</td>
                          <td className="px-4 py-3 text-right text-sm">{formatNumber(cat.likesCount)}</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-indigo-600">
                            {cat.engagementRate.toFixed(2)}%
                          </td>
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
            <div>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Brands</option>
                  {report.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.brandName}</option>
                  ))}
                </select>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="NANO">Nano (&lt;10K)</option>
                  <option value="MICRO">Micro (10K-100K)</option>
                  <option value="MACRO">Macro (100K-500K)</option>
                  <option value="MEGA">Mega (&gt;500K)</option>
                </select>
              </div>

              {/* Influencers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInfluencers.map((inf) => (
                  <div key={inf.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(inf.influencerName)}&background=random`}
                        alt={inf.influencerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{inf.influencerName}</p>
                        <p className="text-sm text-gray-500">@{inf.influencerUsername}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">{inf.platform}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[inf.category as keyof typeof CATEGORY_COLORS] || '#6b7280'}20`,
                          color: CATEGORY_COLORS[inf.category as keyof typeof CATEGORY_COLORS] || '#6b7280',
                        }}
                      >
                        {inf.category}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">{inf.brandName}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{formatNumber(inf.followerCount)}</p>
                        <p className="text-xs text-gray-500">Followers</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{formatNumber(inf.likesCount)}</p>
                        <p className="text-xs text-gray-500">Likes</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-indigo-600">{inf.avgEngagementRate?.toFixed(2) || '0'}%</p>
                        <p className="text-xs text-gray-500">Eng Rate</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-4">
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Brands</option>
                  {report.brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>{brand.brandName}</option>
                  ))}
                </select>
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPosts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div className="relative aspect-square bg-gray-200">
                      <img
                        src={post.thumbnailUrl || 'https://picsum.photos/400/400?random=' + post.id}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover"
                      />
                      {post.isSponsored && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-amber-500 text-white text-xs rounded">
                          Sponsored
                        </span>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                        {post.postType}
                      </span>
                    </div>
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-indigo-600">{post.brandName}</span>
                        <span className="text-xs text-gray-500">• {post.postDate}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {formatNumber(post.likesCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" /> {formatNumber(post.commentsCount)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> {formatNumber(post.viewsCount)}
                        </span>
                        <span className="text-indigo-600 font-medium">
                          {post.engagementRate?.toFixed(2) || '0'}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionAnalysisDetailPage;
