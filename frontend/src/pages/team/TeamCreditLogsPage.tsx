import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface CreditLog {
  userId: string;
  userName: string;
  email: string;
  country: string;
  currentBalance: number;
  totalCreditsAdded: number;
  totalCreditsUsed: number;
  discoveryCreditsUsed: number;
  insightsCreditsUsed: number;
  lastActiveAt: string;
}

const TeamCreditLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await teamApi.getCreditLogs({
        search: searchQuery || undefined,
        page,
        limit,
      });
      setLogs(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load credit logs');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Name', 'Email', 'Country', 'Current Balance', 'Total Credits Added', 'Total Credits Used', 'Discovery Credits', 'Insights Credits', 'Last Active'];
    const rows = logs.map(l => [
      l.userName, l.email, l.country, l.currentBalance.toFixed(2),
      l.totalCreditsAdded.toFixed(2), l.totalCreditsUsed.toFixed(2),
      l.discoveryCreditsUsed.toFixed(2), l.insightsCreditsUsed.toFixed(2),
      formatDate(l.lastActiveAt),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-usage-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/team')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-600" />
                  Credit Usage Logs
                </h1>
                <p className="text-sm text-gray-500 mt-1">View credit usage by individual team members</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={logs.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={loadLogs}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Members Credit Usage ({total})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                <p className="text-gray-400 mt-2">Loading credit logs...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-500">{error}</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No credit usage data found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Current Balance</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Discovery</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Insights</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.userId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                            {log.userName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.country || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {log.currentBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="text-blue-600">{log.discoveryCreditsUsed.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="text-purple-600">{log.insightsCreditsUsed.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(log.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/team/credit-logs/${log.userId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
                        >
                          <Eye size={14} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {total > limit && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 px-2">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCreditLogsPage;
