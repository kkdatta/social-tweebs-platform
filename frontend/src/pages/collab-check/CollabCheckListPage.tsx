import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, Eye, MoreVertical,
  CheckCircle, Clock, AlertCircle, Loader,
  Instagram, FileText, RefreshCw, Copy, Edit3
} from 'lucide-react';
import { collabCheckApi } from '../../services/api';

interface Report {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  timePeriod: string;
  queries: string[];
  totalPosts: number;
  totalFollowers: number;
  creditsUsed: number;
  createdAt: string;
  influencers?: Array<{
    id: string;
    influencerName: string;
    influencerUsername?: string;
    profilePictureUrl?: string;
    followerCount: number;
    postsCount: number;
  }>;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
}

export const CollabCheckListPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());
  
  // Filters
  const [platform, setPlatform] = useState('ALL');
  const [status, setStatus] = useState('');
  const [createdBy, setCreatedBy] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    loadData();
  }, [platform, status, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        collabCheckApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        collabCheckApi.getDashboard(),
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
      await collabCheckApi.delete(id);
      setSelectedReports(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedReports.size} report(s)?`)) return;
    
    try {
      const deletePromises = Array.from(selectedReports).map(id => 
        collabCheckApi.delete(id).catch(() => null)
      );
      await Promise.all(deletePromises);
      setSelectedReports(new Set());
      loadData();
    } catch (err: any) {
      alert('Some reports could not be deleted');
    }
  };

  const toggleSelectReport = (id: string) => {
    setSelectedReports(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedReports.size === reports.length) {
      setSelectedReports(new Set());
    } else {
      setSelectedReports(new Set(reports.map(r => r.id)));
    }
  };

  const handleRetry = async (id: string, title: string) => {
    if (!confirm(`Retry "${title}"? This will cost 1 credit per influencer.`)) return;
    try {
      await collabCheckApi.retry(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry report');
    }
  };

  const handleCopyUrl = async (id: string) => {
    try {
      const result = await collabCheckApi.share(id, {});
      if (result.shareUrl) {
        navigator.clipboard.writeText(window.location.origin + result.shareUrl);
        alert('Share URL copied to clipboard!');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to copy URL');
    }
    setOpenMenuId(null);
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
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const formatTimePeriod = (period: string) => {
    const map: Record<string, string> = {
      '1_MONTH': '1 Month',
      '3_MONTHS': '3 Months',
      '6_MONTHS': '6 Months',
      '1_YEAR': '1 Year',
    };
    return map[period] || period;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Influencer Collab Check</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Analyze influencer collaborations with brands (1 credit per influencer)</p>
        </div>
        <button
          onClick={() => navigate('/collab-check/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
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
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden lg:block">
            <div className="text-lg sm:text-2xl font-bold text-indigo-600">{stats.totalPostsAnalyzed}</div>
            <div className="text-xs sm:text-sm text-gray-500">Posts</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden lg:block">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.avgEngagementRate.toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-gray-500">Avg ER</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
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
            <option value="ME">Created by Me</option>
            <option value="TEAM">Team Reports</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button onClick={handleSearch} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Search
          </button>
          
          {selectedReports.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedReports.size})
            </button>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>No collab check reports found</p>
            <button
              onClick={() => navigate('/collab-check/new')}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Create your first report
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedReports.size === reports.length && reports.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Queries</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className={`hover:bg-gray-50 ${selectedReports.has(report.id) ? 'bg-purple-50' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.has(report.id)}
                      onChange={() => toggleSelectReport(report.id)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <Instagram className="w-5 h-5 text-pink-500" />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {report.influencers && report.influencers.length > 0 ? (
                        <>
                          <div className="flex -space-x-2">
                            {report.influencers.slice(0, 3).map((inf, idx) => (
                              <img
                                key={inf.id}
                                src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                                alt={inf.influencerName}
                                className="w-8 h-8 rounded-full border-2 border-white"
                                style={{ zIndex: 3 - idx }}
                              />
                            ))}
                          </div>
                          {report.influencers.length > 3 && (
                            <span className="text-xs text-gray-500">+{report.influencers.length - 3}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{report.title}</div>
                    <div className="text-xs text-gray-500">{formatTimePeriod(report.timePeriod)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(report.queries || []).slice(0, 2).map((q, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {q}
                        </span>
                      ))}
                      {report.queries?.length > 2 && (
                        <span className="text-xs text-gray-500">+{report.queries.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{report.totalPosts}</td>
                  <td className="px-4 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/collab-check/${report.id}`)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* 3-dots Menu */}
                      <div className="relative" ref={openMenuId === report.id ? menuRef : null}>
                        <button
                          onClick={() => setOpenMenuId(openMenuId === report.id ? null : report.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {openMenuId === report.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/collab-check/${report.id}`);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit Report
                            </button>
                            {report.status === 'FAILED' && (
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  handleRetry(report.id, report.title);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <RefreshCw className="w-4 h-4" />
                                Retry Report
                              </button>
                            )}
                            <button
                              onClick={() => handleCopyUrl(report.id)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-4 h-4" />
                              Copy URL
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(report.id, report.title);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Report
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} reports
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
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
