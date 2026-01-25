import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  User,
  Calendar,
  Coins,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { creditsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface UserDetail {
  userId: string;
  name: string;
  email: string;
  currentBalance: number;
  totalCreditsAdded: number;
  totalCreditsUsed: number;
  accountValidUntil: string;
  daysRemaining: number;
}

interface MonthlyBreakdown {
  month: string;
  moduleType: string;
  transactionType: string;
  totalAmount: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  transactionType: string;
  amount: number;
  moduleType: string;
  actionType: string;
  comment: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export const AnalyticsDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'CREDIT' | 'DEBIT' | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    if (userId) {
      loadUserDetail();
    }
  }, [userId, transactionTypeFilter, moduleFilter, page]);

  const loadUserDetail = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const result = await creditsApi.getUserCreditDetail(userId, {
        transactionType: transactionTypeFilter,
        moduleType: moduleFilter || undefined,
        page,
        limit: 20,
      });
      setUserDetail(result.user);
      setMonthlyBreakdown(result.monthlyBreakdown);
      setTransactions(result.transactions);
      setTotalTransactions(result.total);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have permission to view this user\'s details');
      } else {
        setError(err.response?.data?.message || 'Failed to load user details');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      MANUAL_ALLOCATION: 'Credit Allocation',
      INFLUENCER_SEARCH: 'Influencer Search',
      INFLUENCER_UNBLUR: 'Profile Unblur',
      INFLUENCER_INSIGHT: 'Insight Unlock',
      INFLUENCER_EXPORT: 'Export Influencers',
      PROFILE_UNLOCK: 'Profile Unlock',
      REPORT_GENERATION: 'Report Generation',
      REPORT_REFRESH: 'Report Refresh',
      ACCOUNT_EXPIRY: 'Account Expiry',
      ADMIN_ADJUSTMENT: 'Admin Adjustment',
      INSIGHT_UNLOCK: 'Insight Unlock',
      INSIGHT_REFRESH: 'Insight Refresh',
    };
    return labels[actionType] || actionType.replace(/_/g, ' ');
  };

  const getModuleLabel = (moduleType: string) => {
    const labels: Record<string, string> = {
      UNIFIED_BALANCE: 'Unified Balance',
      DISCOVERY: 'Discovery',
      INSIGHTS: 'Insights',
      AUDIENCE_OVERLAP: 'Audience Overlap',
      TIE_BREAKER: 'Tie Breaker',
      SOCIAL_SENTIMENTS: 'Social Sentiments',
      INFLUENCER_COLLAB_CHECK: 'Collab Check',
      PAID_COLLABORATION: 'Paid Collaboration',
      CAMPAIGN_TRACKING: 'Campaign Tracking',
      MENTION_TRACKING: 'Mention Tracking',
      COMPETITION_ANALYSIS: 'Competition Analysis',
      INFLUENCER_GROUP: 'Influencer Group',
      EXPORT: 'Export',
    };
    return labels[moduleType] || moduleType.replace(/_/g, ' ');
  };

  // Check permissions
  if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN')) {
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

  if (loading && !userDetail) {
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
            onClick={() => navigate('/analytics')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Back to Analytics
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/analytics')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Usage Details</h1>
              <p className="text-sm text-gray-500 mt-1">
                Detailed usage breakdown for {userDetail?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* User Info Card */}
        {userDetail && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userDetail.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{userDetail.name}</h2>
                  <p className="text-gray-500">{userDetail.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                  <p className="text-xl font-bold text-purple-600">{userDetail.currentBalance.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Added</p>
                  <p className="text-xl font-bold text-green-600">{userDetail.totalCreditsAdded.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Used</p>
                  <p className="text-xl font-bold text-red-600">{userDetail.totalCreditsUsed.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Days Remaining</p>
                  <p className={`text-xl font-bold ${userDetail.daysRemaining <= 7 ? 'text-orange-600' : 'text-gray-900'}`}>
                    {userDetail.daysRemaining}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Breakdown */}
        {monthlyBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Month</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Transactions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatMonth(item.month)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {getModuleLabel(item.moduleType)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          item.transactionType === 'CREDIT' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.transactionType === 'CREDIT' ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                          {item.transactionType}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium text-right ${
                        item.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.transactionType === 'CREDIT' ? '+' : '-'}{item.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {item.transactionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <div className="flex items-center gap-2">
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => {
                    setTransactionTypeFilter(e.target.value as 'CREDIT' | 'DEBIT' | 'ALL');
                    setPage(1);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="ALL">All Types</option>
                  <option value="CREDIT">Credits Only</option>
                  <option value="DEBIT">Debits Only</option>
                </select>
                <select
                  value={moduleFilter}
                  onChange={(e) => {
                    setModuleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">All Modules</option>
                  <option value="UNIFIED_BALANCE">Unified Balance</option>
                  <option value="DISCOVERY">Discovery</option>
                  <option value="INSIGHTS">Insights</option>
                  <option value="AUDIENCE_OVERLAP">Audience Overlap</option>
                  <option value="SOCIAL_SENTIMENTS">Social Sentiments</option>
                  <option value="CAMPAIGN_TRACKING">Campaign Tracking</option>
                  <option value="PAID_COLLABORATION">Paid Collaboration</option>
                  <option value="MENTION_TRACKING">Mention Tracking</option>
                  <option value="COMPETITION_ANALYSIS">Competition Analysis</option>
                </select>
                <button
                  onClick={loadUserDetail}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No transactions found
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance After</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(txn.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          txn.transactionType === 'CREDIT' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.transactionType === 'CREDIT' ? (
                            <ArrowUpRight size={12} />
                          ) : (
                            <ArrowDownRight size={12} />
                          )}
                          {txn.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getActionLabel(txn.actionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {getModuleLabel(txn.moduleType)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                        txn.transactionType === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.transactionType === 'CREDIT' ? '+' : '-'}{txn.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {txn.balanceAfter.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 max-w-[200px] truncate">
                        {txn.comment || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalTransactions > 20 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((page - 1) * 20) + 1} - {Math.min(page * 20, totalTransactions)} of {totalTransactions}
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
                  disabled={page * 20 >= totalTransactions}
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

export default AnalyticsDetailPage;
