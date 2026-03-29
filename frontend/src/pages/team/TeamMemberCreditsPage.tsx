import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Plus,
  Minus,
  CheckCircle2,
  Coins,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const MODULE_OPTIONS = [
  { value: 'UNIFIED_BALANCE', label: 'Overall Credit (Unified Balance)' },
  { value: 'AUDIENCE_OVERLAP', label: 'Audience Overlap' },
  { value: 'SOCIAL_SENTIMENTS', label: 'Social Sentiments' },
  { value: 'INFLUENCER_COLLAB_CHECK', label: 'Influencer Collab Check' },
  { value: 'PAID_COLLABORATION', label: 'Paid Collaboration' },
  { value: 'CAMPAIGN_TRACKING', label: 'Campaign Tracking' },
  { value: 'MENTION_TRACKING', label: 'Mention Tracking' },
  { value: 'COMPETITION_ANALYSIS', label: 'Competition Analysis' },
];

const TeamMemberCreditsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [transactionType, setTransactionType] = useState<'credit' | 'debit'>('credit');
  const [amount, setAmount] = useState('');
  const [moduleType, setModuleType] = useState('UNIFIED_BALANCE');
  const [comment, setComment] = useState('');

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [txnLoading, setTxnLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadMember(id);
      loadTransactions(id);
    }
  }, [id]);

  const loadMember = async (memberId: string) => {
    try {
      setLoading(true);
      const data = await teamApi.getMember(memberId);
      setMember(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (memberId: string) => {
    try {
      setTxnLoading(true);
      const data = await teamApi.getCreditDetails(memberId, { page: 1, limit: 10 });
      setRecentTransactions(data.transactions || []);
    } catch {
      // non-critical
    } finally {
      setTxnLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!id || !amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setAllocating(true);
      setError(null);
      setSuccess(null);

      const result = await teamApi.allocateCredits(id, {
        amount: Number(amount),
        moduleType,
        comment: comment || `${transactionType === 'credit' ? 'Credit' : 'Debit'} by ${user?.name}`,
      });

      setSuccess(result.message || 'Credits allocated successfully');
      setAmount('');
      setComment('');
      loadMember(id);
      loadTransactions(id);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to allocate credits');
    } finally {
      setAllocating(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/team')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-purple-600" />
                Manage Credits
              </h1>
              {member && (
                <p className="text-sm text-gray-500 mt-1">
                  {member.name} ({member.email})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* Current Balance Card */}
        {member && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Coins className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Balance</p>
                  <p className="text-2xl font-bold text-gray-900">{member.creditBalance.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Validity Period</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {member.validityStart ? new Date(member.validityStart).toLocaleDateString() : '-'} to{' '}
                  {member.validityEnd ? new Date(member.validityEnd).toLocaleDateString() : '-'}
                </p>
                {member.daysUntilExpiry > 0 && (
                  <p className={`text-xs mt-1 ${member.daysUntilExpiry <= 5 ? 'text-red-500' : 'text-gray-400'}`}>
                    {member.daysUntilExpiry} days remaining
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {member.role === 'ADMIN' ? 'Admin' : 'Sub-user'}
                </p>
                <p className="text-xs text-gray-400 mt-1">{member.internalRoleType?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Allocate Credits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocate Credits</h3>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setTransactionType('credit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'credit'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Plus size={16} />
              Credit
            </button>
            <button
              onClick={() => setTransactionType('debit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'debit'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Minus size={16} />
              Debit
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter amount"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
              <select
                value={moduleType}
                onChange={(e) => setModuleType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {MODULE_OPTIONS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Comment (optional)</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Reason for credit/debit..."
            />
          </div>

          <button
            onClick={handleAllocate}
            disabled={allocating || !amount || Number(amount) <= 0}
            className={`px-6 py-2.5 text-sm rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 ${
              transactionType === 'credit'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {allocating ? <Loader2 size={16} className="animate-spin" /> : transactionType === 'credit' ? <Plus size={16} /> : <Minus size={16} />}
            {transactionType === 'credit' ? 'Credit' : 'Debit'} {amount ? Number(amount).toFixed(2) : '0.00'} Credits
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            {txnLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No transactions yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Module</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Comment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransactions.map((txn, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                            ? <TrendingUp size={12} />
                            : <TrendingDown size={12} />}
                          {txn.transactionType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{getModuleLabel(txn.moduleType)}</td>
                      <td className={`px-6 py-3 text-sm font-semibold text-right ${
                        txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {txn.transactionType === 'CREDIT' || txn.transactionType === 'TRANSFER_IN' ? '+' : '-'}
                        {txn.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-400 max-w-[200px] truncate">
                        {txn.comment || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCreditsPage;
