import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Users, FileText, 
  Calendar, DollarSign, TrendingUp, Eye, MessageSquare,
  Heart, Clock, Plus
} from 'lucide-react';
import { campaignsApi } from '../../services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
  PAUSED: { label: 'Paused', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
};

const INFLUENCER_STATUS: Record<string, { label: string; color: string }> = {
  INVITED: { label: 'Invited', color: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
  DECLINED: { label: 'Declined', color: 'bg-red-100 text-red-700' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  COMPLETED: { label: 'Completed', color: 'bg-purple-100 text-purple-700' },
};

const DELIVERABLE_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  SUBMITTED: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  PUBLISHED: { label: 'Published', color: 'bg-purple-100 text-purple-700' },
};

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'influencers' | 'deliverables' | 'metrics'>('overview');

  useEffect(() => {
    if (id) loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await campaignsApi.getById(id!);
      setCampaign(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'INR') => {
    if (!amount) return '-';
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await campaignsApi.update(id!, { status: newStatus });
      loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleInfluencerStatusChange = async (influencerId: string, newStatus: string) => {
    try {
      await campaignsApi.updateInfluencer(id!, influencerId, { status: newStatus });
      loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update influencer status');
    }
  };

  const handleDeliverableStatusChange = async (deliverableId: string, newStatus: string) => {
    try {
      await campaignsApi.updateDeliverable(id!, deliverableId, { status: newStatus });
      loadCampaign();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update deliverable status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/campaigns')} className="text-purple-600 hover:text-purple-700">
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/campaigns')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[campaign.status]?.color}`}>
                  {STATUS_CONFIG[campaign.status]?.label}
                </span>
              </div>
              {campaign.description && (
                <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {campaign.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Start Campaign
                </button>
              )}
              {campaign.status === 'ACTIVE' && (
                <>
                  <button
                    onClick={() => handleStatusChange('PAUSED')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Pause
                  </button>
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Complete
                  </button>
                </>
              )}
              {campaign.status === 'PAUSED' && (
                <button
                  onClick={() => handleStatusChange('ACTIVE')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => navigate(`/campaigns/${id}/edit`)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Edit size={20} />
              </button>
            </div>
          </div>

          {/* Campaign Info Bar */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-gray-100 rounded">{campaign.platform}</span>
            </div>
            {campaign.objective && (
              <div className="flex items-center gap-1">
                <TrendingUp size={16} />
                {campaign.objective.replace('_', ' ')}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </div>
            <div className="flex items-center gap-1">
              <Users size={16} />
              {campaign.influencerCount} Influencers
            </div>
            <div className="flex items-center gap-1">
              <FileText size={16} />
              {campaign.deliverableCount} Deliverables
            </div>
            <div className="flex items-center gap-1">
              <DollarSign size={16} />
              {formatCurrency(campaign.budget, campaign.currency)}
            </div>
          </div>

          {/* Hashtags & Mentions */}
          {(campaign.hashtags?.length > 0 || campaign.mentions?.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {campaign.hashtags?.map((tag: string) => (
                <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                  {tag}
                </span>
              ))}
              {campaign.mentions?.map((mention: string) => (
                <span key={mention} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                  {mention}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {(['overview', 'influencers', 'deliverables', 'metrics'] as const).map((section) => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeSection === section
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Impressions</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalImpressions || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Reach</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalReach || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Likes</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalLikes || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Comments</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalComments || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Avg Engagement</p>
                    <p className="text-2xl font-bold text-gray-900">{(campaign.metrics?.avgEngagementRate || 0).toFixed(2)}%</p>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Budget Utilization</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(campaign.metrics?.totalSpent || 0)} / {formatCurrency(campaign.budget || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${Math.min(campaign.metrics?.budgetUtilization || 0, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(campaign.metrics?.budgetUtilization || 0).toFixed(1)}% utilized
                  </p>
                </div>
              </div>
            )}

            {/* Influencers Section */}
            {activeSection === 'influencers' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Campaign Influencers ({campaign.influencers?.length || 0})</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus size={18} />
                    Add Influencer
                  </button>
                </div>
                <div className="space-y-3">
                  {campaign.influencers?.map((influencer: any) => (
                    <div key={influencer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <Users size={20} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{influencer.influencerName}</p>
                          <p className="text-sm text-gray-500">@{influencer.influencerUsername} · {formatNumber(influencer.followerCount)} followers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${INFLUENCER_STATUS[influencer.status]?.color}`}>
                          {INFLUENCER_STATUS[influencer.status]?.label}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(influencer.budgetAllocated)}</p>
                          <p className="text-xs text-gray-500">{influencer.deliverables || 0} deliverables</p>
                        </div>
                        <select
                          value={influencer.status}
                          onChange={(e) => handleInfluencerStatusChange(influencer.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="INVITED">Invited</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="DECLINED">Declined</option>
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {(!campaign.influencers || campaign.influencers.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No influencers added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Deliverables Section */}
            {activeSection === 'deliverables' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Deliverables ({campaign.deliverables?.length || 0})</h3>
                  <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    <Plus size={18} />
                    Add Deliverable
                  </button>
                </div>
                <div className="space-y-3">
                  {campaign.deliverables?.map((deliverable: any) => (
                    <div key={deliverable.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{deliverable.title || 'Untitled'}</p>
                          <p className="text-sm text-gray-500">
                            {deliverable.deliverableType} · {deliverable.influencerName || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${DELIVERABLE_STATUS[deliverable.status]?.color}`}>
                          {DELIVERABLE_STATUS[deliverable.status]?.label}
                        </span>
                        {deliverable.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock size={14} />
                            {formatDate(deliverable.dueDate)}
                          </div>
                        )}
                        <select
                          value={deliverable.status}
                          onChange={(e) => handleDeliverableStatusChange(deliverable.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="SUBMITTED">Submitted</option>
                          <option value="APPROVED">Approved</option>
                          <option value="REJECTED">Rejected</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {(!campaign.deliverables || campaign.deliverables.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No deliverables added yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metrics Section */}
            {activeSection === 'metrics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="text-purple-600" size={20} />
                      <span className="text-sm text-gray-600">Impressions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalImpressions || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="text-blue-600" size={20} />
                      <span className="text-sm text-gray-600">Reach</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalReach || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="text-pink-600" size={20} />
                      <span className="text-sm text-gray-600">Likes</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalLikes || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="text-green-600" size={20} />
                      <span className="text-sm text-gray-600">Comments</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(campaign.metrics?.totalComments || 0)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Views</p>
                    <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalViews || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Shares</p>
                    <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalShares || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Clicks</p>
                    <p className="text-xl font-bold">{formatNumber(campaign.metrics?.totalClicks || 0)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Avg Engagement Rate</p>
                    <p className="text-xl font-bold">{(campaign.metrics?.avgEngagementRate || 0).toFixed(2)}%</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-4">Budget Overview</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Budget</p>
                      <p className="text-xl font-bold">{formatCurrency(campaign.budget || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount Spent</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(campaign.metrics?.totalSpent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Remaining</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatCurrency((campaign.budget || 0) - (campaign.metrics?.totalSpent || 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;
