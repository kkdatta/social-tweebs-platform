import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCog,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  LogIn,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Shield,
  CreditCard,
} from 'lucide-react';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  role: string;
  internalRoleType: string;
  status: string;
  creditBalance: number;
  validityStart: string | null;
  validityEnd: string | null;
  daysUntilExpiry: number;
  lastActiveAt: string;
  createdAt: string;
  enabledFeatures: string[];
  enabledActions: string[];
}

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  BUSINESS_TEAM: 'Business Team',
  FINANCE_TEAM: 'Finance Team',
  SALES_TEAM: 'Sales Team',
  SUPPORT_TEAM: 'Support Team',
  TECHNICAL_TEAM: 'Technical Team',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-700',
  LOCKED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-700',
  EXPIRED: 'bg-orange-100 text-orange-700',
};

const TeamMemberListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, login, logout, updateUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const limit = 15;

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await teamApi.getMembers({
        search: searchQuery || undefined,
        page,
        limit,
      });
      setMembers(result.data);
      setTotal(result.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDelete = async (memberId: string) => {
    try {
      setActionLoading(memberId);
      await teamApi.deleteMember(memberId);
      setDeleteConfirm(null);
      loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (member: TeamMember) => {
    try {
      setActionLoading(member.id);
      const result = await teamApi.impersonate(member.id);

      const originalToken = localStorage.getItem('token');
      const originalUser = localStorage.getItem('user');
      localStorage.setItem('impersonation_original_token', originalToken || '');
      localStorage.setItem('impersonation_original_user', originalUser || '');
      localStorage.setItem('impersonation_id', result.impersonationId);

      localStorage.setItem('token', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.targetUser));
      updateUser(result.targetUser);

      window.location.href = '/discovery';
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to login as user');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-6 h-6 text-purple-600" />
                Team Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage team members, services, and credits
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/team/credit-logs')}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <CreditCard size={16} />
                Credit Logs
              </button>
              <button
                onClick={loadMembers}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/team/new')}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Add New Member
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Members Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Team Members ({total})
              </h3>
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
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                <p className="text-gray-400 mt-2">Loading team members...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-500">{error}</p>
                <button onClick={loadMembers} className="mt-3 px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Try Again
                </button>
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center">
                <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No team members found</p>
                <p className="text-gray-400 text-sm mt-1">Click "Add New Member" to create your first team member.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Mobile</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Country</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Credit Balance</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Last Active</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
                            {member.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-gray-900 truncate max-w-[160px]">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{member.country || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {ROLE_LABELS[member.internalRoleType] || member.internalRoleType}
                          </span>
                          <span className="text-xs text-gray-400">
                            {member.role === 'ADMIN' ? 'Admin' : 'Sub-user'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">
                        {member.creditBalance.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDateTime(member.lastActiveAt)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[member.status] || 'bg-gray-100 text-gray-600'}`}>
                          {member.status === 'PENDING_VERIFICATION' ? 'Pending' : member.status.charAt(0) + member.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenu(openMenu === member.id ? null : member.id);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-500" />
                          </button>
                          {openMenu === member.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                              <button
                                onClick={() => { setOpenMenu(null); navigate(`/team/${member.id}/edit`); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit size={14} />
                                Edit Member
                              </button>
                              <button
                                onClick={() => { setOpenMenu(null); navigate(`/team/${member.id}/services`); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Shield size={14} />
                                Manage Services
                              </button>
                              <button
                                onClick={() => { setOpenMenu(null); navigate(`/team/${member.id}/credits`); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <CreditCard size={14} />
                                Manage Credits
                              </button>
                              <button
                                onClick={() => { setOpenMenu(null); handleImpersonate(member); }}
                                disabled={actionLoading === member.id}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
                              >
                                {actionLoading === member.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                                Login as User
                              </button>
                              <div className="border-t border-gray-100 my-1" />
                              <button
                                onClick={() => { setOpenMenu(null); setDeleteConfirm(member.id); }}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={14} />
                                Delete Member
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-gray-600 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Member</h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this member? Their account will be suspended and remaining credits will be returned.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === deleteConfirm && <Loader2 size={14} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamMemberListPage;
