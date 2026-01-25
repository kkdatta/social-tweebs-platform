import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Coins,
  Search,
  RefreshCw,
  Eye,
  Download,
  ArrowUpDown,
  ChevronDown,
  AlertCircle,
  Loader2,
  UserCheck
} from 'lucide-react';
import { creditsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TeamMemberUsage {
  userId: string;
  name: string;
  email: string;
  country: string;
  currentBalance: number;
  totalCreditsAdded: number;
  discoveryUsage: number;
  insightsUsage: number;
  otherUsage: number;
  lastActiveAt: string | null;
}

interface AnalyticsSummary {
  totalTeamMembers: number;
  totalCreditsAllocated: number;
  totalCreditsUsed: number;
  activeUsers: number;
  usageByModule: Record<string, number>;
}

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [usageLogs, setUsageLogs] = useState<TeamMemberUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [sortBy, setSortBy] = useState('lastActiveAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    loadUsageLogs();
  }, [searchQuery, page, sortBy, sortOrder]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const data = await creditsApi.getAnalyticsSummary();
      setSummary(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view analytics');
      } else {
        setError(err.response?.data?.message || 'Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsageLogs = async () => {
    try {
      setLogsLoading(true);
      const result = await creditsApi.getUsageLogs({
        search: searchQuery || undefined,
        page,
        limit: 15,
        sortBy,
        sortOrder,
      });
      setUsageLogs(result.data);
      setTotalLogs(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load usage logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1);
  };

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

  const getModuleLabel = (moduleType: string) => {
    const labels: Record<string, string> = {
      UNIFIED_BALANCE: 'Unified',
      DISCOVERY: 'Discovery',
      INSIGHTS: 'Insights',
      AUDIENCE_OVERLAP: 'Audience Overlap',
      TIE_BREAKER: 'Tie Breaker',
      SOCIAL_SENTIMENTS: 'Sentiments',
      INFLUENCER_COLLAB_CHECK: 'Collab Check',
      PAID_COLLABORATION: 'Paid Collab',
      CAMPAIGN_TRACKING: 'Campaigns',
      MENTION_TRACKING: 'Mentions',
      COMPETITION_ANALYSIS: 'Competition',
      INFLUENCER_GROUP: 'Groups',
      EXPORT: 'Export',
    };
    return labels[moduleType] || moduleType.replace(/_/g, ' ');
  };

  // Check if user has permission
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={loadSummary}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Usage Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor team credit usage and allocation
              </p>
            </div>
            <button
              onClick={() => { loadSummary(); loadUsageLogs(); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalTeamMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits Allocated</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalCreditsAllocated.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <Coins className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits Used</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalCreditsUsed.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <UserCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Users (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeUsers}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Usage by Module */}
        {summary && Object.keys(summary.usageByModule).length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Module</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(summary.usageByModule).map(([module, usage]) => (
                <div key={module} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">{getModuleLabel(module)}</p>
                  <p className="text-lg font-bold text-gray-900">{usage.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Team Credit Usage</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {logsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
              </div>
            ) : usageLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No team members found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
                    <th 
                      className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('currentBalance')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Balance
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('discoveryUsage')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Discovery
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('insightsUsage')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Insights
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th 
                      className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastActiveAt')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Last Active
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usageLogs.map((member) => (
                    <tr key={member.userId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900">{member.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.country || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                        {member.currentBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="text-blue-600">{member.discoveryUsage.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className="text-purple-600">{member.insightsUsage.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 text-right whitespace-nowrap">
                        {formatDate(member.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/analytics/${member.userId}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
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

          {/* Pagination */}
          {totalLogs > 15 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 15) + 1} - {Math.min(page * 15, totalLogs)} of {totalLogs}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
