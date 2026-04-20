import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  MoreVertical,
  X,
  Upload,
  FileSpreadsheet,
  Link2,
  Eye,
  Check,
  ChevronRight,
  Palette,
  Bell,
  Globe,
  UserCheck,
  XCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { influencerGroupsApi, campaignsApi } from '../../services/api';

// ============ TYPES ============

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

interface Application {
  id: string;
  platform: string;
  platformUsername: string;
  influencerName?: string;
  followerCount: number;
  profilePictureUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  phoneNumber?: string;
  email?: string;
}

interface InvitationFormData {
  invitationName: string;
  invitationType: 'LANDING_PAGE' | 'FORM_ONLY';
  urlSlug: string;
  landingHeader: string;
  landingContent: string;
  landingButtonText: string;
  formHeader: string;
  formContent: string;
  formPlatforms: string[];
  collectPhone: boolean;
  collectEmail: boolean;
  collectAddress: boolean;
  pricingOptions: string[];
  pricingCurrency: string;
  formButtonText: string;
  thankyouHeader: string;
  thankyouContent: string;
  logoUrl: string;
  backgroundColor: string;
  titleColor: string;
  textColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  notifyOnSubmission: boolean;
}

// ============ HELPERS ============

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

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);

/** Profile UUID vs opaque platform user id */
const INFLUENCER_PROFILE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseInfluencerIdInput(raw: string): { influencerProfileId?: string; platformUserId?: string } {
  const t = raw.trim();
  if (!t) return {};
  if (INFLUENCER_PROFILE_UUID_RE.test(t)) return { influencerProfileId: t };
  return { platformUserId: t };
}

// ============ MODAL WRAPPER ============

const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ open, onClose, title, wide, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// ============ MAIN COMPONENT ============

