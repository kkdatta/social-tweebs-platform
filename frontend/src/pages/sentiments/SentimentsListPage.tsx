import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, Eye, MoreVertical,
  CheckCircle, Clock, AlertCircle, Loader, Download,
  Instagram, FileText, Users, ThumbsUp, ThumbsDown, Minus,
  Edit3, Share2, X
} from 'lucide-react';
import { sentimentsApi } from '../../services/api';

interface Report {
  id: string;
  title: string;
  platform: string;
  reportType: 'POST' | 'PROFILE';
  influencerName?: string;
  influencerAvatarUrl?: string;
  overallSentimentScore?: number;
  status: 'PENDING' | 'AGGREGATING' | 'IN_PROCESS' | 'COMPLETED' | 'FAILED';
  creditsUsed: number;
  createdAt: string;
}

interface DashboardStats {
  totalReports: number;
  completedReports: number;
  processingReports: number;
  pendingReports: number;
  failedReports: number;
  reportsThisMonth: number;
  avgSentimentScore: number;
}

export const SentimentsListPage = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Filters
  const [platform, setPlatform] = useState('ALL');
  const [reportType, setReportType] = useState('');
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
  }, [platform, reportType, status, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [reportsData, statsData] = await Promise.all([
        sentimentsApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          reportType: reportType || undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        sentimentsApi.getDashboard(),
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
      await sentimentsApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) return;
    if (!confirm(`Delete ${selectedReports.length} selected reports?`)) return;
    try {
      await sentimentsApi.bulkDelete(selectedReports);
      setSelectedReports([]);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete reports');
    }
  };

  const handleDownloadPdf = async (id: string, title: string) => {
    try {
      setDownloadingId(id);
      setOpenMenuId(null);
      const blob = await sentimentsApi.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_sentiment_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleSelectReport = (id: string) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROCESS: 'bg-blue-100 text-blue-800',
      AGGREGATING: 'bg-indigo-100 text-indigo-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      IN_PROCESS: <Loader className="w-3 h-3 animate-spin" />,
      AGGREGATING: <Loader className="w-3 h-3 animate-spin" />,
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

  const getSentimentIndicator = (score?: number) => {
    if (score === undefined || score === null) return null;
    
    if (score >= 60) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <ThumbsUp className="w-4 h-4" />
          <span className="font-medium">{score.toFixed(1)}%</span>
        </div>
      );
    } else if (score >= 40) {
      return (
        <div className="flex items-center gap-1 text-yellow-600">
          <Minus className="w-4 h-4" />
          <span className="font-medium">{score.toFixed(1)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <ThumbsDown className="w-4 h-4" />
          <span className="font-medium">{score.toFixed(1)}%</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Social Sentiments</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Analyze sentiment from posts and profiles (1 credit per URL)</p>
        </div>
        <button
          onClick={() => navigate('/sentiments/new')}
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
            <div className="text-lg sm:text-2xl font-bold text-emerald-600">{stats.avgSentimentScore.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Avg Score</div>
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
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Types</option>
            <option value="POST">Post</option>
            <option value="PROFILE">Profile</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROCESS">In Process</option>
            <option value="AGGREGATING">Aggregating</option>
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
                placeholder="Search by title or influencer..."
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
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-purple-700">{selectedReports.length} report(s) selected</span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>No sentiment reports found</p>
            <button
              onClick={() => navigate('/sentiments/new')}
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
                    checked={selectedReports.length === reports.length}
                    onChange={toggleSelectAll}
                    className="rounded text-purple-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sentiment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleSelectReport(report.id)}
                      className="rounded text-purple-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={report.influencerAvatarUrl || `https://ui-avatars.com/api/?name=${report.influencerName || 'U'}`}
                          alt={report.influencerName || ''}
                          className="w-10 h-10 rounded-full"
                        />
                        <Instagram className="absolute -bottom-1 -right-1 w-4 h-4 text-pink-500 bg-white rounded-full" />
                      </div>
                      <span className="font-medium text-gray-900">{report.influencerName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{report.title}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      report.reportType === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {report.reportType === 'POST' ? <FileText className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                      {report.reportType}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {getSentimentIndicator(report.overallSentimentScore)}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(report.status)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/sentiments/${report.id}`)}
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
                          {downloadingId === report.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <MoreVertical className="w-4 h-4" />
                          )}
                        </button>
                        
                        {openMenuId === report.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                navigate(`/sentiments/${report.id}`);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit Report
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(report.id, report.title)}
                              disabled={report.status !== 'COMPLETED'}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF
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
