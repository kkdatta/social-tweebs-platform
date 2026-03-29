import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Trash2,
  Share2,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';

interface Report {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  totalBrands: number;
  totalPosts: number;
  totalInfluencers: number;
  creditsUsed: number;
  createdAt: string;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  inProgressReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  totalBrandsAnalyzed: number;
  totalInfluencersAnalyzed: number;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
}

const CompetitionAnalysisListPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ME' | 'TEAM' | 'SHARED'>('ME');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [activeTab, statusFilter, platformFilter, page]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        createdBy: activeTab,
        page: page.toString(),
        limit: '10',
      });
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (platformFilter && platformFilter !== 'ALL') params.append('platform', platformFilter);

      const response = await api.get(`/api/v1/competition-analysis?${params}`);
      setReports(response.data.reports || []);
      setHasMore(response.data.hasMore || false);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/v1/competition-analysis/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchReports();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/api/v1/competition-analysis/${id}`);
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.post(`/api/v1/competition-analysis/${id}/retry`);
      fetchReports();
    } catch (error) {
      console.error('Failed to retry report:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Completed' },
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />, label: 'In Progress' },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3.5 h-3.5" />, label: 'Pending' },
      FAILED: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-3.5 h-3.5" />, label: 'Failed' },
    };
    const badge = badges[status] || badges.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      INSTAGRAM: 'bg-pink-100 text-pink-800',
      TIKTOK: 'bg-gray-100 text-gray-800',
      YOUTUBE: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[platform] || 'bg-gray-100 text-gray-800'}`}>
        {platform}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Competition Analysis</h1>
          <p className="text-gray-500 mt-1">Compare brand influencer marketing performance</p>
        </div>
        <button
          onClick={() => navigate('/competition-analysis/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Report
        </button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalReports}</p>
                <p className="text-xs text-gray-500">Total Reports</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.completedReports}</p>
                <p className="text-xs text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBrandsAnalyzed}</p>
                <p className="text-xs text-gray-500">Brands Analyzed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalInfluencersAnalyzed}</p>
                <p className="text-xs text-gray-500">Influencers</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.avgEngagementRate.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">Avg ER</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-6 px-6">
            {(['ME', 'TEAM', 'SHARED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'ME' ? 'Created by Me' : tab === 'TEAM' ? 'Created by Team' : 'Shared with Me'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
              </select>
              <select
                value={platformFilter}
                onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>
          )}
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
              <button
                onClick={() => navigate('/competition-analysis/create')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Create Your First Report
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platforms</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brands</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{report.title}</p>
                        <p className="text-sm text-gray-500">
                          {report.totalInfluencers} influencers • {report.totalPosts} posts
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {report.platforms.map((p) => getPlatformBadge(p))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {report.dateRangeStart && report.dateRangeEnd
                        ? `${report.dateRangeStart} - ${report.dateRangeEnd}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{report.totalBrands}</td>
                    <td className="px-6 py-4">{getStatusBadge(report.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/competition-analysis/${report.id}`)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="View Report"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.status === 'FAILED' && (
                          <button
                            onClick={() => handleRetry(report.id)}
                            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                            title="Retry"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {reports.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

export default CompetitionAnalysisListPage;
