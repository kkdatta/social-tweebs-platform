import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportPolling } from '../../hooks/useReportPolling';
import {
  ArrowLeft, Share2, Download, MoreVertical, Edit3, Trash2, RefreshCw,
  CheckCircle, Clock, AlertCircle, Loader, Eye, Heart, MessageCircle,
  Hash, AtSign, Users, FileText, BarChart3, TrendingUp,
  ExternalLink, Share, Filter, Instagram, UserPlus, ChevronLeft, ChevronRight,
  Image, Video, Layers, Play, X, Mail, FileSpreadsheet
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Area
} from 'recharts';
import * as XLSX from 'xlsx';
import { paidCollaborationApi } from '../../services/api';
import { SortableTh } from '../../components/SortableTh';

interface Report {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  hashtags: string[];
  mentions: string[];
  queryLogic: 'AND' | 'OR';
  dateRangeStart: string;
  dateRangeEnd: string;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
  engagementViewsRate: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  categorizations?: Categorization[];
  influencers?: Influencer[];
  posts?: Post[];
}

interface Categorization {
  category: string;
  accountsCount: number;
  followersCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
}

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  profilePictureUrl?: string;
  platform: string;
  followerCount: number;
  postsCount: number;
  likesCount: number;
  viewsCount: number;
  commentsCount: number;
  sharesCount: number;
  engagementRate: number;
  category: string;
  credibilityScore: number;
}

interface Post {
  id: string;
  postId?: string;
  postUrl?: string;
  postType: string;
  thumbnailUrl?: string;
  caption?: string;
  matchedHashtags?: string[];
  matchedMentions?: string[];
  isSponsored: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate: number;
  postDate: string;
  influencer?: {
    id: string;
    influencerName: string;
    influencerUsername?: string;
    profilePictureUrl?: string;
  };
}

interface ChartDataPoint {
  date: string;
  postsCount: number;
  influencersCount: number;
}

type PcCatSortKey =
  | 'category'
  | 'accounts'
  | 'followers'
  | 'posts'
  | 'likes'
  | 'views'
  | 'comments'
  | 'shares'
  | 'er';

const PC_CATEGORY_TIER_ORDER = ['NANO', 'MICRO', 'MACRO', 'MEGA'];

