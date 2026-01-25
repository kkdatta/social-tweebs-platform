import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowLeft, Instagram, Youtube, Music, Plus, X, Scale, AlertCircle,
  CheckCircle, Lock, Unlock, Users
} from 'lucide-react';
import { tieBreakerApi } from '../../services/api';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const debounce = <T extends (...args: any[]) => any>(func: T, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface SearchedInfluencer {
  id: string;
  platform: string;
  platformUserId: string;
  username: string;
  fullName?: string;
  profilePictureUrl?: string;
  followerCount: number;
  engagementRate?: number;
  isVerified: boolean;
  isUnlocked: boolean;
  locationCountry?: string;
}

type Platform = 'INSTAGRAM' | 'YOUTUBE' | 'TIKTOK';

export const TieBreakerCreatePage = () => {
  const navigate = useNavigate();
  
  // Form state
  const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInfluencers, setSelectedInfluencers] = useState<SearchedInfluencer[]>([]);
  
  // Search state
  const [searchResults, setSearchResults] = useState<SearchedInfluencer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate credits needed
  const creditsNeeded = selectedInfluencers.filter(inf => !inf.isUnlocked).length;

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string, plat: Platform) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      try {
        const results = await tieBreakerApi.searchInfluencers(plat, query, 20);
        setSearchResults(results);
        setHasSearched(true);
      } catch (err) {
        console.error('Search failed:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery, platform);
  }, [searchQuery, platform, debouncedSearch]);

  // Clear selection when platform changes
  useEffect(() => {
    setSelectedInfluencers([]);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
  }, [platform]);

  const handleSelectInfluencer = (influencer: SearchedInfluencer) => {
    if (selectedInfluencers.length >= 3) {
      setError('You can only compare up to 3 influencers');
      return;
    }

    if (selectedInfluencers.some(inf => inf.id === influencer.id)) {
      return; // Already selected
    }

    setSelectedInfluencers(prev => [...prev, influencer]);
    setError(null);
  };

  const handleRemoveInfluencer = (id: string) => {
    setSelectedInfluencers(prev => prev.filter(inf => inf.id !== id));
  };

  const handleSubmit = async () => {
    if (selectedInfluencers.length < 2) {
      setError('Please select at least 2 influencers to compare');
      return;
    }

    if (creditsNeeded > 0) {
      const confirmed = confirm(
        `This comparison will cost ${creditsNeeded} credit(s) for ${creditsNeeded} unblurred influencer(s). Continue?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await tieBreakerApi.create({
        platform,
        influencerIds: selectedInfluencers.map(inf => inf.id),
        searchQuery: searchQuery || undefined,
      });

      if (result.success) {
        navigate(`/tie-breaker/${result.comparison.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create comparison');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPlatformIcon = (plat: string) => {
    switch (plat) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5" />;
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5" />;
      case 'TIKTOK':
        return <Music className="w-5 h-5" />;
      default:
        return <Scale className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tie-breaker')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Comparison</h1>
          <p className="text-gray-600">Select 2-3 influencers to compare</p>
        </div>
      </div>

      {/* Credit Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Credit Information</p>
            <p className="mt-1">
              1 credit will be deducted for each unblurred influencer selected for comparison.
              Already unlocked influencers are free to compare.
            </p>
          </div>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Platform</h2>
        <div className="flex gap-3">
          {(['INSTAGRAM', 'YOUTUBE', 'TIKTOK'] as Platform[]).map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatform(plat)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                platform === plat
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {getPlatformIcon(plat)}
              <span className="font-medium">{plat}</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Note: You can only compare influencers from the same platform
        </p>
      </div>

      {/* Selected Influencers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Selected Influencers ({selectedInfluencers.length}/3)
          </h2>
          {creditsNeeded > 0 && (
            <span className="text-sm text-orange-600 font-medium">
              {creditsNeeded} credit(s) required
            </span>
          )}
        </div>

        {selectedInfluencers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Users className="w-12 h-12 mb-4 text-gray-300" />
            <p>No influencers selected</p>
            <p className="text-sm mt-1">Search and select 2-3 influencers to compare</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedInfluencers.map((influencer) => (
              <div
                key={influencer.id}
                className="relative border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <button
                  onClick={() => handleRemoveInfluencer(influencer.id)}
                  className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3">
                  <img
                    src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.username}`}
                    alt={influencer.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900 truncate">
                        {influencer.fullName || influencer.username}
                      </span>
                      {influencer.isVerified && (
                        <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">@{influencer.username}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">{formatNumber(influencer.followerCount)} followers</span>
                      {influencer.isUnlocked ? (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Unlock className="w-3 h-3" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-orange-600">
                          <Lock className="w-3 h-3" />
                          1 credit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add more placeholder */}
            {selectedInfluencers.length < 3 && (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Plus className="w-8 h-8 mx-auto mb-2" />
                  <span className="text-sm">Add influencer</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Influencers */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Influencers</h2>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${platform.toLowerCase()} influencers by name or username...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Search Results */}
        <div className="mt-4">
          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            </div>
          )}

          {!isSearching && hasSearched && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No influencers found for "{searchQuery}"
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((influencer) => {
                const isSelected = selectedInfluencers.some(inf => inf.id === influencer.id);
                
                return (
                  <div
                    key={influencer.id}
                    onClick={() => !isSelected && handleSelectInfluencer(influencer)}
                    className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    <img
                      src={influencer.profilePictureUrl || `https://ui-avatars.com/api/?name=${influencer.username}`}
                      alt={influencer.username}
                      className="w-12 h-12 rounded-full"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {influencer.fullName || influencer.username}
                        </span>
                        {influencer.isVerified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">@{influencer.username}</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {formatNumber(influencer.followerCount)}
                      </div>
                      <div className="text-sm text-gray-500">followers</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {influencer.isUnlocked ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <Unlock className="w-3 h-3" />
                          Free
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                          <Lock className="w-3 h-3" />
                          1 credit
                        </span>
                      )}
                      
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {selectedInfluencers.length < 2
            ? `Select ${2 - selectedInfluencers.length} more influencer(s)`
            : creditsNeeded > 0
            ? `${creditsNeeded} credit(s) will be deducted`
            : 'Ready to compare!'}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={selectedInfluencers.length < 2 || isSubmitting}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Scale className="w-5 h-5" />
              Compare Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};
