import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  ChevronDown, 
  ChevronUp,
  Instagram, 
  Youtube, 
  Music2,
  Linkedin,
  Users,
  Eye,
  Heart,
  BadgeCheck,
  Lock,
  Unlock,
  RefreshCw,
  X,
  MapPin,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Play,
  ShoppingBag,
  LayoutGrid,
  List,
  Hash,
  AtSign,
  Plus,
  Calendar,
  Globe,
  Mail,
  Target,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { 
  Platform, 
  InfluencerProfile, 
  SearchFilters, 
  TextTagFilter,
  LocationOption,
  InterestOption,
  BrandOption,
} from '../../types';
import { 
  CONTACT_TYPES, 
  ACCOUNT_TYPES, 
  GROWTH_INTERVALS, 
  AGE_GROUPS,
  SORT_FIELDS,
} from '../../types';
import { discoveryApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const platforms = [
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: 'bg-red-500' },
  { id: 'TIKTOK', name: 'TikTok', icon: Music2, color: 'bg-black' },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600' },
];

// ============ REUSABLE FILTER COMPONENTS ============

// Collapsible Section
const FilterSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-gray-800 text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {isOpen && <div className="p-3 space-y-3 border-t border-gray-100">{children}</div>}
    </div>
  );
};

// Tag Input for Hashtags/Mentions
const TagInput: React.FC<{
  tags: TextTagFilter[];
  onChange: (tags: TextTagFilter[]) => void;
}> = ({ tags, onChange }) => {
  const [input, setInput] = useState('');
  const [type, setType] = useState<'hashtag' | 'mention'>('hashtag');

  const addTag = () => {
    if (!input.trim()) return;
    const value = input.replace(/^[#@]/, '').trim();
    if (value && !tags.some((t) => t.value === value && t.type === type)) {
      onChange([...tags, { type, value }]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <select value={type} onChange={(e) => setType(e.target.value as any)} className="input py-1.5 text-sm w-20 sm:w-24">
          <option value="hashtag">#</option>
          <option value="mention">@</option>
        </select>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder={type === 'hashtag' ? 'hashtag' : 'username'}
          className="input py-1.5 text-sm flex-1 min-w-0"
        />
        <button onClick={addTag} className="btn btn-secondary py-1.5 px-2 shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, i) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              tag.type === 'hashtag' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {tag.type === 'hashtag' ? '#' : '@'}{tag.value}
              <button onClick={() => onChange(tags.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Relevance/Lookalike Input
const RelevanceInput: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}> = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const addValue = () => {
    if (!input.trim()) return;
    if (!values.includes(input.trim())) {
      onChange([...values, input.trim()]);
    }
    setInput('');
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
          placeholder={placeholder}
          className="input py-1.5 text-sm flex-1 min-w-0"
        />
        <button onClick={addValue} className="btn btn-secondary py-1.5 px-2 shrink-0">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((v, i) => (
            <span key={i} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
              v.startsWith('#') ? 'bg-blue-100 text-blue-700' : v.startsWith('@') ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {v}
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Async Searchable Select
const AsyncSelect: React.FC<{
  value: number[];
  onChange: (ids: number[]) => void;
  fetchOptions: (query: string) => Promise<{ id: number; name: string }[]>;
  placeholder?: string;
}> = ({ value, onChange, fetchOptions, placeholder = 'Search...' }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const results = await fetchOptions(debouncedQuery);
        setOptions(results.slice(0, 50));
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) load();
  }, [debouncedQuery, isOpen, fetchOptions]);

  const selectedOptions = options.filter((o) => value.includes(o.id));

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input py-1.5 text-sm cursor-pointer min-h-[34px] flex flex-wrap gap-1 items-center"
      >
        {selectedOptions.length > 0 ? (
          selectedOptions.map((opt) => (
            <span key={opt.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
              {opt.name}
              <button onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v !== opt.id)); }}><X className="w-3 h-3" /></button>
            </span>
          ))
        ) : (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        )}
      </div>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          <div className="p-2 border-b sticky top-0 bg-white">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="input py-1 text-sm w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {isLoading ? (
            <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-gray-500 text-sm">No results</div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  if (value.includes(opt.id)) {
                    onChange(value.filter((v) => v !== opt.id));
                  } else {
                    onChange([...value, opt.id]);
                  }
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  value.includes(opt.id) ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                {opt.name}
                {value.includes(opt.id) && <span>✓</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ============ MAIN COMPONENT ============

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('INSTAGRAM');
  const [isLoading, setIsLoading] = useState(false);
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [showUnblurModal, setShowUnblurModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isExactMatch, setIsExactMatch] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Complete filters state
  const [filters, setFilters] = useState<SearchFilters>({
    platform: selectedPlatform,
    influencer: {},
    audience: {},
    sort: { field: 'followers', direction: 'desc' },
    page: 0,
  });

  // Helper functions
  const updateInfluencerFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      influencer: {
        ...prev.influencer,
        [key]: value === '' || value === undefined || (Array.isArray(value) && value.length === 0) ? undefined : value,
      },
    }));
  };

  const updateAudienceFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      audience: {
        ...prev.audience,
        [key]: value === '' || value === undefined || (Array.isArray(value) && value.length === 0) ? undefined : value,
      },
    }));
  };

  // Update platform
  useEffect(() => {
    setFilters((prev) => ({ ...prev, platform: selectedPlatform }));
  }, [selectedPlatform]);

  // Initial load
  useEffect(() => {
    handleSearch();
  }, [selectedPlatform]);

  const handleSearch = async (page = 0) => {
    if (!selectedPlatform) return;
    
    setIsLoading(true);
    setError(null);
    setShowFilters(false); // Close mobile filters after search
    
    try {
      const searchFilters: SearchFilters = { ...filters, platform: selectedPlatform, page };

      // Clean empty values
      if (searchFilters.influencer) {
        Object.keys(searchFilters.influencer).forEach((key) => {
          const val = (searchFilters.influencer as any)[key];
          if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0) ||
              (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).every(k => (val as any)[k] === undefined))) {
            delete (searchFilters.influencer as any)[key];
          }
        });
      }
      if (searchFilters.audience) {
        Object.keys(searchFilters.audience).forEach((key) => {
          const val = (searchFilters.audience as any)[key];
          if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) {
            delete (searchFilters.audience as any)[key];
          }
        });
      }

      const response = await discoveryApi.search(searchFilters);
      
      if (page === 0) {
        setInfluencers(response.influencers);
      } else {
        setInfluencers((prev) => [...prev, ...response.influencers]);
      }
      
      setTotalResults(response.total);
      setCurrentPage(page);
      setHasMore((page + 1) * 15 < response.total);
      setIsExactMatch(response.isExactMatch !== false);
      
      if (user && response.creditsUsed > 0) {
        updateUser({ ...user, credits: user.credits - response.creditsUsed });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      platform: selectedPlatform,
      influencer: {},
      audience: {},
      sort: { field: 'followers', direction: 'desc' },
      page: 0,
    });
  };

  const handleUnblur = async (profileIds: string[]) => {
    try {
      const response = await discoveryApi.unblur(profileIds, selectedPlatform);
      setInfluencers((prev) => prev.map((inf) => profileIds.includes(inf.id) ? { ...inf, isBlurred: false } : inf));
      if (user) updateUser({ ...user, credits: user.credits - response.creditsUsed });
      setShowUnblurModal(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unblur profiles');
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const blurredCount = influencers.filter((i) => i.isBlurred).length;
  const unblurCost = blurredCount * 0.04;

  // Filter sidebar content
  const FilterContent = () => (
    <div className="space-y-3">
      {/* Platform Selection */}
      <div className="card p-3">
        <label className="text-xs font-medium text-gray-600 mb-2 block">Platform</label>
        <div className="grid grid-cols-2 gap-2">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPlatform(p.id as Platform); setCurrentPage(0); }}
              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedPlatform === p.id ? `${p.color} text-white shadow` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <p.icon className="w-4 h-4" />
              <span className="hidden xs:inline">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Sort */}
      <div className="card p-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Bio / Name Search</label>
          <input
            type="text"
            placeholder="Search keywords..."
            value={filters.influencer?.bio || ''}
            onChange={(e) => updateInfluencerFilter('bio', e.target.value)}
            className="input py-1.5 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sort By</label>
            <select
              value={filters.sort?.field || 'followers'}
              onChange={(e) => setFilters({ ...filters, sort: { ...filters.sort!, field: e.target.value as any } })}
              className="input py-1.5 text-sm"
            >
              {SORT_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Direction</label>
            <select
              value={filters.sort?.direction || 'desc'}
              onChange={(e) => setFilters({ ...filters, sort: { ...filters.sort!, direction: e.target.value as any } })}
              className="input py-1.5 text-sm"
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <FilterSection title="Metrics" icon={<Users className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Followers</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.influencer?.followers?.min || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
            <input type="number" placeholder="Max" value={filters.influencer?.followers?.max || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Min Engagement Rate (%)</label>
          <input type="number" step="0.1" placeholder="e.g., 2.5" value={filters.influencer?.engagementRate ? filters.influencer.engagementRate * 100 : ''} onChange={(e) => updateInfluencerFilter('engagementRate', e.target.value ? parseFloat(e.target.value) / 100 : undefined)} className="input py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Engagements</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.influencer?.engagements?.min || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
            <input type="number" placeholder="Max" value={filters.influencer?.engagements?.max || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
          </div>
        </div>
        {selectedPlatform === 'INSTAGRAM' && (
          <div>
            <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1"><Play className="w-3 h-3" /> Reels Plays</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.influencer?.reelsPlays?.min || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
              <input type="number" placeholder="Max" value={filters.influencer?.reelsPlays?.max || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
            </div>
          </div>
        )}
      </FilterSection>

      {/* Content & Activity */}
      <FilterSection title="Content & Activity" icon={<Calendar className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Posted Within (Days)</label>
          <input type="number" min="30" placeholder="e.g., 30, 60, 90" value={filters.influencer?.lastposted || ''} onChange={(e) => updateInfluencerFilter('lastposted', e.target.value ? parseInt(e.target.value) : undefined)} className="input py-1.5 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Find active influencers (min 30 days)</p>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Keywords in Posts</label>
          <input type="text" placeholder="e.g., fitness, lifestyle" value={filters.influencer?.keywords || ''} onChange={(e) => updateInfluencerFilter('keywords', e.target.value)} className="input py-1.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Hashtags & Mentions Used</label>
          <TagInput tags={filters.influencer?.textTags || []} onChange={(tags) => updateInfluencerFilter('textTags', tags)} />
        </div>
      </FilterSection>

      {/* Lookalike Search */}
      <FilterSection title="Lookalike Search" icon={<Target className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Similar Topics To</label>
          <RelevanceInput values={filters.influencer?.relevance || []} onChange={(v) => updateInfluencerFilter('relevance', v)} placeholder="#hashtag or @username" />
          <p className="text-xs text-gray-400 mt-1">Find similar content creators</p>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Similar Audience To</label>
          <RelevanceInput values={filters.influencer?.audienceRelevance || []} onChange={(v) => updateInfluencerFilter('audienceRelevance', v)} placeholder="@username" />
          <p className="text-xs text-gray-400 mt-1">Audience lookalike search</p>
        </div>
      </FilterSection>

      {/* Growth & Performance */}
      <FilterSection title="Growth & Performance" icon={<TrendingUp className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Followers Growth Rate</label>
          <div className="grid grid-cols-3 gap-1">
            <select value={filters.influencer?.followersGrowthRate?.interval || ''} onChange={(e) => updateInfluencerFilter('followersGrowthRate', { ...filters.influencer?.followersGrowthRate, interval: e.target.value || undefined })} className="input py-1.5 text-xs">
              <option value="">Period</option>
              {GROWTH_INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
            <select value={filters.influencer?.followersGrowthRate?.operator || ''} onChange={(e) => updateInfluencerFilter('followersGrowthRate', { ...filters.influencer?.followersGrowthRate, operator: e.target.value || undefined })} className="input py-1.5 text-xs">
              <option value="">Op</option>
              <option value="gt">&gt;</option>
              <option value="gte">≥</option>
              <option value="lt">&lt;</option>
              <option value="lte">≤</option>
            </select>
            <input type="number" step="0.01" placeholder="0.05" value={filters.influencer?.followersGrowthRate?.value || ''} onChange={(e) => updateInfluencerFilter('followersGrowthRate', { ...filters.influencer?.followersGrowthRate, value: e.target.value ? parseFloat(e.target.value) : undefined })} className="input py-1.5 text-xs" />
          </div>
          <p className="text-xs text-gray-400 mt-1">0.05 = 5% growth</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.influencer?.hasSponsoredPosts || false} onChange={(e) => updateInfluencerFilter('hasSponsoredPosts', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm text-gray-700">Has Sponsored Posts</span>
          <ShoppingBag className="w-3 h-3 text-green-500" />
        </label>
      </FilterSection>

      {/* Account Properties */}
      <FilterSection title="Account Properties" icon={<BadgeCheck className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Account Type</label>
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <label key={t.value} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={filters.influencer?.accountTypes?.includes(t.value) || false} onChange={(e) => {
                  const current = filters.influencer?.accountTypes || [];
                  const updated = e.target.checked ? [...current, t.value] : current.filter((v) => v !== t.value);
                  updateInfluencerFilter('accountTypes', updated.length > 0 ? updated : undefined);
                }} className="w-3.5 h-3.5 text-primary-600 rounded" />
                <span className="text-sm text-gray-700">{t.label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.influencer?.isVerified || false} onChange={(e) => updateInfluencerFilter('isVerified', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm text-gray-700">Verified Only</span>
          <BadgeCheck className="w-4 h-4 text-blue-500" />
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.influencer?.hasYouTube || false} onChange={(e) => updateInfluencerFilter('hasYouTube', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm text-gray-700">Has YouTube</span>
          <Youtube className="w-4 h-4 text-red-500" />
        </label>
      </FilterSection>

      {/* Contact Information */}
      <FilterSection title="Contact Info" icon={<Mail className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          {CONTACT_TYPES.slice(0, 10).map((c) => {
            const isSelected = filters.influencer?.hasContactDetails?.some((x) => x.contactType === c.value);
            return (
              <label key={c.value} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={isSelected || false} onChange={(e) => {
                  const current = filters.influencer?.hasContactDetails || [];
                  const updated = e.target.checked ? [...current, { contactType: c.value, filterAction: 'must' as const }] : current.filter((x) => x.contactType !== c.value);
                  updateInfluencerFilter('hasContactDetails', updated.length > 0 ? updated : undefined);
                }} className="w-3.5 h-3.5 text-primary-600 rounded" />
                <span className="text-xs text-gray-700">{c.label}</span>
              </label>
            );
          })}
        </div>
      </FilterSection>

      {/* Demographics */}
      <FilterSection title="Demographics" icon={<Globe className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Location</label>
          <AsyncSelect
            value={filters.influencer?.location || []}
            onChange={(ids) => updateInfluencerFilter('location', ids.length > 0 ? ids : undefined)}
            fetchOptions={async (q) => (await discoveryApi.getLocations(q)).map((l) => ({ id: l.id, name: l.name }))}
            placeholder="Select locations..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Language</label>
          <select value={filters.influencer?.language || ''} onChange={(e) => updateInfluencerFilter('language', e.target.value || undefined)} className="input py-1.5 text-sm">
            <option value="">Any</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
            <option value="zh">Chinese</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Gender</label>
            <select value={filters.influencer?.gender || ''} onChange={(e) => updateInfluencerFilter('gender', e.target.value || undefined)} className="input py-1.5 text-sm">
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Age</label>
            <div className="flex gap-1">
              <select value={filters.influencer?.age?.min || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-xs">
                <option value="">Min</option>
                <option value="18">18</option>
                <option value="25">25</option>
                <option value="35">35</option>
                <option value="45">45</option>
              </select>
              <select value={filters.influencer?.age?.max || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-xs">
                <option value="">Max</option>
                <option value="25">25</option>
                <option value="35">35</option>
                <option value="45">45</option>
                <option value="65">65</option>
              </select>
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Audience Demographics */}
      <FilterSection title="Audience Demographics" icon={<Users className="w-4 h-4 text-purple-500" />} defaultOpen={false}>
        <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2">
          <Info className="w-3 h-3 inline mr-1" />
          Weights (0-1) set minimum thresholds. 0.3 = 30% of audience.
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Location</label>
          <AsyncSelect
            value={filters.audience?.location?.map((l) => l.id) || []}
            onChange={(ids) => updateAudienceFilter('location', ids.length > 0 ? ids.map((id) => ({ id, weight: 0.2 })) : undefined)}
            fetchOptions={async (q) => (await discoveryApi.getLocations(q)).map((l) => ({ id: l.id, name: l.name }))}
            placeholder="Select locations..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Gender</label>
          <select value={filters.audience?.gender?.id || ''} onChange={(e) => updateAudienceFilter('gender', e.target.value ? { id: e.target.value as any, weight: 0.5 } : undefined)} className="input py-1.5 text-sm">
            <option value="">Any</option>
            <option value="MALE">Majority Male</option>
            <option value="FEMALE">Majority Female</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Age</label>
          <div className="flex flex-wrap gap-1">
            {AGE_GROUPS.map((a) => {
              const isSelected = filters.audience?.age?.some((x) => x.id === a.value);
              return (
                <label key={a.value} className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={isSelected || false} onChange={(e) => {
                    const current = filters.audience?.age || [];
                    const updated = e.target.checked ? [...current, { id: a.value as any, weight: 0.3 }] : current.filter((x) => x.id !== a.value);
                    updateAudienceFilter('age', updated.length > 0 ? updated : undefined);
                  }} className="w-3.5 h-3.5 text-primary-600 rounded" />
                  <span className="text-xs text-gray-700">{a.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Credibility</label>
          <input type="range" min="0" max="1" step="0.05" value={filters.audience?.credibility || 0} onChange={(e) => updateAudienceFilter('credibility', parseFloat(e.target.value) > 0 ? parseFloat(e.target.value) : undefined)} className="w-full" />
          <div className="flex justify-between text-xs text-gray-400">
            <span>No filter</span>
            <span className="text-gray-700 font-medium">{filters.audience?.credibility ? `${Math.round(filters.audience.credibility * 100)}% real` : 'Not set'}</span>
            <span>100%</span>
          </div>
        </div>
      </FilterSection>

      {/* Brands & Interests */}
      <FilterSection title="Brands & Interests" icon={<ShoppingBag className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Brands Partnered With</label>
          <AsyncSelect
            value={filters.influencer?.brands || []}
            onChange={(ids) => updateInfluencerFilter('brands', ids.length > 0 ? ids : undefined)}
            fetchOptions={async (q) => (await discoveryApi.getBrands(q)).map((b) => ({ id: b.id, name: b.name }))}
            placeholder="Search brands..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Interests</label>
          <AsyncSelect
            value={filters.influencer?.interests || []}
            onChange={(ids) => updateInfluencerFilter('interests', ids.length > 0 ? ids : undefined)}
            fetchOptions={async (q) => {
              const results = await discoveryApi.getInterests(selectedPlatform);
              return q ? results.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : results;
            }}
            placeholder="Select interests..."
          />
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="flex gap-2 sticky bottom-0 bg-gray-50 pt-2 pb-safe-bottom">
        <button onClick={() => handleSearch(0)} disabled={isLoading} className="btn btn-primary flex-1 py-2.5">
          {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
          Search
        </button>
        <button onClick={resetFilters} className="btn btn-secondary py-2.5 px-3">Reset</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Influencer Discovery</h1>
          <p className="text-gray-500 text-sm hidden sm:block">Search 500K+ influencers with powerful filters</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button 
            onClick={() => setShowFilters(true)} 
            className="lg:hidden btn btn-secondary flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          {selectedInfluencers.length > 0 && (
            <button className="btn btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export </span>({selectedInfluencers.length})
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span className="text-red-700 flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-500" /></button>
        </div>
      )}
      {!isExactMatch && influencers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-yellow-700">Showing similar results - no exact matches for all filters.</span>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-gray-50 shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterContent />
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex gap-4">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <FilterContent />
        </div>

        {/* Results Area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Results Header */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <p className="text-gray-600 text-sm sm:text-base">
                <span className="font-semibold text-gray-900">{totalResults.toLocaleString()}</span> influencers
              </p>
              {blurredCount > 0 && (
                <button onClick={() => setShowUnblurModal(true)} className="text-xs sm:text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  <Unlock className="w-3 sm:w-4 h-3 sm:h-4" />
                  Unblur {blurredCount} ({unblurCost.toFixed(2)} cr)
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                  <LayoutGrid className="w-4 h-4 text-gray-600" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
                  <List className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoading && influencers.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="text-gray-500">Searching...</p>
              </div>
            </div>
          )}

          {/* Results */}
          {influencers.length > 0 && (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4' : 'space-y-3'}>
              {influencers.map((inf) => viewMode === 'grid' ? (
                <div key={inf.id} className={`card p-3 sm:p-4 hover:shadow-md transition-shadow ${inf.isBlurred ? 'relative overflow-hidden' : ''}`}>
                  {inf.isBlurred && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                      <Lock className="w-6 h-6 text-gray-400 mb-2" />
                      <button onClick={() => handleUnblur([inf.id])} className="btn btn-primary text-sm py-1 px-3">
                        <Unlock className="w-3 h-3 mr-1" /> Unblur
                      </button>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.username}&background=6366f1&color=fff`} alt={inf.username} className="w-12 sm:w-14 h-12 sm:h-14 rounded-full object-cover" />
                      {inf.isVerified && <BadgeCheck className="absolute -bottom-1 -right-1 w-4 sm:w-5 h-4 sm:h-5 text-blue-500 bg-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{inf.fullName || inf.username}</h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">@{inf.username}</p>
                      {inf.locationCountry && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{inf.locationCountry}</p>}
                    </div>
                    <input type="checkbox" checked={selectedInfluencers.includes(inf.id)} onChange={(e) => setSelectedInfluencers(e.target.checked ? [...selectedInfluencers, inf.id] : selectedInfluencers.filter((id) => id !== inf.id))} className="w-4 h-4 text-primary-600 rounded shrink-0" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{formatNumber(inf.followerCount)}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{inf.engagementRate?.toFixed(1) || '0'}%</p>
                      <p className="text-xs text-gray-500">ER</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{formatNumber(inf.avgLikes || 0)}</p>
                      <p className="text-xs text-gray-500">Likes</p>
                    </div>
                  </div>
                  {(inf.followersGrowthRate || inf.category || inf.hasSponsoredPosts) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {inf.followersGrowthRate && inf.followersGrowthRate > 0 && (
                        <span className="text-xs text-green-600 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />+{(inf.followersGrowthRate * 100).toFixed(1)}%</span>
                      )}
                      {inf.category && <span className="px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700">{inf.category}</span>}
                      {inf.hasSponsoredPosts && <span className="px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 flex items-center gap-0.5"><ShoppingBag className="w-3 h-3" />Sponsored</span>}
                    </div>
                  )}
                  <button onClick={() => navigate(`/insights/${inf.id}`)} disabled={inf.isBlurred} className="btn btn-secondary w-full mt-3 py-1.5 text-sm">
                    <Sparkles className="w-4 h-4 mr-1" /> View Insights
                  </button>
                </div>
              ) : (
                <div key={inf.id} className={`card p-3 hover:shadow-md transition-shadow flex items-center gap-2 sm:gap-4 ${inf.isBlurred ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={selectedInfluencers.includes(inf.id)} onChange={(e) => setSelectedInfluencers(e.target.checked ? [...selectedInfluencers, inf.id] : selectedInfluencers.filter((id) => id !== inf.id))} className="w-4 h-4 text-primary-600 rounded shrink-0" />
                  <div className="relative shrink-0">
                    <img src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.username}&background=6366f1&color=fff`} alt={inf.username} className="w-10 h-10 rounded-full object-cover" />
                    {inf.isVerified && <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{inf.fullName || inf.username}</h3>
                    <p className="text-xs text-gray-500 truncate">@{inf.username}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <div className="text-center"><p className="font-semibold">{formatNumber(inf.followerCount)}</p><p className="text-xs text-gray-500">Followers</p></div>
                    <div className="text-center"><p className="font-semibold">{inf.engagementRate?.toFixed(1) || '0'}%</p><p className="text-xs text-gray-500">ER</p></div>
                    <div className="text-center"><p className="font-semibold">{formatNumber(inf.avgLikes || 0)}</p><p className="text-xs text-gray-500">Likes</p></div>
                  </div>
                  {inf.isBlurred ? (
                    <button onClick={() => handleUnblur([inf.id])} className="btn btn-secondary text-xs sm:text-sm py-1 shrink-0"><Unlock className="w-3 h-3 mr-1" />Unblur</button>
                  ) : (
                    <button onClick={() => navigate(`/insights/${inf.id}`)} className="btn btn-primary text-xs sm:text-sm py-1 shrink-0"><Eye className="w-3 h-3 mr-1" />View</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && influencers.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">No influencers found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
              <button onClick={() => setShowFilters(true)} className="btn btn-secondary mt-4 lg:hidden">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Open Filters
              </button>
            </div>
          )}

          {/* Load More */}
          {hasMore && !isLoading && (
            <div className="text-center">
              <button onClick={() => handleSearch(currentPage + 1)} className="btn btn-secondary">Load More</button>
            </div>
          )}
          {isLoading && influencers.length > 0 && (
            <div className="text-center py-4"><RefreshCw className="w-5 h-5 animate-spin text-primary-600 mx-auto" /></div>
          )}
        </div>
      </div>

      {/* Unblur Modal */}
      {showUnblurModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Unblur Profiles</h3>
              <button onClick={() => setShowUnblurModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-gray-600 mb-4">Unblur <strong>{blurredCount}</strong> profiles for <strong>{unblurCost.toFixed(2)} credits</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowUnblurModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleUnblur(influencers.filter((i) => i.isBlurred).map((i) => i.id))} className="btn btn-primary flex-1">Unblur All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
