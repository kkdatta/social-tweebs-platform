import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Share2, Download, MoreVertical, Edit3, Trash2, RefreshCw,
  CheckCircle, Clock, AlertCircle, Loader, Eye, Heart, MessageCircle,
  Hash, AtSign, Users, FileText, BarChart3, TrendingUp,
  ExternalLink, Share, Filter
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Area
} from 'recharts';
import { paidCollaborationApi } from '../../services/api';

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

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [reportData, chartDataResult] = await Promise.all([
        paidCollaborationApi.getById(id!),
        paidCollaborationApi.getChartData(id!).catch(() => ({ data: [] })),
      ]);
      setReport(reportData);
      setChartData(chartDataResult.data || []);
      setNewTitle(reportData.title);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredInfluencers = report?.influencers
    ?.filter(inf => selectedCategory === 'ALL' || inf.category === selectedCategory)
    .sort((a, b) => {
      const aVal = (a as any)[influencerSort] || 0;
      const bVal = (b as any)[influencerSort] || 0;
      return influencerSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }) || [];

  const filteredPosts = report?.posts
    ?.filter(post => {
      if (sponsoredOnly && !post.isSponsored) return false;
      if (selectedCategory !== 'ALL') {
        const influencer = report?.influencers?.find(i => i.id === post.influencer?.id);
        if (influencer && influencer.category !== selectedCategory) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aVal = (a as any)[postSort] || 0;
      const bVal = (b as any)[postSort] || 0;
      return postSortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }) || [];

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
          </div>
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-2">
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
                  onClick={() => { setShowMenu(false); /* Download PDF */ }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => { setShowMenu(false); /* Download XLSX */ }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download XLSX
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accounts</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Comments</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Shares</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg ER</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {report.categorizations.map((cat) => (
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
                    onChange={(e) => setSelectedCategory(e.target.value)}
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
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="likesCount-desc">Most Liked</option>
                    <option value="likesCount-asc">Least Liked</option>
                    <option value="followerCount-desc">Most Followers</option>
                    <option value="followerCount-asc">Least Followers</option>
                    <option value="engagementRate-desc">Highest ER</option>
                    <option value="engagementRate-asc">Lowest ER</option>
                    <option value="credibilityScore-desc">Highest Credibility</option>
                    <option value="credibilityScore-asc">Lowest Credibility</option>
                  </select>
                </div>

                {/* Influencers List */}
                <div className="grid gap-4">
                  {filteredInfluencers.map((influencer) => (
                    <div key={influencer.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                      <img
                        src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.influencerName}`}
                        alt={influencer.influencerName}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  ))}
                </div>
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
                      onChange={(e) => setSponsoredOnly(e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Sponsored Only</span>
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="NANO">Nano</option>
                    <option value="MICRO">Micro</option>
                    <option value="MACRO">Macro</option>
                    <option value="MEGA">Mega</option>
                  </select>
                  <select
                    value={`${postSort}-${postSortOrder}`}
                    onChange={(e) => {
                      const [sort, order] = e.target.value.split('-');
                      setPostSort(sort);
                      setPostSortOrder(order as 'asc' | 'desc');
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="likesCount-desc">Most Liked</option>
                    <option value="likesCount-asc">Least Liked</option>
                    <option value="viewsCount-desc">Most Viewed</option>
                    <option value="viewsCount-asc">Least Viewed</option>
                    <option value="postDate-desc">Newest</option>
                    <option value="postDate-asc">Oldest</option>
                  </select>
                </div>

                {/* Posts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 rounded-xl overflow-hidden">
                      {post.thumbnailUrl && (
                        <div className="relative aspect-square bg-gray-200">
                          <img
                            src={post.thumbnailUrl}
                            alt="Post thumbnail"
                            className="w-full h-full object-cover"
                          />
                          {post.isSponsored && (
                            <span className="absolute top-2 left-2 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                              Sponsored
                            </span>
                          )}
                          {post.postUrl && (
                            <a
                              href={post.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-700" />
                            </a>
                          )}
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
                            <div>
                              <div className="text-sm font-medium text-gray-900">{post.influencer.influencerName}</div>
                              {post.influencer.influencerUsername && (
                                <div className="text-xs text-gray-500">@{post.influencer.influencerUsername}</div>
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
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Heart className="w-4 h-4 text-pink-500" />
                              {formatNumber(post.likesCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4 text-green-500" />
                              {formatNumber(post.commentsCount)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-blue-500" />
                              {formatNumber(post.viewsCount)}
                            </span>
                          </div>
                          <span className="text-xs">{formatDate(post.postDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
    </div>
  );
};
