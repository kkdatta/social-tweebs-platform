import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Repeat,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate?: number;
  isSponsored: boolean;
  postDate?: string;
  influencerId?: string;
  influencerName?: string;
  influencerUsername?: string;
  influencerFollowerCount?: number;
  influencerCredibility?: number;
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

interface TimelinePoint {
  date: string;
  brands: Record<string, number>;
  total: number;
}

interface BrandShare {
  brandName: string;
  value: number;
  color: string;
}

interface EnhancedChartData {
  postsOverTime: TimelinePoint[];
  influencersOverTime: TimelinePoint[];
  postsShare: BrandShare[];
  influencersShare: BrandShare[];
  engagementShare: BrandShare[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  NANO: '#22c55e',
  MICRO: '#3b82f6',
  MACRO: '#a855f7',
  MEGA: '#f97316',
};

const CATEGORY_LABELS: Record<string, string> = {
  NANO: 'Nano (<10K)',
  MICRO: 'Micro (10K-100K)',
  MACRO: 'Macro (100K-500K)',
  MEGA: 'Mega (>500K)',
};

const POST_TYPE_COLORS: Record<string, string> = {
  PHOTO: '#3b82f6',
  VIDEO: '#ef4444',
  CAROUSEL: '#10b981',
  REEL: '#f97316',
};

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recent', order: 'desc' as const },
  { value: 'recent', label: 'Oldest', order: 'asc' as const },
  { value: 'likes', label: 'Most Liked', order: 'desc' as const },
  { value: 'likes', label: 'Least Liked', order: 'asc' as const },
  { value: 'comments', label: 'Most Commented', order: 'desc' as const },
  { value: 'comments', label: 'Least Commented', order: 'asc' as const },
  { value: 'credibility', label: 'Highest Credibility', order: 'desc' as const },
  { value: 'credibility', label: 'Lowest Credibility', order: 'asc' as const },
  { value: 'followers', label: 'Highest Followers', order: 'desc' as const },
  { value: 'followers', label: 'Lowest Followers', order: 'asc' as const },
];

const API_PREFIX = '/api/v1/competition-analysis';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getStatusBadge(status: string) {
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
}

function getPlatformIcon(platform: string) {
  if (platform === 'INSTAGRAM') return '📷';
  if (platform === 'TIKTOK') return '🎵';
  return '🌐';
}

// ─── Download Helpers ────────────────────────────────────────────────────────