export const PaidCollaborationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const [report, setReport] = useState<Report | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  // Filters
  const [sponsoredOnly, setSponsoredOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [influencerSort, setInfluencerSort] = useState('likesCount');
  const [influencerSortOrder, setInfluencerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [postSort, setPostSort] = useState('likesCount');
  const [postSortOrder, setPostSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'influencers' | 'posts'>('overview');

  // Pagination
  const ITEMS_PER_PAGE = 12;
  const [influencerPage, setInfluencerPage] = useState(1);
  const [postPage, setPostPage] = useState(1);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [pcCatSort, setPcCatSort] = useState<{ key: PcCatSortKey; dir: 'asc' | 'desc' }>({
    key: 'category',
    dir: 'asc',
  });

  const loadReport = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(prev => prev === true ? true : false);
      const [reportData, chartDataResult] = await Promise.all([
        paidCollaborationApi.getById(id),
        paidCollaborationApi.getChartData(id).catch(() => []),
      ]);
      setReport(reportData);
      setChartData(Array.isArray(chartDataResult) ? chartDataResult : []);
      setNewTitle(reportData.title);
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateTitle = async () => {
    if (!report || !newTitle.trim()) return;
    try {
      await paidCollaborationApi.update(report.id, { title: newTitle.trim() });
      setReport({ ...report, title: newTitle.trim() });
      setEditingTitle(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update title');
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm(`Are you sure you want to delete "${report.title}"?`)) return;
    try {
      await paidCollaborationApi.delete(report.id);
      navigate('/paid-collaboration');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleRetry = async () => {
    if (!report) return;
    if (!confirm('Retry this report? This will cost 1 credit.')) return;
    try {
      await paidCollaborationApi.retry(report.id);
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry report');
    }
  };

  const handleShare = async () => {
    try {
      const result = await paidCollaborationApi.share(id!, {});
      if (result.shareUrl) {
        navigator.clipboard.writeText(window.location.origin + result.shareUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate share URL');
    }
    setShowMenu(false);
  };

  const handleExportPdf = () => {
    setShowMenu(false);
    window.print();
  };

  const handleExportExcel = () => {
    if (!report) return;
    setShowMenu(false);

    const wb = XLSX.utils.book_new();

    const summaryRows = [
      {
        Title: report.title,
        Platform: report.platform,
        Status: report.status,
        'Date range start': report.dateRangeStart,
        'Date range end': report.dateRangeEnd,
        Hashtags: (report.hashtags || []).join(', '),
        Mentions: (report.mentions || []).join(', '),
        'Query logic': report.queryLogic,
        'Total influencers': report.totalInfluencers,
        'Total posts': report.totalPosts,
        'Total likes': report.totalLikes,
        'Total views': report.totalViews,
        'Total comments': report.totalComments,
        'Total shares': report.totalShares,
        'Avg engagement rate': report.avgEngagementRate,
        'Engagement / views rate': report.engagementViewsRate,
        'Created at': report.createdAt,
        'Completed at': report.completedAt ?? '',
      },
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Summary');

    if (report.categorizations?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(report.categorizations), 'Categories');
    }

    if (report.influencers?.length) {
      const infRows = report.influencers.map((i) => ({
        Name: i.influencerName,
        Username: i.influencerUsername ?? '',
        Platform: i.platform,
        Category: i.category,
        Followers: i.followerCount,
        Posts: i.postsCount,
        Likes: i.likesCount,
        Views: i.viewsCount,
        Comments: i.commentsCount,
        Shares: i.sharesCount,
        'Engagement rate': i.engagementRate,
        'Credibility score': i.credibilityScore,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infRows), 'Influencers');
    }

    if (report.posts?.length) {
      const postRows = report.posts.map((p) => ({
        'Post ID': p.postId ?? '',
        'Post URL': p.postUrl ?? '',
        Type: p.postType,
        Sponsored: p.isSponsored,
        Caption: p.caption ?? '',
        Likes: p.likesCount,
        Views: p.viewsCount,
        Comments: p.commentsCount,
        Shares: p.sharesCount,
        'Engagement rate': p.engagementRate,
        'Post date': p.postDate,
        'Influencer name': p.influencer?.influencerName ?? '',
        'Influencer username': p.influencer?.influencerUsername ?? '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postRows), 'Posts');
    }

    const safeName = (report.title || 'report').replace(/[^\w\-]+/g, '_').slice(0, 80);
    XLSX.writeFile(wb, `paid-collaboration-${safeName}.xlsx`);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      IN_PROGRESS: <Loader className="w-4 h-4 animate-spin" />,
      PENDING: <Clock className="w-4 h-4" />,
      FAILED: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ALL: 'bg-gray-100 text-gray-800',
      NANO: 'bg-green-100 text-green-800',
      MICRO: 'bg-blue-100 text-blue-800',
      MACRO: 'bg-purple-100 text-purple-800',
      MEGA: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toUpperCase()) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'TIKTOK':
        return <div className="w-5 h-5 text-black font-bold text-xs flex items-center justify-center rounded bg-gray-100">TT</div>;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPostTypeBadge = (type?: string) => {
    const config: Record<string, { icon: any; label: string; color: string }> = {
      IMAGE: { icon: <Image className="w-3 h-3" />, label: 'Image', color: 'bg-blue-100 text-blue-700' },
      VIDEO: { icon: <Video className="w-3 h-3" />, label: 'Video', color: 'bg-red-100 text-red-700' },
      REEL: { icon: <Play className="w-3 h-3" />, label: 'Reel', color: 'bg-purple-100 text-purple-700' },
      CAROUSEL: { icon: <Layers className="w-3 h-3" />, label: 'Carousel', color: 'bg-amber-100 text-amber-700' },
    };
    const cfg = config[type?.toUpperCase() || ''] || config.IMAGE;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await paidCollaborationApi.share(id!, { sharedWithEmail: inviteEmail.trim() });
      setShowInviteModal(false);
      setInviteEmail('');
      alert('Team member invited successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to invite team member');
    }
  };

  const allFilteredInfluencers = report?.influencers
    ?.filter(inf => selectedCategory === 'ALL' || inf.category === selectedCategory)
    .sort((a, b) => {
      if (influencerSort === 'createdAt') {
        return influencerSortOrder === 'desc' ? -1 : 1;
      }
      const aVal = (a as any)[influencerSort] || 0;
      const bVal = (b as any)[influencerSort] || 0;
      return influencerSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }) || [];

  const influencerTotalPages = Math.ceil(allFilteredInfluencers.length / ITEMS_PER_PAGE);
  const paginatedInfluencers = allFilteredInfluencers.slice(
    (influencerPage - 1) * ITEMS_PER_PAGE,
    influencerPage * ITEMS_PER_PAGE,
  );

  const allFilteredPosts = report?.posts
    ?.filter(post => {
      if (sponsoredOnly && !post.isSponsored) return false;
      if (selectedCategory !== 'ALL') {
        const influencer = report?.influencers?.find(i => i.id === post.influencer?.id);
        if (influencer && influencer.category !== selectedCategory) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (postSort === 'postDate') {
        const aDate = new Date(a.postDate || 0).getTime();
        const bDate = new Date(b.postDate || 0).getTime();
        return postSortOrder === 'desc' ? bDate - aDate : aDate - bDate;
      }
      const aVal = (a as any)[postSort] || 0;
      const bVal = (b as any)[postSort] || 0;
      return postSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }) || [];

  const postTotalPages = Math.ceil(allFilteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = allFilteredPosts.slice(
    (postPage - 1) * ITEMS_PER_PAGE,
    postPage * ITEMS_PER_PAGE,
  );

  const togglePcCatSort = (key: PcCatSortKey) => {
    setPcCatSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'category' ? 'asc' : 'desc' },
    );
  };

  const sortedPcCategorizations = [...(report?.categorizations || [])].sort((a, b) => {
    const m = pcCatSort.dir === 'asc' ? 1 : -1;
    const k = pcCatSort.key;
    if (k === 'category') {
      return (
        m * (PC_CATEGORY_TIER_ORDER.indexOf(a.category) - PC_CATEGORY_TIER_ORDER.indexOf(b.category))
      );
    }
    if (k === 'accounts') return m * (a.accountsCount - b.accountsCount);
    if (k === 'followers') return m * (a.followersCount - b.followersCount);
    if (k === 'posts') return m * (a.postsCount - b.postsCount);
    if (k === 'likes') return m * (a.likesCount - b.likesCount);
    if (k === 'views') return m * (a.viewsCount - b.viewsCount);
    if (k === 'comments') return m * (a.commentsCount - b.commentsCount);
    if (k === 'shares') return m * (a.sharesCount - b.sharesCount);
    if (k === 'er') return m * (a.engagementRate - b.engagementRate);
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500">
        <FileText className="w-16 h-16 mb-4 text-gray-300" />
        <p className="text-xl">Report not found</p>
        <button
          onClick={() => navigate('/paid-collaboration')}
          className="mt-4 text-purple-600 hover:text-purple-700"
        >
          Back to reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/paid-collaboration')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-purple-500 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                />
                <button onClick={handleUpdateTitle} className="text-green-600 hover:text-green-700">
                  <CheckCircle className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <button
                  onClick={() => setEditingTitle(true)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(report.status)}
              <span className="text-gray-500">
                {formatDate(report.dateRangeStart)} - {formatDate(report.dateRangeEnd)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {report.hashtags?.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  <Hash className="w-3 h-3 mr-1" />
                  {tag.replace('#', '')}
                </span>
              ))}
              {report.mentions?.map((mention, idx) => (
                <span key={idx} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                  <AtSign className="w-3 h-3 mr-1" />
                  {mention.replace('@', '')}
                </span>
              ))}
              {report.hashtags?.length > 0 && report.mentions?.length > 0 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                  Logic: {report.queryLogic}
                </span>
              )}
            </div>
            {report.status === 'COMPLETED' && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sponsoredOnly ? 'bg-purple-600' : 'bg-gray-200'}`}>
                  <input
                    type="checkbox"
                    checked={sponsoredOnly}
                    onChange={(e) => setSponsoredOnly(e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sponsoredOnly ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-sm text-gray-700 font-medium">Show Sponsored Posts Only</span>
              </label>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleShare}
            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Excel
                </button>
                <button
                  onClick={() => { setShowMenu(false); setShowInviteModal(true); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Team Member
                </button>
                {report.status === 'FAILED' && (
                  <button
                    onClick={() => { setShowMenu(false); handleRetry(); }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry Report
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={() => { setShowMenu(false); handleDelete(); }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message for Failed Reports */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Report Failed</p>
            <p className="text-red-600 text-sm">{report.errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm text-red-700 hover:text-red-800 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Retry (1 credit)
            </button>
          </div>
        </div>
      )}

      {/* Empty result state */}
      {report.status === 'COMPLETED' && report.totalInfluencers === 0 && report.totalPosts === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Collaborations Found</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            No paid collaboration posts were found for the given hashtags/mentions in the selected date range.
            Try broadening your date range or adjusting the search terms.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      {report.status === 'COMPLETED' && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Influencers</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalInfluencers)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Posts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatNumber(report.totalPosts)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Likes</span>
            </div>
            <div className="text-2xl font-bold text-pink-600">{formatNumber(report.totalLikes)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(report.totalViews)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Comments</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatNumber(report.totalComments)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Share className="w-4 h-4" />
              <span className="text-xs">Shares</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{formatNumber(report.totalShares)}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Avg ER</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{(report.avgEngagementRate || 0).toFixed(2)}%</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">ER/Views</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{(report.engagementViewsRate || 0).toFixed(2)}%</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {report.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex gap-4 px-4" aria-label="Tabs">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'influencers', label: `Influencers (${report.totalInfluencers})` },
                { id: 'posts', label: `Posts (${report.totalPosts})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Posts & Influencers Chart */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts & Influencers Over Time</h3>
                  {chartData.length > 0 ? (
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis 
                            yAxisId="left" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}K` : value}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                              weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                            formatter={(value: number, name: string) => [
                              value >= 1000 ? `${(value/1000).toFixed(1)}K` : value,
                              name === 'postsCount' ? 'Posts' : 
                              name === 'influencersCount' ? 'Influencers' : 
                              name === 'likesCount' ? 'Likes' : 'Views'
                            ]}
                          />
                          <Legend />
                          <Area 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="viewsCount" 
                            fill="#dbeafe" 
                            stroke="#3b82f6" 
                            fillOpacity={0.3}
                            name="Views"
                          />
                          <Bar 
                            yAxisId="right"
                            dataKey="postsCount" 
                            fill="#8b5cf6" 
                            name="Posts" 
                            radius={[4, 4, 0, 0]}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="influencersCount" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            dot={{ fill: '#10b981', strokeWidth: 2 }}
                            name="Influencers"
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="likesCount" 
                            stroke="#f43f5e" 
                            strokeWidth={2}
                            dot={{ fill: '#f43f5e', strokeWidth: 2 }}
                            name="Likes"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                        <p>No chart data available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categorization Table */}
                {report.categorizations && report.categorizations.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Categorization</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <SortableTh
                              active={pcCatSort.key === 'category'}
                              direction={pcCatSort.key === 'category' ? pcCatSort.dir : 'asc'}
                              onClick={() => togglePcCatSort('category')}
                            >
                              Category
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'accounts'}
                              direction={pcCatSort.key === 'accounts' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('accounts')}
                            >
                              Accounts
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'followers'}
                              direction={pcCatSort.key === 'followers' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('followers')}
                            >
                              Followers
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'posts'}
                              direction={pcCatSort.key === 'posts' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('posts')}
                            >
                              Posts
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'likes'}
                              direction={pcCatSort.key === 'likes' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('likes')}
                            >
                              Likes
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'views'}
                              direction={pcCatSort.key === 'views' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('views')}
                            >
                              Views
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'comments'}
                              direction={pcCatSort.key === 'comments' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('comments')}
                            >
                              Comments
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'shares'}
                              direction={pcCatSort.key === 'shares' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('shares')}
                            >
                              Shares
                            </SortableTh>
                            <SortableTh
                              align="right"
                              active={pcCatSort.key === 'er'}
                              direction={pcCatSort.key === 'er' ? pcCatSort.dir : 'desc'}
                              onClick={() => togglePcCatSort('er')}
                            >
                              Avg ER
                            </SortableTh>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {sortedPcCategorizations.map((cat) => (
                            <tr key={cat.category} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cat.category)}`}>
                                  {cat.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.accountsCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.followersCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.postsCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.likesCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.viewsCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.commentsCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-gray-900">{formatNumber(cat.sharesCount)}</td>
                              <td className="px-4 py-3 text-right text-sm text-emerald-600 font-medium">
                                {(cat.engagementRate || 0).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Influencers Tab */}
            {activeTab === 'influencers' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Filter:</span>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setInfluencerPage(1); }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="NANO">Nano (&lt;10K)</option>
                    <option value="MICRO">Micro (10K-100K)</option>
                    <option value="MACRO">Macro (100K-500K)</option>
                    <option value="MEGA">Mega (&gt;500K)</option>
                  </select>
                  <select
                    value={`${influencerSort}-${influencerSortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setInfluencerSort(sort);
                      setInfluencerSortOrder(order as 'asc' | 'desc');
                      setInfluencerPage(1);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="likesCount-desc">Most Liked</option>
                    <option value="likesCount-asc">Least Liked</option>
                    <option value="commentsCount-desc">Most Commented</option>
                    <option value="commentsCount-asc">Least Commented</option>
                    <option value="followerCount-desc">Highest Followers</option>
                    <option value="followerCount-asc">Lowest Followers</option>
                    <option value="credibilityScore-desc">Highest Credibility</option>
                    <option value="credibilityScore-asc">Lowest Credibility</option>
                    <option value="createdAt-desc">Recent</option>
                    <option value="createdAt-asc">Oldest</option>
                  </select>
                </div>

                {/* Influencers Count */}
                <div className="text-sm text-gray-500">
                  Showing {paginatedInfluencers.length} of {allFilteredInfluencers.length} influencers
                </div>

                {/* Influencers List */}
                <div className="grid gap-4">
                  {paginatedInfluencers.map((influencer) => (
                    <div key={influencer.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        {getPlatformIcon(influencer.platform)}
                        <img
                          src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.influencerName}`}
                          alt={influencer.influencerName}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{influencer.influencerName}</span>
                          {influencer.influencerUsername && (
                            <span className="text-gray-500 text-sm">@{influencer.influencerUsername}</span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs ${getCategoryColor(influencer.category)}`}>
                            {influencer.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-600">
                          <span>{formatNumber(influencer.followerCount)} followers</span>
                          <span>{influencer.postsCount} posts</span>
                          <span className="text-emerald-600">{(influencer.engagementRate || 0).toFixed(2)}% ER</span>
                          <span className="text-purple-600">{(influencer.credibilityScore || 0).toFixed(0)}% credibility</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-pink-600 font-semibold">{formatNumber(influencer.likesCount)}</div>
                          <div className="text-gray-400 text-xs">Likes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-blue-600 font-semibold">{formatNumber(influencer.viewsCount)}</div>
                          <div className="text-gray-400 text-xs">Views</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-600 font-semibold">{formatNumber(influencer.commentsCount)}</div>
                          <div className="text-gray-400 text-xs">Comments</div>
                        </div>
                        <div className="text-center">
                          <div className="text-purple-600 font-semibold">{formatNumber(influencer.sharesCount)}</div>
                          <div className="text-gray-400 text-xs">Shares</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Influencer Pagination */}
                {influencerTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Page {influencerPage} of {influencerTotalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setInfluencerPage(p => Math.max(1, p - 1))}
                        disabled={influencerPage === 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, influencerTotalPages) }, (_, i) => {
                        let pageNum: number;
                        if (influencerTotalPages <= 5) {
                          pageNum = i + 1;
                        } else if (influencerPage <= 3) {
                          pageNum = i + 1;
                        } else if (influencerPage >= influencerTotalPages - 2) {
                          pageNum = influencerTotalPages - 4 + i;
                        } else {
                          pageNum = influencerPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setInfluencerPage(pageNum)}
                            className={`w-8 h-8 rounded-lg text-sm font-medium ${
                              influencerPage === pageNum
                                ? 'bg-purple-600 text-white'
                                : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setInfluencerPage(p => Math.min(influencerTotalPages, p + 1))}
                        disabled={influencerPage === influencerTotalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Filter:</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sponsoredOnly}
                      onChange={(e) => { setSponsoredOnly(e.target.checked); setPostPage(1); }}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Sponsored Only</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); setPostPage(1); }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="NANO">Nano (&lt;10K)</option>
                    <option value="MICRO">Micro (10K-100K)</option>
                    <option value="MACRO">Macro (100K-500K)</option>
                    <option value="MEGA">Mega (&gt;500K)</option>
                  </select>
                  <select
                    value={`${postSort}-${postSortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setPostSort(sort);
                      setPostSortOrder(order as 'asc' | 'desc');
                      setPostPage(1);
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="likesCount-desc">Most Liked</option>
                    <option value="likesCount-asc">Least Liked</option>
                    <option value="commentsCount-desc">Most Commented</option>
                    <option value="commentsCount-asc">Least Commented</option>
                    <option value="viewsCount-desc">Most Viewed</option>
                    <option value="viewsCount-asc">Least Viewed</option>
                    <option value="sharesCount-desc">Most Shared</option>
                    <option value="sharesCount-asc">Least Shared</option>
                    <option value="engagementRate-desc">Highest Engagement</option>
                    <option value="engagementRate-asc">Lowest Engagement</option>
                    <option value="postDate-desc">Newest</option>
                    <option value="postDate-asc">Oldest</option>
                  </select>
                </div>

                {/* Post Count */}
                <div className="text-sm text-gray-500">
                  Showing {paginatedPosts.length} of {allFilteredPosts.length} posts
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                      {post.thumbnailUrl && (
                        <div className="relative aspect-square bg-gray-200">
                          <img
                            src={post.thumbnailUrl}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                            {post.isSponsored && (
                              <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full font-medium">
                                Sponsored
                              </span>
                            )}
                            {getPostTypeBadge(post.postType)}
                          </div>
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            {getPlatformIcon(report.platform)}
                            {post.postUrl && (
                              <a
                                href={post.postUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-white/90 rounded-full hover:bg-white"
                              >
                                <ExternalLink className="w-4 h-4 text-gray-700" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        {post.influencer && (
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={post.influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${post.influencer.influencerName}`}
                              alt={post.influencer.influencerName}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">{post.influencer.influencerName}</div>
                              {post.influencer.influencerUsername && (
                                <div className="text-xs text-gray-500 truncate">@{post.influencer.influencerUsername}</div>
                              )}
                            </div>
                          </div>
                        )}
                        {post.caption && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.caption}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {post.matchedHashtags?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="text-xs text-blue-600">#{tag.replace('#', '')}</span>
                          ))}
                          {post.matchedMentions?.slice(0, 2).map((m, idx) => (
                            <span key={idx} className="text-xs text-purple-600">@{m.replace('@', '')}</span>
                          ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Heart className="w-3.5 h-3.5 text-pink-500" />
                            </div>
                            <div className="text-xs font-semibold text-gray-800">{formatNumber(post.likesCount)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                            </div>
                            <div className="text-xs font-semibold text-gray-800">{formatNumber(post.commentsCount)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                            </div>
                            <div className="text-xs font-semibold text-gray-800">{formatNumber(post.viewsCount)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center justify-center">
                              <Share className="w-3.5 h-3.5 text-purple-500" />
                            </div>
                            <div className="text-xs font-semibold text-gray-800">{formatNumber(post.sharesCount)}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span className="text-emerald-600 font-medium">{(post.engagementRate || 0).toFixed(2)}% ER</span>
                          <span>{formatDate(post.postDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Posts Pagination */}
                {postTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Page {postPage} of {postTotalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPostPage(p => Math.max(1, p - 1))}
                        disabled={postPage === 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: Math.min(5, postTotalPages) }, (_, i) => {
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
                            className={`w-8 h-8 rounded-lg text-sm font-medium ${
                              postPage === pageNum
                                ? 'bg-purple-600 text-white'
                                : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setPostPage(p => Math.min(postTotalPages, p + 1))}
                        disabled={postPage === postTotalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading/Pending State */}
      {(report.status === 'PENDING' || report.status === 'IN_PROGRESS') && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
          </h3>
          <p className="text-gray-600">
            {report.status === 'PENDING'
              ? 'Your report is in the queue and will start processing shortly.'
              : 'Analyzing posts and influencers. This may take a few minutes...'}
          </p>
        </div>
      )}

      {/* Invite Team Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter the email address of a registered SocialTweebs user to share this report with them.
            </p>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="team.member@company.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail(''); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
