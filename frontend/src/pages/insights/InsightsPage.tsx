import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Download, RefreshCw, Share2, Users, Heart, MessageCircle,
  Eye, MapPin, BadgeCheck, TrendingUp, Globe, Calendar, ExternalLink,
  BarChart3, PieChart, Instagram, Youtube, Sparkles, Play, AlertCircle,
  Hash, ChevronDown, ChevronRight, UserPlus, FolderPlus, X, CloudRainWind,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import { insightsApi, influencerGroupsApi, campaignsApi } from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f97316', '#14b8a6'];
const PIE_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444'];

interface ViewMoreModalProps {
  title: string;
  columns: { key: string; label: string }[];
  data: any[];
  onClose: () => void;
}

const ViewMoreModal: React.FC<ViewMoreModalProps> = ({ title, columns, data, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col animate-fadeIn">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 print:hidden"><X className="w-5 h-5" /></button>
      </div>
      <div className="overflow-auto flex-1 p-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{columns.map(c => <th key={c.key} className="px-3 py-2 text-left font-semibold text-gray-600">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map(c => (
                  <td key={c.key} className="px-3 py-2 text-gray-700">
                    {c.key === 'url' || c.key === 'postUrl'
                      ? row[c.key] ? <a href={row[c.key]} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></a> : '-'
                      : typeof row[c.key] === 'number' ? row[c.key].toLocaleString() : row[c.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const formatNum = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const InsightsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [viewMoreData, setViewMoreData] = useState<ViewMoreModalProps | null>(null);
  const [audienceSection, setAudienceSection] = useState<'followers' | 'engagers'>('followers');
  const [locationTab, setLocationTab] = useState<'country' | 'state' | 'city'>('country');
  const [postCategory, setPostCategory] = useState<'popular' | 'sponsored' | 'recent'>('popular');
  const [reelCategory, setReelCategory] = useState<'popular' | 'recent'>('popular');

  useEffect(() => { if (id) fetchInsight(); }, [id]);

  const fetchInsight = async () => {
    try {
      setIsLoading(true); setError('');
      const data = await insightsApi.getById(id!);
      setInsights(data);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load insight');
    } finally { setIsLoading(false); }
  };

  const handleRefresh = async () => {
    if (!confirm('Refreshing this insight will cost 1 credit. Continue?')) return;
    try {
      setIsRefreshing(true);
      const result = await insightsApi.refresh(id!);
      setInsights(result.insight);
      if (user && result.remainingBalance !== undefined) updateUser({ ...user, credits: result.remainingBalance });
      if (result.creditsUsed > 0) alert(`Insight refreshed! ${result.creditsUsed} credit used. Remaining: ${result.remainingBalance}`);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to refresh insight');
    } finally { setIsRefreshing(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); } catch { alert('Copy this link: ' + url); }
  };

  const handleExportJSON = () => {
    if (!insights) return;
    const dataStr = JSON.stringify(insights, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${insights.username}_insight_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => window.print();

  const handleExportExcel = () => {
    if (!insights) return;
    const st = insights.stats || {};
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ['Metric', 'Value'],
      ['Username', insights.username ?? ''],
      ['Full name', insights.fullName ?? ''],
      ['Platform', insights.platform ?? ''],
      ['Location', insights.locationCountry ?? ''],
      ['Followers', st.followerCount ?? ''],
      ['Following', st.followingCount ?? ''],
      ['Posts', st.postCount ?? ''],
      ['Avg likes', st.avgLikes ?? ''],
      ['Avg comments', st.avgComments ?? ''],
      ['Avg views', st.avgViews ?? ''],
      ['Engagement rate %', st.engagementRate != null ? Number(st.engagementRate) : ''],
      ['Avg reel views', st.avgReelViews ?? ''],
      ['Avg reel likes', st.avgReelLikes ?? ''],
      ['Avg reel comments', st.avgReelComments ?? ''],
      ['Brand post ER %', st.brandPostER != null ? Number(st.brandPostER) : ''],
      ['Posts with hidden likes %', st.postsWithHiddenLikesPct != null ? Number(st.postsWithHiddenLikesPct) : ''],
      ['Report refreshed', insights.lastRefreshedAt ? new Date(insights.lastRefreshedAt).toISOString() : ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Insight stats');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${insights.username}_insight_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddToGroup = async () => {
    try {
      const result = await influencerGroupsApi.list({ limit: 50 });
      const groups = result.groups || [];
      if (groups.length === 0) { alert('No groups found. Create a group first.'); return; }
      const groupName = prompt('Enter group name to add to:\n' + groups.map((g: any) => g.name).join('\n'));
      const group = groups.find((g: any) => g.name === groupName);
      if (!group) return;
      await influencerGroupsApi.addInfluencer(group.id, {
        influencerName: insights.fullName || insights.username,
        influencerUsername: insights.username,
        platform: insights.platform,
        profilePictureUrl: insights.profilePictureUrl,
        followerCount: insights.stats?.followerCount,
        engagementRate: insights.stats?.engagementRate,
      });
      alert('Added to group successfully!');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add to group'); }
    setShowAddMenu(false);
  };

  const handleAddToCampaign = async () => {
    try {
      const result = await campaignsApi.list({ tab: 'created_by_me', limit: 50 });
      const camps = result.campaigns || [];
      if (camps.length === 0) { alert('No campaigns found. Create a campaign first.'); return; }
      const name = prompt('Enter campaign name to add to:\n' + camps.map((c: any) => c.name).join('\n'));
      const camp = camps.find((c: any) => c.name === name);
      if (!camp) return;
      await campaignsApi.addInfluencer(camp.id, {
        influencerName: insights.fullName || insights.username,
        influencerUsername: insights.username,
        platform: insights.platform,
        profilePictureUrl: insights.profilePictureUrl,
        followerCount: insights.stats?.followerCount,
      });
      alert('Added to campaign successfully!');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add to campaign'); }
    setShowAddMenu(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.relative')) { setShowExportMenu(false); setShowAddMenu(false); } };
    if (showExportMenu || showAddMenu) { document.addEventListener('click', handler); return () => document.removeEventListener('click', handler); }
  }, [showExportMenu, showAddMenu]);

  const getPlatformIcon = () => {
    switch (insights?.platform) {
      case 'INSTAGRAM': return <Instagram className="w-4 h-4" />;
      case 'YOUTUBE': return <Youtube className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96"><div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-gray-500">Loading insights...</p></div></div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-96"><div className="text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">{error}</h3>
      <button type="button" onClick={() => navigate('/insights')} className="btn btn-primary mt-4 print:hidden">Back to Insights</button></div></div>
  );
  if (!insights) return (
    <div className="flex items-center justify-center h-96"><div className="text-center">
      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">Insight not found</h3>
      <button type="button" onClick={() => navigate('/insights')} className="btn btn-primary mt-4 print:hidden">Back to Insights</button></div></div>
  );

  const s = insights.stats || {};
  const aud = insights.audience || {};
  const eng = insights.engagement || {};
  const growth = insights.growth || {};
  const look = insights.lookalikes || {};
  const posts = insights.posts || {};
  const reels = insights.reels || {};
  const engagers = aud.engagers || {};
  const currentAud = audienceSection === 'followers' ? aud : engagers;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'posts', label: 'Posts', icon: Instagram },
    { id: 'reels', label: 'Reels', icon: Play },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn insights-print-root">
      <style>{`
        @media print {
          .flex.h-screen > div:first-child,
          .flex.h-screen header,
          .flex.h-screen > .flex-1 > .bg-amber-500 {
            display: none !important;
          }
          .flex.h-screen .flex-1 > main {
            padding: 12px !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {viewMoreData && <ViewMoreModal {...viewMoreData} onClose={() => setViewMoreData(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print print:hidden">
        <button onClick={() => navigate('/insights')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Insights
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {insights.dataFreshnessStatus === 'STALE' && (
            <span className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /><span className="hidden sm:inline">Data may be outdated</span></span>
          )}
          <button onClick={handleShare} className="btn btn-secondary text-sm py-2"><Share2 className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Share</span></button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-secondary text-sm py-2"><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <button onClick={() => { handleExportJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Download className="w-4 h-4" />Export as JSON</button>
                <button onClick={() => { handleExportExcel(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Download className="w-4 h-4" />Export Excel</button>
                <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Download className="w-4 h-4" />Save as PDF</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn btn-secondary text-sm py-2"><UserPlus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Add to</span></button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <button onClick={handleAddToGroup} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><FolderPlus className="w-4 h-4" />Add to Group</button>
                <button onClick={handleAddToCampaign} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Users className="w-4 h-4" />Add to Campaign</button>
              </div>
            )}
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing} className="btn btn-primary disabled:opacity-50 text-sm py-2">
            {isRefreshing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div><span className="hidden sm:inline">Refreshing...</span></>
              : <><RefreshCw className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Refresh (1 Credit)</span></>}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <img src={insights.profilePictureUrl || `https://ui-avatars.com/api/?name=${insights.username}&background=6366f1&color=fff`} alt={insights.username} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover ring-2 sm:ring-4 ring-primary-100" />
            {insights.isVerified && <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white"><BadgeCheck className="w-3 h-3 sm:w-5 sm:h-5 text-white" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{insights.fullName || insights.username}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${insights.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' : insights.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {getPlatformIcon()}<span className="ml-1">{insights.platform}</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">@{insights.username}</p>
            {insights.bio && <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{insights.bio}</p>}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
              {insights.locationCountry && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-4 sm:h-4" />{insights.locationCountry}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" />Report: {new Date(insights.lastRefreshedAt).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3 sm:w-4 sm:h-4" />{formatNum(s.followerCount)} followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto hide-scrollbar print:hidden">
        <nav className="flex min-w-max">
          {tabs.map(tab => (
            <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 11 Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[
              { label: 'Followers', value: formatNum(s.followerCount), icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Avg Likes', value: formatNum(s.avgLikes), icon: Heart, color: 'bg-pink-50 text-pink-600' },
              { label: 'Avg Comments', value: formatNum(s.avgComments), icon: MessageCircle, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Engagement Rate', value: s.engagementRate ? `${Number(s.engagementRate).toFixed(2)}%` : 'N/A', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
              { label: 'Avg Reel Views', value: formatNum(s.avgReelViews), icon: Eye, color: 'bg-purple-50 text-purple-600' },
              { label: 'Avg Reel Likes', value: formatNum(s.avgReelLikes), icon: Heart, color: 'bg-rose-50 text-rose-600' },
              { label: 'Avg Reel Comments', value: formatNum(s.avgReelComments), icon: MessageCircle, color: 'bg-orange-50 text-orange-600' },
              { label: 'Brand Post ER', value: s.brandPostER ? `${Number(s.brandPostER).toFixed(2)}%` : 'N/A', icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
              { label: 'Posts Count', value: formatNum(s.postCount), icon: Instagram, color: 'bg-cyan-50 text-cyan-600' },
              { label: 'Hidden Likes', value: s.postsWithHiddenLikesPct != null ? `${Number(s.postsWithHiddenLikesPct).toFixed(1)}%` : 'N/A', icon: Eye, color: 'bg-gray-50 text-gray-600' },
              { label: 'Location', value: insights.locationCountry || 'N/A', icon: MapPin, color: 'bg-teal-50 text-teal-600' },
            ].map((stat, i) => (
              <div key={i} className="card p-3 text-center">
                <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2 ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Growth (6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growth.last6Months || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={v => formatNum(v)} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} name="Followers" dot={false} />
                  <Line type="monotone" dataKey="following" stroke="#8b5cf6" strokeWidth={2} name="Following" dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} name="Likes" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Word Cloud */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud</h3>
              {insights.wordCloud && insights.wordCloud.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center items-center min-h-[250px]">
                  {insights.wordCloud.map((word: any, i: number) => (
                    <span key={i} className="inline-block px-2 py-1 rounded-lg transition-transform hover:scale-110"
                      style={{ fontSize: `${Math.max(12, Math.min(36, word.value / 3))}px`, color: COLORS[i % COLORS.length], fontWeight: word.value > 60 ? 700 : 400, opacity: 0.7 + (word.value / 300) }}>
                      {word.text}
                    </span>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-center py-16">No word cloud data available</p>}
            </div>

            {/* Influencer Lookalikes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Lookalikes</h3>
              {look.influencer && look.influencer.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Username</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Full Name</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Similarity</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {look.influencer.map((l: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-primary-600 font-medium">@{l.username}</td>
                          <td className="px-3 py-2 text-gray-700">{l.fullName || '-'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNum(l.followers)}</td>
                          <td className="px-3 py-2 text-right"><span className="text-green-600 font-medium">{(l.similarity * 100).toFixed(0)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-gray-500 text-center py-8">No lookalike data available</p>}
            </div>

            {/* Audience Lookalikes */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Lookalikes</h3>
              {look.audience && look.audience.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Username</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Full Name</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Overlap</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {look.audience.map((l: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-primary-600 font-medium">@{l.username}</td>
                          <td className="px-3 py-2 text-gray-700">{l.fullName || '-'}</td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNum(l.followers)}</td>
                          <td className="px-3 py-2 text-right"><span className="text-blue-600 font-medium">{(l.overlap * 100).toFixed(0)}%</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-gray-500 text-center py-8">No audience lookalike data available</p>}
            </div>

            {/* Brand Affinity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Brand Affinity</h3>
              {insights.brandAffinity && insights.brandAffinity.length > 0 ? (
                <div className="space-y-3">
                  {insights.brandAffinity.slice(0, 5).map((b: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24 truncate">{b.brand}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.min(b.percentage * 4, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                      <span className="text-sm font-medium w-12 text-right">{b.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-center py-8">No brand affinity data</p>}
            </div>

            {/* Influencer Interests */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Interests</h3>
              {insights.interests && insights.interests.length > 0 ? (
                <div className="space-y-3">
                  {insights.interests.slice(0, 5).map((int: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-28 truncate">{int.category}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.min(int.percentage * 2, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                      <span className="text-sm font-medium w-12 text-right">{int.percentage.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-gray-500 text-center py-8">No interest data</p>}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ENGAGEMENT TAB ==================== */}
      {activeTab === 'engagement' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ER Distribution Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Rate Distribution</h3>
              <p className="text-sm text-gray-500 mb-4">Number of similar influencers by engagement rate range</p>
              {eng.rateDistribution && eng.rateDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={eng.rateDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Influencers" />
                    </BarChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Engagement Rate Distribution', columns: [{ key: 'range', label: 'ER Range' }, { key: 'count', label: 'Similar Influencers' }], data: eng.rateDistribution, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">
                    View More <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No distribution data</p>}
            </div>

            {/* ER Rate Circle */}
            <div className="card p-6 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Engagement Rate</h3>
              <div className="w-40 h-40 relative mb-4">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="68" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                  <circle cx="80" cy="80" r="68" stroke="#6366f1" strokeWidth="14" fill="none" strokeDasharray={`${Math.min((s.engagementRate || 0) * 42.7, 427)} 427`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {s.engagementRate ? `${Number(s.engagementRate).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {s.engagementRate > 3 ? 'Above average engagement' : s.engagementRate > 1 ? 'Average engagement' : 'Below average engagement'}
              </p>
            </div>
          </div>

          {/* Engagement Spread Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Likes Spread (Last 150 Posts)</h3>
              {eng.likesSpread && eng.likesSpread.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eng.likesSpread.slice(-50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Likes History', columns: [{ key: 'date', label: 'Date' }, { key: 'likes', label: 'Likes' }, { key: 'postUrl', label: 'Post Link' }], data: eng.likesSpread, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No likes spread data</p>}
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments Spread (Last 150 Posts)</h3>
              {eng.commentsSpread && eng.commentsSpread.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eng.commentsSpread.slice(-50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Line type="monotone" dataKey="comments" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Comments History', columns: [{ key: 'date', label: 'Date' }, { key: 'comments', label: 'Comments' }, { key: 'postUrl', label: 'Post Link' }], data: eng.commentsSpread, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No comments spread data</p>}
            </div>
          </div>

          {/* Popular Hashtags */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Hashtags</h3>
            {eng.topHashtags && eng.topHashtags.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {eng.topHashtags.slice(0, 5).map((h: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                      <Hash className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="font-medium text-gray-900 text-sm truncate">{h.tag}</p>
                      <p className="text-xs text-gray-500 mt-1">{h.usagePercentage?.toFixed(1) || 0}% usage</p>
                      <p className="text-xs text-gray-400">{h.count || 0} posts</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setViewMoreData({ title: 'All Hashtags', columns: [{ key: 'tag', label: 'Hashtag' }, { key: 'usagePercentage', label: 'Usage %' }, { key: 'count', label: 'Post Count' }], data: eng.topHashtags, onClose: () => setViewMoreData(null) })}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Hashtags <ChevronRight className="w-4 h-4" /></button>
              </>
            ) : <p className="text-gray-500 text-center py-8">No hashtag data</p>}
          </div>
        </div>
      )}

      {/* ==================== AUDIENCE TAB ==================== */}
      {activeTab === 'audience' && (
        <div className="space-y-6">
          {/* Followers/Engagers Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
            <button type="button" onClick={() => setAudienceSection('followers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${audienceSection === 'followers' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Followers</button>
            <button type="button" onClick={() => setAudienceSection('engagers')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${audienceSection === 'engagers' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Engagers</button>
          </div>

          {/* Credibility & Notable Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 mx-auto relative mb-3">
                <svg className="w-24 h-24 transform -rotate-90"><circle cx="48" cy="48" r="42" stroke="#e5e7eb" strokeWidth="10" fill="none" /><circle cx="48" cy="48" r="42" stroke="#22c55e" strokeWidth="10" fill="none" strokeDasharray={`${(currentAud.credibility || aud.credibility || 0) * 264} 264`} strokeLinecap="round" /></svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-600">{currentAud.credibility ? `${(currentAud.credibility * 100).toFixed(0)}%` : aud.credibility ? `${(aud.credibility * 100).toFixed(0)}%` : 'N/A'}</span>
              </div>
              <p className="font-semibold text-gray-900">{audienceSection === 'followers' ? 'Followers Credibility' : 'Engagers Credibility'}</p>
              <p className="text-xs text-gray-500 mt-1">Based on avatar, bio, post count & follow ratio</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-5xl font-bold text-blue-600 mb-3">
                {audienceSection === 'followers'
                  ? (aud.notableFollowersPct ? `${Number(aud.notableFollowersPct).toFixed(1)}%` : 'N/A')
                  : (currentAud.notableEngagersPct ? `${Number(currentAud.notableEngagersPct).toFixed(1)}%` : 'N/A')}
              </p>
              <p className="font-semibold text-gray-900">{audienceSection === 'followers' ? 'Notable Followers' : 'Notable Engagers'}</p>
              <p className="text-xs text-gray-500 mt-1">{audienceSection === 'followers' ? 'Followers who are influencers' : 'Engagers who are influencers'}</p>
            </div>
          </div>

          {/* Credibility Distribution */}
          {currentAud.credibilityDistribution && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Credibility</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={currentAud.credibilityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <button onClick={() => setViewMoreData({ title: 'Audience Credibility', columns: [{ key: 'range', label: 'Credibility %' }, { key: 'count', label: 'Influencer Accounts' }], data: currentAud.credibilityDistribution, onClose: () => setViewMoreData(null) })}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Audience Type Pie */}
            {currentAud.audienceTypes && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Type</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie data={currentAud.audienceTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="percentage" label={({ type, percentage }: any) => `${type}: ${percentage}%`}>
                      {currentAud.audienceTypes.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Location with Tabs */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit mb-4 print:hidden">
                {(['country', 'state', 'city'] as const).map(t => (
                  <button type="button" key={t} onClick={() => setLocationTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${locationTab === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>{t}</button>
                ))}
              </div>
              {(() => {
                const locData = locationTab === 'country' ? currentAud.topCountries
                  : locationTab === 'state' ? currentAud.topStates
                  : currentAud.topCities;
                const nameKey = locationTab === 'country' ? 'country' : locationTab === 'state' ? 'state' : 'city';
                if (!locData || locData.length === 0) return <p className="text-gray-500 text-center py-8">No location data</p>;
                return (
                  <>
                    <div className="space-y-2">
                      {locData.slice(0, 5).map((loc: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm text-gray-700 flex-1 truncate">{loc[nameKey]}</span>
                          <span className="text-sm font-medium w-12 text-right">{loc.percentage}%</span>
                          <span className="text-xs text-gray-400 w-16 text-right">{formatNum(loc.followers)}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setViewMoreData({
                      title: `${audienceSection === 'followers' ? 'Followers' : 'Engagers'} by ${locationTab}`,
                      columns: [{ key: nameKey, label: locationTab.charAt(0).toUpperCase() + locationTab.slice(1) }, { key: 'followers', label: 'Count' }, { key: 'percentage', label: '%' }, { key: 'engagements', label: 'Engagements' }],
                      data: locData, onClose: () => setViewMoreData(null)
                    })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Split */}
            {currentAud.genderSplit && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Split</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie data={[{ name: 'Female', value: currentAud.genderSplit.female }, { name: 'Male', value: currentAud.genderSplit.male }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      <Cell fill="#ec4899" /><Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Age & Gender */}
            {currentAud.ageGroups && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age & Gender Split</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={currentAud.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#6366f1" stackId="a" name="Male" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="female" fill="#ec4899" stackId="a" name="Female" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <button onClick={() => setViewMoreData({
                  title: 'Age & Gender Split',
                  columns: [{ key: 'range', label: 'Age Range' }, { key: 'percentage', label: 'Total %' }, { key: 'male', label: 'Male %' }, { key: 'female', label: 'Female %' }],
                  data: currentAud.ageGroups, onClose: () => setViewMoreData(null)
                })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* Reachability */}
          {currentAud.reachability && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Reachability</h3>
              <p className="text-sm text-gray-500 mb-4">Followers grouped by number of influencers they follow</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '< 500', value: currentAud.reachability.below500, color: 'bg-green-50 text-green-700', desc: 'Most likely to see posts' },
                  { label: '500-1000', value: currentAud.reachability['500to1000'], color: 'bg-blue-50 text-blue-700', desc: 'Moderate reach' },
                  { label: '1000-1500', value: currentAud.reachability['1000to1500'], color: 'bg-amber-50 text-amber-700', desc: 'Lower reach' },
                  { label: '> 1500', value: currentAud.reachability.above1500, color: 'bg-red-50 text-red-700', desc: 'Unlikely to see posts' },
                ].map((r, i) => (
                  <div key={i} className={`p-4 rounded-xl ${r.color} text-center`}>
                    <p className="text-2xl font-bold">{r.value}%</p>
                    <p className="font-medium text-sm mt-1">Following {r.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notable Followers/Engagers */}
          {(() => {
            const notable = audienceSection === 'followers' ? currentAud.notableFollowers : currentAud.notableEngagers;
            if (!notable || notable.length === 0) return null;
            return (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notable {audienceSection === 'followers' ? 'Followers' : 'Engagers'}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Username</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Full Name</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Engagements</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {notable.slice(0, 5).map((n: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-primary-600 font-medium">@{n.username}</td>
                          <td className="px-3 py-2 text-gray-700">{n.fullName || '-'}</td>
                          <td className="px-3 py-2 text-right">{formatNum(n.followers)}</td>
                          <td className="px-3 py-2 text-right">{formatNum(n.engagements)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setViewMoreData({
                  title: `Notable ${audienceSection === 'followers' ? 'Followers' : 'Engagers'}`,
                  columns: [{ key: 'username', label: 'Username' }, { key: 'fullName', label: 'Name' }, { key: 'followers', label: 'Followers' }, { key: 'engagements', label: 'Engagements' }],
                  data: notable, onClose: () => setViewMoreData(null)
                })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View All <ChevronRight className="w-4 h-4" /></button>
              </div>
            );
          })()}

          {/* Audience Brand Affinity */}
          {currentAud.brandAffinity && currentAud.brandAffinity.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Brand Affinity</h3>
              <div className="space-y-3">
                {currentAud.brandAffinity.slice(0, 5).map((b: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 truncate">{b.brand}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.min(b.percentage * 4, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                    <span className="text-sm font-medium w-12 text-right">{b.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setViewMoreData({
                title: 'Audience Brand Affinity',
                columns: [{ key: 'brand', label: 'Brand' }, { key: 'followers', label: 'Followers' }, { key: 'likes', label: 'Likes' }, { key: 'followersAffinity', label: 'Followers Affinity' }, { key: 'engagersAffinity', label: 'Engagers Affinity' }],
                data: currentAud.brandAffinity, onClose: () => setViewMoreData(null)
              })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Brands <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {/* Audience Interests */}
          {currentAud.interests && currentAud.interests.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Interests</h3>
              <div className="space-y-3">
                {currentAud.interests.slice(0, 5).map((int: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32 truncate">{int.category}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.min(int.percentage * 2, 100)}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                    <span className="text-sm font-medium w-12 text-right">{int.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setViewMoreData({
                title: 'Audience Interests',
                columns: [{ key: 'category', label: 'Interest Category' }, { key: 'followers', label: 'Followers' }, { key: 'likes', label: 'Likes' }, { key: 'followersAffinity', label: 'Followers Affinity' }, { key: 'engagersAffinity', label: 'Engagers Affinity' }],
                data: currentAud.interests, onClose: () => setViewMoreData(null)
              })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Interests <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* ==================== POSTS TAB ==================== */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
            {([['popular', 'Top Posts'], ['sponsored', 'Sponsored'], ['recent', 'Recent Posts']] as const).map(([key, label]) => (
              <button type="button" key={key} onClick={() => setPostCategory(key as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${postCategory === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>
            ))}
          </div>
          {(() => {
            const postList = posts[postCategory] || [];
            if (postList.length === 0) return (
              <div className="card p-12 text-center"><Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No {postCategory} posts data</h3>
                <p className="text-gray-500 mt-2">Posts data will be available after refresh</p></div>
            );
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {postList.map((post: any, i: number) => (
                  <a key={post.id || i} href={post.url || '#'} target="_blank" rel="noopener noreferrer" className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow block">
                    <div className="relative aspect-square bg-gray-100">
                      {post.imageUrl || post.thumbnail ? (
                        <img src={post.imageUrl || post.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Instagram className="w-12 h-12 text-gray-300" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                        <div className="text-white text-center"><Heart className="w-6 h-6 mx-auto mb-1" /><p className="font-semibold">{formatNum(post.likes)}</p></div>
                        <div className="text-white text-center"><MessageCircle className="w-6 h-6 mx-auto mb-1" /><p className="font-semibold">{formatNum(post.comments)}</p></div>
                      </div>
                      {post.url && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-5 h-5 text-white" /></div>}
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{post.caption || 'No caption'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{post.postedAt}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(post.likes)}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNum(post.comments)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ==================== REELS TAB ==================== */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
            {([['popular', 'Top Reels'], ['recent', 'Recent Reels']] as const).map(([key, label]) => (
              <button type="button" key={key} onClick={() => setReelCategory(key as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reelCategory === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>
            ))}
          </div>
          {(() => {
            const reelList = reels[reelCategory] || [];
            if (reelList.length === 0) return (
              <div className="card p-12 text-center"><Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No {reelCategory} reels data</h3>
                <p className="text-gray-500 mt-2">Reels data will be available after refresh</p></div>
            );
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {reelList.map((reel: any, i: number) => (
                  <a key={reel.id || i} href={reel.url || '#'} target="_blank" rel="noopener noreferrer" className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow block">
                    <div className="relative aspect-[9/16] bg-gray-100">
                      {reel.thumbnail ? (
                        <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Play className="w-12 h-12 text-gray-300" /></div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <div className="text-white text-center"><Eye className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.views)}</p></div>
                        <div className="text-white text-center"><Heart className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.likes)}</p></div>
                        <div className="text-white text-center"><MessageCircle className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.comments)}</p></div>
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1"><Play className="w-3 h-3" /> Reel</div>
                      {reel.url && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-5 h-5 text-white" /></div>}
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-600 line-clamp-2">{reel.caption || 'No caption'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">{reel.postedAt}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(reel.views)}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(reel.likes)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
