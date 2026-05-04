import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportPolling } from '../../hooks/useReportPolling';
import {
  ArrowLeft, Share2, Download, RefreshCw, Hash, AtSign,
  Users, FileText, Heart, Eye, MessageCircle,
  Calendar, Clock, CheckCircle, AlertCircle, Loader,
  TrendingUp, ChevronDown, Instagram, Youtube, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import { mentionTrackingApi } from '../../services/api';
import { SortableTh } from '../../components/SortableTh';

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

const POSTS_PER_PAGE = 12;

export const MentionTrackingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'posts'>('overview');

  // Header-level sponsored toggle (only when report was NOT created with sponsoredOnly)
  const [headerSponsoredToggle, setHeaderSponsoredToggle] = useState(false);

  type MtOverviewCatSortKey =
    | 'category'
    | 'accounts'
    | 'followers'
    | 'posts'
    | 'likes'
    | 'views'
    | 'comments'
    | 'er';

  // Influencer tab state
  const [infCategoryFilter, setInfCategoryFilter] = useState('ALL');
  const [infSortBy, setInfSortBy] = useState('likes');
  const [infSortOrder, setInfSortOrder] = useState<'asc' | 'desc'>('desc');
  const [overviewCatSort, setOverviewCatSort] = useState<{
    key: MtOverviewCatSortKey;
    dir: 'asc' | 'desc';
  }>({ key: 'category', dir: 'asc' });

  // Posts tab state
  const [postCategoryFilter, setPostCategoryFilter] = useState('ALL');
  const [postSortBy, setPostSortBy] = useState('likes');
  const [postSortOrder, setPostSortOrder] = useState<'asc' | 'desc'>('desc');
  const [postPage, setPostPage] = useState(1);

  const loadReport = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(prev => prev === true ? true : false);
      const [reportData, chartDataResponse] = await Promise.all([
        mentionTrackingApi.getById(id),
        mentionTrackingApi.getChartData(id).catch(() => []),
      ]);
      setReport(reportData);
      setChartData(chartDataResponse);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) loadReport();
  }, [id, loadReport]);

  useReportPolling(report?.status, loadReport);

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

  const handleExportPdf = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!report) return;

    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        Title: report.title,
        Status: report.status,
        DateRangeStart: report.dateRangeStart,
        DateRangeEnd: report.dateRangeEnd,
        Platforms: (report.platforms || []).join(', '),
        Hashtags: (report.hashtags || []).join(', '),
        Usernames: (report.usernames || []).join(', '),
        Keywords: (report.keywords || []).join(', '),
        SponsoredOnly: report.sponsoredOnly,
        TotalInfluencers: report.totalInfluencers,
        TotalPosts: report.totalPosts,
        TotalLikes: report.totalLikes,
        TotalViews: report.totalViews,
        TotalComments: report.totalComments,
        AvgEngagementRate: report.avgEngagementRate,
        EngagementViewsRate: report.engagementViewsRate,
        TotalFollowers: report.totalFollowers,
        CreditsUsed: report.creditsUsed,
        CreatedAt: report.createdAt,
      },
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    if (chartData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(chartData), 'Trend');
    }

    if (report.categorization?.length) {
      const catRows = report.categorization.map((c: any) => ({
        Category: c.category,
        Label: c.label,
        Accounts: c.accountsCount,
        Followers: c.followersCount,
        Posts: c.postsCount,
        Likes: c.likesCount,
        Views: c.viewsCount,
        Comments: c.commentsCount,
        ERPercent: c.engagementRate,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Categorization');
    }

    const infRows = (report.influencers || []).map((inf: any) => ({
      Platform: inf.platform,
      Name: inf.influencerName,
      Username: inf.influencerUsername,
      Category: inf.category,
      Followers: inf.followerCount,
      Posts: inf.postsCount,
      Likes: inf.likesCount,
      Views: inf.viewsCount,
      Comments: inf.commentsCount,
      Credibility: inf.audienceCredibility,
      ERPercent: inf.avgEngagementRate,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infRows), 'Influencers');

    const postRows = (report.posts || []).map((p: any) => ({
      Influencer: p.influencerUsername,
      PostDate: p.postDate,
      Likes: p.likesCount,
      Views: p.viewsCount,
      Comments: p.commentsCount,
      Sponsored: p.isSponsored,
      Description: p.description,
      MatchedHashtags: (p.matchedHashtags || []).join('; '),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postRows), 'Posts');

    const safeTitle = (report.title || 'report').replace(/[/\\?%*:|"<>]/g, '-').slice(0, 80);
    XLSX.writeFile(wb, `mention-tracking-${safeTitle}-${report.id.slice(0, 8)}.xlsx`);
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
      ALL: 'bg-gray-100 text-gray-700',
    };
    return styles[category] || 'bg-gray-100 text-gray-700';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toUpperCase()) {
      case 'INSTAGRAM':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'YOUTUBE':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'TIKTOK':
        return (
          <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-gray-800">T</span>
        );
      default:
        return <span className="w-4 h-4 text-gray-400">?</span>;
    }
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

  // Apply header-level sponsored toggle to ALL data views
  const applyGlobalSponsoredFilter = (posts: any[]) => {
    if (headerSponsoredToggle) return posts.filter((p: any) => p.isSponsored);
    return posts;
  };

  // Build influencer-to-category mapping from the report's posts for filtering
  const influencerCategoryMap = new Map<string, string>();
  report.influencers.forEach((inf: any) => {
    influencerCategoryMap.set(inf.id, inf.category);
  });

  const CATEGORY_TIER_ORDER_MT = ['NANO', 'MICRO', 'MACRO', 'MEGA'];

  const toggleOverviewCatSort = (key: MtOverviewCatSortKey) => {
    setOverviewCatSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'category' ? 'asc' : 'desc' },
    );
  };

  const toggleInfSort = (key: string) => {
    if (infSortBy === key) {
      setInfSortOrder(o => (o === 'desc' ? 'asc' : 'desc'));
    } else {
      setInfSortBy(key);
      setInfSortOrder(['name', 'platform'].includes(key) ? 'asc' : 'desc');
    }
  };

  const sortedCategorization = [...(report.categorization || [])].sort((a: any, b: any) => {
    const m = overviewCatSort.dir === 'asc' ? 1 : -1;
    const k = overviewCatSort.key;
    if (k === 'category') {
      return (
        m *
        (CATEGORY_TIER_ORDER_MT.indexOf(a.category) - CATEGORY_TIER_ORDER_MT.indexOf(b.category))
      );
    }
    if (k === 'accounts') return m * (a.accountsCount - b.accountsCount);
    if (k === 'followers') return m * (a.followersCount - b.followersCount);
    if (k === 'posts') return m * (a.postsCount - b.postsCount);
    if (k === 'likes') return m * (a.likesCount - b.likesCount);
    if (k === 'views') return m * (a.viewsCount - b.viewsCount);
    if (k === 'comments') return m * (a.commentsCount - b.commentsCount);
    if (k === 'er') return m * (a.engagementRate - b.engagementRate);
    return 0;
  });

  // --- Influencer list: filter + sort ---
  const filteredInfluencers = report.influencers
    .filter((inf: any) => infCategoryFilter === 'ALL' || inf.category === infCategoryFilter)
    .sort((a: any, b: any) => {
      const m = infSortOrder === 'desc' ? -1 : 1;
      switch (infSortBy) {
        case 'recent':
          return m * (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
        case 'likes':
          return m * (a.likesCount - b.likesCount);
        case 'followers':
          return m * (a.followerCount - b.followerCount);
        case 'posts':
          return m * (a.postsCount - b.postsCount);
        case 'views':
          return m * (a.viewsCount - b.viewsCount);
        case 'comments':
          return m * (a.commentsCount - b.commentsCount);
        case 'credibility':
          return m * ((a.audienceCredibility || 0) - (b.audienceCredibility || 0));
        case 'engagement':
          return m * ((a.avgEngagementRate || 0) - (b.avgEngagementRate || 0));
        case 'name':
          return m * (a.influencerName || '').localeCompare(b.influencerName || '');
        case 'platform':
          return m * (a.platform || '').localeCompare(b.platform || '');
        default:
          return 0;
      }
    });

  // --- Posts list: filter + sort + pagination ---
  const postsAfterGlobalFilter = applyGlobalSponsoredFilter(report.posts);
  const filteredPosts = postsAfterGlobalFilter
    .filter((post: any) => {
      if (postCategoryFilter === 'ALL') return true;
      const infId = post.influencerId || post.influencer?.id;
      return influencerCategoryMap.get(infId) === postCategoryFilter;
    })
    .sort((a: any, b: any) => {
      const m = postSortOrder === 'desc' ? -1 : 1;
      switch (postSortBy) {
        case 'likes': return m * (a.likesCount - b.likesCount);
        case 'views': return m * (a.viewsCount - b.viewsCount);
        case 'comments': return m * (a.commentsCount - b.commentsCount);
        case 'recent': return m * (new Date(a.postDate || 0).getTime() - new Date(b.postDate || 0).getTime());
        default: return 0;
      }
    });

  const postTotalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (postPage - 1) * POSTS_PER_PAGE,
    postPage * POSTS_PER_PAGE,
  );

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
        <div className="flex gap-2 print:hidden">
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
          <div className="relative group">
            <button type="button" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className="w-3 h-3" />
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
              <button
                type="button"
                onClick={handleExportPdf}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as PDF
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Criteria Tags + Sponsored Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
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

          {/* Sponsored-only toggle: only visible if report was NOT created with sponsoredOnly */}
          {!report.sponsoredOnly && report.status === 'COMPLETED' && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-gray-600">Sponsored Posts Only</span>
              <button
                onClick={() => setHeaderSponsoredToggle(!headerSponsoredToggle)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  headerSponsoredToggle ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    headerSponsoredToggle ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
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

          {/* ===== Overview Tab ===== */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8">
              {/* Posts / Influencers vs Date Chart */}
              {chartData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Posts &amp; Influencers Over Time</h3>
                  <div className="bg-gray-50 rounded-lg p-4" style={{ height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb' }}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="postsCount" name="Posts" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="influencersCount" name="Influencers" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Categorization Table */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Influencer Categorization</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <SortableTh
                          active={overviewCatSort.key === 'category'}
                          direction={overviewCatSort.key === 'category' ? overviewCatSort.dir : 'asc'}
                          onClick={() => toggleOverviewCatSort('category')}
                        >
                          Category
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'accounts'}
                          direction={overviewCatSort.key === 'accounts' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('accounts')}
                        >
                          Accounts
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'followers'}
                          direction={overviewCatSort.key === 'followers' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('followers')}
                        >
                          Followers
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'posts'}
                          direction={overviewCatSort.key === 'posts' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('posts')}
                        >
                          Posts
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'likes'}
                          direction={overviewCatSort.key === 'likes' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('likes')}
                        >
                          Likes
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'views'}
                          direction={overviewCatSort.key === 'views' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('views')}
                        >
                          Views
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'comments'}
                          direction={overviewCatSort.key === 'comments' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('comments')}
                        >
                          Comments
                        </SortableTh>
                        <SortableTh
                          align="right"
                          active={overviewCatSort.key === 'er'}
                          direction={overviewCatSort.key === 'er' ? overviewCatSort.dir : 'desc'}
                          onClick={() => toggleOverviewCatSort('er')}
                        >
                          ER %
                        </SortableTh>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedCategorization.map((cat: any) => (
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

          {/* ===== Influencers Tab ===== */}
          {activeTab === 'influencers' && (
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-4 items-center">
                <select
                  value={infCategoryFilter}
                  onChange={(e) => setInfCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="NANO">Nano (&lt;10K)</option>
                  <option value="MICRO">Micro (10K-100K)</option>
                  <option value="MACRO">Macro (100K-500K)</option>
                  <option value="MEGA">Mega (&gt;500K)</option>
                </select>
                <span className="ml-auto text-sm text-gray-500 self-center">
                  {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableTh
                        active={infSortBy === 'platform'}
                        direction={infSortBy === 'platform' ? infSortOrder : 'asc'}
                        onClick={() => toggleInfSort('platform')}
                      >
                        Platform
                      </SortableTh>
                      <SortableTh
                        active={infSortBy === 'name'}
                        direction={infSortBy === 'name' ? infSortOrder : 'asc'}
                        onClick={() => toggleInfSort('name')}
                      >
                        Influencer
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'followers'}
                        direction={infSortBy === 'followers' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('followers')}
                      >
                        Followers
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'posts'}
                        direction={infSortBy === 'posts' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('posts')}
                      >
                        Posts
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'likes'}
                        direction={infSortBy === 'likes' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('likes')}
                      >
                        Likes
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'views'}
                        direction={infSortBy === 'views' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('views')}
                      >
                        Views
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'comments'}
                        direction={infSortBy === 'comments' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('comments')}
                      >
                        Comments
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'credibility'}
                        direction={infSortBy === 'credibility' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('credibility')}
                      >
                        Credibility
                      </SortableTh>
                      <SortableTh
                        align="right"
                        active={infSortBy === 'engagement'}
                        direction={infSortBy === 'engagement' ? infSortOrder : 'desc'}
                        onClick={() => toggleInfSort('engagement')}
                      >
                        ER %
                      </SortableTh>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInfluencers.map((inf: any) => (
                      <tr key={inf.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            {getPlatformIcon(inf.platform)}
                          </div>
                        </td>
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

          {/* ===== Posts Tab ===== */}
          {activeTab === 'posts' && (
            <div className="p-6">
              <div className="flex flex-wrap gap-4 mb-4">
                <select
                  value={postCategoryFilter}
                  onChange={(e) => { setPostCategoryFilter(e.target.value); setPostPage(1); }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="ALL">All Categories</option>
                  <option value="NANO">Nano (&lt;10K)</option>
                  <option value="MICRO">Micro (10K-100K)</option>
                  <option value="MACRO">Macro (100K-500K)</option>
                  <option value="MEGA">Mega (&gt;500K)</option>
                </select>
                <select
                  value={postSortBy}
                  onChange={(e) => setPostSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="likes">Sort by Likes</option>
                  <option value="views">Sort by Views</option>
                  <option value="comments">Sort by Comments</option>
                  <option value="recent">Sort by Date</option>
                </select>
                <button
                  onClick={() => setPostSortOrder(postSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center gap-1"
                >
                  {postSortOrder === 'desc' ? 'Highest First' : 'Lowest First'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${postSortOrder === 'asc' ? 'rotate-180' : ''}`} />
                </button>
                <span className="ml-auto text-sm text-gray-500 self-center">
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedPosts.map((post: any) => (
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
                        @{post.influencerUsername} &bull; {post.postDate}
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
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

              {/* Pagination */}
              {postTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {(postPage - 1) * POSTS_PER_PAGE + 1} to {Math.min(postPage * POSTS_PER_PAGE, filteredPosts.length)} of {filteredPosts.length} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPostPage(p => Math.max(1, p - 1))}
                      disabled={postPage === 1}
                      className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(postTotalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (postTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (postPage <= 3) {
                        pageNum = i + 1;
                      } else if (postPage >= postTotalPages - 2) {
                        pageNum = postTotalPages - 4 + i;
                      } else {
                        pageNum = postPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPostPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-lg border ${
                            postPage === pageNum
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPostPage(p => Math.min(postTotalPages, p + 1))}
                      disabled={postPage === postTotalPages}
                      className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
