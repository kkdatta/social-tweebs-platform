import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, RefreshCw, Trash2, Eye,
  Users, CheckCircle, Clock, AlertCircle,
  Instagram, Youtube, ChevronDown
} from 'lucide-react';
import { audienceOverlapApi } from '../../services/api';

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  profilePictureUrl?: string;
  followerCount: number;
}

interface Report {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'FAILED';
  overlapPercentage?: number;
  influencerCount: number;
  influencers: Influencer[];
  createdAt: string;
  createdById: string;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  inProcessReports: number;
  failedReports: number;
  reportsThisMonth: number;
  remainingQuota: number;
}

export const AudienceOverlapListPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [platform, setPlatform] = useState('ALL');
  const [status, setStatus] = useState('');
  const [createdBy, setCreatedBy] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [platform, status, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        audienceOverlapApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        audienceOverlapApi.getDashboard(),
      ]);
      setReports(reportsData.reports);
      setTotal(reportsData.total);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await audienceOverlapApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm('Retrying will cost 1 credit. Continue?')) return;
    try {
      await audienceOverlapApi.retry(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry report');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROCESS: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      IN_PROCESS: <RefreshCw className="w-3 h-3 animate-spin" />,
      PENDING: <Clock className="w-3 h-3" />,
      FAILED: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="hidden xs:inline">{status.replace('_', ' ')}</span>
      </span>
    );
  };

  const getPlatformIcon = (platform: string) => {
    return platform === 'INSTAGRAM' ? (
      <Instagram className="w-4 sm:w-5 h-4 sm:h-5 text-pink-500" />
    ) : (
      <Youtube className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Audience Overlap</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Compare audience overlap between influencers</p>
        </div>
        <button
          onClick={() => navigate('/audience-overlap/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.inProcessReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden sm:block">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.failedReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Failed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden sm:block">
            <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.reportsThisMonth}</div>
            <div className="text-xs sm:text-sm text-gray-500">This Month</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden lg:block">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.remainingQuota}</div>
            <div className="text-xs sm:text-sm text-gray-500">Remaining</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            {/* Filter Toggle for Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Desktop Filters */}
            <div className="hidden sm:flex gap-3">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROCESS">Processing</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>

              <select
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Reports</option>
                <option value="ME">My Reports</option>
                <option value="TEAM">Team</option>
              </select>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                Search
              </button>
            </div>
          </div>
          
          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden flex flex-wrap gap-2 pt-3 border-t border-gray-200">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="ALL">All Platforms</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="IN_PROCESS">Processing</option>
                <option value="FAILED">Failed</option>
              </select>

              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
              >
                Apply Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 px-4">
            <Users className="w-12 h-12 mb-4 text-gray-300" />
            <p>No reports found</p>
            <button
              onClick={() => navigate('/audience-overlap/new')}
              className="mt-4 text-purple-600 hover:text-purple-700 text-sm"
            >
              Create your first report
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="sm:hidden divide-y divide-gray-200">
              {reports.map((report) => (
                <div key={report.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {getPlatformIcon(report.platform)}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(report.status)}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">{report.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{report.influencerCount} influencers</span>
                          {report.status === 'COMPLETED' && report.overlapPercentage !== undefined && (
                            <span className="text-purple-600 font-medium">{report.overlapPercentage.toFixed(1)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/audience-overlap/${report.id}`)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(report.id, report.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop Table Layout */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overlap</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        {getPlatformIcon(report.platform)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {report.influencers.slice(0, 3).map((inf, idx) => (
                              <img
                                key={idx}
                                src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                                alt={inf.influencerName}
                                className="w-8 h-8 rounded-full border-2 border-white"
                              />
                            ))}
                            {report.influencerCount > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                                +{report.influencerCount - 3}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{report.title}</div>
                            <div className="text-sm text-gray-500">{report.influencerCount} influencers</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {report.status === 'COMPLETED' && report.overlapPercentage !== undefined ? (
                          <span className="text-lg font-semibold text-purple-600">
                            {report.overlapPercentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(report.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/audience-overlap/${report.id}`)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="View Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {report.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(report.id)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Retry"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(report.id, report.title)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
            </div>
          </>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
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