function downloadAsPdf(report: ReportDetail) {
  const doc = new jsPDF({ orientation: 'landscape' });

  doc.setFontSize(18);
  doc.text(report.title, 14, 20);
  doc.setFontSize(10);
  doc.text(`Date Range: ${report.dateRangeStart} - ${report.dateRangeEnd}`, 14, 28);
  doc.text(`Status: ${report.status} | Generated: ${new Date().toLocaleDateString()}`, 14, 34);

  // Summary
  doc.setFontSize(14);
  doc.text('Report Summary', 14, 46);
  autoTable(doc, {
    startY: 50,
    head: [['Brands', 'Influencers', 'Posts', 'Likes', 'Views', 'Comments', 'Shares', 'Avg ER']],
    body: [[
      report.totalBrands,
      report.totalInfluencers,
      report.totalPosts,
      formatNumber(report.totalLikes),
      formatNumber(report.totalViews),
      formatNumber(report.totalComments),
      formatNumber(report.totalShares),
      `${report.avgEngagementRate?.toFixed(2) || '0'}%`,
    ]],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Brand Overview
  const brandY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Brand Overview', 14, brandY);
  autoTable(doc, {
    startY: brandY + 4,
    head: [['Brand', 'Hashtags', 'Mentions', 'Keywords', 'Influencers', 'Posts', 'Likes', 'Views', 'Eng Rate']],
    body: report.brands.map(b => [
      b.brandName,
      b.hashtags?.join(', ') || '-',
      b.username || '-',
      b.keywords?.join(', ') || '-',
      b.influencerCount,
      b.postsCount,
      formatNumber(b.totalLikes),
      formatNumber(b.totalViews),
      `${b.avgEngagementRate?.toFixed(2) || '0'}%`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Influencer & Post Count
  const ipcY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Influencer & Post Count', 14, ipcY);
  autoTable(doc, {
    startY: ipcY + 4,
    head: [['Data', ...report.brands.map(b => b.brandName)]],
    body: [
      ['Influencers', ...report.brands.map(b => b.influencerCount.toString())],
      ['Posts', ...report.brands.map(b => b.postsCount.toString())],
    ],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Category Breakdown
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Influencer Category Breakdown', 14, 20);
  const categories = ['NANO', 'MICRO', 'MACRO', 'MEGA'] as const;
  autoTable(doc, {
    startY: 24,
    head: [['Category', ...report.brands.map(b => b.brandName)]],
    body: categories.map(cat => [
      CATEGORY_LABELS[cat],
      ...report.brands.map(b => {
        const key = `${cat.toLowerCase()}Count` as keyof Brand;
        return (b[key] as number || 0).toString();
      }),
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Post Type Breakdown
  const ptY = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(14);
  doc.text('Post Type Breakdown', 14, ptY);
  autoTable(doc, {
    startY: ptY + 4,
    head: [['Brand', 'Photo', 'Video', 'Carousel', 'Reel']],
    body: report.postTypeBreakdown.map(b => [
      b.brandName,
      `${b.photoCount} (${b.photoPercentage.toFixed(0)}%)`,
      `${b.videoCount} (${b.videoPercentage.toFixed(0)}%)`,
      `${b.carouselCount} (${b.carouselPercentage.toFixed(0)}%)`,
      `${b.reelCount} (${b.reelPercentage.toFixed(0)}%)`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
  });

  // Posts Data
  doc.addPage();
  doc.setFontSize(14);
  doc.text('All Brand Posts', 14, 20);
  autoTable(doc, {
    startY: 24,
    head: [['Platform', 'Influencer', 'Followers', 'Likes', 'Comments', 'Shares', 'Views', 'Credibility', 'Type']],
    body: report.posts.map(p => [
      p.platform,
      p.influencerName || '-',
      formatNumber(p.influencerFollowerCount || 0),
      formatNumber(p.likesCount),
      formatNumber(p.commentsCount),
      formatNumber(p.sharesCount),
      formatNumber(p.viewsCount),
      p.influencerCredibility ? `${p.influencerCredibility.toFixed(0)}%` : '-',
      p.postType || '-',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
  });

  doc.save(`${report.title.replace(/\s+/g, '_')}_report.pdf`);
}

function downloadAsXlsx(report: ReportDetail) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['Report Title', report.title],
    ['Date Range', `${report.dateRangeStart} - ${report.dateRangeEnd}`],
    ['Status', report.status],
    ['Total Brands', report.totalBrands],
    ['Total Influencers', report.totalInfluencers],
    ['Total Posts', report.totalPosts],
    ['Total Likes', report.totalLikes],
    ['Total Views', report.totalViews],
    ['Total Comments', report.totalComments],
    ['Total Shares', report.totalShares],
    ['Avg Engagement Rate', `${report.avgEngagementRate?.toFixed(2) || '0'}%`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Brand Overview sheet
  const brandHeader = ['Brand', 'Hashtags', 'Mentions', 'Keywords', 'Influencers', 'Posts', 'Likes', 'Views', 'Comments', 'Shares', 'Followers', 'Eng Rate'];
  const brandRows = report.brands.map(b => [
    b.brandName,
    b.hashtags?.join(', ') || '',
    b.username || '',
    b.keywords?.join(', ') || '',
    b.influencerCount,
    b.postsCount,
    b.totalLikes,
    b.totalViews,
    b.totalComments,
    b.totalShares,
    b.totalFollowers,
    b.avgEngagementRate?.toFixed(2) || '0',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([brandHeader, ...brandRows]), 'Brand Overview');

  // Influencer & Post Count sheet
  const ipcHeader = ['Data', ...report.brands.map(b => b.brandName)];
  const ipcRows = [
    ['Influencers', ...report.brands.map(b => b.influencerCount)],
    ['Posts', ...report.brands.map(b => b.postsCount)],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([ipcHeader, ...ipcRows]), 'Influencer & Post Count');

  // Category Breakdown sheet
  const catHeader = ['Category', ...report.brands.map(b => b.brandName)];
  const catRows = (['NANO', 'MICRO', 'MACRO', 'MEGA'] as const).map(cat => [
    CATEGORY_LABELS[cat],
    ...report.brands.map(b => {
      const key = `${cat.toLowerCase()}Count` as keyof Brand;
      return b[key] as number || 0;
    }),
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([catHeader, ...catRows]), 'Category Breakdown');

  // Post Type Breakdown sheet
  const ptHeader = ['Brand', 'Photo', 'Video', 'Carousel', 'Reel'];
  const ptRows = report.postTypeBreakdown.map(b => [
    b.brandName, b.photoCount, b.videoCount, b.carouselCount, b.reelCount,
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([ptHeader, ...ptRows]), 'Post Type Breakdown');

  // Posts sheet
  const postsHeader = ['Platform', 'Influencer', 'Username', 'Followers', 'Likes', 'Comments', 'Shares', 'Views', 'Credibility %', 'Post Type', 'Brand', 'Date'];
  const postsRows = report.posts.map(p => [
    p.platform,
    p.influencerName || '',
    p.influencerUsername || '',
    p.influencerFollowerCount || 0,
    p.likesCount,
    p.commentsCount,
    p.sharesCount,
    p.viewsCount,
    p.influencerCredibility || '',
    p.postType || '',
    p.brandName,
    p.postDate || '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([postsHeader, ...postsRows]), 'All Posts');

  // Influencers sheet
  const infHeader = ['Name', 'Username', 'Platform', 'Brand', 'Category', 'Followers', 'Posts', 'Likes', 'Views', 'Comments', 'Shares', 'Credibility %', 'Eng Rate'];
  const infRows = report.influencers.map(i => [
    i.influencerName,
    i.influencerUsername || '',
    i.platform,
    i.brandName,
    i.category || '',
    i.followerCount,
    i.postsCount,
    i.likesCount,
    i.viewsCount,
    i.commentsCount,
    i.sharesCount,
    i.audienceCredibility || '',
    i.avgEngagementRate?.toFixed(2) || '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([infHeader, ...infRows]), 'Influencers');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${report.title.replace(/\s+/g, '_')}_report.xlsx`);
}

// ─── Custom Tooltip for Pie Charts ──────────────────────────────────────────

const PieTooltip: React.FC<any> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const total = d.payload.total as number;
  const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium">{d.name}</p>
      <p className="text-gray-600">{formatNumber(d.value)} ({pct}%)</p>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const CompetitionAnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [chartData, setChartData] = useState<EnhancedChartData | null>(null);
  const [paginatedPosts, setPaginatedPosts] = useState<Post[]>([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Post table state
  const [postPage, setPostPage] = useState(1);
  const [postSortIdx, setPostSortIdx] = useState(0);
  const [postCategoryFilter, setPostCategoryFilter] = useState('ALL');
  const [postBrandFilter, setPostBrandFilter] = useState('');

  // Category breakdown tab state
  const [categoryTab, setCategoryTab] = useState<string>('influencers');

  const postsPerPage = 20;

  // ─── Data Fetching ───────────────────────────────────────────────────────

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_PREFIX}/${id}`);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchChartData = useCallback(async () => {
    try {
      const res = await api.get(`${API_PREFIX}/${id}/enhanced-charts`);
      setChartData(res.data);
    } catch {
      // Fall back to old endpoint
      try {
        const res = await api.get(`${API_PREFIX}/${id}/chart-data`);
        const old = res.data as Array<{ date: string; brandPosts: Record<string, number>; totalPosts: number }>;
        setChartData({
          postsOverTime: old.map(d => ({ date: d.date, brands: d.brandPosts, total: d.totalPosts })),
          influencersOverTime: [],
          postsShare: [],
          influencersShare: [],
          engagementShare: [],
        });
      } catch {
        // ignore
      }
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
    if (!id) return;
    try {
      const sort = SORT_OPTIONS[postSortIdx];
      const params = new URLSearchParams({
        page: postPage.toString(),
        limit: postsPerPage.toString(),
        sortBy: sort.value,
        sortOrder: sort.order,
      });
      if (postBrandFilter) params.append('brandId', postBrandFilter);
      if (postCategoryFilter !== 'ALL') params.append('category', postCategoryFilter);

      const res = await api.get(`${API_PREFIX}/${id}/posts?${params}`);
      setPaginatedPosts(res.data.posts || []);
      setPostsTotal(res.data.total || 0);
    } catch {
      // ignore
    }
  }, [id, postPage, postSortIdx, postCategoryFilter, postBrandFilter]);

  useEffect(() => {
    if (id) {
      fetchReport();
      fetchChartData();
    }
  }, [id, fetchReport, fetchChartData]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const handleRetry = async () => {
    try {
      await api.post(`${API_PREFIX}/${id}/retry`);
      fetchReport();
    } catch (err) {
      console.error('Retry failed:', err);
    }
  };

  const handleShare = async () => {
    try {
      const res = await api.post(`${API_PREFIX}/${id}/share`, {});
      if (res.data.shareUrl) {
        navigator.clipboard.writeText(res.data.shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  // ─── Computed Data ───────────────────────────────────────────────────────

  // Per-brand category breakdown (computed from influencers)
  const brandCategoryData = useMemo(() => {
    if (!report) return [];
    const categories = ['NANO', 'MICRO', 'MACRO', 'MEGA'] as const;
    type MetricKey = 'count' | 'posts' | 'followers' | 'likes' | 'views' | 'comments' | 'shares' | 'engagement';

    const result: Array<{
      category: string;
      label: string;
      brands: Array<{
        brandId: string;
        brandName: string;
        color: string;
        count: number;
        posts: number;
        followers: number;
        likes: number;
        views: number;
        comments: number;
        shares: number;
        engagement: number;
      }>;
    }> = [];

    for (const cat of categories) {
      const row = {
        category: cat,
        label: CATEGORY_LABELS[cat],
        brands: report.brands.map(brand => {
          const brandInfluencers = report.influencers.filter(
            i => i.brandId === brand.id && i.category === cat,
          );
          const count = brandInfluencers.length;
          const posts = brandInfluencers.reduce((s, i) => s + i.postsCount, 0);
          const followers = brandInfluencers.reduce((s, i) => s + Number(i.followerCount), 0);
          const likes = brandInfluencers.reduce((s, i) => s + Number(i.likesCount), 0);
          const views = brandInfluencers.reduce((s, i) => s + Number(i.viewsCount), 0);
          const comments = brandInfluencers.reduce((s, i) => s + Number(i.commentsCount), 0);
          const shares = brandInfluencers.reduce((s, i) => s + Number(i.sharesCount), 0);
          const avgER = count > 0
            ? brandInfluencers.reduce((s, i) => s + (Number(i.avgEngagementRate) || 0), 0) / count
            : 0;

          return {
            brandId: brand.id,
            brandName: brand.brandName,
            color: brand.displayColor || '#6b7280',
            count,
            posts,
            followers,
            likes,
            views,
            comments,
            shares,
            engagement: Number(avgER.toFixed(2)),
          };
        }),
      };
      result.push(row);
    }
    return result;
  }, [report]);

  const categoryTabKey = categoryTab as string;
  const categoryMetricMap: Record<string, string> = {
    influencers: 'count',
    posts: 'posts',
    followers: 'followers',
    likes: 'likes',
    views: 'views',
    comments: 'comments',
    shares: 'shares',
    engagement: 'engagement',
  };

  // Chart data for category breakdown stacked bar
  const categoryBarData = useMemo(() => {
    if (!report) return [];
    const metricKey = categoryMetricMap[categoryTabKey] || 'count';
    return brandCategoryData.map(row => {
      const entry: Record<string, any> = { category: row.label };
      row.brands.forEach(b => {
        entry[b.brandName] = (b as any)[metricKey] || 0;
      });
      return entry;
    });
  }, [brandCategoryData, categoryTabKey, report]);

  // Pie chart data with totals embedded
  const postsShareData = useMemo(() => {
    if (!chartData?.postsShare?.length && report) {
      return report.brands.map(b => ({
        name: b.brandName,
        value: b.postsCount,
        color: b.displayColor || '#6b7280',
        total: report.totalPosts,
      }));
    }
    const total = chartData?.postsShare?.reduce((s, d) => s + d.value, 0) || 0;
    return (chartData?.postsShare || []).map(d => ({ name: d.brandName, value: d.value, color: d.color, total }));
  }, [chartData, report]);

  const influencersShareData = useMemo(() => {
    if (!chartData?.influencersShare?.length && report) {
      return report.brands.map(b => ({
        name: b.brandName,
        value: b.influencerCount,
        color: b.displayColor || '#6b7280',
        total: report.totalInfluencers,
      }));
    }
    const total = chartData?.influencersShare?.reduce((s, d) => s + d.value, 0) || 0;
    return (chartData?.influencersShare || []).map(d => ({ name: d.brandName, value: d.value, color: d.color, total }));
  }, [chartData, report]);

  const engagementShareData = useMemo(() => {
    if (!chartData?.engagementShare?.length && report) {
      return report.brands.map(b => ({
        name: b.brandName,
        value: Number(b.totalLikes) + Number(b.totalComments) + Number(b.totalShares),
        color: b.displayColor || '#6b7280',
        total: Number(report.totalLikes) + Number(report.totalComments) + Number(report.totalShares),
      }));
    }
    const total = chartData?.engagementShare?.reduce((s, d) => s + d.value, 0) || 0;
    return (chartData?.engagementShare || []).map(d => ({ name: d.brandName, value: d.value, color: d.color, total }));
  }, [chartData, report]);

  // Timeline chart data
  const postsTimelineData = useMemo(() => {
    return (chartData?.postsOverTime || []).map(d => ({ date: d.date, ...d.brands, total: d.total }));
  }, [chartData]);

  const influencersTimelineData = useMemo(() => {
    return (chartData?.influencersOverTime || []).map(d => ({ date: d.date, ...d.brands, total: d.total }));
  }, [chartData]);

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-500 mb-4">Report not found</p>
        <button onClick={() => navigate('/competition-analysis')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Back to Reports
        </button>
      </div>
    );
  }

  const brandNames = report.brands.map(b => b.brandName);
  const brandColors = report.brands.map(b => b.displayColor || '#6b7280');
  const totalPostPages = Math.ceil(postsTotal / postsPerPage);

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      {/* ═══ 1. HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/competition-analysis')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-500 text-sm">{report.dateRangeStart} — {report.dateRangeEnd}</span>
              {report.platforms.map(p => (
                <span key={p} className="text-xs px-2 py-0.5 bg-gray-100 rounded">{p}</span>
              ))}
              {getStatusBadge(report.status)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {report.status === 'FAILED' && (
            <button onClick={handleRetry} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Repeat className="w-4 h-4" /> Retry
            </button>
          )}
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Share2 className="w-4 h-4" /> Share
          </button>
          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
              <Download className="w-4 h-4" /> Download
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <button
                  onClick={() => { downloadAsPdf(report); setMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                >
                  <FileText className="w-4 h-4 text-red-500" /> Download as PDF
                </button>
                <button
                  onClick={() => { downloadAsXlsx(report); setMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> Download as XLSX
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{report.errorMessage}</p>
        </div>
      )}

      {/* ═══ 2. REPORT SUMMARY CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'Brands', value: report.totalBrands, color: 'text-gray-900' },
          { label: 'Influencers', value: formatNumber(report.totalInfluencers), color: 'text-gray-900' },
          { label: 'Posts', value: formatNumber(report.totalPosts), color: 'text-gray-900' },
          { label: 'Likes', value: formatNumber(report.totalLikes), color: 'text-gray-900' },
          { label: 'Views', value: formatNumber(report.totalViews), color: 'text-gray-900' },
          { label: 'Comments', value: formatNumber(report.totalComments), color: 'text-gray-900' },
          { label: 'Shares', value: formatNumber(report.totalShares), color: 'text-gray-900' },
          { label: 'Avg ER', value: `${report.avgEngagementRate?.toFixed(2) || '0'}%`, color: 'text-indigo-600' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ═══ 3. BRAND OVERVIEW TABLE ═══ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Brand Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                {report.brands.some(b => b.hashtags?.length) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hashtags</th>
                )}
                {report.brands.some(b => b.username) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentions</th>
                )}
                {report.brands.some(b => b.keywords?.length) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keywords</th>
                )}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Influencers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eng Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {report.brands.map(brand => (
                <tr key={brand.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: brand.displayColor }} />
                      <span className="font-medium text-gray-900">{brand.brandName}</span>
                    </div>
                  </td>
                  {report.brands.some(b => b.hashtags?.length) && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {brand.hashtags?.map(h => (
                          <span key={h} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{h}</span>
                        )) || <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                  )}
                  {report.brands.some(b => b.username) && (
                    <td className="px-4 py-3 text-sm text-gray-600">{brand.username || '-'}</td>
                  )}
                  {report.brands.some(b => b.keywords?.length) && (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {brand.keywords?.map(k => (
                          <span key={k} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{k}</span>
                        )) || <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">{brand.influencerCount}</td>
                  <td className="px-4 py-3 text-right">{brand.postsCount}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(brand.totalLikes)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(brand.totalViews)}</td>
                  <td className="px-4 py-3 text-right font-medium text-indigo-600">{brand.avgEngagementRate?.toFixed(2) || '0'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 4. INFLUENCER & POST COUNT TABLE ═══ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer & Post Count</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                {report.brands.map(brand => (
                  <th key={brand.id} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: brand.displayColor }} />
                      {brand.brandName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Influencers</td>
                {report.brands.map(b => (
                  <td key={b.id} className="px-4 py-3 text-right text-gray-900 font-semibold">{b.influencerCount}</td>
                ))}
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">Posts</td>
                {report.brands.map(b => (
                  <td key={b.id} className="px-4 py-3 text-right text-gray-900 font-semibold">{b.postsCount}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 5. COMPARISON PIE CHARTS ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Posts Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={postsShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {postsShareData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Influencers Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Influencers Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={influencersShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {influencersShareData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Engagement Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={engagementShareData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {engagementShareData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ 6. PUBLISHING TIMELINE CHARTS ═══ */}
      {postsTimelineData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Posts Over Time */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Posts Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={postsTimelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  {brandNames.map((name, i) => (
                    <Line key={name} type="monotone" dataKey={name} stroke={brandColors[i]} strokeWidth={2} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Influencers Over Time */}
          {influencersTimelineData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Influencers Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={influencersTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    {brandNames.map((name, i) => (
                      <Line key={name} type="monotone" dataKey={name} stroke={brandColors[i]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ 7. INFLUENCER CATEGORY BREAKDOWN ═══ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Category Breakdown</h3>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b border-gray-200">
          {['influencers', 'posts', 'followers', 'likes', 'views', 'comments', 'shares', 'engagement'].map(tab => (
            <button
              key={tab}
              onClick={() => setCategoryTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors capitalize ${
                categoryTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'engagement' ? 'Engagement Rate' : tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                {report.brands.map(b => (
                  <th key={b.id} className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.displayColor }} />
                      {b.brandName}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {brandCategoryData.map(row => (
                <tr key={row.category} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[row.category]}20`,
                        color: CATEGORY_COLORS[row.category],
                      }}
                    >
                      {row.label}
                    </span>
                  </td>
                  {row.brands.map(b => {
                    const metric = categoryMetricMap[categoryTabKey] || 'count';
                    const val = (b as any)[metric] || 0;
                    return (
                      <td key={b.brandId} className="px-4 py-3 text-right font-medium text-gray-900">
                        {metric === 'engagement' ? `${val}%` : formatNumber(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stacked Bar Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBarData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              {report.brands.map((brand, i) => (
                <Bar key={brand.id} dataKey={brand.brandName} stackId="a" fill={brand.displayColor || brandColors[i]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══ 8. POST TYPE BREAKDOWN ═══ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Type Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {report.postTypeBreakdown.map(breakdown => {
            const pieData = [
              { name: 'Photo', value: breakdown.photoCount, color: POST_TYPE_COLORS.PHOTO },
              { name: 'Video', value: breakdown.videoCount, color: POST_TYPE_COLORS.VIDEO },
              { name: 'Carousel', value: breakdown.carouselCount, color: POST_TYPE_COLORS.CAROUSEL },
              { name: 'Reel', value: breakdown.reelCount, color: POST_TYPE_COLORS.REEL },
            ].filter(d => d.value > 0);
            const total = pieData.reduce((s, d) => s + d.value, 0);

            return (
              <div key={breakdown.brandId} className="border border-gray-100 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-3 text-center">{breakdown.brandName}</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={70}>
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`, '']} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 space-y-1.5">
                  {[
                    { label: 'Photo', pct: breakdown.photoPercentage, color: POST_TYPE_COLORS.PHOTO },
                    { label: 'Video', pct: breakdown.videoPercentage, color: POST_TYPE_COLORS.VIDEO },
                    { label: 'Carousel', pct: breakdown.carouselPercentage, color: POST_TYPE_COLORS.CAROUSEL },
                    { label: 'Reel', pct: breakdown.reelPercentage, color: POST_TYPE_COLORS.REEL },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-xs">
                      <div className="w-14 text-gray-500">{item.label}</div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                      </div>
                      <div className="w-10 text-right text-gray-500">{item.pct.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 9. ALL BRAND POSTS (Post-Level Data Table) ═══ */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Brand Posts</h3>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={postBrandFilter}
              onChange={e => { setPostBrandFilter(e.target.value); setPostPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Brands</option>
              {report.brands.map(b => (
                <option key={b.id} value={b.id}>{b.brandName}</option>
              ))}
            </select>

            <select
              value={postCategoryFilter}
              onChange={e => { setPostCategoryFilter(e.target.value); setPostPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Categories</option>
              <option value="NANO">Nano (&lt;10K)</option>
              <option value="MICRO">Micro (10K-100K)</option>
              <option value="MACRO">Macro (100K-500K)</option>
              <option value="MEGA">Mega (&gt;500K)</option>
            </select>

            <select
              value={postSortIdx}
              onChange={e => { setPostSortIdx(Number(e.target.value)); setPostPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {SORT_OPTIONS.map((opt, idx) => (
                <option key={idx} value={idx}>{opt.label}</option>
              ))}
            </select>

            <span className="text-sm text-gray-500 ml-auto">
              {postsTotal} post{postsTotal !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Posts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Credibility</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Post Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPosts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">No posts found</td>
                </tr>
              ) : (
                paginatedPosts.map(post => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">{getPlatformIcon(post.platform)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.postUrl ? (
                              <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 inline-flex items-center gap-1">
                                {post.influencerName || 'Unknown'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              post.influencerName || 'Unknown'
                            )}
                          </p>
                          {post.influencerUsername && (
                            <p className="text-xs text-gray-500">@{post.influencerUsername}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{formatNumber(post.influencerFollowerCount || 0)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(post.likesCount)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(post.commentsCount)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(post.sharesCount)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(post.viewsCount)}</td>
                    <td className="px-4 py-3 text-right">
                      {post.influencerCredibility != null ? (
                        <span className={`font-medium ${post.influencerCredibility >= 80 ? 'text-green-600' : post.influencerCredibility >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                          {post.influencerCredibility.toFixed(0)}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        post.postType === 'PHOTO' ? 'bg-blue-100 text-blue-700' :
                        post.postType === 'VIDEO' ? 'bg-red-100 text-red-700' :
                        post.postType === 'CAROUSEL' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {post.postType || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-700">{post.brandName}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPostPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {postPage} of {totalPostPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPostPage(p => Math.max(1, p - 1))}
                disabled={postPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPostPage(p => Math.min(totalPostPages, p + 1))}
                disabled={postPage >= totalPostPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionAnalysisDetailPage;
