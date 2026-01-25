import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, Eye, MoreVertical,
  CheckCircle, Clock, AlertCircle, Loader,
  Instagram, FileText, RefreshCw, Copy, Edit3, Hash, AtSign
} from 'lucide-react';
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
  avgEngagementRate: number;
  createdAt: string;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  inProgressReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  totalInfluencersAnalyzed: number;
  totalPostsAnalyzed: number;
  avgEngagementRate: number;
}

export const PaidCollaborationListPage = () => {
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
        paidCollaborationApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        paidCollaborationApi.getDashboard(),
      ]);
      setReports(reportsData.reports || []);
      setTotal(reportsData.total || 0);
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
      await paidCollaborationApi.delete(id);
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
        paidCollaborationApi.delete(id).catch(() => null)
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
    if (!confirm(`Retry "${title}"? This will cost 1 credit.`)) return;
    try {
      await paidCollaborationApi.retry(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry report');
    }
  };

  const handleCopyUrl = async (id: string) => {
    try {
      const result = await paidCollaborationApi.share(id, {});
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
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      IN_PROGRESS: <Loader className="w-3 h-3 animate-spin" />,
      PENDING: <Clock className="w-3 h-3" />,
      FAILED: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDate = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startDate} - ${endDate}`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'TIKTOK':
        return <div className="w-5 h-5 text-black font-bold text-xs flex items-center justify-center">TT</div>;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paid Collaboration</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Discover sponsored posts by hashtags/mentions (1 credit per report)</p>
        </div>
        <button
          onClick={() => navigate('/paid-collaboration/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.inProgressReports}</div>
            <div className="text-xs sm:text-sm text-gray-500">In Progress</div>
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
            <div className="text-lg sm:text-2xl font-bold text-indigo-600">{stats.totalInfluencersAnalyzed}</div>
            <div className="text-xs sm:text-sm text-gray-500">Influencers</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden lg:block">
            <div className="text-lg sm:text-2xl font-bold text-cyan-600">{stats.totalPostsAnalyzed}</div>
            <div className="text-xs sm:text-sm text-gray-500">Posts</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden lg:block">
            <div className="text-lg sm:text-2xl font-bold text-emerald-600">{(stats.avgEngagementRate || 0).toFixed(1)}%</div>
            <div className="text-xs sm:text-sm text-gray-500">Avg ER</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-4 px-4" aria-label="Tabs">
            {[
              { id: 'ALL', label: 'All Reports' },
              { id: 'ME', label: 'Created by Me' },
              { id: 'TEAM', label: 'Created by Team' },
              { id: 'SHARED', label: 'Shared with Me' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setCreatedBy(tab.id); setPage(1); }}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  createdBy === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

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
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, hashtag, or mention..."
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
            <p>No paid collaboration reports found</p>
            <button
              onClick={() => navigate('/paid-collaboration/new')}
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hashtags</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mentions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Range</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posts</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
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
                    {getPlatformIcon(report.platform)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-gray-900">{report.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(report.hashtags || []).slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          <Hash className="w-3 h-3 mr-0.5" />
                          {tag.replace('#', '')}
                        </span>
                      ))}
                      {report.hashtags?.length > 2 && (
                        <span className="text-xs text-gray-500">+{report.hashtags.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(report.mentions || []).slice(0, 2).map((mention, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          <AtSign className="w-3 h-3 mr-0.5" />
                          {mention.replace('@', '')}
                        </span>
                      ))}
                      {report.mentions?.length > 2 && (
                        <span className="text-xs text-gray-500">+{report.mentions.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {formatDateRange(report.dateRangeStart, report.dateRangeEnd)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{report.totalPosts}</td>
                  <td className="px-4 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/paid-collaboration/${report.id}`)}
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
                                navigate(`/paid-collaboration/${report.id}`);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              View Details
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
                              Copy Share URL
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
