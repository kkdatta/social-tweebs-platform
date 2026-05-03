import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
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
  FileText,
  CreditCard,
  CheckCircle2,
  Coins,
  Tag,
  MessageSquare,
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

const PAGE_SIZE = 10;
const CREDIT_PER_UNBLUR = 0.04;
const CREDIT_PER_EXPORT = 0.04; // 1 credit / 25 influencers
const CREDIT_PER_INSIGHT = 1;

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const platforms: {
  id: Platform;
  name: string;
  icon: typeof Instagram;
  color: string;
  disabled?: boolean;
}[] = [
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: 'bg-red-500' },
  { id: 'TIKTOK', name: 'TikTok', icon: Music2, color: 'bg-black', disabled: true },
  { id: 'LINKEDIN', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-600', disabled: true },
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

// Async Searchable Select with click-outside handling and persistent selection labels
const AsyncSelect: React.FC<{
  value: number[];
  onChange: (ids: number[]) => void;
  fetchOptions: (query: string) => Promise<{ id: number; name: string }[]>;
  placeholder?: string;
}> = ({ value, onChange, fetchOptions, placeholder = 'Search...' }) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<{ id: number; name: string }[]>([]);
  const [selectedCache, setSelectedCache] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current || value.length === 0) return;
    didInitRef.current = true;
    const resolve = async () => {
      try {
        const results = await fetchOptions('');
        setOptions(results.slice(0, 50));
        setSelectedCache(prev => {
          const next = new Map(prev);
          for (const r of results) {
            if (value.includes(r.id)) next.set(r.id, r.name);
          }
          return next;
        });
      } catch {}
    };
    resolve();
  }, [value, fetchOptions]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const results = await fetchOptions(debouncedQuery);
        setOptions(results.slice(0, 50));
        setSelectedCache(prev => {
          const next = new Map(prev);
          for (const r of results) {
            if (value.includes(r.id)) next.set(r.id, r.name);
          }
          return next;
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) load();
  }, [debouncedQuery, isOpen, fetchOptions, value]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="input py-1.5 text-sm cursor-pointer min-h-[34px] flex flex-wrap gap-1 items-center"
      >
        {value.length > 0 ? (
          value.map((id) => {
            const name = selectedCache.get(id) || options.find(o => o.id === id)?.name || `ID:${id}`;
            return (
              <span key={id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
                {name}
                <button onClick={(e) => { e.stopPropagation(); onChange(value.filter((v) => v !== id)); setSelectedCache(prev => { const n = new Map(prev); n.delete(id); return n; }); }}><X className="w-3 h-3" /></button>
              </span>
            );
          })
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
              autoFocus
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
                    setSelectedCache(prev => { const n = new Map(prev); n.delete(opt.id); return n; });
                  } else {
                    onChange([...value, opt.id]);
                    setSelectedCache(prev => new Map(prev).set(opt.id, opt.name));
                  }
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  value.includes(opt.id) ? 'bg-primary-50 text-primary-700 font-medium' : ''
                }`}
              >
                {opt.name}
                {value.includes(opt.id) && <CheckCircle2 className="w-4 h-4 text-primary-600" />}
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
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const toggleFilter = (name: string) => setOpenFilter(prev => prev === name ? null : name);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFileName, setExportFileName] = useState('');
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [excludePreviouslyExported, setExcludePreviouslyExported] = useState(false);
  const [exportCount, setExportCount] = useState(0);
  const [exportCostEstimate, setExportCostEstimate] = useState<{ creditCost: number; previouslyExportedCount: number; newExportCount: number } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [previouslyExportedIds, setPreviouslyExportedIds] = useState<Set<string>>(new Set());

  // Insights Confirmation Modal State
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [insightsTargetProfile, setInsightsTargetProfile] = useState<InfluencerProfile | null>(null);
  const [insightsHasAccess, setInsightsHasAccess] = useState(false);
  const [isCheckingInsights, setIsCheckingInsights] = useState(false);


  // Location name tracking for display
  const [selectedLocationNames, setSelectedLocationNames] = useState<Map<number, string>>(new Map([[304716, 'India']]));

  // Complete filters state
  const DEFAULT_LOCATION = [304716]; // India (Modash location ID)
  const [filters, setFilters] = useState<SearchFilters>({
    platform: selectedPlatform,
    influencer: { location: DEFAULT_LOCATION },
    audience: {},
    sort: { field: 'followers', direction: 'desc' },
    page: 0,
  });

  const getFilterSummary = useCallback((category: string): string | null => {
    const inf = filters.influencer || {};
    const aud = filters.audience || {};
    switch (category) {
      case 'demographics':
      case 'location': {
        if (inf.location?.length) {
          const names = inf.location.map(id => selectedLocationNames.get(id)).filter(Boolean) as string[];
          if (names.length > 0) {
            const joined = names.join(', ');
            return joined.length > 30 ? joined.slice(0, 27) + '...' : joined;
          }
          return `${inf.location.length} location${inf.location.length > 1 ? 's' : ''}`;
        }
        return null;
      }
      case 'language': {
        const parts: string[] = [];
        if (inf.language) parts.push(`Inf: ${inf.language.toUpperCase()}`);
        if (aud.language) parts.push(`Aud: ${(aud.language.id || '').toUpperCase()}`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'gender': {
        const parts: string[] = [];
        if (aud.engagersGender) parts.push(`Eng: ${aud.engagersGender.id === 'MALE' ? 'M' : 'F'}`);
        if (aud.gender) parts.push(`Fol: ${aud.gender.id === 'MALE' ? 'M' : 'F'}`);
        if (inf.gender) {
          const gMap: Record<string, string> = { MALE: 'M', FEMALE: 'F', KNOWN: 'M/F', UNKNOWN: 'Neutral' };
          parts.push(`Inf: ${gMap[inf.gender] || inf.gender}`);
        }
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'age': {
        const parts: string[] = [];
        if (inf.age?.min || inf.age?.max) {
          if (inf.age?.max) parts.push(`Inf: ${inf.age.min || '?'}-${inf.age.max}`);
          else parts.push(`Inf: ${inf.age.min}+`);
        }
        if (aud.ageRange?.min || aud.ageRange?.max) {
          if (aud.ageRange?.max) parts.push(`Aud: ${aud.ageRange.min || '?'}-${aud.ageRange.max}`);
          else parts.push(`Aud: ${aud.ageRange.min}+`);
        }
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'audience': {
        const parts: string[] = [];
        if (aud.location?.length) parts.push(`${aud.location.length} loc`);
        if (aud.age?.length) parts.push(`${aud.age.length} age group${aud.age.length > 1 ? 's' : ''}`);
        if (aud.credibility) parts.push(`${Math.round(aud.credibility * 100)}% real`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'engagement':
      case 'engagements': {
        const parts: string[] = [];
        const er = inf.engagementRate;
        if (er != null) {
          if (typeof er === 'number') parts.push(`ER >= ${(er * 100).toFixed(1)}%`);
          else if (er.min != null && er.max != null) parts.push(`ER ${(er.min * 100).toFixed(1)}-${(er.max * 100).toFixed(1)}%`);
          else if (er.min != null) parts.push(`ER >= ${(er.min * 100).toFixed(1)}%`);
        }
        if (inf.engagements) {
          if (inf.engagements.min != null && inf.engagements.max != null) parts.push(`${inf.engagements.min.toLocaleString()}-${inf.engagements.max.toLocaleString()}`);
          else if (inf.engagements.min != null) parts.push(`>= ${inf.engagements.min.toLocaleString()}`);
        }
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'followers':
      case 'metrics': {
        const parts: string[] = [];
        if (inf.followers) parts.push('Followers');
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'reelViews': {
        if (inf.reelsPlays?.min || inf.reelsPlays?.max) return 'Set';
        return null;
      }
      case 'keywords': {
        if (inf.keywords) return inf.keywords.split(',')[0].trim();
        return null;
      }
      case 'lastPosted': {
        if (inf.lastposted) return `${inf.lastposted}d`;
        return null;
      }
      case 'textTags': {
        if (inf.textTags?.length) return `${inf.textTags.length} tag${inf.textTags.length > 1 ? 's' : ''}`;
        return null;
      }
      case 'category': {
        if (inf.categories?.length) return inf.categories.join(', ');
        return null;
      }
      case 'activity': {
        const parts: string[] = [];
        if (inf.lastposted) parts.push(`${inf.lastposted}d`);
        if (inf.keywords) parts.push(inf.keywords.split(',')[0].trim());
        if (inf.textTags?.length) parts.push(`${inf.textTags.length} tag${inf.textTags.length > 1 ? 's' : ''}`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'lookalike': {
        const parts: string[] = [];
        if (inf.relevance?.length) parts.push(`${inf.relevance.length} topic${inf.relevance.length > 1 ? 's' : ''}`);
        if (inf.audienceRelevance?.length) parts.push(`${inf.audienceRelevance.length} audience`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'growth': {
        const parts: string[] = [];
        if (inf.followersGrowthRate?.value != null) parts.push(`${(inf.followersGrowthRate.value * 100).toFixed(0)}% growth`);
        if (inf.hasSponsoredPosts) parts.push('Sponsored');
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'account': {
        const parts: string[] = [];
        if (inf.accountTypes?.length) parts.push(inf.accountTypes.join(', '));
        if (inf.isVerified) parts.push('Verified');
        if (inf.hasYouTube) parts.push('YouTube');
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'contact': {
        const parts: string[] = [];
        if (inf.hasContactDetails?.length) parts.push(`${inf.hasContactDetails.length} type${inf.hasContactDetails.length > 1 ? 's' : ''}`);
        if (inf.contactInfoFilter?.length) parts.push(`${inf.contactInfoFilter.length} filter${inf.contactInfoFilter.length > 1 ? 's' : ''}`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      case 'brands': {
        if (inf.brands?.length) return `${inf.brands.length} brand${inf.brands.length > 1 ? 's' : ''}`;
        return null;
      }
      case 'interests': {
        const parts: string[] = [];
        if (inf.interests?.length) parts.push(`${inf.interests.length} influencer`);
        if (aud.interests?.length) parts.push(`${aud.interests.length} audience`);
        return parts.length > 0 ? parts.join(', ') : null;
      }
      default:
        return null;
    }
  }, [filters, selectedLocationNames]);

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

    setOpenFilter(null);
    setIsLoading(true);
    setError(null);
    setShowFilters(false);
    
    try {
      const searchFilters: SearchFilters = { ...filters, platform: selectedPlatform, page };

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

      const applyFirstThreeFree = (list: InfluencerProfile[], globalOffset: number) =>
        list.map((inf, i) => ({
          ...inf,
          isBlurred: globalOffset + i < 3 ? false : inf.isBlurred,
        }));

      if (page === 0) {
        setInfluencers(applyFirstThreeFree(response.influencers, 0));
      } else {
        setInfluencers((prev) => {
          const offset = prev.length;
          return [...prev, ...applyFirstThreeFree(response.influencers, offset)];
        });
      }
      
      setTotalResults(response.total);
      setCurrentPage(page);
      setHasMore(response.hasMore ?? (page + 1) * PAGE_SIZE < response.total);
      setIsExactMatch(response.isExactMatch !== false);
      
      if (user && response.remainingBalance !== undefined) {
        updateUser({ ...user, credits: response.remainingBalance });
      } else if (user && response.creditsUsed > 0) {
        updateUser({ ...user, credits: user.credits - response.creditsUsed });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load export history on mount to know previously exported IDs
  useEffect(() => {
    discoveryApi.getExportHistory().then((history) => {
      setPreviouslyExportedIds(new Set(history.allExportedProfileIds));
    }).catch(() => {});
  }, []);

  const hasBlurredInCurrentBatch = influencers.some((i) => i.isBlurred);

  const handleLoadMore = () => {
    handleSearch(currentPage + 1);
  };

  // ============ INSIGHTS CONFIRMATION ============
  const handleViewInsights = async (profile: InfluencerProfile) => {
    if (profile.isBlurred) return;
    
    setIsCheckingInsights(true);
    setInsightsTargetProfile(profile);

    try {
      const access = await discoveryApi.checkInsightsAccess(profile.id);
      if (access.hasAccess) {
        const insightNavId = access.insightId ?? profile.id;
        navigate(`/insights/${insightNavId}`);
        return;
      }
      setInsightsHasAccess(false);
      setShowInsightsModal(true);
    } catch {
      navigate(`/insights/${profile.id}`);
    } finally {
      setIsCheckingInsights(false);
    }
  };

  const confirmViewInsights = async () => {
    if (!insightsTargetProfile) return;
    
    try {
      const res = await discoveryApi.viewInsights(insightsTargetProfile.id);
      if (user) {
        updateUser({ ...user, credits: user.credits - CREDIT_PER_INSIGHT });
      }
      setShowInsightsModal(false);
      const navId = res.insightId ?? insightsTargetProfile.id;
      navigate(`/insights/${navId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unlock insights');
      setShowInsightsModal(false);
    }
  };

  // ============ EXPORT FLOW ============
  const openExportModal = () => {
    if (selectedInfluencers.length === 0) {
      setError('Please select influencers to export');
      return;
    }
    setExportCount(selectedInfluencers.length);
    setExportFileName(`influencer_export_${new Date().toISOString().split('T')[0]}`);
    setExcludePreviouslyExported(false);
    setExportCostEstimate(null);
    setShowExportModal(true);
    updateExportEstimate(selectedInfluencers, false);
  };

  const updateExportEstimate = async (ids: string[], excludePrev: boolean) => {
    try {
      const estimate = await discoveryApi.getExportCostEstimate(ids, excludePrev);
      setExportCostEstimate(estimate);
    } catch {
      const effectiveCount = excludePrev
        ? ids.filter((id) => !previouslyExportedIds.has(id)).length
        : ids.length;
      setExportCostEstimate({
        creditCost: effectiveCount * CREDIT_PER_EXPORT,
        previouslyExportedCount: ids.length - effectiveCount,
        newExportCount: effectiveCount,
      });
    }
  };

  const handleExcludePrevChange = (checked: boolean) => {
    setExcludePreviouslyExported(checked);
    updateExportEstimate(selectedInfluencers, checked);
  };

  const confirmExport = async () => {
    setIsExporting(true);
    const idsToExport = selectedInfluencers.slice(0, exportCount);
    try {
      const result = await discoveryApi.export({
        profileIds: idsToExport,
        format: exportFormat,
        fileName: exportFileName,
        excludePreviouslyExported,
      });
      
      if (user) {
        updateUser({ ...user, credits: user.credits - result.creditsUsed });
      }

      setPreviouslyExportedIds((prev) => {
        const updated = new Set(prev);
        idsToExport.forEach((id) => updated.add(id));
        return updated;
      });

      setShowExportModal(false);
      setSelectedInfluencers([]);
      setError(null);

      if (result.data && result.data.length > 0) {
        const safeName = exportFileName || `influencer_export_${new Date().toISOString().split('T')[0]}`;

        if (exportFormat === 'json') {
          const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (exportFormat === 'csv') {
          const headers = Object.keys(result.data[0]);
          const csvRows = [
            headers.join(','),
            ...result.data.map((row: Record<string, any>) =>
              headers.map((h) => {
                const val = row[h] ?? '';
                const str = String(val);
                return str.includes(',') || str.includes('"') || str.includes('\n')
                  ? `"${str.replace(/"/g, '""')}"`
                  : str;
              }).join(',')
            ),
          ];
          const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeName}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        } else if (exportFormat === 'xlsx') {
          const ws = XLSX.utils.json_to_sheet(result.data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Influencers');
          XLSX.writeFile(wb, `${safeName}.xlsx`);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      platform: selectedPlatform,
      influencer: { location: DEFAULT_LOCATION },
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

  // Horizontal Filter Bar
  const FilterBar = () => (
    <div className="card p-3 space-y-3">
      {/* Top Row: Platform, Bio Search, Sort, and Actions */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Platform Selection - Dropdown */}
        <div className="relative">
          <select
            value={selectedPlatform}
            onChange={(e) => {
              setSelectedPlatform(e.target.value as Platform);
              setCurrentPage(0);
            }}
            className="input py-2 text-sm pr-8 appearance-none bg-white min-w-[140px]"
          >
            {platforms.map((p) => (
              <option key={p.id} value={p.id} disabled={p.disabled}>
                {p.name}{p.disabled ? ' (Coming soon)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Bio Search with match type */}
        <div className="flex-1 min-w-[200px] flex gap-1">
          <select
            value={filters.influencer?.bioMatchType || 'must'}
            onChange={(e) => updateInfluencerFilter('bioMatchType', e.target.value)}
            className="input py-2 text-sm w-[130px] shrink-0"
          >
            <option value="must">Must contain</option>
            <option value="should">Should contain</option>
            <option value="not">Does not contain</option>
          </select>
          <input
            type="text"
            placeholder="Search by bio or name..."
            value={filters.influencer?.bio || ''}
            onChange={(e) => updateInfluencerFilter('bio', e.target.value)}
            className="input py-2 text-sm flex-1 min-w-0"
          />
        </div>

        {/* Sort */}
        <div className="flex gap-2">
          <select
            value={filters.sort?.field || 'followers'}
            onChange={(e) => setFilters({ ...filters, sort: { ...filters.sort!, field: e.target.value as any } })}
            className="input py-2 text-sm"
          >
            {SORT_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <select
            value={filters.sort?.direction || 'desc'}
            onChange={(e) => setFilters({ ...filters, sort: { ...filters.sort!, direction: e.target.value as any } })}
            className="input py-2 text-sm"
          >
            <option value="desc">High → Low</option>
            <option value="asc">Low → High</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => handleSearch(0)} disabled={isLoading} className="btn btn-primary py-2 px-4">
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
          <button onClick={resetFilters} className="btn btn-secondary py-2 px-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Collapsed horizontal: category pills, click to expand */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {/* Followers Filter (renamed from Metrics, Reels removed) */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('followers')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'followers' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('followers') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Users className="w-3.5 h-3.5" />
            <span>Followers</span>
            {getFilterSummary('followers') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('followers')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'followers' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'followers' && <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Followers</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.influencer?.followers?.min || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
                  <input type="number" placeholder="Max" value={filters.influencer?.followers?.max || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
                </div>
              </div>
            </div>
          </div>}
        </div>

        {/* Reel Views Filter (Instagram only) */}
        {selectedPlatform === 'INSTAGRAM' && (
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('reelViews')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'reelViews' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('reelViews') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Play className="w-3.5 h-3.5" />
            <span>Reel Views</span>
            {getFilterSummary('reelViews') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('reelViews')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'reelViews' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'reelViews' && <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div>
              <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1"><Play className="w-3 h-3" /> Reels Plays</label>
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={filters.influencer?.reelsPlays?.min || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
                <input type="number" placeholder="Max" value={filters.influencer?.reelsPlays?.max || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
              </div>
            </div>
          </div>}
        </div>
        )}

        {/* Engagement Rate Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('engagement')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'engagement' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('engagement') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Heart className="w-3.5 h-3.5" />
            <span>Engagement</span>
            {getFilterSummary('engagement') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('engagement')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'engagement' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'engagement' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Engagement Rate (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number" step="0.1" placeholder="From"
                    value={(() => {
                      const er = filters.influencer?.engagementRate;
                      if (er == null) return '';
                      if (typeof er === 'number') return (er * 100).toFixed(1);
                      return er.min != null ? (er.min * 100).toFixed(1) : '';
                    })()}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                      const cur = filters.influencer?.engagementRate;
                      const curMax = (cur && typeof cur === 'object') ? cur.max : undefined;
                      if (val != null && curMax == null) {
                        updateInfluencerFilter('engagementRate', val);
                      } else if (val != null || curMax != null) {
                        updateInfluencerFilter('engagementRate', { min: val, max: curMax });
                      } else {
                        updateInfluencerFilter('engagementRate', undefined);
                      }
                    }}
                    className={`input py-1.5 text-sm flex-1 ${(() => {
                      const er = filters.influencer?.engagementRate;
                      const hasMin = er != null && (typeof er === 'number' || (typeof er === 'object' && er.min != null));
                      return hasMin ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : '';
                    })()}`}
                  />
                  <input
                    type="number" step="0.1" placeholder="To"
                    value={(() => {
                      const er = filters.influencer?.engagementRate;
                      if (er == null || typeof er === 'number') return '';
                      return er.max != null ? (er.max * 100).toFixed(1) : '';
                    })()}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                      const cur = filters.influencer?.engagementRate;
                      const curMin = typeof cur === 'number' ? cur : (cur && typeof cur === 'object' ? cur.min : undefined);
                      if (curMin != null || val != null) {
                        updateInfluencerFilter('engagementRate', { min: curMin, max: val });
                      } else {
                        updateInfluencerFilter('engagementRate', undefined);
                      }
                    }}
                    className={`input py-1.5 text-sm flex-1 ${(() => {
                      const er = filters.influencer?.engagementRate;
                      return er && typeof er === 'object' && er.max != null ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : '';
                    })()}`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Only "From" for &gt;= filter, or both for a range</p>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <label className="text-xs font-medium text-gray-700 mb-1 block">Engagements (count)</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="From" value={filters.influencer?.engagements?.min || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, min: e.target.value ? parseInt(e.target.value) : undefined })} className={`input py-1.5 text-sm flex-1 ${filters.influencer?.engagements?.min ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : ''}`} />
                  <input type="number" placeholder="To" value={filters.influencer?.engagements?.max || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, max: e.target.value ? parseInt(e.target.value) : undefined })} className={`input py-1.5 text-sm flex-1 ${filters.influencer?.engagements?.max ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : ''}`} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Average engagements per post</p>
              </div>
            </div>
          </div>}
        </div>

        {/* Last Posted Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('lastPosted')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'lastPosted' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('lastPosted') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Last Posted</span>
            {getFilterSummary('lastPosted') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('lastPosted')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'lastPosted' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'lastPosted' && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Posted Within (Days)</label>
              <input type="number" min="30" placeholder="e.g., 30, 60, 90" value={filters.influencer?.lastposted || ''} onChange={(e) => updateInfluencerFilter('lastposted', e.target.value ? parseInt(e.target.value) : undefined)} className="input py-1.5 text-sm w-full" />
              <p className="text-xs text-gray-400 mt-1">Find active influencers (min 30 days)</p>
            </div>
          </div>}
        </div>

        {/* Keywords Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('keywords')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'keywords' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('keywords') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Keywords</span>
            {getFilterSummary('keywords') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('keywords')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'keywords' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'keywords' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Keywords in Posts</label>
                <input type="text" placeholder="e.g., fitness, lifestyle" value={filters.influencer?.keywords || ''} onChange={(e) => updateInfluencerFilter('keywords', e.target.value)} className="input py-1.5 text-sm w-full" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.influencer?.excludeKeywords || false} onChange={(e) => updateInfluencerFilter('excludeKeywords', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm text-gray-700">Exclude these keywords</span>
              </label>
            </div>
          </div>}
        </div>

        {/* Text Tags Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('textTags')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'textTags' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('textTags') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Hash className="w-3.5 h-3.5" />
            <span>Text Tags</span>
            {getFilterSummary('textTags') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('textTags')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'textTags' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'textTags' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => updateInfluencerFilter('textTagAction', 'should')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${(!filters.influencer?.textTagAction || filters.influencer?.textTagAction === 'should') ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Include
                </button>
                <button
                  type="button"
                  onClick={() => updateInfluencerFilter('textTagAction', 'should_not')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.influencer?.textTagAction === 'should_not' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Exclude
                </button>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Hashtags & Mentions Used</label>
                <TagInput tags={filters.influencer?.textTags || []} onChange={(tags) => updateInfluencerFilter('textTags', tags)} />
              </div>
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('lookalike')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'lookalike' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('lookalike') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Target className="w-3.5 h-3.5" />
            <span>Lookalike</span>
            {getFilterSummary('lookalike') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('lookalike')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'lookalike' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'lookalike' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                  <Target className="w-3.5 h-3.5 text-primary-500" />
                  <span className="text-xs font-semibold text-gray-800">Influencer Lookalike</span>
                </div>
                <label className="text-xs text-gray-600 mb-1 block">Similar Topics To</label>
                <RelevanceInput values={filters.influencer?.relevance || []} onChange={(v) => updateInfluencerFilter('relevance', v)} placeholder="#hashtag or @username" />
                <p className="text-xs text-gray-400 mt-1">Find similar content creators</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs font-semibold text-gray-800">Audience Lookalike</span>
                </div>
                <label className="text-xs text-gray-600 mb-1 block">Similar Audience To</label>
                <RelevanceInput values={filters.influencer?.audienceRelevance || []} onChange={(v) => updateInfluencerFilter('audienceRelevance', v)} placeholder="@username" />
                <p className="text-xs text-gray-400 mt-1">Audience lookalike search</p>
              </div>
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('growth')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'growth' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('growth') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Growth</span>
            {getFilterSummary('growth') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('growth')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'growth' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'growth' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
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
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('account')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'account' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('account') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Account</span>
            {getFilterSummary('account') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('account')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'account' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'account' && <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
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
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('contact')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'contact' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('contact') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Mail className="w-3.5 h-3.5" />
            <span>Contact</span>
            {getFilterSummary('contact') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('contact')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'contact' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'contact' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="grid grid-cols-2 gap-2">
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
          </div>}
        </div>

        {/* Location Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('location')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'location' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('location') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <MapPin className="w-3.5 h-3.5" />
            <span>Location</span>
            {getFilterSummary('location') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('location')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'location' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'location' && <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Location</label>
                <AsyncSelect
                  value={filters.influencer?.location || []}
                  onChange={(ids) => {
                    updateInfluencerFilter('location', ids.length > 0 ? ids : undefined);
                    setSelectedLocationNames(prev => {
                      const next = new Map(prev);
                      for (const key of prev.keys()) {
                        if (!ids.includes(key)) next.delete(key);
                      }
                      return next;
                    });
                  }}
                  fetchOptions={async (q) => {
                    const results = (await discoveryApi.getLocations(q)).map((l) => ({ id: l.id, name: l.name }));
                    setSelectedLocationNames(prev => {
                      const next = new Map(prev);
                      for (const r of results) {
                        if (filters.influencer?.location?.includes(r.id)) next.set(r.id, r.name);
                      }
                      return next;
                    });
                    return results;
                  }}
                  placeholder="Select locations..."
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.influencer?.excludeLocations || false} onChange={(e) => updateInfluencerFilter('excludeLocations', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
                <span className="text-sm text-gray-700">Exclude these locations</span>
              </label>
            </div>
          </div>}
        </div>

        {/* Language Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('language')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'language' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('language') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Globe className="w-3.5 h-3.5" />
            <span>Language</span>
            {getFilterSummary('language') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('language')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'language' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'language' && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Influencer Language</label>
                <select value={filters.influencer?.language || ''} onChange={(e) => updateInfluencerFilter('language', e.target.value || undefined)} className={`input py-1.5 text-sm w-full ${filters.influencer?.language ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : ''}`}>
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
              <div className="border-t border-gray-200 pt-3">
                <label className="text-xs text-gray-600 mb-1 block">Audience Language</label>
                <select value={filters.audience?.language?.id || ''} onChange={(e) => updateAudienceFilter('language', e.target.value ? { id: e.target.value, weight: 0.2 } : undefined)} className={`input py-1.5 text-sm w-full ${filters.audience?.language ? 'ring-1 ring-primary-300 bg-primary-50 text-primary-700 font-medium' : ''}`}>
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
            </div>
          </div>}
        </div>

        {/* Gender Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('gender')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'gender' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('gender') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Users className="w-3.5 h-3.5" />
            <span>Gender</span>
            {getFilterSummary('gender') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('gender')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'gender' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'gender' && <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-20">
            <div className="flex gap-6">
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Heart className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">Engagers</span>
                </div>
                <div className="space-y-1.5">
                  {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name="engagers-gender" checked={(filters.audience?.engagersGender?.id || '') === opt.value} onChange={() => updateAudienceFilter('engagersGender', opt.value ? { id: opt.value as any, weight: 0.5 } : undefined)} className="w-3.5 h-3.5 text-primary-600" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-l border-gray-200" />
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Users className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">Followers</span>
                </div>
                <div className="space-y-1.5">
                  {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name="audience-gender" checked={(filters.audience?.gender?.id || '') === opt.value} onChange={() => updateAudienceFilter('gender', opt.value ? { id: opt.value as any, weight: 0.5 } : undefined)} className="w-3.5 h-3.5 text-primary-600" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-l border-gray-200" />
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Target className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-xs font-semibold text-gray-700">Influencer</span>
                </div>
                <div className="space-y-1.5">
                  {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'KNOWN', label: 'Male or Female' }, { value: 'UNKNOWN', label: 'Gender Neutral' }].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input type="radio" name="influencer-gender" checked={(filters.influencer?.gender || '') === opt.value} onChange={() => updateInfluencerFilter('gender', opt.value || undefined)} className="w-3.5 h-3.5 text-primary-600" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>}
        </div>

        {/* Age Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('age')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'age' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('age') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Age</span>
            {getFilterSummary('age') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('age')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'age' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'age' && <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">Influencer Age</label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ min: 13, max: 18, label: '13-18' }, { min: 18, max: 25, label: '18-25' }, { min: 25, max: 35, label: '25-35' }, { min: 35, max: 45, label: '35-45' }, { min: 45, max: 65, label: '45-65' }, { min: 65, max: undefined, label: '65+' }].map((range) => {
                    const isSelected = filters.influencer?.age?.min === range.min && filters.influencer?.age?.max === range.max;
                    return (
                      <button key={range.label} type="button" onClick={() => updateInfluencerFilter('age', isSelected ? undefined : { min: range.min, max: range.max })} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {range.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-2">
                  <input type="number" placeholder="Min age" value={filters.influencer?.age?.min || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
                  <input type="number" placeholder="Max age" value={filters.influencer?.age?.max || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Or enter custom range above</p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <label className="text-xs font-medium text-gray-700 mb-2 block">Audience Age</label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ min: '13', max: '18', label: '13-18' }, { min: '18', max: '25', label: '18-25' }, { min: '25', max: '35', label: '25-35' }, { min: '35', max: '45', label: '35-45' }, { min: '45', max: '65', label: '45-65' }, { min: '65', max: undefined, label: '65+' }].map((range) => {
                    const isSelected = filters.audience?.ageRange?.min === range.min && filters.audience?.ageRange?.max === range.max;
                    return (
                      <button key={range.label} type="button" onClick={() => updateAudienceFilter('ageRange', isSelected ? undefined : { min: range.min, max: range.max, weight: 0.2 })} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('audience')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'audience' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : getFilterSummary('audience') ? 'bg-purple-50 text-purple-700 ring-1 ring-purple-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span>Audience</span>
            {getFilterSummary('audience') && (
              <span className="text-xs text-purple-600 max-w-[120px] truncate">({getFilterSummary('audience')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'audience' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'audience' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2">
              <Info className="w-3 h-3 inline mr-1" />
              Weights (0-1) set minimum thresholds. 0.3 = 30% of audience.
            </div>
            <div className="space-y-3">
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
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('brands')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'brands' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('brands') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Brands</span>
            {getFilterSummary('brands') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('brands')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'brands' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'brands' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Brands Partnered With</label>
                <AsyncSelect
                  value={filters.influencer?.brands || []}
                  onChange={(ids) => updateInfluencerFilter('brands', ids.length > 0 ? ids : undefined)}
                  fetchOptions={async (q) => (await discoveryApi.getBrands(q)).map((b) => ({ id: b.id, name: b.name }))}
                  placeholder="Search brands..."
                />
              </div>
            </div>
          </div>}
        </div>

        <div className="relative">
          <button type="button" onClick={() => toggleFilter('interests')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'interests' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('interests') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interests</span>
            {getFilterSummary('interests') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('interests')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'interests' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'interests' && <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Influencer Interests</label>
                <AsyncSelect
                  value={filters.influencer?.interests || []}
                  onChange={(ids) => updateInfluencerFilter('interests', ids.length > 0 ? ids : undefined)}
                  fetchOptions={async (q) => {
                    const results = await discoveryApi.getInterests(selectedPlatform);
                    return q ? results.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : results;
                  }}
                  placeholder="Select influencer interests..."
                />
              </div>
              <div className="border-t border-gray-200 pt-3">
                <label className="text-xs text-gray-600 mb-1 block">Audience Interests</label>
                <AsyncSelect
                  value={filters.audience?.interests?.map((i) => i.id) || []}
                  onChange={(ids) => updateAudienceFilter('interests', ids.length > 0 ? ids.map((id) => ({ id, weight: 0.3 })) : undefined)}
                  fetchOptions={async (q) => {
                    const results = await discoveryApi.getInterests(selectedPlatform);
                    return q ? results.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : results;
                  }}
                  placeholder="Select audience interests..."
                />
              </div>
            </div>
          </div>}
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button type="button" onClick={() => toggleFilter('category')} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${openFilter === 'category' ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300' : getFilterSummary('category') ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
            <Tag className="w-3.5 h-3.5" />
            <span>Category</span>
            {getFilterSummary('category') && (
              <span className="text-xs text-primary-600 max-w-[120px] truncate">({getFilterSummary('category')})</span>
            )}
            <ChevronDown className={`w-3 h-3 ml-0.5 transition-transform ${openFilter === 'category' ? 'rotate-180' : ''}`} />
          </button>
          {openFilter === 'category' && <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-20">
            <div className="space-y-2">
              <label className="text-xs text-gray-600 mb-1 block">Account Category</label>
              {[{ value: 'Creator', label: 'Creator' }, { value: 'Business', label: 'Business' }, { value: 'Other', label: 'Other' }].map((cat) => (
                <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters.influencer?.categories?.includes(cat.value) || false} onChange={(e) => {
                    const current = filters.influencer?.categories || [];
                    const updated = e.target.checked ? [...current, cat.value] : current.filter((v) => v !== cat.value);
                    updateInfluencerFilter('categories', updated.length > 0 ? updated : undefined);
                  }} className="w-3.5 h-3.5 text-primary-600 rounded" />
                  <span className="text-sm text-gray-700">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>}
        </div>
      </div>

      {/* Click-away: close filter when clicking outside */}
      {openFilter && <div className="fixed inset-0 z-10" onMouseDown={() => setOpenFilter(null)} />}
    </div>
  );

  // Full Filter Content (for mobile drawer)
  const FilterContent = () => (
    <div className="space-y-3">
      {/* Platform Selection - Dropdown */}
      <div className="card p-3">
        <label className="text-xs font-medium text-gray-600 mb-2 block">Platform</label>
        <select
          value={selectedPlatform}
          onChange={(e) => {
            setSelectedPlatform(e.target.value as Platform);
            setCurrentPage(0);
          }}
          className="input py-2 text-sm w-full"
        >
          {platforms.map((p) => (
            <option key={p.id} value={p.id} disabled={p.disabled}>
              {p.name}{p.disabled ? ' (Coming soon)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Search & Sort */}
      <div className="card p-3 space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Bio / Name Search</label>
          <div className="flex gap-1">
            <select
              value={filters.influencer?.bioMatchType || 'must'}
              onChange={(e) => updateInfluencerFilter('bioMatchType', e.target.value)}
              className="input py-1.5 text-sm w-[120px] shrink-0"
            >
              <option value="must">Must contain</option>
              <option value="should">Should contain</option>
              <option value="not">Does not contain</option>
            </select>
            <input
              type="text"
              placeholder="Search keywords..."
              value={filters.influencer?.bio || ''}
              onChange={(e) => updateInfluencerFilter('bio', e.target.value)}
              className="input py-1.5 text-sm flex-1 min-w-0"
            />
          </div>
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

      {/* Followers Section */}
      <FilterSection title="Followers" icon={<Users className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Followers</label>
          <div className="flex gap-2">
            <input type="number" placeholder="Min" value={filters.influencer?.followers?.min || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
            <input type="number" placeholder="Max" value={filters.influencer?.followers?.max || ''} onChange={(e) => updateInfluencerFilter('followers', { ...filters.influencer?.followers, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
          </div>
        </div>
      </FilterSection>

      {/* Reel Views (Instagram only) */}
      {selectedPlatform === 'INSTAGRAM' && (
        <FilterSection title="Reel Views" icon={<Play className="w-4 h-4 text-gray-500" />}>
          <div>
            <label className="text-xs text-gray-600 mb-1 block flex items-center gap-1"><Play className="w-3 h-3" /> Reels Plays</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" value={filters.influencer?.reelsPlays?.min || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
              <input type="number" placeholder="Max" value={filters.influencer?.reelsPlays?.max || ''} onChange={(e) => updateInfluencerFilter('reelsPlays', { ...filters.influencer?.reelsPlays, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm" />
            </div>
          </div>
        </FilterSection>
      )}

      {/* Engagement */}
      <FilterSection title="Engagement" icon={<Heart className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Engagement Rate (%)</label>
          <div className="flex gap-2">
            <input
              type="number" step="0.1" placeholder="From"
              value={(() => {
                const er = filters.influencer?.engagementRate;
                if (er == null) return '';
                if (typeof er === 'number') return (er * 100).toFixed(1);
                return er.min != null ? (er.min * 100).toFixed(1) : '';
              })()}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                const cur = filters.influencer?.engagementRate;
                const curMax = (cur && typeof cur === 'object') ? cur.max : undefined;
                if (val != null && curMax == null) {
                  updateInfluencerFilter('engagementRate', val);
                } else if (val != null || curMax != null) {
                  updateInfluencerFilter('engagementRate', { min: val, max: curMax });
                } else {
                  updateInfluencerFilter('engagementRate', undefined);
                }
              }}
              className="input py-1.5 text-sm flex-1"
            />
            <input
              type="number" step="0.1" placeholder="To"
              value={(() => {
                const er = filters.influencer?.engagementRate;
                if (er == null || typeof er === 'number') return '';
                return er.max != null ? (er.max * 100).toFixed(1) : '';
              })()}
              onChange={(e) => {
                const val = e.target.value ? parseFloat(e.target.value) / 100 : undefined;
                const cur = filters.influencer?.engagementRate;
                const curMin = typeof cur === 'number' ? cur : (cur && typeof cur === 'object' ? cur.min : undefined);
                if (curMin != null || val != null) {
                  updateInfluencerFilter('engagementRate', { min: curMin, max: val });
                } else {
                  updateInfluencerFilter('engagementRate', undefined);
                }
              }}
              className="input py-1.5 text-sm flex-1"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Only "From" for &gt;= filter, or both for a range</p>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Engagements (count)</label>
          <div className="flex gap-2">
            <input type="number" placeholder="From" value={filters.influencer?.engagements?.min || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
            <input type="number" placeholder="To" value={filters.influencer?.engagements?.max || ''} onChange={(e) => updateInfluencerFilter('engagements', { ...filters.influencer?.engagements, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Average engagements per post</p>
        </div>
      </FilterSection>

      {/* Last Posted */}
      <FilterSection title="Last Posted" icon={<Calendar className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Posted Within (Days)</label>
          <input type="number" min="30" placeholder="e.g., 30, 60, 90" value={filters.influencer?.lastposted || ''} onChange={(e) => updateInfluencerFilter('lastposted', e.target.value ? parseInt(e.target.value) : undefined)} className="input py-1.5 text-sm" />
          <p className="text-xs text-gray-400 mt-1">Find active influencers (min 30 days)</p>
        </div>
      </FilterSection>

      {/* Keywords */}
      <FilterSection title="Keywords" icon={<MessageSquare className="w-4 h-4 text-gray-500" />}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Keywords in Posts</label>
          <input type="text" placeholder="e.g., fitness, lifestyle" value={filters.influencer?.keywords || ''} onChange={(e) => updateInfluencerFilter('keywords', e.target.value)} className="input py-1.5 text-sm" />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={filters.influencer?.excludeKeywords || false} onChange={(e) => updateInfluencerFilter('excludeKeywords', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm text-gray-700">Exclude these keywords</span>
        </label>
      </FilterSection>

      {/* Text Tags */}
      <FilterSection title="Text Tags" icon={<Hash className="w-4 h-4 text-gray-500" />}>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => updateInfluencerFilter('textTagAction', 'should')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${(!filters.influencer?.textTagAction || filters.influencer?.textTagAction === 'should') ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Include
          </button>
          <button
            type="button"
            onClick={() => updateInfluencerFilter('textTagAction', 'should_not')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filters.influencer?.textTagAction === 'should_not' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Exclude
          </button>
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Hashtags & Mentions Used</label>
          <TagInput tags={filters.influencer?.textTags || []} onChange={(tags) => updateInfluencerFilter('textTags', tags)} />
        </div>
      </FilterSection>

      {/* Lookalike Search */}
      <FilterSection title="Lookalike Search" icon={<Target className="w-4 h-4 text-gray-500" />}>
        <div>
          <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
            <Target className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs font-semibold text-gray-800">Influencer Lookalike</span>
          </div>
          <label className="text-xs text-gray-600 mb-1 block">Similar Topics To</label>
          <RelevanceInput values={filters.influencer?.relevance || []} onChange={(v) => updateInfluencerFilter('relevance', v)} placeholder="#hashtag or @username" />
          <p className="text-xs text-gray-400 mt-1">Find similar content creators</p>
        </div>
        <div>
          <div className="flex items-center gap-1 mb-2 pb-1 border-b border-gray-100">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-gray-800">Audience Lookalike</span>
          </div>
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

      {/* Location */}
      <FilterSection title="Location" icon={<MapPin className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Influencer Location</label>
          <AsyncSelect
            value={filters.influencer?.location || []}
            onChange={(ids) => {
              updateInfluencerFilter('location', ids.length > 0 ? ids : undefined);
              setSelectedLocationNames(prev => {
                const next = new Map(prev);
                for (const key of prev.keys()) {
                  if (!ids.includes(key)) next.delete(key);
                }
                return next;
              });
            }}
            fetchOptions={async (q) => {
              const results = (await discoveryApi.getLocations(q)).map((l) => ({ id: l.id, name: l.name }));
              setSelectedLocationNames(prev => {
                const next = new Map(prev);
                for (const r of results) {
                  if (filters.influencer?.location?.includes(r.id)) next.set(r.id, r.name);
                }
                return next;
              });
              return results;
            }}
            placeholder="Select locations..."
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer mt-2">
          <input type="checkbox" checked={filters.influencer?.excludeLocations || false} onChange={(e) => updateInfluencerFilter('excludeLocations', e.target.checked || undefined)} className="w-4 h-4 text-primary-600 rounded" />
          <span className="text-sm text-gray-700">Exclude these locations</span>
        </label>
      </FilterSection>

      {/* Language */}
      <FilterSection title="Language" icon={<Globe className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Influencer Language</label>
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
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Language</label>
          <select value={filters.audience?.language?.id || ''} onChange={(e) => updateAudienceFilter('language', e.target.value ? { id: e.target.value, weight: 0.2 } : undefined)} className="input py-1.5 text-sm">
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
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender" icon={<Users className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div className="flex gap-6">
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Heart className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">Engagers</span>
            </div>
            <div className="space-y-1.5">
              {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="drawer-engagers-gender" checked={(filters.audience?.engagersGender?.id || '') === opt.value} onChange={() => updateAudienceFilter('engagersGender', opt.value ? { id: opt.value as any, weight: 0.5 } : undefined)} className="w-3.5 h-3.5 text-primary-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="border-l border-gray-200" />
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Users className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">Followers</span>
            </div>
            <div className="space-y-1.5">
              {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="drawer-audience-gender" checked={(filters.audience?.gender?.id || '') === opt.value} onChange={() => updateAudienceFilter('gender', opt.value ? { id: opt.value as any, weight: 0.5 } : undefined)} className="w-3.5 h-3.5 text-primary-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="border-l border-gray-200" />
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Target className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-700">Influencer</span>
            </div>
            <div className="space-y-1.5">
              {[{ value: '', label: 'Any' }, { value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'KNOWN', label: 'Male or Female' }, { value: 'UNKNOWN', label: 'Gender Neutral' }].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="radio" name="drawer-influencer-gender" checked={(filters.influencer?.gender || '') === opt.value} onChange={() => updateInfluencerFilter('gender', opt.value || undefined)} className="w-3.5 h-3.5 text-primary-600" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Age */}
      <FilterSection title="Age" icon={<Calendar className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Influencer Age</label>
          <div className="flex flex-wrap gap-1.5">
            {[{ min: 13, max: 18, label: '13-18' }, { min: 18, max: 25, label: '18-25' }, { min: 25, max: 35, label: '25-35' }, { min: 35, max: 45, label: '35-45' }, { min: 45, max: 65, label: '45-65' }, { min: 65, max: undefined, label: '65+' }].map((range) => {
              const isSelected = filters.influencer?.age?.min === range.min && filters.influencer?.age?.max === range.max;
              return (
                <button key={range.label} type="button" onClick={() => updateInfluencerFilter('age', isSelected ? undefined : { min: range.min, max: range.max })} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {range.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <input type="number" placeholder="Min age" value={filters.influencer?.age?.min || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, min: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
            <input type="number" placeholder="Max age" value={filters.influencer?.age?.max || ''} onChange={(e) => updateInfluencerFilter('age', { ...filters.influencer?.age, max: e.target.value ? parseInt(e.target.value) : undefined })} className="input py-1.5 text-sm flex-1" />
          </div>
          <p className="text-xs text-gray-400 mt-1">Or enter custom range above</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-2 block">Audience Age</label>
          <div className="flex flex-wrap gap-1.5">
            {[{ min: '13', max: '18', label: '13-18' }, { min: '18', max: '25', label: '18-25' }, { min: '25', max: '35', label: '25-35' }, { min: '35', max: '45', label: '35-45' }, { min: '45', max: '65', label: '45-65' }, { min: '65', max: undefined, label: '65+' }].map((range) => {
              const isSelected = filters.audience?.ageRange?.min === range.min && filters.audience?.ageRange?.max === range.max;
              return (
                <button key={range.label} type="button" onClick={() => updateAudienceFilter('ageRange', isSelected ? undefined : { min: range.min, max: range.max, weight: 0.2 })} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {range.label}
                </button>
              );
            })}
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

      {/* Brands */}
      <FilterSection title="Brands" icon={<ShoppingBag className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Brands Partnered With</label>
          <AsyncSelect
            value={filters.influencer?.brands || []}
            onChange={(ids) => updateInfluencerFilter('brands', ids.length > 0 ? ids : undefined)}
            fetchOptions={async (q) => (await discoveryApi.getBrands(q)).map((b) => ({ id: b.id, name: b.name }))}
            placeholder="Search brands..."
          />
        </div>
      </FilterSection>

      {/* Interests */}
      <FilterSection title="Interests" icon={<Sparkles className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Influencer Interests</label>
          <AsyncSelect
            value={filters.influencer?.interests || []}
            onChange={(ids) => updateInfluencerFilter('interests', ids.length > 0 ? ids : undefined)}
            fetchOptions={async (q) => {
              const results = await discoveryApi.getInterests(selectedPlatform);
              return q ? results.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : results;
            }}
            placeholder="Select influencer interests..."
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 mb-1 block">Audience Interests</label>
          <AsyncSelect
            value={filters.audience?.interests?.map((i) => i.id) || []}
            onChange={(ids) => updateAudienceFilter('interests', ids.length > 0 ? ids.map((id) => ({ id, weight: 0.3 })) : undefined)}
            fetchOptions={async (q) => {
              const results = await discoveryApi.getInterests(selectedPlatform);
              return q ? results.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())) : results;
            }}
            placeholder="Select audience interests..."
          />
        </div>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" icon={<Tag className="w-4 h-4 text-gray-500" />} defaultOpen={false}>
        <div className="space-y-2">
          <label className="text-xs text-gray-600 mb-1 block">Account Category</label>
          {[{ value: 'Creator', label: 'Creator' }, { value: 'Business', label: 'Business' }, { value: 'Other', label: 'Other' }].map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={filters.influencer?.categories?.includes(cat.value) || false} onChange={(e) => {
                const current = filters.influencer?.categories || [];
                const updated = e.target.checked ? [...current, cat.value] : current.filter((v) => v !== cat.value);
                updateInfluencerFilter('categories', updated.length > 0 ? updated : undefined);
              }} className="w-3.5 h-3.5 text-primary-600 rounded" />
              <span className="text-sm text-gray-700">{cat.label}</span>
            </label>
          ))}
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
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="lg:hidden btn btn-secondary flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          {selectedInfluencers.length > 0 && (
            <button onClick={openExportModal} className="btn btn-primary">
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
      <div className="space-y-4">
        {/* Horizontal Filter Bar */}
        <div className="hidden lg:block">
          <FilterBar />
        </div>

        {/* Results Area */}
        <div className="min-w-0 space-y-4">
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
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{inf.engagementRate ? `${inf.engagementRate.toFixed(1)}%` : 'N/A'}</p>
                      <p className="text-xs text-gray-500">ER</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-gray-900 text-sm sm:text-base">{inf.avgLikes ? formatNumber(inf.avgLikes) : 'N/A'}</p>
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
                  <button onClick={() => handleViewInsights(inf)} disabled={inf.isBlurred || isCheckingInsights} className="btn btn-secondary w-full mt-3 py-1.5 text-sm">
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
                    <div className="text-center"><p className="font-semibold">{inf.engagementRate ? `${inf.engagementRate.toFixed(1)}%` : 'N/A'}</p><p className="text-xs text-gray-500">ER</p></div>
                    <div className="text-center"><p className="font-semibold">{inf.avgLikes ? formatNumber(inf.avgLikes) : 'N/A'}</p><p className="text-xs text-gray-500">Likes</p></div>
                  </div>
                  {inf.isBlurred ? (
                    <button onClick={() => handleUnblur([inf.id])} className="btn btn-secondary text-xs sm:text-sm py-1 shrink-0"><Unlock className="w-3 h-3 mr-1" />Unblur</button>
                  ) : (
                    <button onClick={() => handleViewInsights(inf)} disabled={isCheckingInsights} className="btn btn-primary text-xs sm:text-sm py-1 shrink-0"><Eye className="w-3 h-3 mr-1" />View</button>
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
              <button onClick={resetFilters} className="btn btn-secondary mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </button>
            </div>
          )}

          {/* Load More -- only enabled once all current profiles are unblurred */}
          {hasMore && !isLoading && (
            <div className="text-center py-2">
              <button
                type="button"
                onClick={() => handleLoadMore()}
                disabled={hasBlurredInCurrentBatch}
                title={hasBlurredInCurrentBatch ? 'Unblur all profiles in this list to load more' : undefined}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load More
              </button>
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
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Unlock className="w-5 h-5 text-primary-600" /> Unblur Profiles
              </h3>
              <button onClick={() => setShowUnblurModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Blurred profiles</span>
                <span className="font-semibold">{blurredCount}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Cost per profile</span>
                <span className="font-semibold">{CREDIT_PER_UNBLUR} credits</span>
              </div>
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Total cost</span>
                <span className="font-bold text-primary-600">{unblurCost.toFixed(2)} credits</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Once unblurred, profiles stay permanently accessible for you and your admin.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowUnblurModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button onClick={() => handleUnblur(influencers.filter((i) => i.isBlurred).map((i) => i.id))} className="btn btn-primary flex-1">
                <Coins className="w-4 h-4 mr-1" /> Unblur All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Download className="w-5 h-5 text-primary-600" /> Export Influencers
              </h3>
              <button onClick={() => setShowExportModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              {/* File Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">File Name</label>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={exportFileName}
                    onChange={(e) => setExportFileName(e.target.value)}
                    placeholder="Enter file name..."
                    className="input text-sm flex-1"
                  />
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Export Format</label>
                <div className="flex gap-2">
                  {(['csv', 'xlsx', 'json'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        exportFormat === fmt
                          ? 'bg-primary-600 text-white shadow'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Influencers */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Number of influencers to export
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={selectedInfluencers.length}
                    value={exportCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setExportCount(val);
                      updateExportEstimate(selectedInfluencers.slice(0, val), excludePreviouslyExported);
                    }}
                    className="flex-1"
                  />
                  <span className="font-bold text-primary-600 min-w-[3ch] text-right">{exportCount}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {selectedInfluencers.length} influencer{selectedInfluencers.length !== 1 ? 's' : ''} selected
                </p>
              </div>

              {/* Exclude Previously Exported */}
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <input
                  type="checkbox"
                  checked={excludePreviouslyExported}
                  onChange={(e) => handleExcludePrevChange(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded mt-0.5"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Exclude previously exported influencers</span>
                  {exportCostEstimate && exportCostEstimate.previouslyExportedCount > 0 && excludePreviouslyExported && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {exportCostEstimate.previouslyExportedCount} already exported will be excluded
                    </p>
                  )}
                </div>
              </label>

              {/* Credit Summary */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-primary-600" />
                  <span className="font-semibold text-primary-800">Credit Utilization</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Influencers to export</span>
                    <span className="font-medium">{exportCostEstimate?.newExportCount ?? exportCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-medium">1 credit per 25 influencers</span>
                  </div>
                  {exportCostEstimate && excludePreviouslyExported && exportCostEstimate.previouslyExportedCount > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>Previously exported (excluded)</span>
                      <span>-{exportCostEstimate.previouslyExportedCount}</span>
                    </div>
                  )}
                  <div className="border-t border-primary-200 pt-2 flex justify-between">
                    <span className="font-semibold text-primary-800">Total Credit Cost</span>
                    <span className="font-bold text-primary-600 text-lg">
                      {exportCostEstimate?.creditCost.toFixed(2) ?? (exportCount * CREDIT_PER_EXPORT).toFixed(2)} credits
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Your balance</span>
                    <span>{user?.credits?.toFixed(2) ?? '0.00'} credits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowExportModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={confirmExport}
                disabled={isExporting || (exportCostEstimate?.newExportCount ?? 0) === 0}
                className="btn btn-primary flex-1"
              >
                {isExporting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin mr-1" /> Exporting...</>
                ) : (
                  <><Download className="w-4 h-4 mr-1" /> Export & Deduct Credits</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Credit Confirmation Modal */}
      {showInsightsModal && insightsTargetProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" /> View Influencer Report
              </h3>
              <button onClick={() => setShowInsightsModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <img
                src={insightsTargetProfile.profilePictureUrl || `https://ui-avatars.com/api/?name=${insightsTargetProfile.username}&background=6366f1&color=fff`}
                alt={insightsTargetProfile.username}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-gray-900">{insightsTargetProfile.fullName || insightsTargetProfile.username}</p>
                <p className="text-sm text-gray-500">@{insightsTargetProfile.username}</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Coins className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    This will cost <span className="font-bold">{CREDIT_PER_INSIGHT} credit</span> to view the detailed report.
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Once purchased, you can access this report anytime without additional charges. 
                    It will also appear in your Influencer Insights menu.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>Your balance</span>
              <span className="font-semibold">{user?.credits?.toFixed(2) ?? '0.00'} credits</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowInsightsModal(false)} className="btn btn-secondary flex-1">Cancel</button>
              <button
                onClick={confirmViewInsights}
                disabled={(user?.credits ?? 0) < CREDIT_PER_INSIGHT}
                className="btn btn-primary flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" /> Pay {CREDIT_PER_INSIGHT} Credit & View
              </button>
            </div>
            {(user?.credits ?? 0) < CREDIT_PER_INSIGHT && (
              <p className="text-xs text-red-500 text-center mt-2">Insufficient credits</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
