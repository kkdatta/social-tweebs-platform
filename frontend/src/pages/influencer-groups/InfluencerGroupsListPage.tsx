import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  Instagram,
  Youtube,
  RefreshCw,
  UserPlus,
  ChevronDown,
} from 'lucide-react';
import { influencerGroupsApi } from '../../services/api';

interface GroupSummary {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  influencerCount: number;
  unapprovedCount: number;
  ownerName?: string;
  createdAt: string;
}

interface DashboardStats {
  totalGroups: number;
  totalInfluencers: number;
  pendingApplications: number;
  groupsByPlatform: Record<string, number>;
  recentGroups: GroupSummary[];
}

const PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'];
const TABS = [
  { id: 'created_by_me', label: 'Created by Me' },
  { id: 'created_by_team', label: 'By Team' },
  { id: 'shared_with_me', label: 'Shared' },
];

const getPlatformIcon = (platform: string) => {
  switch (platform.toUpperCase()) {
    case 'INSTAGRAM':
      return <Instagram className="w-4 h-4 text-pink-500" />;
    case 'YOUTUBE':
      return <Youtube className="w-4 h-4 text-red-500" />;
    case 'TIKTOK':
      return <span className="w-4 h-4 text-black font-bold text-xs">TT</span>;
    default:
      return null;
  }
};

export const InfluencerGroupsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('created_by_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await influencerGroupsApi.list({
        tab: activeTab,
        search: searchQuery || undefined,
        platforms: selectedPlatforms.length > 0 ? selectedPlatforms : undefined,
        page,
        limit: 10,
      });
      setGroups(response.groups);
      setTotal(response.total);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await influencerGroupsApi.getDashboard();
      setStats(response);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [activeTab, page, searchQuery, selectedPlatforms]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchGroups();
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
    setPage(0);
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;
    try {
      await influencerGroupsApi.delete(groupId);
      fetchGroups();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Influencer Groups</h1>
          <p className="text-sm text-gray-600 mt-1 hidden sm:block">
            Manage your influencer groups and campaigns
          </p>
        </div>
        <button
          onClick={() => navigate('/influencer-groups/create')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Dashboard Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg shrink-0">
                <Users className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Total Groups</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.totalGroups}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg shrink-0">
                <UserPlus className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Influencers</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.totalInfluencers}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg shrink-0">
                <RefreshCw className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Pending</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.pendingApplications}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
                <Instagram className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">Instagram</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {stats.groupsByPlatform?.INSTAGRAM || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs & Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs - Scrollable on mobile */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(0);
                }}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search & Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </form>
            
            {/* Filter Toggle for Mobile */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors ${
                    selectedPlatforms.includes(platform)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {getPlatformIcon(platform)}
                  <span className="hidden md:inline">{platform}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Mobile Filters Panel */}
          {showFilters && (
            <div className="sm:hidden flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedPlatforms.includes(platform)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {getPlatformIcon(platform)}
                  {platform}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Groups List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No groups found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new influencer group.
              </p>
              <button
                onClick={() => navigate('/influencer-groups/create')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Create Group
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="sm:hidden">
                {groups.map((group) => (
                  <div key={group.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex gap-1">
                            {group.platforms.map((platform) => (
                              <span key={platform}>{getPlatformIcon(platform)}</span>
                            ))}
                          </div>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {group.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{group.influencerCount} influencers</span>
                          {group.unapprovedCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[10px]">
                              {group.unapprovedCount} pending
                            </span>
                          )}
                        </div>
                        {group.ownerName && (
                          <p className="text-xs text-gray-400 mt-1">by {group.ownerName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/influencer-groups/${group.id}`)}
                          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Platforms
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Group Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Influencers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Owner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            {group.platforms.map((platform) => (
                              <span key={platform}>{getPlatformIcon(platform)}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {group.name}
                            </p>
                            {group.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {group.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {group.influencerCount}
                            </span>
                            {group.unapprovedCount > 0 && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                {group.unapprovedCount} pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {group.ownerName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/influencer-groups/${group.id}`)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              Showing {page * 10 + 1} to {Math.min((page + 1) * 10, total)} of{' '}
              {total} groups
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerGroupsListPage;
