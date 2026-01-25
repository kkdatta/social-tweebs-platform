import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  FileText,
  BarChart3,
  Instagram,
  Youtube,
  CheckSquare,
  Square,
  X,
  Check,
} from 'lucide-react';
import { generatedReportsApi } from '../../services/api';

type ReportTab = 'INFLUENCER_DISCOVERY' | 'PAID_COLLABORATION';

interface DiscoveryExport {
  id: string;
  title: string;
  platform: string;
  exportFormat: string;
  profileCount: number;
  fileUrl?: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
  downloadedAt?: string;
  createdById: string;
  createdByName?: string;
}

interface PaidCollaborationReport {
  id: string;
  title: string;
  platform: string;
  reportType: string;
  exportFormat: string;
  influencerCount: number;
  fileUrl?: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
  downloadedAt?: string;
  createdById: string;
  createdByName?: string;
}

interface DashboardStats {
  totalDiscoveryExports: number;
  totalPaidCollaborationReports: number;
  totalReports: number;
  reportsThisMonth: number;
  byPlatform: Record<string, number>;
}

export const GeneratedReportsListPage = () => {
  // State
  const [activeTab, setActiveTab] = useState<ReportTab>('INFLUENCER_DISCOVERY');
  const [discoveryExports, setDiscoveryExports] = useState<DiscoveryExport[]>([]);
  const [paidCollabReports, setPaidCollabReports] = useState<PaidCollaborationReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [platform, setPlatform] = useState('ALL');
  const [createdBy, setCreatedBy] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success',
  });

  useEffect(() => {
    loadData();
    loadStats();
  }, [activeTab, platform, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await generatedReportsApi.list({
        tab: activeTab,
        platform: platform !== 'ALL' ? platform : undefined,
        createdBy: createdBy as 'ALL' | 'ME' | 'TEAM',
        search: search || undefined,
        page,
        limit: 10,
      });

      if (activeTab === 'INFLUENCER_DISCOVERY') {
        setDiscoveryExports(data.discoveryExports || []);
      } else {
        setPaidCollabReports(data.paidCollaborationReports || []);
      }
      setTotal(data.total);
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to load reports:', err);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await generatedReportsApi.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleTabChange = (tab: ReportTab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds([]);
    setSearch('');
  };

  const handleDownload = async (id: string) => {
    try {
      const result = await generatedReportsApi.download(activeTab, id);
      if (result.fileUrl) {
        // In production, this would trigger a download
        window.open(result.fileUrl, '_blank');
      }
      showToast(result.message || 'Your report has been downloaded.');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to download report', 'error');
    }
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) {
      showToast('Report title cannot be empty', 'error');
      return;
    }

    try {
      const result = await generatedReportsApi.rename(activeTab, id, renameValue);
      showToast(result.message || 'Report renamed successfully.');
      setRenamingId(null);
      setRenameValue('');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to rename report', 'error');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await generatedReportsApi.delete(activeTab, id);
      showToast(result.message || 'Report deleted successfully.');
      loadData();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete report', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} report(s)? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const result = await generatedReportsApi.bulkDelete(activeTab, selectedIds);
      showToast(result.message || `${result.deletedCount} report(s) deleted successfully.`);
      setSelectedIds([]);
      loadData();
      loadStats();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete reports', 'error');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const currentReports =
      activeTab === 'INFLUENCER_DISCOVERY' ? discoveryExports : paidCollabReports;
    if (selectedIds.length === currentReports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentReports.map((r) => r.id));
    }
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toUpperCase()) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFormatBadge = (format: string) => {
    const styles: Record<string, string> = {
      CSV: 'bg-green-100 text-green-800',
      XLSX: 'bg-blue-100 text-blue-800',
      JSON: 'bg-yellow-100 text-yellow-800',
      PDF: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[format] || 'bg-gray-100 text-gray-800'}`}>
        {format}
      </span>
    );
  };

  const currentReports =
    activeTab === 'INFLUENCER_DISCOVERY' ? discoveryExports : paidCollabReports;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-4 right-4 z-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Generated Reports</h1>
          <p className="text-sm text-gray-600 hidden sm:block">
            View and manage your exported reports from Influencer Discovery and Paid Collaboration
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalReports}</div>
                <div className="text-xs sm:text-sm text-gray-500">Total</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalDiscoveryExports}</div>
                <div className="text-sm text-gray-500">Discovery Exports</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalPaidCollaborationReports}
                </div>
                <div className="text-sm text-gray-500">Paid Collab Reports</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.reportsThisMonth}</div>
                <div className="text-sm text-gray-500">This Month</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => handleTabChange('INFLUENCER_DISCOVERY')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'INFLUENCER_DISCOVERY'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Influencer Discovery
            </div>
          </button>
          <button
            onClick={() => handleTabChange('PAID_COLLABORATION')}
            className={`flex-1 px-6 py-4 text-sm font-medium ${
              activeTab === 'PAID_COLLABORATION'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Paid Collaboration
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <select
              value={platform}
              onChange={(e) => {
                setPlatform(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Platforms</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="TIKTOK">TikTok</option>
            </select>

            <select
              value={createdBy}
              onChange={(e) => {
                setCreatedBy(e.target.value);
                setPage(1);
              }}
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
                  placeholder="Search by report name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Search
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : currentReports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p>No reports found</p>
            <p className="text-sm text-gray-400 mt-2">
              {activeTab === 'INFLUENCER_DISCOVERY'
                ? 'Export influencer profiles from Influencer Discovery to see them here'
                : 'Generate Paid Collaboration reports to see them here'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {selectedIds.length === currentReports.length ? (
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Platform
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Report Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Format
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {activeTab === 'INFLUENCER_DISCOVERY' ? 'Profiles' : 'Influencers'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentReports.map((report: any) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleSelection(report.id)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      {selectedIds.includes(report.id) ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">{getPlatformIcon(report.platform)}</td>
                  <td className="px-4 py-4">
                    {renamingId === report.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(report.id);
                            if (e.key === 'Escape') cancelRename();
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(report.id)}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelRename}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-gray-900">{report.title}</div>
                        {report.createdByName && (
                          <div className="text-xs text-gray-500">by {report.createdByName}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">{getFormatBadge(report.exportFormat)}</td>
                  <td className="px-4 py-4 text-gray-900">
                    {activeTab === 'INFLUENCER_DISCOVERY'
                      ? report.profileCount
                      : report.influencerCount}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(report.id)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                        title="Re-download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => startRename(report.id, report.title)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Rename"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
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
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, total)} of {total} reports
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
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