export const InfluencerGroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Core state
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
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Menu state
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const dotsMenuRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const bulkMenuRef = useRef<HTMLDivElement>(null);
  const [showCampaignPickerModal, setShowCampaignPickerModal] = useState(false);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [campaignPickerLoading, setCampaignPickerLoading] = useState(false);
  const [selectedCampaignForBulk, setSelectedCampaignForBulk] = useState('');
  const [addToCampaignLoading, setAddToCampaignLoading] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showApplicationDetail, setShowApplicationDetail] = useState<Application | null>(null);

  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [appPage, setAppPage] = useState(0);
  const [appTotal, setAppTotal] = useState(0);
  const [appHasMore, setAppHasMore] = useState(false);
  const [appSearch, setAppSearch] = useState('');
  const [appPlatformFilter, setAppPlatformFilter] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedInvitationId, setSelectedInvitationId] = useState<string>('');

  // Edit modal state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // Share modal state
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [shareLoading, setShareLoading] = useState(false);

  // Add influencer state
  const [addTab, setAddTab] = useState<'manual' | 'upload' | 'import'>('manual');
  const [addPlatform, setAddPlatform] = useState('');
  const [addName, setAddName] = useState('');
  const [addInfluencerId, setAddInfluencerId] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addFollowers, setAddFollowers] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [importGroupSearch, setImportGroupSearch] = useState('');
  const [importGroups, setImportGroups] = useState<any[]>([]);
  const [selectedImportGroup, setSelectedImportGroup] = useState('');
  const [csvData, setCsvData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copy to group state
  const [copyGroups, setCopyGroups] = useState<any[]>([]);
  const [selectedCopyGroup, setSelectedCopyGroup] = useState('');
  const [copyLoading, setCopyLoading] = useState(false);

  // Invitation state
  const [invStep, setInvStep] = useState(0);
  const [invForm, setInvForm] = useState<InvitationFormData>({
    invitationName: '',
    invitationType: 'FORM_ONLY',
    urlSlug: '',
    landingHeader: '',
    landingContent: '',
    landingButtonText: 'Apply Now',
    formHeader: '',
    formContent: '',
    formPlatforms: [],
    collectPhone: false,
    collectEmail: true,
    collectAddress: false,
    pricingOptions: [],
    pricingCurrency: 'USD',
    formButtonText: 'Submit Application',
    thankyouHeader: 'Thank You!',
    thankyouContent: 'Your application has been submitted successfully.',
    logoUrl: '',
    backgroundColor: '#ffffff',
    titleColor: '#000000',
    textColor: '#333333',
    buttonBgColor: '#6366f1',
    buttonTextColor: '#ffffff',
    notifyOnSubmission: true,
  });
  const [invLoading, setInvLoading] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ============ DATA FETCHING ============

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

  const fetchApplications = async (invitationId?: string) => {
    if (!id || !group?.invitations?.length) return;
    const invId = invitationId || selectedInvitationId || group.invitations[0]?.id;
    if (!invId) return;

    if (!selectedInvitationId && invId) setSelectedInvitationId(invId);
    setApplicationsLoading(true);
    try {
      const response = await influencerGroupsApi.getApplications(id, invId, {
        search: appSearch || undefined,
        platform: appPlatformFilter || undefined,
        status: appStatusFilter || undefined,
        page: appPage,
        limit: 20,
      });
      setApplications(response.applications);
      setAppTotal(response.total);
      setAppHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchGroupsForImport = async () => {
    try {
      const response = await influencerGroupsApi.list({ limit: 50 });
      setImportGroups(response.groups.filter((g: any) => g.id !== id));
      setCopyGroups(response.groups.filter((g: any) => g.id !== id));
    } catch (error) {
      console.error('Failed to fetch groups for import:', error);
    }
  };

  useEffect(() => { fetchGroup(); }, [id]);

  useEffect(() => {
    if (activeTab === 'members') fetchMembers();
  }, [id, activeTab, page, searchQuery, selectedPlatform]);

  useEffect(() => {
    if (activeTab === 'applications' && group) fetchApplications();
  }, [activeTab, group, appPage, appSearch, appPlatformFilter, appStatusFilter, selectedInvitationId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dotsMenuRef.current && !dotsMenuRef.current.contains(e.target as Node)) {
        setShowDotsMenu(false);
      }
      if (bulkMenuRef.current && !bulkMenuRef.current.contains(e.target as Node)) {
        setBulkActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============ MEMBER ACTIONS ============

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((i) => i !== memberId) : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    setSelectedMembers(selectedMembers.length === members.length ? [] : members.map((m) => m.id));
  };

  const handleRemoveSingleMember = async (memberId: string) => {
    if (!confirm('Remove this influencer from the group?')) return;
    try {
      await influencerGroupsApi.removeMembers(id!, { memberIds: [memberId] });
      showToast('Influencer removed');
      fetchMembers();
      fetchGroup();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to remove influencer';
      showToast(typeof msg === 'string' ? msg : 'Failed to remove influencer', 'error');
    }
  };

  const handleRemoveMembers = async () => {
    if (selectedMembers.length === 0) return;
    if (!confirm(`Remove ${selectedMembers.length} influencer(s) from this group?`)) return;
    try {
      await influencerGroupsApi.removeMembers(id!, { memberIds: selectedMembers });
      setSelectedMembers([]);
      showToast(`${selectedMembers.length} influencer(s) removed`);
      fetchMembers();
      fetchGroup();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to remove members';
      showToast(typeof msg === 'string' ? msg : 'Failed to remove members', 'error');
    }
  };

  // ============ EDIT GROUP ============

  const openEditModal = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDescription(group.description || '');
    setEditPlatforms([...group.platforms]);
    setShowEditModal(true);
    setShowDotsMenu(false);
  };

  const handleEditGroup = async () => {
    if (!editName.trim()) return;
    setEditLoading(true);
    try {
      await influencerGroupsApi.update(id!, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        platforms: editPlatforms,
      });
      showToast('Group updated');
      setShowEditModal(false);
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to update group', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ============ SHARE GROUP ============

  const handleShareWithUser = async () => {
    if (!shareEmail.trim()) return;
    setShareLoading(true);
    try {
      await influencerGroupsApi.share(id!, {
        sharedWithEmail: shareEmail.trim(),
        permissionLevel: sharePermission,
      });
      showToast('Group shared successfully');
      setShareEmail('');
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to share group', 'error');
    } finally {
      setShareLoading(false);
    }
  };

  const handleMakePublic = async () => {
    setShareLoading(true);
    try {
      const result = await influencerGroupsApi.share(id!, { makePublic: true });
      showToast('Public link generated');
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to generate public link', 'error');
    } finally {
      setShareLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      await influencerGroupsApi.removeShare(id!, shareId);
      showToast('Share removed');
      fetchGroup();
    } catch (error) {
      showToast('Failed to remove share', 'error');
    }
  };

  // ============ ADD INFLUENCER ============

  const handleAddManual = async () => {
    if (!addName.trim() && !addInfluencerId.trim()) return;
    setAddLoading(true);
    try {
      const idFields = parseInfluencerIdInput(addInfluencerId);
      await influencerGroupsApi.addInfluencer(id!, {
        ...idFields,
        influencerName: addName.trim() || undefined,
        influencerUsername: addUsername.trim() || undefined,
        platform: addPlatform || undefined,
        followerCount: addFollowers ? parseInt(addFollowers, 10) : undefined,
      });
      showToast('Influencer added');
      setAddName('');
      setAddInfluencerId('');
      setAddUsername('');
      setAddFollowers('');
      fetchMembers();
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to add influencer', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        showToast('File must have a header row and at least one data row', 'error');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const data = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] || '';
        });
        return obj;
      });
      setCsvData(data);
      showToast(`${data.length} influencer(s) parsed from file`);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (csvData.length === 0) return;
    setAddLoading(true);
    try {
      const influencers = csvData
        .map((row) => {
          const rawId = (row.id || row.influencer_id || row.profile_id || row.influencer_profile_id || '').trim();
          const idFields = parseInfluencerIdInput(rawId);
          const name = (row.name || row.influencer_name || row.influencername || '').trim();
          if (!name && !idFields.influencerProfileId && !idFields.platformUserId) return null;
          const plat = (row.platform || '').trim().toUpperCase();
          return {
            ...idFields,
            influencerName: name || undefined,
            influencerUsername: (row.username || row.influencer_username || row.handle || '').trim() || undefined,
            platform: plat || undefined,
            followerCount: parseInt(row.followers || row.follower_count || '0', 10) || 0,
          };
        })
        .filter(Boolean) as Array<{
        influencerProfileId?: string;
        platformUserId?: string;
        influencerName?: string;
        influencerUsername?: string;
        platform?: string;
        followerCount: number;
      }>;

      const result = await influencerGroupsApi.bulkAddInfluencers(id!, { influencers });
      showToast(`Added ${result.added ?? 0}, skipped ${result.skipped ?? 0}`);
      setCsvData([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchMembers();
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Bulk upload failed', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleImportFromGroup = async () => {
    if (!selectedImportGroup) return;
    setAddLoading(true);
    try {
      const result = await influencerGroupsApi.importFromGroup(id!, {
        sourceGroupId: selectedImportGroup,
      });
      showToast(`Imported ${result.importedCount || 0} influencer(s)`);
      setSelectedImportGroup('');
      setShowAddModal(false);
      fetchMembers();
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Import failed', 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const downloadCsvTemplate = () => {
    const csv =
      'id,name,username,platform,followers\n,John Doe,johndoe,,50000\n00000000-0000-4000-8000-000000000001,,,,\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'influencer_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============ COPY TO GROUP ============

  const openCopyModal = () => {
    fetchGroupsForImport();
    setShowCopyModal(true);
    setBulkActionsOpen(false);
  };

  const openCampaignPicker = async () => {
    setBulkActionsOpen(false);
    setShowCampaignPickerModal(true);
    setCampaignPickerLoading(true);
    setSelectedCampaignForBulk('');
    setCampaignsList([]);
    try {
      const [mine, team] = await Promise.all([
        campaignsApi.list({ limit: 100, tab: 'created_by_me' }),
        campaignsApi.list({ limit: 100, tab: 'created_by_team' }),
      ]);
      const merged: any[] = [...(mine.campaigns || [])];
      for (const c of team.campaigns || []) {
        if (!merged.find((x) => x.id === c.id)) merged.push(c);
      }
      setCampaignsList(merged);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to load campaigns', 'error');
    } finally {
      setCampaignPickerLoading(false);
    }
  };

  const submitAddToCampaign = async () => {
    if (!selectedCampaignForBulk || selectedMembers.length === 0) return;
    setAddToCampaignLoading(true);
    try {
      const picked = members.filter((m) => selectedMembers.includes(m.id));
      for (const m of picked) {
        await campaignsApi.addInfluencer(selectedCampaignForBulk, {
          influencerName: m.influencerName,
          influencerUsername: m.influencerUsername?.replace(/^@/, ''),
          platform: m.platform,
          followerCount: m.followerCount,
        });
      }
      showToast(`Added ${picked.length} influencer(s) to campaign`);
      setShowCampaignPickerModal(false);
      setSelectedCampaignForBulk('');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to add to campaign', 'error');
    } finally {
      setAddToCampaignLoading(false);
    }
  };

  const navigateToSentimentsWithSelected = () => {
    const picked = members.filter((m) => selectedMembers.includes(m.id));
    const platforms = new Set(picked.map((m) => m.platform.toUpperCase()));
    if (platforms.size > 1) {
      showToast('Select influencers from a single platform for sentiments', 'error');
      return;
    }
    const only = [...platforms][0];
    if (only === 'YOUTUBE') {
      showToast('Sentiments supports Instagram and TikTok profiles only', 'error');
      return;
    }
    const platform: 'INSTAGRAM' | 'TIKTOK' = only === 'TIKTOK' ? 'TIKTOK' : 'INSTAGRAM';
    const urls: string[] = [];
    for (const m of picked) {
      const u = (m.influencerUsername || '').replace(/^@/, '').trim();
      if (!u) continue;
      if (platform === 'TIKTOK') {
        urls.push(`https://www.tiktok.com/@${u}`);
      } else {
        urls.push(`https://www.instagram.com/${u}/`);
      }
    }
    if (urls.length === 0) {
      showToast('Selected influencers need a username to build profile URLs', 'error');
      return;
    }
    setBulkActionsOpen(false);
    navigate('/sentiments/new', {
      state: {
        sentimentPrefill: {
          urls,
          reportType: 'PROFILE' as const,
          platform,
          multipleQuery: urls.length > 1,
        },
      },
    });
  };

  const navigateToOverlapWithSelected = () => {
    if (selectedMembers.length < 2) {
      showToast('Select at least 2 influencers for audience overlap', 'error');
      return;
    }
    const picked = members.filter((m) => selectedMembers.includes(m.id));
    const overlapMembers = picked.map((m) => ({
      username: m.influencerUsername || m.influencerName,
      platform: m.platform,
    }));
    setBulkActionsOpen(false);
    navigate('/audience-overlap/new', { state: { overlapMembers } });
  };

  const handleCopyToGroup = async () => {
    if (!selectedCopyGroup || selectedMembers.length === 0) return;
    setCopyLoading(true);
    try {
      const result = await influencerGroupsApi.copyToGroup(id!, {
        targetGroupId: selectedCopyGroup,
        memberIds: selectedMembers,
      });
      showToast(`Copied ${result.copiedCount || 0} influencer(s)`);
      setShowCopyModal(false);
      setSelectedCopyGroup('');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Copy failed', 'error');
    } finally {
      setCopyLoading(false);
    }
  };

  // ============ EXPORT / DOWNLOAD ============

  const handleDownloadGroup = () => {
    setShowDotsMenu(false);
    const headers = ['Platform', 'Name', 'Username', 'Followers', 'Credibility', 'Engagement Rate', 'Added'];
    const rows = members.map((m) => [
      m.platform, m.influencerName, m.influencerUsername || '', m.followerCount,
      m.audienceCredibility || '', m.engagementRate || '', new Date(m.addedAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group?.name || 'group'}_influencers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportXlsx = async () => {
    if (!id || !group) return;
    setShowDotsMenu(false);
    try {
      const all: GroupMember[] = [];
      let pageNum = 0;
      let more = true;
      while (more) {
        const response = await influencerGroupsApi.getMembers(id, {
          page: pageNum,
          limit: 500,
        });
        all.push(...response.members);
        more = response.hasMore;
        pageNum += 1;
        if (pageNum > 500) break;
      }
      const rows = all.map((m) => ({
        Name: m.influencerName,
        Platform: m.platform,
        Handle: m.influencerUsername || '',
        Followers: m.followerCount,
        'Engagement Rate': m.engagementRate ?? '',
        'Audience Credibility': m.audienceCredibility ?? '',
        'Avg Likes': m.avgLikes ?? '',
        'Avg Views': m.avgViews ?? '',
        Source: m.source,
        'Added At': new Date(m.addedAt).toLocaleString(),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Influencers');
      const fname = `${group.name.replace(/[^\w\-]+/g, '_')}_influencers.xlsx`;
      XLSX.writeFile(wb, fname);
      showToast('Exported XLSX');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  // ============ INVITATION MANAGEMENT ============

  const openInvitationModal = () => {
    setInvStep(0);
    setInvForm({
      invitationName: '',
      invitationType: 'FORM_ONLY',
      urlSlug: '',
      landingHeader: '',
      landingContent: '',
      landingButtonText: 'Apply Now',
      formHeader: 'Join Our Influencer Network',
      formContent: 'Fill out the form below to apply.',
      formPlatforms: group?.platforms || [],
      collectPhone: false,
      collectEmail: true,
      collectAddress: false,
      pricingOptions: [],
      pricingCurrency: 'USD',
      formButtonText: 'Submit Application',
      thankyouHeader: 'Thank You!',
      thankyouContent: 'Your application has been submitted successfully.',
      logoUrl: '',
      backgroundColor: '#ffffff',
      titleColor: '#000000',
      textColor: '#333333',
      buttonBgColor: '#6366f1',
      buttonTextColor: '#ffffff',
      notifyOnSubmission: true,
    });
    setShowInvitationModal(true);
  };

  const getInvTotalSteps = () => (invForm.invitationType === 'LANDING_PAGE' ? 5 : 4);

  const handleCreateInvitation = async () => {
    if (!invForm.invitationName || !invForm.urlSlug) return;
    setInvLoading(true);
    try {
      await influencerGroupsApi.createInvitation(id!, {
        invitationName: invForm.invitationName,
        invitationType: invForm.invitationType,
        urlSlug: invForm.urlSlug,
        landingHeader: invForm.landingHeader || undefined,
        landingContent: invForm.landingContent || undefined,
        landingButtonText: invForm.landingButtonText || undefined,
        formHeader: invForm.formHeader || undefined,
        formContent: invForm.formContent || undefined,
        formPlatforms: invForm.formPlatforms.length > 0 ? invForm.formPlatforms : undefined,
        collectPhone: invForm.collectPhone,
        collectEmail: invForm.collectEmail,
        pricingOptions: invForm.pricingOptions.length > 0 ? invForm.pricingOptions : undefined,
        pricingCurrency: invForm.pricingCurrency || undefined,
        formButtonText: invForm.formButtonText || undefined,
        thankyouHeader: invForm.thankyouHeader || undefined,
        thankyouContent: invForm.thankyouContent || undefined,
        logoUrl: invForm.logoUrl || undefined,
        backgroundColor: invForm.backgroundColor,
        titleColor: invForm.titleColor,
        textColor: invForm.textColor,
        buttonBgColor: invForm.buttonBgColor,
        buttonTextColor: invForm.buttonTextColor,
        notifyOnSubmission: invForm.notifyOnSubmission,
      });
      showToast('Invitation created');
      setShowInvitationModal(false);
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to create invitation', 'error');
    } finally {
      setInvLoading(false);
    }
  };

  const copyInvitationUrl = (slug: string) => {
    const url = `${window.location.origin}/invite/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Invitation URL copied');
  };

  // ============ APPLICATION MANAGEMENT ============

  const handleApproveApplication = async (appId: string) => {
    try {
      await influencerGroupsApi.approveApplication(id!, appId);
      showToast('Application approved');
      fetchApplications();
      fetchGroup();
      fetchMembers();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve', 'error');
    }
  };

  const handleRejectApplication = async (appId: string) => {
    if (!confirm('Reject this application?')) return;
    try {
      await influencerGroupsApi.rejectApplication(id!, appId);
      showToast('Application rejected');
      fetchApplications();
      fetchGroup();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject', 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedApps.length === 0) return;
    try {
      await influencerGroupsApi.bulkApproveApplications(id!, selectedApps);
      showToast(`${selectedApps.length} application(s) approved`);
      setSelectedApps([]);
      fetchApplications();
      fetchGroup();
      fetchMembers();
    } catch (error) {
      showToast('Bulk approve failed', 'error');
    }
  };

  const handleBulkReject = async () => {
    if (selectedApps.length === 0) return;
    if (!confirm(`Reject ${selectedApps.length} application(s)?`)) return;
    try {
      await influencerGroupsApi.bulkRejectApplications(id!, selectedApps);
      showToast(`${selectedApps.length} application(s) rejected`);
      setSelectedApps([]);
      fetchApplications();
      fetchGroup();
    } catch (error) {
      showToast('Bulk reject failed', 'error');
    }
  };

  // ============ RENDER: LOADING & ERROR ============

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
        <button onClick={() => navigate('/influencer-groups')} className="mt-4 text-indigo-600 hover:text-indigo-800">
          Back to Groups
        </button>
      </div>
    );
  }

  // ============ RENDER ============

  return (
    <div className="max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => navigate('/influencer-groups')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{group.name}</h1>
              <div className="flex gap-1">
                {group.platforms.map((p) => (
                  <span key={p} className="p-1 bg-gray-100 rounded">{getPlatformIcon(p)}</span>
                ))}
              </div>
            </div>
            {group.description && <p className="text-sm text-gray-600 mt-1">{group.description}</p>}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
              <span>Owner: {group.ownerName}</span>
              <span className="hidden sm:inline">Created: {new Date(group.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* 3-Dots Menu */}
          <div className="relative" ref={dotsMenuRef}>
            <button
              onClick={() => setShowDotsMenu(!showDotsMenu)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              <MoreVertical className="w-4 h-4" />
              <span className="hidden sm:inline">Actions</span>
            </button>
            {showDotsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                <button
                  onClick={openEditModal}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4" /> Edit Group
                </button>
                <button
                  onClick={() => { setShowShareModal(true); setShowDotsMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="w-4 h-4" /> Share Group
                </button>
                <button
                  onClick={() => { setShowShareModal(true); setShowDotsMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <UserPlus className="w-4 h-4" /> Invite Team Member
                </button>
                <button
                  onClick={handleDownloadGroup}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" /> Download Group Details
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: 'Influencers', value: group.influencerCount, icon: Users, bg: 'bg-indigo-100', color: 'text-indigo-600' },
          { label: 'Pending', value: group.unapprovedCount, icon: Clock, bg: 'bg-yellow-100', color: 'text-yellow-600' },
          { label: 'Invitations', value: group.invitations?.length || 0, icon: Mail, bg: 'bg-green-100', color: 'text-green-600' },
          { label: 'Shares', value: group.shares?.length || 0, icon: Share2, bg: 'bg-purple-100', color: 'text-purple-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 ${stat.bg} rounded-lg shrink-0`}>
                <stat.icon className={`w-4 sm:w-5 h-4 sm:h-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex -mb-px min-w-max">
            {(['members', 'invitations', 'applications'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'members' && `Influencers (${group.influencerCount})`}
                {tab === 'invitations' && `Invitations (${group.invitations?.length || 0})`}
                {tab === 'applications' && (
                  <>
                    Applications
                    {group.unapprovedCount > 0 && (
                      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        {group.unapprovedCount}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ========== MEMBERS TAB ========== */}
        {activeTab === 'members' && (
          <>
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => { setShowAddModal(true); fetchGroupsForImport(); }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium sm:w-auto w-full"
                  >
                    <Plus className="w-4 h-4" /> Add Influencer
                  </button>
                  <button
                    type="button"
                    onClick={handleExportXlsx}
                    disabled={membersLoading || group.influencerCount === 0}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 text-sm font-medium sm:w-auto w-full disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Export XLSX
                  </button>
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search influencers..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm"
                  >
                    <Filter className="w-4 h-4" /> Filter
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => { setSelectedPlatform(e.target.value); setPage(0); }}
                    className="hidden sm:block px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">All Platforms</option>
                    {group.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {showFilters && (
                  <div className="sm:hidden">
                    <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">All Platforms</option>
                      {group.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                )}

                {/* Bulk actions (dropdown when influencers are selected) */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-xs sm:text-sm text-indigo-700 font-medium">
                      {selectedMembers.length} selected
                    </span>
                    <div className="relative ml-auto" ref={bulkMenuRef}>
                      <button
                        type="button"
                        onClick={() => setBulkActionsOpen((o) => !o)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-indigo-900 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 text-xs sm:text-sm font-medium shadow-sm"
                      >
                        Bulk actions
                        <ChevronDown className={`w-4 h-4 transition-transform ${bulkActionsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {bulkActionsOpen && (
                        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 text-left">
                          <button
                            type="button"
                            onClick={openCampaignPicker}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Add to Campaign
                          </button>
                          <button
                            type="button"
                            onClick={navigateToSentimentsWithSelected}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Compute Sentiments
                          </button>
                          <button
                            type="button"
                            disabled={selectedMembers.length < 2}
                            onClick={navigateToOverlapWithSelected}
                            className={`w-full px-3 py-2 text-left text-sm ${
                              selectedMembers.length < 2
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Compute Overlap (min 2)
                          </button>
                          <div className="border-t border-gray-100 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              setBulkActionsOpen(false);
                              openCopyModal();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5 shrink-0" /> Copy to Group
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkActionsOpen(false);
                              handleRemoveMembers();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" /> Remove Selected
                          </button>
                        </div>
                      )}
                    </div>
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No influencers yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Add influencers to this group to get started.</p>
                  <button
                    onClick={() => { setShowAddModal(true); fetchGroupsForImport(); }}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Influencer
                  </button>
                </div>
              ) : (
                <>
                  {members.length > 0 && (
                    <div className="sm:hidden flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-gray-50">
                      <input
                        type="checkbox"
                        checked={members.length > 0 && selectedMembers.length === members.length}
                        onChange={selectAllMembers}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        aria-label="Select all influencers on this page"
                      />
                      <span className="text-sm text-gray-600">
                        {selectedMembers.length === members.length && members.length > 0
                          ? 'Deselect all'
                          : 'Select all on this page'}
                      </span>
                    </div>
                  )}
                  {/* Mobile Card Layout */}
                  <div className="sm:hidden divide-y divide-gray-200">
                    {members.map((member) => (
                      <div key={member.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selectedMembers.includes(member.id)}
                            onChange={() => toggleMemberSelection(member.id)}
                            className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {member.profilePictureUrl ? (
                              <img src={member.profilePictureUrl} alt={member.influencerName}
                                className="w-10 h-10 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <Users className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {getPlatformIcon(member.platform)}
                                <p className="text-sm font-medium text-gray-900 truncate">{member.influencerName}</p>
                              </div>
                              {member.influencerUsername && (
                                <p className="text-xs text-gray-500 truncate">@{member.influencerUsername}</p>
                              )}
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{formatNumber(member.followerCount)} followers</span>
                                {member.engagementRate && <span>{member.engagementRate.toFixed(1)}% ER</span>}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveSingleMember(member.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 w-10">
                            <input type="checkbox"
                              checked={members.length > 0 && selectedMembers.length === members.length}
                              onChange={selectAllMembers}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              title="Select all on this page"
                              aria-label="Select all influencers on this page"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credibility</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <input type="checkbox" checked={selectedMembers.includes(member.id)}
                                onChange={() => toggleMemberSelection(member.id)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            </td>
                            <td className="px-4 py-4">{getPlatformIcon(member.platform)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {member.profilePictureUrl ? (
                                  <img src={member.profilePictureUrl} alt={member.influencerName}
                                    className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{member.influencerName}</p>
                                  {member.influencerUsername && (
                                    <p className="text-sm text-gray-500">@{member.influencerUsername}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">{formatNumber(member.followerCount)}</td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {member.audienceCredibility ? `${member.audienceCredibility.toFixed(1)}%` : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {member.engagementRate ? `${member.engagementRate.toFixed(2)}%` : '-'}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-500">
                              {new Date(member.addedAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <button onClick={() => handleRemoveSingleMember(member.id)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Remove from group">
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

            {totalMembers > 0 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing {page * 20 + 1} to {Math.min((page + 1) * 20, totalMembers)} of {totalMembers}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Previous</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={!hasMore}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========== INVITATIONS TAB ========== */}
        {activeTab === 'invitations' && (
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Invitations</h3>
              <button onClick={openInvitationModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm w-full sm:w-auto">
                <Plus className="w-4 h-4" /> Create Invitation
              </button>
            </div>

            {group.invitations && group.invitations.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {group.invitations.map((invitation: any) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                      <div className="min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {invitation.invitationName}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          Type: {invitation.invitationType === 'LANDING_PAGE' ? 'Landing Page + Form' : 'Form Only'}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Applications: {invitation.applicationsCount}
                          {invitation.applicationsCount > 0 && (
                            <span className="ml-2 text-yellow-600 font-medium">
                              ({invitation.applicationsCount} unapproved)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          invitation.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {invitation.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button onClick={() => copyInvitationUrl(invitation.urlSlug)}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Copy URL">
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => window.open(`/invite/${invitation.urlSlug}`, '_blank')}
                          className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Open invitation">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        {invitation.applicationsCount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvitationId(invitation.id);
                              setActiveTab('applications');
                            }}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View applications">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No invitations created yet</p>
                <p className="text-xs text-gray-400 mt-1">Create an invitation to let influencers apply to join this group</p>
              </div>
            )}
          </div>
        )}

        {/* ========== APPLICATIONS TAB ========== */}
        {activeTab === 'applications' && (
          <div className="p-0">
            {/* Invitation selector + filters */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {group.invitations && group.invitations.length > 1 && (
                    <select value={selectedInvitationId}
                      onChange={(e) => { setSelectedInvitationId(e.target.value); setAppPage(0); }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                      {group.invitations.map((inv: any) => (
                        <option key={inv.id} value={inv.id}>{inv.invitationName}</option>
                      ))}
                    </select>
                  )}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Search applications..."
                        value={appSearch} onChange={(e) => { setAppSearch(e.target.value); setAppPage(0); }}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
                    </div>
                  </div>
                  <select value={appPlatformFilter}
                    onChange={(e) => { setAppPlatformFilter(e.target.value); setAppPage(0); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">All Platforms</option>
                    {group.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={appStatusFilter}
                    onChange={(e) => { setAppStatusFilter(e.target.value); setAppPage(0); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {selectedApps.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-xs sm:text-sm text-indigo-700 font-medium">{selectedApps.length} selected</span>
                    <div className="flex gap-2 ml-auto">
                      <button onClick={handleBulkApprove}
                        className="flex items-center gap-1 px-3 py-1.5 text-green-700 bg-white border border-green-200 rounded-lg hover:bg-green-50 text-xs sm:text-sm">
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button onClick={handleBulkReject}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 text-xs sm:text-sm">
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Applications List */}
            {!group.invitations?.length ? (
              <div className="text-center py-12 px-4">
                <Mail className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Create an invitation first to receive applications</p>
              </div>
            ) : applicationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No applications found</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="sm:hidden divide-y divide-gray-200">
                  {applications.map((app) => (
                    <div key={app.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start gap-3">
                        <input type="checkbox"
                          checked={selectedApps.includes(app.id)}
                          onChange={() => setSelectedApps((prev) =>
                            prev.includes(app.id) ? prev.filter((i) => i !== app.id) : [...prev, app.id]
                          )}
                          className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          disabled={app.status !== 'PENDING'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(app.platform)}
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {app.influencerName || app.platformUsername}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">@{app.platformUsername}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>{formatNumber(app.followerCount)} followers</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                              app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>{app.status}</span>
                          </div>
                        </div>
                        {app.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => handleApproveApplication(app.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRejectApplication(app.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox"
                            checked={selectedApps.length === applications.filter((a) => a.status === 'PENDING').length && applications.filter((a) => a.status === 'PENDING').length > 0}
                            onChange={() => {
                              const pending = applications.filter((a) => a.status === 'PENDING').map((a) => a.id);
                              setSelectedApps(selectedApps.length === pending.length ? [] : pending);
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Followers</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <input type="checkbox"
                              checked={selectedApps.includes(app.id)}
                              onChange={() => setSelectedApps((prev) =>
                                prev.includes(app.id) ? prev.filter((i) => i !== app.id) : [...prev, app.id]
                              )}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              disabled={app.status !== 'PENDING'} />
                          </td>
                          <td className="px-4 py-4">{getPlatformIcon(app.platform)}</td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{app.influencerName || app.platformUsername}</p>
                              <p className="text-sm text-gray-500">@{app.platformUsername}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">{formatNumber(app.followerCount)}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>{app.status}</span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setShowApplicationDetail(app)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="View details">
                                <Eye className="w-4 h-4" />
                              </button>
                              {app.status === 'PENDING' && (
                                <>
                                  <button onClick={() => handleApproveApplication(app.id)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve">
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleRejectApplication(app.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject">
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {appTotal > 0 && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs sm:text-sm text-gray-500">
                  Showing {appPage * 20 + 1} to {Math.min((appPage + 1) * 20, appTotal)} of {appTotal}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setAppPage((p) => Math.max(0, p - 1))} disabled={appPage === 0}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Previous</button>
                  <button onClick={() => setAppPage((p) => p + 1)} disabled={!appHasMore}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========== MODALS ========== */}

      {/* Edit Group Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Group">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
            <div className="flex gap-3">
              {['INSTAGRAM', 'YOUTUBE', 'TIKTOK'].map((p) => (
                <button key={p} type="button"
                  onClick={() => setEditPlatforms((prev) =>
                    prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                  )}
                  className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all ${
                    editPlatforms.includes(p) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  {getPlatformIcon(p)}
                  <span className="text-sm">{p}</span>
                  {editPlatforms.includes(p) && <Check className="w-4 h-4 text-indigo-600" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleEditGroup} disabled={editLoading || !editName.trim() || editPlatforms.length === 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Share Group Modal */}
      <Modal open={showShareModal} onClose={() => setShowShareModal(false)} title="Share Group / Invite Team" wide>
        <div className="space-y-6">
          {/* Share with user */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Share with User / Invite Team Member
            </h4>
            <p className="text-xs text-gray-500 mb-3">Enter the email of a registered SocialTweebs user to share this group.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
              <select value={sharePermission} onChange={(e) => setSharePermission(e.target.value as 'VIEW' | 'EDIT')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="VIEW">View</option>
                <option value="EDIT">Edit</option>
              </select>
              <button onClick={handleShareWithUser} disabled={shareLoading || !shareEmail.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {shareLoading ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </div>

          {/* Public Link */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Public Link
            </h4>
            {group.isPublic && group.shareUrlToken ? (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <input type="text" readOnly
                  value={`${window.location.origin}/groups/shared/${group.shareUrlToken}`}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-600" />
                <button onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/groups/shared/${group.shareUrlToken}`);
                  showToast('Link copied');
                }} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button onClick={handleMakePublic} disabled={shareLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                Generate Public Link
              </button>
            )}
          </div>

          {/* Current Shares */}
          {group.shares && group.shares.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Current Shares</h4>
              <div className="space-y-2">
                {group.shares.map((share: any) => (
                  <div key={share.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm text-gray-900">{share.sharedWithUserName || share.sharedWithUserEmail}</p>
                      <p className="text-xs text-gray-500">{share.permissionLevel} access</p>
                    </div>
                    <button onClick={() => handleRemoveShare(share.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Influencer Modal */}
      <Modal open={showAddModal} onClose={() => {
        setShowAddModal(false);
        setCsvData([]);
        setAddInfluencerId('');
      }} title="Add Influencer" wide>
        <div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {[
              { id: 'manual' as const, label: 'Manual Add', icon: UserPlus },
              { id: 'upload' as const, label: 'Upload List', icon: Upload },
              { id: 'import' as const, label: 'Import from Group', icon: FileSpreadsheet },
            ].map((t) => (
              <button key={t.id} onClick={() => setAddTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  addTab === t.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* Manual Add */}
          {addTab === 'manual' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Enter an <strong>influencer name</strong> and/or an <strong>influencer ID</strong> (profile UUID or platform user id). All other fields are optional.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Influencer name</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Influencer ID</label>
                <input type="text" value={addInfluencerId} onChange={(e) => setAddInfluencerId(e.target.value)}
                  placeholder="Profile UUID or platform user id"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select value={addPlatform} onChange={(e) => setAddPlatform(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Default ({group.platforms[0] || '—'})</option>
                  {group.platforms.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={addUsername} onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="e.g., johndoe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Followers</label>
                <input type="number" value={addFollowers} onChange={(e) => setAddFollowers(e.target.value)}
                  placeholder="e.g., 50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <button onClick={handleAddManual}
                disabled={addLoading || (!addName.trim() && !addInfluencerId.trim())}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {addLoading ? 'Adding...' : 'Add Influencer'}
              </button>
            </div>
          )}

          {/* Upload CSV/XLSX */}
          {addTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-2">Upload a CSV file with influencer data</p>
                <p className="text-xs text-gray-400 mb-4">
                  Columns: id (profile UUID or platform user id), name, username, platform, followers — name or id required per row
                </p>
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload}
                  className="hidden" id="csv-upload" />
                <div className="flex justify-center gap-3">
                  <label htmlFor="csv-upload"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm cursor-pointer hover:bg-indigo-700">
                    Choose File
                  </label>
                  <button onClick={downloadCsvTemplate}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <Download className="w-4 h-4 inline mr-1" /> Download Template
                  </button>
                </div>
              </div>
              {csvData.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{csvData.length} influencer(s) ready to import</p>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Username</th>
                          <th className="px-3 py-2 text-left">Platform</th>
                          <th className="px-3 py-2 text-left">Followers</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {csvData.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5">{row.name || row.influencer_name || '-'}</td>
                            <td className="px-3 py-1.5">{row.username || row.handle || '-'}</td>
                            <td className="px-3 py-1.5">{row.platform || 'INSTAGRAM'}</td>
                            <td className="px-3 py-1.5">{row.followers || row.follower_count || '0'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <p className="text-xs text-gray-400 text-center py-2">...and {csvData.length - 10} more</p>
                    )}
                  </div>
                  <button onClick={handleBulkUpload} disabled={addLoading}
                    className="w-full mt-3 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                    {addLoading ? 'Uploading...' : `Upload ${csvData.length} Influencer(s)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Import from Group */}
          {addTab === 'import' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Import all influencers from another group into this one.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Group</label>
                <select value={selectedImportGroup} onChange={(e) => setSelectedImportGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select a group...</option>
                  {importGroups.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.influencerCount} influencers)
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleImportFromGroup} disabled={addLoading || !selectedImportGroup}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                {addLoading ? 'Importing...' : 'Import Influencers'}
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Add to Campaign Modal */}
      <Modal
        open={showCampaignPickerModal}
        onClose={() => {
          setShowCampaignPickerModal(false);
          setSelectedCampaignForBulk('');
        }}
        title="Add to campaign"
      >
        {campaignPickerLoading ? (
          <div className="py-10 flex justify-center text-gray-500 text-sm">Loading campaigns…</div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Add {selectedMembers.length} selected influencer(s) to a campaign.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select
                value={selectedCampaignForBulk}
                onChange={(e) => setSelectedCampaignForBulk(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select a campaign…</option>
                {campaignsList.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCampaignPickerModal(false);
                  setSelectedCampaignForBulk('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitAddToCampaign}
                disabled={!selectedCampaignForBulk || addToCampaignLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {addToCampaignLoading ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Copy to Group Modal */}
      <Modal open={showCopyModal} onClose={() => setShowCopyModal(false)} title="Copy Influencers to Group">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Copy {selectedMembers.length} selected influencer(s) to another group.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Group</label>
            <select value={selectedCopyGroup} onChange={(e) => setSelectedCopyGroup(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">Select a group...</option>
              {copyGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name} ({g.influencerCount} influencers)</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowCopyModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button onClick={handleCopyToGroup} disabled={copyLoading || !selectedCopyGroup}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {copyLoading ? 'Copying...' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Invitation Modal */}
      <Modal open={showInvitationModal} onClose={() => setShowInvitationModal(false)} title="Create Invitation" wide>
        <div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {Array.from({ length: getInvTotalSteps() }, (_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />}
                <button
                  onClick={() => { if (i < invStep) setInvStep(i); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 ${
                    i === invStep ? 'bg-indigo-600 text-white' :
                    i < invStep ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                  {i + 1}.{' '}
                  {invForm.invitationType === 'LANDING_PAGE'
                    ? ['Type', 'Landing Page', 'Form', 'Branding', 'Finalize'][i]
                    : ['Type', 'Form', 'Branding', 'Finalize'][i]
                  }
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Step 0: Type Selection */}
          {invStep === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Choose how influencers will discover and apply to your group.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { id: 'LANDING_PAGE' as const, title: 'Landing Page + Form', desc: 'Full landing page with content, images/video, and an application form.' },
                  { id: 'FORM_ONLY' as const, title: 'Application Form Only', desc: 'Direct application form without a landing page.' },
                ]).map((opt) => (
                  <button key={opt.id}
                    onClick={() => setInvForm({ ...invForm, invitationType: opt.id })}
                    className={`text-left p-4 border-2 rounded-lg transition-all ${
                      invForm.invitationType === opt.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className="font-medium text-gray-900 text-sm">{opt.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <button onClick={() => setInvStep(1)}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                Next
              </button>
            </div>
          )}

          {/* Landing Page Step (only for LANDING_PAGE type) */}
          {invStep === 1 && invForm.invitationType === 'LANDING_PAGE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landing Page Header</label>
                <input type="text" value={invForm.landingHeader}
                  onChange={(e) => setInvForm({ ...invForm, landingHeader: e.target.value })}
                  placeholder="Join Our Influencer Network"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={invForm.landingContent}
                  onChange={(e) => setInvForm({ ...invForm, landingContent: e.target.value })}
                  rows={4} placeholder="Tell influencers why they should join..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                <input type="text" value={invForm.landingButtonText}
                  onChange={(e) => setInvForm({ ...invForm, landingButtonText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInvStep(0)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button onClick={() => setInvStep(2)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Next</button>
              </div>
            </div>
          )}

          {/* Form Step */}
          {((invStep === 1 && invForm.invitationType === 'FORM_ONLY') ||
            (invStep === 2 && invForm.invitationType === 'LANDING_PAGE')) && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Header</label>
                <input type="text" value={invForm.formHeader}
                  onChange={(e) => setInvForm({ ...invForm, formHeader: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Form Description</label>
                <textarea value={invForm.formContent}
                  onChange={(e) => setInvForm({ ...invForm, formContent: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {group.platforms.map((p) => (
                    <button key={p} type="button"
                      onClick={() => setInvForm({
                        ...invForm,
                        formPlatforms: invForm.formPlatforms.includes(p)
                          ? invForm.formPlatforms.filter((x) => x !== p) : [...invForm.formPlatforms, p]
                      })}
                      className={`flex items-center gap-2 px-3 py-1.5 border-2 rounded-lg text-sm ${
                        invForm.formPlatforms.includes(p) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                      }`}>
                      {getPlatformIcon(p)} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={invForm.collectPhone}
                    onChange={(e) => setInvForm({ ...invForm, collectPhone: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600" /> Collect Phone
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={invForm.collectEmail}
                    onChange={(e) => setInvForm({ ...invForm, collectEmail: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600" /> Collect Email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={invForm.collectAddress}
                    onChange={(e) => setInvForm({ ...invForm, collectAddress: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600" /> Collect Address
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Options</label>
                <div className="flex flex-wrap gap-2">
                  {['PHOTO', 'VIDEO', 'STORY', 'CAROUSEL'].map((opt) => (
                    <button key={opt} type="button"
                      onClick={() => setInvForm({
                        ...invForm,
                        pricingOptions: invForm.pricingOptions.includes(opt)
                          ? invForm.pricingOptions.filter((x) => x !== opt) : [...invForm.pricingOptions, opt]
                      })}
                      className={`px-3 py-1.5 border-2 rounded-lg text-xs ${
                        invForm.pricingOptions.includes(opt) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submit Button Text</label>
                <input type="text" value={invForm.formButtonText}
                  onChange={(e) => setInvForm({ ...invForm, formButtonText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Page Header</label>
                <input type="text" value={invForm.thankyouHeader}
                  onChange={(e) => setInvForm({ ...invForm, thankyouHeader: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Page Content</label>
                <textarea value={invForm.thankyouContent}
                  onChange={(e) => setInvForm({ ...invForm, thankyouContent: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setInvStep(invForm.invitationType === 'LANDING_PAGE' ? 1 : 0)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button onClick={() => setInvStep(invForm.invitationType === 'LANDING_PAGE' ? 3 : 2)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Next</button>
              </div>
            </div>
          )}

          {/* Branding Step */}
          {((invStep === 2 && invForm.invitationType === 'FORM_ONLY') ||
            (invStep === 3 && invForm.invitationType === 'LANDING_PAGE')) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Branding & Colors</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" value={invForm.logoUrl}
                  onChange={(e) => setInvForm({ ...invForm, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'backgroundColor', label: 'Background' },
                  { key: 'titleColor', label: 'Title' },
                  { key: 'textColor', label: 'Text' },
                  { key: 'buttonBgColor', label: 'Button BG' },
                  { key: 'buttonTextColor', label: 'Button Text' },
                ].map((c) => (
                  <div key={c.key}>
                    <label className="block text-xs text-gray-600 mb-1">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={(invForm as any)[c.key]}
                        onChange={(e) => setInvForm({ ...invForm, [c.key]: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" value={(invForm as any)[c.key]}
                        onChange={(e) => setInvForm({ ...invForm, [c.key]: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setInvStep(invForm.invitationType === 'LANDING_PAGE' ? 2 : 1)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button onClick={() => setInvStep(invForm.invitationType === 'LANDING_PAGE' ? 4 : 3)}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Next</button>
              </div>
            </div>
          )}

          {/* Finalize Step */}
          {((invStep === 3 && invForm.invitationType === 'FORM_ONLY') ||
            (invStep === 4 && invForm.invitationType === 'LANDING_PAGE')) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Final Details</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Name *</label>
                <input type="text" value={invForm.invitationName}
                  onChange={(e) => {
                    setInvForm({
                      ...invForm,
                      invitationName: e.target.value,
                      urlSlug: invForm.urlSlug || generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g., Summer Campaign Invite"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug * <span className="text-xs text-gray-400">(permanent, cannot be changed)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">/invite/</span>
                  <input type="text" value={invForm.urlSlug}
                    onChange={(e) => setInvForm({ ...invForm, urlSlug: generateSlug(e.target.value) })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={invForm.notifyOnSubmission}
                  onChange={(e) => setInvForm({ ...invForm, notifyOnSubmission: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600" />
                Notify me when an influencer submits the form
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setInvStep(invForm.invitationType === 'LANDING_PAGE' ? 3 : 2)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
                <button onClick={handleCreateInvitation}
                  disabled={invLoading || !invForm.invitationName || !invForm.urlSlug}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {invLoading ? 'Creating...' : 'Create Invitation'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Application Detail Modal */}
      <Modal
        open={!!showApplicationDetail}
        onClose={() => setShowApplicationDetail(null)}
        title="Application Details"
      >
        {showApplicationDetail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              {showApplicationDetail.profilePictureUrl ? (
                <img src={showApplicationDetail.profilePictureUrl} alt=""
                  className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
                  <Users className="w-7 h-7 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {showApplicationDetail.influencerName || showApplicationDetail.platformUsername}
                </p>
                <p className="text-sm text-gray-500">@{showApplicationDetail.platformUsername}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Platform</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {getPlatformIcon(showApplicationDetail.platform)}
                  <span className="text-gray-900">{showApplicationDetail.platform}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-500">Followers</p>
                <p className="text-gray-900 mt-0.5">{formatNumber(showApplicationDetail.followerCount)}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <span className={`inline-block mt-0.5 px-2 py-1 text-xs rounded-full ${
                  showApplicationDetail.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  showApplicationDetail.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>{showApplicationDetail.status}</span>
              </div>
              <div>
                <p className="text-gray-500">Submitted</p>
                <p className="text-gray-900 mt-0.5">{new Date(showApplicationDetail.submittedAt).toLocaleString()}</p>
              </div>
              {showApplicationDetail.email && (
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="text-gray-900 mt-0.5">{showApplicationDetail.email}</p>
                </div>
              )}
              {showApplicationDetail.phoneNumber && (
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-900 mt-0.5">{showApplicationDetail.phoneNumber}</p>
                </div>
              )}
            </div>
            {showApplicationDetail.status === 'PENDING' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => { handleApproveApplication(showApplicationDetail.id); setShowApplicationDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                  <CheckCircle className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => { handleRejectApplication(showApplicationDetail.id); setShowApplicationDetail(null); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InfluencerGroupDetailPage;
