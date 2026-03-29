import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Users, FileText, Calendar, TrendingUp, Eye, MessageSquare,
  Heart, Share2, MoreVertical, Download, Plus, Search, Filter, ExternalLink,
  LayoutGrid, LayoutList, Instagram, Youtube, AlertTriangle, X, Link2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { campaignsApi } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  PENDING: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
  PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  INSTAGRAM: <Instagram size={16} className="text-pink-500" />,
  YOUTUBE: <Youtube size={16} className="text-red-500" />,
  TIKTOK: <span className="text-xs font-bold">TT</span>,
};

const CHART_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'stories' | 'analytics'>('posts');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showDownloadTypeModal, setShowDownloadTypeModal] = useState<'pdf' | 'xlsx' | null>(null);
  const [showAddInfluencer, setShowAddInfluencer] = useState(false);
  const [showAddPost, setShowAddPost] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [timelineMetrics, setTimelineMetrics] = useState<string[]>(['posts', 'likes', 'views']);

  // Influencer filters
  const [infPlatformFilter, setInfPlatformFilter] = useState('');
  const [infPublishFilter, setInfPublishFilter] = useState('all');
  const [infSearchQuery, setInfSearchQuery] = useState('');

  // Post filters
  const [postPlatformFilter, setPostPlatformFilter] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postSortBy, setPostSortBy] = useState('most_liked');
  const [postViewMode, setPostViewMode] = useState<'table' | 'grid'>('table');

  // Add forms
  const [newInfluencer, setNewInfluencer] = useState({ influencerName: '', influencerUsername: '', platform: 'INSTAGRAM' });
  const [newPostUrl, setNewPostUrl] = useState('');

  useEffect(() => {
    if (id) loadCampaign();
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'analytics') loadAnalytics();
  }, [id, activeTab]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await campaignsApi.getById(id!);
      setCampaign(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const data = await campaignsApi.getAnalytics(id!);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleAddInfluencer = async () => {
    if (!newInfluencer.influencerName.trim()) return;
    try {
      await campaignsApi.addInfluencer(id!, {
        influencerName: newInfluencer.influencerName,
        influencerUsername: newInfluencer.influencerUsername,
        platform: newInfluencer.platform,
      });
      setShowAddInfluencer(false);
      setNewInfluencer({ influencerName: '', influencerUsername: '', platform: 'INSTAGRAM' });
      loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add influencer');
    }
  };

  const handleAddPost = async () => {
    if (!newPostUrl.trim()) return;
    try {
      await campaignsApi.addPost(id!, { postUrl: newPostUrl });
      setShowAddPost(false);
      setNewPostUrl('');
      loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add post');
    }
  };

  const handleExport = async (format: 'pdf' | 'xlsx', reportType: 'basic' | 'advanced') => {
    try {
      const data = await campaignsApi.getExportData(id!, reportType);
      if (format === 'pdf') {
        exportPDF(data, reportType);
      } else {
        exportXLSX(data, reportType);
      }
      setShowDownloadTypeModal(null);
      setShowDownloadMenu(false);
    } catch (err) {
      alert('Failed to export report');
    }
  };

  const exportPDF = (data: any, reportType: string) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(data.campaign.name, 14, 20);
    doc.setFontSize(10);
    doc.text(`Platform: ${data.campaign.platform} | Status: ${data.campaign.status}`, 14, 28);
    doc.text(`Date Range: ${formatDate(data.campaign.startDate)} - ${formatDate(data.campaign.endDate)}`, 14, 34);
    if (data.campaign.hashtags?.length) {
      doc.text(`Hashtags: ${data.campaign.hashtags.join(', ')}`, 14, 40);
    }

    doc.setFontSize(14);
    doc.text('Campaign Summary', 14, 52);
    doc.setFontSize(10);
    const summaryData = [
      ['Total Influencers', String(data.metrics.totalInfluencers)],
      ['Total Posts', String(data.metrics.totalPosts)],
      ['Total Likes', formatNumber(data.metrics.totalLikes)],
      ['Total Views', formatNumber(data.metrics.totalViews)],
      ['Total Comments', formatNumber(data.metrics.totalComments)],
      ['Total Shares', formatNumber(data.metrics.totalShares)],
      ['Avg Engagement Rate', `${data.metrics.avgEngagementRate}%`],
      ['Engagement/Views Ratio', `${data.metrics.engagementToViewsRatio}%`],
    ];
    autoTable(doc, { startY: 56, head: [['Metric', 'Value']], body: summaryData });

    doc.setFontSize(14);
    doc.text('Influencer Performance', 14, (doc as any).lastAutoTable.finalY + 12);
    const infHeaders = ['Name', 'Platform', 'Posts', 'Followers', 'Likes', 'Views', 'Comments', 'Shares', 'Credibility'];
    const infBody = (data.influencers || []).map((inf: any) => [
      inf.influencerName, inf.platform, String(inf.postsCount || 0),
      formatNumber(inf.followerCount || 0), formatNumber(inf.likesCount || 0),
      formatNumber(inf.viewsCount || 0), formatNumber(inf.commentsCount || 0),
      formatNumber(inf.sharesCount || 0), inf.audienceCredibility ? `${inf.audienceCredibility}%` : '-',
    ]);
    autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 16, head: [infHeaders], body: infBody, styles: { fontSize: 8 } });

    doc.save(`${data.campaign.name}_${reportType}_report.pdf`);
  };

  const exportXLSX = (data: any, reportType: string) => {
    const wb = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Campaign Report'],
      ['Name', data.campaign.name],
      ['Platform', data.campaign.platform],
      ['Status', data.campaign.status],
      ['Date Range', `${formatDate(data.campaign.startDate)} - ${formatDate(data.campaign.endDate)}`],
      ['Hashtags', data.campaign.hashtags?.join(', ') || '-'],
      [],
      ['Metric', 'Value'],
      ['Total Influencers', data.metrics.totalInfluencers],
      ['Total Posts', data.metrics.totalPosts],
      ['Total Likes', data.metrics.totalLikes],
      ['Total Views', data.metrics.totalViews],
      ['Total Comments', data.metrics.totalComments],
      ['Total Shares', data.metrics.totalShares],
      ['Avg Engagement Rate', `${data.metrics.avgEngagementRate}%`],
      ['Engagement/Views Ratio', `${data.metrics.engagementToViewsRatio}%`],
    ]);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    const infData = (data.influencers || []).map((inf: any) => ({
      Name: inf.influencerName, Platform: inf.platform, Posts: inf.postsCount || 0,
      Followers: inf.followerCount || 0, Likes: inf.likesCount || 0, Views: inf.viewsCount || 0,
      Comments: inf.commentsCount || 0, Shares: inf.sharesCount || 0,
      'Audience Credibility': inf.audienceCredibility ? `${inf.audienceCredibility}%` : '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(infData), 'Influencers');

    const postData = (data.posts || []).map((p: any) => ({
      Influencer: p.influencerName || '-', 'Posted Date': formatDate(p.postedDate),
      Platform: p.platform, Followers: p.followerCount || 0, Likes: p.likesCount || 0,
      Views: p.viewsCount || 0, Comments: p.commentsCount || 0, Shares: p.sharesCount || 0,
      'Engagement Rate': p.engagementRate ? `${p.engagementRate}%` : '-', 'Post URL': p.postUrl || '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(postData), 'Posts');

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${data.campaign.name}_${reportType}_report.xlsx`);
  };

  const filteredInfluencers = useMemo(() => {
    if (!campaign?.influencers) return [];
    return campaign.influencers.filter((inf: any) => {
      if (infPlatformFilter && inf.platform !== infPlatformFilter) return false;
      if (infPublishFilter === 'published' && (!inf.postsCount || inf.postsCount === 0)) return false;
      if (infPublishFilter === 'unpublished' && inf.postsCount > 0) return false;
      if (infSearchQuery) {
        const q = infSearchQuery.toLowerCase();
        if (!inf.influencerName?.toLowerCase().includes(q) && !inf.influencerUsername?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [campaign?.influencers, infPlatformFilter, infPublishFilter, infSearchQuery]);

  const filteredPosts = useMemo(() => {
    if (!campaign?.posts) return [];
    let posts = [...campaign.posts];
    if (postPlatformFilter) posts = posts.filter((p: any) => p.platform === postPlatformFilter);
    if (postSearchQuery) {
      const q = postSearchQuery.toLowerCase();
      posts = posts.filter((p: any) => p.influencerName?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
    }
    const sortFn: Record<string, (a: any, b: any) => number> = {
      most_liked: (a, b) => (b.likesCount || 0) - (a.likesCount || 0),
      least_liked: (a, b) => (a.likesCount || 0) - (b.likesCount || 0),
      most_commented: (a, b) => (b.commentsCount || 0) - (a.commentsCount || 0),
      least_commented: (a, b) => (a.commentsCount || 0) - (b.commentsCount || 0),
      recent: (a, b) => new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime(),
      oldest: (a, b) => new Date(a.postedDate || 0).getTime() - new Date(b.postedDate || 0).getTime(),
    };
    if (sortFn[postSortBy]) posts.sort(sortFn[postSortBy]);
    return posts;
  }, [campaign?.posts, postPlatformFilter, postSearchQuery, postSortBy]);

  const storyPosts = useMemo(() => {
    if (!campaign?.posts) return [];
    return campaign.posts.filter((p: any) => p.postType === 'STORY');
  }, [campaign?.posts]);

  const showStoriesTab = campaign?.platform === 'INSTAGRAM' || campaign?.platform === 'MULTI';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Campaign not found'}</p>
          <button onClick={() => navigate('/campaigns')} className="text-purple-600 hover:text-purple-700">Back to Campaigns</button>
        </div>
      </div>
    );
  }

  const m = campaign.metrics || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate('/campaigns')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[campaign.status]?.color}`}>
                  {STATUS_CONFIG[campaign.status]?.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                </span>
                <span className="flex items-center gap-1">{PLATFORM_ICONS[campaign.platform] || null} {campaign.platform}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 relative">
              <button onClick={() => navigate(`/campaigns/${id}/edit`)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Edit size={20} />
              </button>
              <button onClick={() => setShowDownloadMenu(!showDownloadMenu)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
              {showDownloadMenu && (
                <div className="absolute right-0 top-12 bg-white border rounded-lg shadow-lg z-10 w-48">
                  <button onClick={() => { setShowDownloadTypeModal('pdf'); setShowDownloadMenu(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Download size={16} /> Export as PDF
                  </button>
                  <button onClick={() => { setShowDownloadTypeModal('xlsx'); setShowDownloadMenu(false); }} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 border-t">
                    <Download size={16} /> Export as XLSX
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hashtags */}
          {campaign.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {campaign.hashtags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Data Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total Influencers', value: formatNumber(m.totalInfluencers || 0), icon: <Users size={18} className="text-purple-500" /> },
            { label: 'Total Posts', value: formatNumber(m.totalPosts || 0), icon: <FileText size={18} className="text-blue-500" /> },
            { label: 'Total Likes', value: formatNumber(m.totalLikes || 0), icon: <Heart size={18} className="text-pink-500" /> },
            { label: 'Total Views', value: formatNumber(m.totalViews || 0), icon: <Eye size={18} className="text-green-500" /> },
            { label: 'Total Comments', value: formatNumber(m.totalComments || 0), icon: <MessageSquare size={18} className="text-orange-500" /> },
            { label: 'Total Shares', value: formatNumber(m.totalShares || 0), icon: <Share2 size={18} className="text-indigo-500" /> },
            { label: 'Avg Engagement', value: `${m.avgEngagementRate || 0}%`, icon: <TrendingUp size={18} className="text-emerald-500" /> },
            { label: 'Eng/Views Ratio', value: `${m.engagementToViewsRatio || 0}%`, icon: <TrendingUp size={18} className="text-cyan-500" /> },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-1">{card.icon}<span className="text-xs text-gray-500">{card.label}</span></div>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      {campaign.timeline?.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Timeline</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'posts', label: 'Posts', color: '#8b5cf6' },
                  { key: 'likes', label: 'Likes', color: '#ec4899' },
                  { key: 'views', label: 'Views', color: '#10b981' },
                  { key: 'comments', label: 'Comments', color: '#f59e0b' },
                  { key: 'shares', label: 'Shares', color: '#6366f1' },
                ].map((metric) => (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => setTimelineMetrics((prev) =>
                      prev.includes(metric.key)
                        ? prev.filter((k) => k !== metric.key)
                        : [...prev, metric.key]
                    )}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      timelineMetrics.includes(metric.key)
                        ? 'text-white border-transparent'
                        : 'text-gray-500 border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    style={timelineMetrics.includes(metric.key) ? { backgroundColor: metric.color } : undefined}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={campaign.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(d) => formatDate(d)}
                  formatter={(value: number, name: string) => [formatNumber(value), name.charAt(0).toUpperCase() + name.slice(1)]}
                />
                <Legend />
                {timelineMetrics.includes('posts') && (
                  <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} name="Posts" />
                )}
                {timelineMetrics.includes('likes') && (
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} name="Likes" />
                )}
                {timelineMetrics.includes('views') && (
                  <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} name="Views" />
                )}
                {timelineMetrics.includes('comments') && (
                  <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2} dot={false} name="Comments" />
                )}
                {timelineMetrics.includes('shares') && (
                  <Line type="monotone" dataKey="shares" stroke="#6366f1" strokeWidth={2} dot={false} name="Shares" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Influencer / Add Post Buttons + Influencer Performance Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Influencer Table Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-lg font-semibold text-gray-900">Influencer Performance ({filteredInfluencers.length})</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowAddInfluencer(true)} className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                  <Plus size={16} /> Add Influencer
                </button>
                <button onClick={() => setShowAddPost(true)} className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Link2 size={16} /> Add Post
                </button>
              </div>
            </div>

            {/* Influencer Filters */}
            <div className="flex flex-wrap gap-3 mt-3">
              <select value={infPlatformFilter} onChange={(e) => setInfPlatformFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
              </select>
              <select value={infPublishFilter} onChange={(e) => setInfPublishFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                <option value="all">All</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="text" placeholder="Search influencer..." value={infSearchQuery} onChange={(e) => setInfSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
          </div>

          {/* Influencer Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Followers</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Comments</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shares</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Credibility</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">View Post</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInfluencers.map((inf: any) => (
                  <tr key={inf.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {PLATFORM_ICONS[inf.platform]}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inf.influencerName}</p>
                          {inf.influencerUsername && <p className="text-xs text-gray-500">@{inf.influencerUsername}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{inf.postsCount || 0}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatNumber(inf.followerCount || 0)}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatNumber(inf.likesCount || 0)}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatNumber(inf.viewsCount || 0)}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatNumber(inf.commentsCount || 0)}</td>
                    <td className="px-4 py-3 text-center text-sm">{formatNumber(inf.sharesCount || 0)}</td>
                    <td className="px-4 py-3 text-center text-sm">{inf.audienceCredibility != null ? `${inf.audienceCredibility}%` : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      {inf.latestPostUrl ? (
                        <a href={inf.latestPostUrl} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-sm font-medium">
                          View <ExternalLink size={12} />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => { setActiveTab('posts'); setPostSearchQuery(inf.influencerName); }}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium">All Posts</button>
                    </td>
                  </tr>
                ))}
                {filteredInfluencers.length === 0 && (
                  <tr><td colSpan={10} className="px-4 py-8 text-center text-gray-500">No influencers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Tabs: Posts / Stories / Analytics */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {(['posts', ...(showStoriesTab ? ['stories'] : []), 'analytics'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Posts Tab */}
            {activeTab === 'posts' && (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <select value={postPlatformFilter} onChange={(e) => setPostPlatformFilter(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                      <option value="">All Platforms</option>
                      <option value="INSTAGRAM">Instagram</option>
                      <option value="YOUTUBE">YouTube</option>
                      <option value="TIKTOK">TikTok</option>
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="text" placeholder="Search..." value={postSearchQuery} onChange={(e) => setPostSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={postSortBy} onChange={(e) => setPostSortBy(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
                      <option value="most_liked">Most Liked</option>
                      <option value="least_liked">Least Liked</option>
                      <option value="most_commented">Most Commented</option>
                      <option value="least_commented">Least Commented</option>
                      <option value="recent">Recent</option>
                      <option value="oldest">Oldest</option>
                    </select>
                    <button onClick={() => setPostViewMode('table')} className={`p-2 rounded ${postViewMode === 'table' ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}>
                      <LayoutList size={18} />
                    </button>
                    <button onClick={() => setPostViewMode('grid')} className={`p-2 rounded ${postViewMode === 'grid' ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}>
                      <LayoutGrid size={18} />
                    </button>
                  </div>
                </div>

                {postViewMode === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posted Date</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Followers</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Likes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Comments</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Views</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shares</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Eng. Rate</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPosts.map((post: any) => (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {PLATFORM_ICONS[post.platform]}
                                <span className="text-sm font-medium">{post.influencerName || '-'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-500">{formatDate(post.postedDate)}</td>
                            <td className="px-4 py-3 text-center text-sm">{formatNumber(post.followerCount || 0)}</td>
                            <td className="px-4 py-3 text-center text-sm">{formatNumber(post.likesCount || 0)}</td>
                            <td className="px-4 py-3 text-center text-sm">{formatNumber(post.commentsCount || 0)}</td>
                            <td className="px-4 py-3 text-center text-sm">{formatNumber(post.viewsCount || 0)}</td>
                            <td className="px-4 py-3 text-center text-sm">{formatNumber(post.sharesCount || 0)}</td>
                            <td className="px-4 py-3 text-center text-sm">{post.engagementRate != null ? `${post.engagementRate}%` : '-'}</td>
                            <td className="px-4 py-3 text-center">
                              {post.postUrl ? (
                                <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 text-sm font-medium inline-flex items-center gap-1">
                                  View Post <ExternalLink size={12} />
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                        {filteredPosts.length === 0 && (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No posts found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPosts.map((post: any) => (
                      <a key={post.id} href={post.postUrl || '#'} target="_blank" rel="noopener noreferrer"
                        className="block bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                        {post.postImageUrl && (
                          <img src={post.postImageUrl} alt="" className="w-full h-48 object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {PLATFORM_ICONS[post.platform]}
                            <span className="text-sm font-medium">{post.influencerName || 'Unknown'}</span>
                            <span className="text-xs text-gray-400 ml-auto">{formatDate(post.postedDate)}</span>
                          </div>
                          {post.description && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{post.description}</p>}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Heart size={12} /> {formatNumber(post.likesCount || 0)}</span>
                            <span className="flex items-center gap-1"><Eye size={12} /> {formatNumber(post.viewsCount || 0)}</span>
                            <span className="flex items-center gap-1"><MessageSquare size={12} /> {formatNumber(post.commentsCount || 0)}</span>
                          </div>
                          {post.audienceCredibility != null && (
                            <div className="mt-2 text-xs text-gray-500">Credibility: {post.audienceCredibility}%</div>
                          )}
                        </div>
                      </a>
                    ))}
                    {filteredPosts.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No posts found</div>}
                  </div>
                )}
              </div>
            )}

            {/* Stories Tab */}
            {activeTab === 'stories' && showStoriesTab && (
              <div>
                <h4 className="text-base font-semibold mb-4">Stories Performance (Instagram)</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Posts</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Followers</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Likes</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Views</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Comments</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Shares</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Credibility</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {storyPosts.length > 0 ? storyPosts.map((post: any) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Instagram size={16} className="text-pink-500" />
                              <span className="text-sm font-medium">{post.influencerName || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm">1</td>
                          <td className="px-4 py-3 text-center text-sm">{formatNumber(post.followerCount || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm">{formatNumber(post.likesCount || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm">{formatNumber(post.viewsCount || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm">{formatNumber(post.commentsCount || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm">{formatNumber(post.sharesCount || 0)}</td>
                          <td className="px-4 py-3 text-center text-sm">{post.audienceCredibility != null ? `${post.audienceCredibility}%` : '-'}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No stories data available</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Campaign Timeline */}
                {campaign.timeline?.length > 0 && (
                  <div>
                    <h4 className="text-base font-semibold mb-4">Campaign Timeline</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={campaign.timeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                        <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name.charAt(0).toUpperCase() + name.slice(1)]} />
                        <Legend />
                        {timelineMetrics.includes('posts') && <Line type="monotone" dataKey="posts" stroke="#8b5cf6" strokeWidth={2} name="Posts" />}
                        {timelineMetrics.includes('likes') && <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} name="Likes" />}
                        {timelineMetrics.includes('views') && <Line type="monotone" dataKey="views" stroke="#10b981" strokeWidth={2} dot={false} name="Views" />}
                        {timelineMetrics.includes('comments') && <Line type="monotone" dataKey="comments" stroke="#f59e0b" strokeWidth={2} dot={false} name="Comments" />}
                        {timelineMetrics.includes('shares') && <Line type="monotone" dataKey="shares" stroke="#6366f1" strokeWidth={2} dot={false} name="Shares" />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Audience Overview */}
                {analytics?.audienceOverview && (
                  <div>
                    <h4 className="text-base font-semibold mb-4">Campaign Audience Overview</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Gender Distribution */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-3">Gender Distribution</h5>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={[
                              { name: 'Male', value: analytics.audienceOverview.genderDistribution.male },
                              { name: 'Female', value: analytics.audienceOverview.genderDistribution.female },
                              { name: 'Other', value: analytics.audienceOverview.genderDistribution.other },
                            ]} cx="50%" cy="50%" outerRadius={70} dataKey="value" label>
                              {[0, 1, 2].map((i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                            </Pie>
                            <Legend />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Age Distribution */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-3">Age Distribution</h5>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={analytics.audienceOverview.ageDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="male" fill="#3b82f6" name="Male" />
                            <Bar dataKey="female" fill="#ec4899" name="Female" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Top Countries */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-3">Top Countries by Audience</h5>
                        <div className="space-y-2">
                          {analytics.audienceOverview.topCountries.map((c: any) => (
                            <div key={c.country} className="flex items-center justify-between text-sm">
                              <span>{c.country}</span>
                              <div className="flex gap-4 text-xs text-gray-500">
                                <span>Audience: {c.audience}%</span>
                                <span>Likes: {c.likes}%</span>
                                <span>Views: {c.views}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Cities */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium mb-3">Top Cities by Audience</h5>
                        <div className="space-y-2">
                          {analytics.audienceOverview.topCities.map((c: any) => (
                            <div key={c.city} className="flex items-center justify-between text-sm">
                              <span>{c.city}</span>
                              <div className="flex gap-4 text-xs text-gray-500">
                                <span>Audience: {c.audience}%</span>
                                <span>Likes: {c.likes}%</span>
                                <span>Views: {c.views}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Influencer-Level Analytics */}
                {analytics?.influencerAnalytics?.map((inf: any) => (
                  <div key={inf.influencerId} className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      {PLATFORM_ICONS[inf.platform]}
                      <h4 className="text-base font-semibold">{inf.influencerName}</h4>
                      <span className="text-xs text-gray-500">@{inf.influencerUsername} | {formatNumber(inf.followerCount || 0)} followers | {inf.postsCount} posts</span>
                    </div>

                    {/* Comparison Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Avg Likes', campaign: inf.avgLikesCampaign, influencer: inf.avgLikesInfluencer },
                        { label: 'Avg Views', campaign: inf.avgViewsCampaign, influencer: inf.avgViewsInfluencer },
                        { label: 'Avg Comments', campaign: inf.avgCommentsCampaign, influencer: inf.avgCommentsInfluencer },
                      ].map(({ label, campaign: c, influencer: i }) => (
                        <div key={label} className="bg-white rounded-lg p-4">
                          <h6 className="text-xs font-medium mb-2">{label}</h6>
                          <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={[{ name: 'Campaign', value: Math.round(c) }, { name: inf.influencerName.split(' ')[0], value: Math.round(i) }]}>
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ))}
                    </div>

                    {/* Percentage Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Likes % of Campaign</p>
                        <p className="text-lg font-bold text-purple-600">{inf.likesPercentage.toFixed(1)}%</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Views % of Campaign</p>
                        <p className="text-lg font-bold text-blue-600">{inf.viewsPercentage.toFixed(1)}%</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Comments % of Campaign</p>
                        <p className="text-lg font-bold text-green-600">{inf.commentsPercentage.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Posts Links */}
                    {inf.posts?.length > 0 && (
                      <div>
                        <h6 className="text-xs font-medium mb-2">Posts</h6>
                        <div className="flex flex-wrap gap-2">
                          {inf.posts.map((p: any) => (
                            <a key={p.id} href={p.postUrl || '#'} target="_blank" rel="noopener noreferrer"
                              className="text-xs px-3 py-1.5 bg-white border rounded-lg hover:bg-purple-50 inline-flex items-center gap-1 text-purple-600">
                              <ExternalLink size={10} /> {p.postType} - {formatDate(p.postedDate)}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {!analytics && (
                  <div className="text-center py-8 text-gray-500">Loading analytics data...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Influencer Modal */}
      {showAddInfluencer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Influencer</h3>
              <button onClick={() => setShowAddInfluencer(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Influencer Name *</label>
                <input type="text" value={newInfluencer.influencerName} onChange={(e) => setNewInfluencer({ ...newInfluencer, influencerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Search by name or keyword..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={newInfluencer.influencerUsername} onChange={(e) => setNewInfluencer({ ...newInfluencer, influencerUsername: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="@username" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={newInfluencer.platform} onChange={(e) => setNewInfluencer({ ...newInfluencer, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>
              <button onClick={handleAddInfluencer} className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
                Add Influencer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Post Modal */}
      {showAddPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Post by URL</h3>
              <button onClick={() => setShowAddPost(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Post URL *</label>
                <input type="url" value={newPostUrl} onChange={(e) => setNewPostUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="https://www.instagram.com/p/..." />
              </div>
              <button onClick={handleAddPost} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                Add Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Download Type Modal */}
      {showDownloadTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Report Type</h3>
              <button onClick={() => setShowDownloadTypeModal(null)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => handleExport(showDownloadTypeModal, 'basic')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-left hover:border-purple-300 hover:bg-purple-50 transition-colors">
                <p className="font-medium text-gray-900">Basic Report</p>
                <p className="text-xs text-gray-500 mt-1">Influencer list + Post statistics</p>
              </button>
              <button onClick={() => handleExport(showDownloadTypeModal, 'advanced')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg text-left hover:border-purple-300 hover:bg-purple-50 transition-colors">
                <p className="font-medium text-gray-900">Advanced Report</p>
                <p className="text-xs text-gray-500 mt-1">Includes full influencer analytics (if unlocked)</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetailPage;
