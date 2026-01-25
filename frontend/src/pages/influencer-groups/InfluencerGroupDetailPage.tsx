import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Trash2,
  Copy,
  Share2,
  Download,
  Instagram,
  Youtube,
  Edit,
  UserPlus,
  Mail,
  ExternalLink,
  CheckCircle,
  Clock,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { influencerGroupsApi } from '../../services/api';

interface GroupMember {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  audienceCredibility?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgViews?: number;
  addedAt: string;
  source: string;
}

interface GroupDetail {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  influencerCount: number;
  unapprovedCount: number;
  ownerName?: string;
  ownerId: string;
  createdById: string;
  isPublic: boolean;
  shareUrlToken?: string;
  createdAt: string;
  shares?: any[];
  invitations?: any[];
}

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

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export const InfluencerGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'applications'>('members');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchGroup = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await influencerGroupsApi.getById(id);
      setGroup(response);
    } catch (error) {
      console.error('Failed to fetch group:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    if (!id) return;
    setMembersLoading(true);
    try {
      const response = await influencerGroupsApi.getMembers(id, {
        search: searchQuery || undefined,
        platform: selectedPlatform || undefined,
        page,
        limit: 20,
      });
      setMembers(response.members);
      setTotalMembers(response.total);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
  }, [id, activeTab, page, searchQuery, selectedPlatform]);

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map((m) => m.id));
    }
  };

  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) return;
    if (!confirm(`Remove ${selectedMembers.length} influencer(s) from this group?`)) return;
    
    try {
      await influencerGroupsApi.removeMembers(id!, { memberIds: selectedMembers });
      setSelectedMembers([]);
      fetchMembers();
      fetchGroup();
    } catch (error) {
      console.error('Failed to remove members:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Group not found</h2>
        <button
          onClick={() => navigate('/influencer-groups')}
          className="mt-4 text-indigo-600 hover:text-indigo-800"
        >
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/influencer-groups')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{group.name}</h1>
              <div className="flex gap-1">
                {group.platforms.map((platform) => (
                  <span key={platform} className="p-1 bg-gray-100 rounded">
                    {getPlatformIcon(platform)}
                  </span>
                ))}
              </div>
            </div>
            {group.description && (
              <p className="text-sm text-gray-600 mt-1">{group.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
              <span>Owner: {group.ownerName}</span>
              <span className="hidden sm:inline">Created: {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg shrink-0">
              <Users className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Influencers</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{group.influencerCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg shrink-0">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-yellow-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Pending</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{group.unapprovedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg shrink-0">
              <Mail className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Invitations</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{group.invitations?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg shrink-0">
              <Share2 className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Shares</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{group.shares?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs - Scrollable on mobile */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Influencers ({group.influencerCount})
            </button>
            <button
              onClick={() => setActiveTab('invitations')}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'invitations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invitations ({group.invitations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'applications'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
              {group.unapprovedCount > 0 && (
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  {group.unapprovedCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Members Tab Content */}
        {activeTab === 'members' && (
          <>
            {/* Toolbar */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col gap-3">
                {/* Top Row - Add button and search */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium sm:w-auto w-full"
                  >
                    <Plus className="w-4 h-4" />
                    Add Influencer
                  </button>
                  
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search influencers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  {/* Filter Toggle for Mobile */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <Filter className="w-4 h-4" />
                    Filter
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Desktop Platform Filter */}
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value)}
                    className="hidden sm:block px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">All Platforms</option>
                    {group.platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mobile Filter Panel */}
                {showFilters && (
                  <div className="sm:hidden">
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Platforms</option>
                      {group.platforms.map((platform) => (
                        <option key={platform} value={platform}>
                          {platform}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Selection Actions */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {selectedMembers.length} selected
                    </span>
                    <button
                      onClick={handleRemoveMembers}
                      className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div>
              {membersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No influencers yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add influencers to this group to get started.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Influencer
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="sm:hidden divide-y divide-gray-200">
                    {members.map((member) => (
                      <div key={member.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {member.profilePictureUrl ? (
                              <img
                                src={member.profilePictureUrl}
                                alt={member.influencerName}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(member.platform)}
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {member.influencerName}
                                </p>
                              </div>
                              {member.influencerUsername && (
                                <p className="text-xs text-gray-500 truncate">
                                  @{member.influencerUsername}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{formatNumber(member.followerCount)} followers</span>
                                {member.engagementRate && (
                                  <span>{member.engagementRate.toFixed(1)}% ER</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <input
                              type="checkbox"
                              checked={selectedMembers.length === members.length && members.length > 0}
                              onChange={selectAllMembers}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Platform
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Influencer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Followers
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Credibility
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Engagement
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Added
                          </th>
                          <th className="px-4 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedMembers.includes(member.id)}
                                onChange={() => toggleMemberSelection(member.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="px-4 py-4">
                              {getPlatformIcon(member.platform)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {member.profilePictureUrl ? (
                                  <img
                                    src={member.profilePictureUrl}
                                    alt={member.influencerName}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {member.influencerName}
                                  </p>
                                  {member.influencerUsername && (
                                    <p className="text-sm text-gray-500">
                                      @{member.influencerUsername}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatNumber(member.followerCount)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {member.audienceCredibility
                                ? `${member.audienceCredibility.toFixed(1)}%`
                                : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {member.engagementRate
                                ? `${member.engagementRate.toFixed(2)}%`
                                : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(member.addedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
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
            {totalMembers > 0 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  Showing {page * 20 + 1} to {Math.min((page + 1) * 20, totalMembers)} of {totalMembers}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Invitations Tab Content */}
        {activeTab === 'invitations' && (
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Invitations</h3>
              <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm w-full sm:w-auto">
                <Plus className="w-4 h-4" />
                Create Invitation
              </button>
            </div>
            
            {group.invitations && group.invitations.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {group.invitations.map((invitation: any) => (
                  <div
                    key={invitation.id}
                    className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {invitation.invitationName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Type: {invitation.invitationType} | /{invitation.urlSlug}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Applications: {invitation.applicationsCount}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            invitation.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {invitation.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No invitations created yet</p>
              </div>
            )}
          </div>
        )}

        {/* Applications Tab Content */}
        {activeTab === 'applications' && (
          <div className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
              Pending Applications ({group.unapprovedCount})
            </h3>
            
            {group.unapprovedCount > 0 ? (
              <p className="text-sm text-gray-500">Application management UI coming soon...</p>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No pending applications</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfluencerGroupDetailPage;
