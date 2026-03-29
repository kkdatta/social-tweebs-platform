import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, Eye,
  CheckCircle, Clock, AlertCircle, Loader,
  Instagram, Calendar, ChevronDown, MoreVertical, Pencil,
} from 'lucide-react';
import { customErApi } from '../../services/api';

interface Report {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  influencerAvatarUrl?: string;
  platform: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  postsCount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
}

export const CustomErListPage = () => {
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editModalReport, setEditModalReport] = useState<Report | null>(null);
  const [editReportName, setEditReportName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadData();
  }, [platform, status, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        customErApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        customErApi.getDashboard(),
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

  const openEditModal = (report: Report) => {
    setMenuOpenId(null);
    setEditModalReport(report);
    setEditReportName(report.influencerName);
  };

  const handleSaveReportName = async () => {
    if (!editModalReport || !editReportName.trim()) return;
    try {
      setSavingEdit(true);
      await customErApi.update(editModalReport.id, { influencerName: editReportName.trim() });
      setEditModalReport(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to rename report');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the report for "${name}"?`)) return;
    try {
      await customErApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
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
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      PROCESSING: <Loader className="w-3 h-3 animate-spin" />,
      PENDING: <Clock className="w-3 h-3" />,
      FAILED: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        <span className="hidden xs:inline">{status}</span>
      </span>
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${startDate} - ${endDate}`;
  };

  const RowActionsMenu = ({ report }: { report: Report }) => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpenId(menuOpenId === report.id ? null : report.id)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
        aria-label="Open actions"
      >
        <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
      {menuOpenId === report.id && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
          <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
            <button
              type="button"
              onClick={() => openEditModal(report)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4 shrink-0" /> Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setMenuOpenId(null);
                handleDelete(report.id, report.influencerName);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {editModalReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setEditModalReport(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
            role="dialog"
            aria-labelledby="list-edit-report-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="list-edit-report-title" className="text-lg font-semibold text-gray-900">
              Rename report
            </h2>
            <div>
              <label htmlFor="list-report-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                Report name
              </label>
              <input
                id="list-report-name-input"
                type="text"
                value={editReportName}
                onChange={(e) => setEditReportName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveReportName();
                  if (e.key === 'Escape') setEditModalReport(null);
                }}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditModalReport(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReportName}
                disabled={savingEdit || !editReportName.trim()}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {savingEdit ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Custom ER Calculator</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Calculate engagement rates for influencers (FREE)</p>
        </div>
        <button
          onClick={() => navigate('/custom-er/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.processingReports}</div>
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
                  placeholder="Search by influencer name..."
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
                <option value="TIKTOK">TikTok</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
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
                <option value="TIKTOK">TikTok</option>
              </select>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
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
            <Calendar className="w-12 h-12 mb-4 text-gray-300" />
            <p>No reports found</p>
            <button
              onClick={() => navigate('/custom-er/new')}
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
                      <div className="relative shrink-0">
                        <img
                          src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName}`}
                          alt={report.influencerName}
                          className="w-10 h-10 rounded-full"
                        />
                        <Instagram className="absolute -bottom-1 -right-1 w-4 h-4 text-pink-500 bg-white rounded-full" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusBadge(report.status)}
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">{report.influencerName}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>{report.postsCount} posts</span>
                          <span>•</span>
                          <span>{formatDateRange(report.dateRangeStart, report.dateRangeEnd)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate(`/custom-er/${report.id}`)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="View report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <RowActionsMenu report={report} />
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posts</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName}`}
                              alt={report.influencerName}
                              className="w-10 h-10 rounded-full"
                            />
                            <Instagram className="absolute -bottom-1 -right-1 w-4 h-4 text-pink-500 bg-white rounded-full" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{report.influencerName}</div>
                            {report.influencerUsername && (
                              <div className="text-sm text-gray-500">@{report.influencerUsername}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateRange(report.dateRangeStart, report.dateRangeEnd)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{report.postsCount}</span>
                        <span className="text-gray-500 text-sm ml-1">posts</span>
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
                            type="button"
                            onClick={() => navigate(`/custom-er/${report.id}`)}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="View Report"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <RowActionsMenu report={report} />
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
