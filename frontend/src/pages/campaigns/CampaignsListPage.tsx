import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Calendar, Users, 
  FileText, DollarSign, TrendingUp,
  Edit, Trash2, Eye, Play, Pause, CheckCircle,
  Filter, ChevronDown
} from 'lucide-react';
import { campaignsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: Play },
  PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Trash2 },
};

const OBJECTIVE_LABELS: Record<string, string> = {
  BRAND_AWARENESS: 'Brand Awareness',
  ENGAGEMENT: 'Engagement',
  CONVERSIONS: 'Conversions',
  REACH: 'Reach',
  TRAFFIC: 'Traffic',
  SALES: 'Sales',
};

export const CampaignsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'created_by_me' | 'created_by_team' | 'shared_with_me'>('created_by_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCampaigns();
    loadDashboard();
  }, [activeTab, statusFilter, platformFilter, searchQuery, page]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const result = await campaignsApi.list({
        tab: activeTab,
        status: statusFilter || undefined,
        platform: platformFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });
      setCampaigns(result.campaigns);
      setTotalCampaigns(result.total);
      setHasMore(result.hasMore);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const data = await campaignsApi.getDashboard();
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await campaignsApi.delete(id);
      loadCampaigns();
      loadDashboard();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateShort = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campaign Tracking</h1>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Manage and track your influencer marketing campaigns
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 hidden sm:block">
                Credits: <span className="font-semibold text-purple-600">{(user as any)?.credits || 0}</span>
              </div>
              <button
                onClick={() => navigate('/campaigns/new')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium w-full sm:w-auto"
              >
                <Plus size={18} />
                <span>Create Campaign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Total Campaigns</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboard.campaigns.total}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 flex-wrap">
                {Object.entries(dashboard.campaigns.byStatus || {}).slice(0, 2).map(([status, count]) => (
                  <span key={status} className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100'}`}>
                    {status}: {count as number}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Influencers</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboard.influencers.total}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 flex-wrap">
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-green-100 text-green-700">
                  Active: {dashboard.influencers.byStatus?.ACTIVE || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Deliverables</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboard.deliverables.total}</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4 flex gap-1 sm:gap-2 flex-wrap">
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-blue-100 text-blue-700">
                  Published: {dashboard.deliverables.byStatus?.PUBLISHED || 0}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-100">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Budget Used</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{dashboard.budget.utilization.toFixed(0)}%</p>
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-yellow-500 h-1.5 sm:h-2 rounded-full" 
                    style={{ width: `${Math.min(dashboard.budget.utilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Tabs - Scrollable on mobile */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              {(['created_by_me', 'created_by_team', 'shared_with_me'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(0); }}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'created_by_me' ? 'My Campaigns' : 
                   tab === 'created_by_team' ? 'Team' : 'Shared'}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                  />
                </div>
              </div>
              
              {/* Filter Toggle for Mobile */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <Filter size={16} />
                Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Desktop Filters */}
              <div className="hidden sm:flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => { setPlatformFilter(e.target.value); setPage(0); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                >
                  <option value="">All Platforms</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>
            </div>
            
            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="sm:hidden flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <select
                  value={platformFilter}
                  onChange={(e) => { setPlatformFilter(e.target.value); setPage(0); }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Platforms</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="TIKTOK">TikTok</option>
                </select>
              </div>
            )}
          </div>

          {/* Campaigns List */}
          <div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">{error}</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No campaigns found</p>
                <button
                  onClick={() => navigate('/campaigns/new')}
                  className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Create your first campaign
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="sm:hidden divide-y divide-gray-200">
                  {campaigns.map((campaign) => {
                    const StatusIcon = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.icon || FileText;
                    return (
                      <div key={campaign.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.color}`}>
                                <StatusIcon size={10} />
                                {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.label}
                              </span>
                              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                {campaign.platform}
                              </span>
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 truncate">{campaign.name}</h3>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {campaign.influencerCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDateShort(campaign.startDate)}
                              </span>
                              {campaign.budget && (
                                <span>{formatCurrency(campaign.budget, campaign.currency)}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/campaigns/${campaign.id}`)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Desktop Table Layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Platform
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Range
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Influencers
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Budget
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaigns.map((campaign) => {
                        const StatusIcon = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.icon || FileText;
                        return (
                          <tr key={campaign.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                {campaign.objective && (
                                  <div className="text-xs text-gray-500">
                                    {OBJECTIVE_LABELS[campaign.objective] || campaign.objective}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                {campaign.platform}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.color}`}>
                                <StatusIcon size={12} />
                                {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.label || campaign.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users size={14} />
                                {campaign.influencerCount}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {campaign.budget ? formatCurrency(campaign.budget, campaign.currency) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => navigate(`/campaigns/${campaign.id}`)}
                                  className="text-purple-600 hover:text-purple-900"
                                  title="View"
                                >
                                  <Eye size={18} />
                                </button>
                                <button
                                  onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Edit"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {!loading && campaigns.length > 0 && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                Showing {page * 10 + 1} to {Math.min((page + 1) * 10, totalCampaigns)} of {totalCampaigns}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default CampaignsListPage;
