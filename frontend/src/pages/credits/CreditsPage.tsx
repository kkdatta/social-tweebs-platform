import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Calendar,
  Info,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { creditsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

interface CreditBalance {
  unifiedBalance: number;
  moduleBalances: Record<string, number>;
  totalBalance: number;
  accountValidUntil: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
}

interface ChartData {
  labels: string[];
  credits: number[];
  debits: number[];
}

interface CreditGuide {
  rules: { action: string; description: string; creditCost: string; notes?: string }[];
  generalInfo: { creditValue: string; refreshInfo: string; reportInfo: string };
}

export const CreditsPage: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [creditGuide, setCreditGuide] = useState<CreditGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [chartDays, setChartDays] = useState(30);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [transactionPage, moduleFilter]);

  useEffect(() => {
    loadChart();
  }, [chartDays]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceData, guideData] = await Promise.all([
        creditsApi.getBalance(),
        creditsApi.getCreditGuide(),
      ]);
      setBalance(balanceData);
      setCreditGuide(guideData);
      await loadChart();
      await loadTransactions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  const loadChart = async () => {
    try {
      const data = await creditsApi.getUsageChart(chartDays);
      setChartData(data);
    } catch (err) {
      console.error('Failed to load chart data:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const result = await creditsApi.getTransactions({
        module: moduleFilter || undefined,
        page: transactionPage,
        limit: 15,
      });
      setTransactions(result.data);
      setTotalTransactions(result.total);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTransactionsLoading(false);
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
      PAID_COLLABORATION: 'Paid Collab',
      CAMPAIGN_TRACKING: 'Campaign Tracking',
      MENTION_TRACKING: 'Mention Tracking',
      COMPETITION_ANALYSIS: 'Competition Analysis',
      INFLUENCER_GROUP: 'Influencer Group',
      EXPORT: 'Export',
    };
    return labels[moduleType] || moduleType.replace(/_/g, ' ');
  };

  // Simple bar chart component
  const SimpleBarChart = () => {
    if (!chartData || chartData.labels.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center text-gray-400">
          No transaction data for this period
        </div>
      );
    }

    const maxValue = Math.max(...chartData.credits, ...chartData.debits, 1);
    const totalCredits = chartData.credits.reduce((a, b) => a + b, 0);
    const totalDebits = chartData.debits.reduce((a, b) => a + b, 0);

    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Credits: <span className="font-semibold text-green-600">{totalCredits.toFixed(2)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Debits: <span className="font-semibold text-red-600">{totalDebits.toFixed(2)}</span></span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2">
          {chartData.labels.map((label, index) => (
            <div key={label} className="flex-1 min-w-[30px] flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                {chartData.credits[index] > 0 && (
                  <div 
                    className="bg-green-500 rounded-t w-full transition-all"
                    style={{ height: `${(chartData.credits[index] / maxValue) * 120}px` }}
                    title={`Credits: ${chartData.credits[index].toFixed(2)}`}
                  />
                )}
                {chartData.debits[index] > 0 && (
                  <div 
                    className="bg-red-500 rounded-b w-full transition-all"
                    style={{ height: `${(chartData.debits[index] / maxValue) * 120}px` }}
                    title={`Debits: ${chartData.debits[index].toFixed(2)}`}
                  />
                )}
              </div>
              <span className="text-[10px] text-gray-400 -rotate-45 origin-center whitespace-nowrap">
                {label.substring(5)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Credits</h2>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={loadData}
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credits & Billing</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your credit balance and view transaction history
              </p>
            </div>
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
            >
              <Info size={16} />
              Credit Guide
              {showGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Credit Guide Section */}
        {showGuide && creditGuide && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-600" />
              Credit Usage Guide
            </h3>
            
            {/* General Info */}
            <div className="bg-purple-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Credit Value</p>
                  <p className="text-lg font-bold text-purple-800">{creditGuide.generalInfo.creditValue}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Refresh Info</p>
                  <p className="text-sm text-purple-800">{creditGuide.generalInfo.refreshInfo}</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 font-medium">Report Info</p>
                  <p className="text-sm text-purple-800">{creditGuide.generalInfo.reportInfo}</p>
                </div>
              </div>
            </div>

            {/* Credit Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Feature</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Description</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Credit Cost</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditGuide.rules.map((rule, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{rule.action}</td>
                      <td className="px-4 py-3 text-gray-600">{rule.description}</td>
                      <td className="px-4 py-3 text-purple-600 font-medium">{rule.creditCost}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{rule.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Main Balance Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Coins className="w-6 h-6" />
              </div>
              <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Available</span>
            </div>
            <p className="text-sm text-purple-200 mb-1">Current Balance</p>
            <p className="text-3xl font-bold">{balance?.unifiedBalance.toFixed(2)} Credits</p>
            <p className="text-xs text-purple-200 mt-2">
              ≈ ₹{((balance?.unifiedBalance || 0) * 100).toLocaleString('en-IN')}
            </p>
          </div>

          {/* Validity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              {balance?.isExpiringSoon && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Expiring Soon
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mb-1">Account Validity</p>
            <p className="text-xl font-bold text-gray-900">
              {balance?.daysRemaining} days remaining
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Valid until: {balance?.accountValidUntil ? formatDate(balance.accountValidUntil) : '-'}
            </p>
          </div>

          {/* Module Balances Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Module Credits</p>
            {balance?.moduleBalances && Object.keys(balance.moduleBalances).length > 0 ? (
              <div className="space-y-2 mt-2">
                {Object.entries(balance.moduleBalances).map(([module, bal]) => (
                  <div key={module} className="flex justify-between text-sm">
                    <span className="text-gray-600">{getModuleLabel(module)}</span>
                    <span className="font-medium">{bal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No module-specific credits</p>
            )}
          </div>
        </div>

        {/* Usage Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Usage (Last {chartDays} Days)</h3>
            <div className="flex items-center gap-2">
              <select
                value={chartDays}
                onChange={(e) => setChartDays(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
              >
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
              <button 
                onClick={loadChart}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <SimpleBarChart />
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <div className="flex items-center gap-2">
                <select
                  value={moduleFilter}
                  onChange={(e) => {
                    setModuleFilter(e.target.value);
                    setTransactionPage(1);
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
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto">
            {transactionsLoading ? (
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
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalTransactions > 15 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {((transactionPage - 1) * 15) + 1} - {Math.min(transactionPage * 15, totalTransactions)} of {totalTransactions}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTransactionPage(p => Math.max(1, p - 1))}
                  disabled={transactionPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setTransactionPage(p => p + 1)}
                  disabled={transactionPage * 15 >= totalTransactions}
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

export default CreditsPage;
