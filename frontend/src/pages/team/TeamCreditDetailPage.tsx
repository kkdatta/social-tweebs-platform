import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Coins,
  Filter,
  User,
} from 'lucide-react';
import { teamApi } from '../../services/api';

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'UNIFIED_BALANCE', label: 'Unified Balance' },
  { value: 'AUDIENCE_OVERLAP', label: 'Audience Overlap' },
  { value: 'SOCIAL_SENTIMENTS', label: 'Social Sentiments' },
  { value: 'INFLUENCER_COLLAB_CHECK', label: 'Competitors Check' },
  { value: 'PAID_COLLABORATION', label: 'Content Discovery' },
  { value: 'INFLUENCERS_GROUP', label: 'Influencer Group' },
  { value: 'CAMPAIGN_TRACKING', label: 'Campaign Tracking' },
  { value: 'MENTION_TRACKING', label: 'Mention Tracking' },
  { value: 'COMPETITION_ANALYSIS', label: 'Competition Analysis' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'DEBIT', label: 'Debit' },
];

interface Transaction {
  month: string;
  moduleType: string;
  transactionType: string;
  amount: number;
  comment: string;
  createdAt: string;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  country: string;
  currentBalance: number;
  totalCreditsAdded: number;
}

const TeamCreditDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState('ALL');
  const [moduleType, setModuleType] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const loadDetails = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await teamApi.getCreditDetails(userId, {
        transactionType: transactionType !== 'ALL' ? transactionType : undefined,
        moduleType: moduleType || undefined,
        page,
        limit,
      });
      setUserInfo(result.user);
      setTransactions(result.transactions);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load credit details');
    } finally {
      setLoading(false);
    }
  }, [userId, transactionType, moduleType, page]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModuleLabel = (mod: string) => {
    return MODULE_OPTIONS.find(m => m.value === mod)?.label || mod.replace(/_/g, ' ');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ['Month', 'Module', 'Type', 'Amount', 'Comment', 'Date'];
    const rows = transactions.map(t => [
      t.month, getModuleLabel(t.moduleType), t.transactionType,
      t.amount.toFixed(2), t.comment || '', formatDate(t.createdAt),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit-details-${userInfo?.name || userId}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/team/credit-logs')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Credit Usage Details</h1>
                {userInfo && (
                  <p className="text-sm text-gray-500 mt-1">{userInfo.name} ({userInfo.email})</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={transactions.length === 0}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={transactions.length === 0}
                className="print:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                <Printer size={16} />
                Export PDF
              </button>
              <button
                type="button"
                onClick={loadDetails}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* User Summary */}
        {userInfo && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member</p>
                  <p className="text-sm font-semibold text-gray-900">{userInfo.name}</p>
                  <p className="text-xs text-gray-400">{userInfo.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Coins className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{userInfo.currentBalance.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Credits Added</p>
                  <p className="text-2xl font-bold text-green-600">{userInfo.totalCreditsAdded.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Country</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{userInfo.country || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter size={16} />
              Filters:
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={transactionType}
                onChange={(e) => { setTransactionType(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {TYPE_OPTIONS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <select
                value={moduleType}
                onChange={(e) => { setModuleType(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {MODULE_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Month-wise Usage ({total} transactions)
            </h3>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">No transactions found for the selected filters</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Month</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 font-medium">
                        {txn.month}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {getModuleLabel(txn.moduleType)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                            ? <TrendingUp size={10} />
                            : <TrendingDown size={10} />}
                          {txn.transactionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`px-6 py-3 text-sm font-semibold text-right ${
                        txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN' ? '+' : '-'}
                        {txn.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400 max-w-[250px] truncate">
                        {txn.comment || '-'}
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

export default TeamCreditDetailPage;
