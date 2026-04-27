import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { authApi } from '../../services/api';

interface SignupRequest {
  id: string;
  email: string;
  name: string;
  phone: string;
  businessName: string;
  campaignFrequency: string;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  processedAt: string | null;
  rejectionReason: string | null;
}

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function SignupApprovalsPage() {
  const [requests, setRequests] = useState<SignupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.getSignupRequests(filterStatus || undefined);
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load signup requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filterStatus]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await authApi.approveSignup(id);
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal.id);
    try {
      await authApi.rejectSignup(rejectModal.id, rejectReason || undefined);
      setRejectModal(null);
      setRejectReason('');
      await fetchRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Signup Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount > 1 ? 's' : ''}` : 'No pending requests'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button onClick={fetchRequests} className="btn btn-secondary py-1.5 px-3">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No signup requests</h3>
          <p className="text-sm text-gray-500 mt-1">
            {filterStatus ? `No ${filterStatus.toLowerCase()} requests found.` : 'All caught up!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const cfg = statusConfig[req.status];
            const StatusIcon = cfg.icon;
            return (
              <div key={req.id} className="card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{req.name}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{req.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{req.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{req.businessName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Campaigns: {req.campaignFrequency}</span>
                      <span>Applied: {new Date(req.createdAt).toLocaleDateString()}</span>
                      {req.processedAt && <span>Processed: {new Date(req.processedAt).toLocaleDateString()}</span>}
                    </div>
                    {req.message && (
                      <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">{req.message}</p>
                    )}
                    {req.rejectionReason && (
                      <p className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">Reason: {req.rejectionReason}</p>
                    )}
                  </div>

                  {req.status === 'PENDING' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={processing === req.id}
                        className="btn bg-green-600 text-white hover:bg-green-700 py-1.5 px-3 text-sm"
                      >
                        {processing === req.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span className="ml-1">Approve</span>
                      </button>
                      <button
                        onClick={() => setRejectModal({ id: req.id, name: req.name })}
                        disabled={processing === req.id}
                        className="btn bg-red-600 text-white hover:bg-red-700 py-1.5 px-3 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="ml-1">Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Reject Signup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting signup request from <strong>{rejectModal.name}</strong>. Optionally provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="input w-full py-2 text-sm min-h-[80px]"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="btn btn-secondary py-1.5 px-4">
                Cancel
              </button>
              <button onClick={handleReject} disabled={processing === rejectModal.id} className="btn bg-red-600 text-white hover:bg-red-700 py-1.5 px-4">
                {processing === rejectModal.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
