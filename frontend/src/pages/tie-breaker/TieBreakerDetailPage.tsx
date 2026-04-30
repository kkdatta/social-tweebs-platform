import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Share2, Edit2, Check, X,
  Instagram, Youtube, Music, Users, Heart, Eye, MessageCircle,
  Globe, MapPin, Briefcase, CheckCircle, AlertCircle, Loader, Clock
} from 'lucide-react';
import { tieBreakerApi } from '../../services/api';

interface AudienceData {
  quality?: number;
  notablePct?: number;
  genderData?: { male: number; female: number };
  ageData?: Array<{ ageRange: string; male: number; female: number }>;
  countries?: Array<{ country: string; percentage: number }>;
  cities?: Array<{ city: string; percentage: number }>;
  interests?: Array<{ interest: string; percentage: number }>;
}

interface TopPost {
  postId: string;
  postUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  likes: number;
  comments: number;
  views: number;
  engagementRate: number;
  isSponsored: boolean;
  postDate?: string;
}

interface Influencer {
  id: string;
  influencerProfileId?: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  followingCount?: number;
  avgLikes: number;
  avgViews: number;
  avgComments: number;
  avgReelViews?: number;
  engagementRate: number;
  isVerified: boolean;
  followersAudience?: AudienceData;
  engagersAudience?: AudienceData;
  topPosts?: TopPost[];
  displayOrder: number;
  wasUnlocked: boolean;
}

interface ComparisonDetail {
  id: string;
  title: string;
  platform: string;
  status: string;
  searchQuery?: string;
  influencers: Influencer[];
  isPublic: boolean;
  shareUrl?: string;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  ownerId: string;
  createdById: string;
}

type Tab = 'overview' | 'followers' | 'engagers' | 'posts';

export const TieBreakerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [comparison, setComparison] = useState<ComparisonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  
  useEffect(() => {
    loadComparison();
  }, [id]);

  useEffect(() => {
    if (!comparison || (comparison.status !== 'PROCESSING' && comparison.status !== 'PENDING')) return;
    const interval = setInterval(async () => {
      try {
        const data = await tieBreakerApi.getById(comparison.id);
        setComparison(data);
        if (data.status !== 'PROCESSING' && data.status !== 'PENDING') clearInterval(interval);
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [comparison?.id, comparison?.status]);
  
  const loadComparison = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await tieBreakerApi.getById(id);
      setComparison(data);
      setEditedTitle(data.title);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveTitle = async () => {
    if (!comparison || !editedTitle.trim()) return;
    
    try {
      await tieBreakerApi.update(comparison.id, { title: editedTitle.trim() });
      setComparison(prev => prev ? { ...prev, title: editedTitle.trim() } : null);
      setIsEditingTitle(false);
    } catch (err) {
      console.error('Failed to update title:', err);
    }
  };
  
  const handleShare = async () => {
    if (!comparison) return;
    
    try {
      const result = await tieBreakerApi.share(comparison.id, { makePublic: true });
      if (result.shareUrl) {
        await navigator.clipboard.writeText(window.location.origin + result.shareUrl);
        alert('Share link copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };
  
  const handleDownloadPDF = () => {
    window.print();
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  const getPlatformIcon = (platform: string, size = 5) => {
    const className = `w-${size} h-${size}`;
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className={`${className} text-pink-500`} />;
      case 'YOUTUBE':
        return <Youtube className={`${className} text-red-500`} />;
      case 'TIKTOK':
        return <Music className={`${className} text-black`} />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      PROCESSING: <Loader className="w-4 h-4 animate-spin" />,
      PENDING: <Clock className="w-4 h-4" />,
      FAILED: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  if (error || !comparison) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <p>{error || 'Comparison not found'}</p>
        <button
          onClick={() => navigate('/tie-breaker')}
          className="mt-4 text-purple-600 hover:underline"
        >
          Back to list
        </button>
      </div>
    );
  }
  
  const influencers = comparison.influencers.sort((a, b) => a.displayOrder - b.displayOrder);

  const audienceEngagersTabLabel =
    comparison.platform === 'YOUTUBE' || comparison.platform === 'TIKTOK'
      ? "Commenters' Audience"
      : "Engagers' Audience";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tie-breaker')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl font-bold border-b-2 border-purple-500 focus:outline-none"
                    autoFocus
                  />
                  <button onClick={handleSaveTitle} className="p-1 text-green-600 hover:bg-green-50 rounded">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsEditingTitle(false)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900">{comparison.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
              {getStatusBadge(comparison.status)}
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                {getPlatformIcon(comparison.platform)}
                {comparison.platform}
              </span>
              <span>{influencers.length} influencers compared</span>
              <span>Created {new Date(comparison.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>
      
      {/* Processing/Error State */}
      {comparison.status === 'PROCESSING' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-blue-800">Comparison is being processed. Please wait...</span>
        </div>
      )}
      
      {comparison.status === 'FAILED' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-800">{comparison.errorMessage || 'Comparison failed to process'}</span>
        </div>
      )}
      
      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex gap-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'followers', label: "Followers' Audience" },
              { id: 'engagers', label: audienceEngagersTabLabel },
              { id: 'posts', label: 'Top Posts' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {/* Influencer Headers */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
            {influencers.map((inf) => (
              <div key={inf.id} className="bg-gray-50 rounded-xl p-4 text-center">
                <img
                  src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                  alt={inf.influencerName}
                  className="w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-md"
                />
                <div className="flex items-center justify-center gap-1">
                  <h3 className="font-bold text-gray-900">{inf.influencerName}</h3>
                  {inf.isVerified && <CheckCircle className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-sm text-gray-500">@{inf.influencerUsername}</p>
                <p className="text-lg font-bold text-purple-600 mt-2">{formatNumber(inf.followerCount)} followers</p>
              </div>
            ))}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab influencers={influencers} formatNumber={formatNumber} />
          )}
          
          {activeTab === 'followers' && (
            <AudienceTab
              influencers={influencers}
              audienceType="followers"
              platform={comparison.platform}
            />
          )}
          
          {activeTab === 'engagers' && (
            <AudienceTab
              influencers={influencers}
              audienceType="engagers"
              platform={comparison.platform}
            />
          )}
          
          {activeTab === 'posts' && (
            <PostsTab influencers={influencers} formatNumber={formatNumber} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ influencers, formatNumber }: { influencers: Influencer[]; formatNumber: (n: number) => string }) => {
  const metrics = [
    { label: 'Followers', key: 'followerCount', icon: Users },
    { label: 'Avg Likes', key: 'avgLikes', icon: Heart },
    { label: 'Avg Views', key: 'avgViews', icon: Eye },
    { label: 'Avg Comments', key: 'avgComments', icon: MessageCircle },
    { label: 'Engagement Rate', key: 'engagementRate', suffix: '%', icon: Briefcase },
  ];
  
  // Add avgReelViews for Instagram
  if (influencers[0]?.platform === 'INSTAGRAM') {
    metrics.splice(4, 0, { label: 'Avg Reel Views', key: 'avgReelViews', icon: Eye });
  }
  
  return (
    <div className="mt-6 space-y-4">
      {metrics.map((metric) => (
        <div key={metric.key} className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${influencers.length}, 1fr)` }}>
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <metric.icon className="w-4 h-4 text-gray-400" />
            {metric.label}
          </div>
          {influencers.map((inf) => {
            const value = (inf as any)[metric.key];
            const formattedValue = metric.suffix === '%'
              ? (value ? Number(value).toFixed(2) + '%' : '-')
              : (value ? formatNumber(value) : '-');
            
            // Find if this is the best value
            const values = influencers.map(i => Number((i as any)[metric.key]) || 0);
            const maxValue = Math.max(...values);
            const isBest = value && Number(value) === maxValue && maxValue > 0;
            
            return (
              <div
                key={inf.id}
                className={`text-center py-3 rounded-lg ${isBest ? 'bg-green-50 text-green-700 font-bold' : 'bg-gray-50'}`}
              >
                {formattedValue}
                {isBest && <span className="ml-1 text-xs">🏆</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// Audience Tab Component
const AudienceTab = ({
  influencers,
  audienceType,
  platform,
}: {
  influencers: Influencer[];
  audienceType: 'followers' | 'engagers';
  platform: string;
}) => {
  const notableAudienceLabel =
    audienceType === 'followers'
      ? 'Followers'
      : platform === 'YOUTUBE' || platform === 'TIKTOK'
        ? 'Commenters'
        : 'Engagers';
  const getAudienceData = (inf: Influencer) => {
    return audienceType === 'followers' ? inf.followersAudience : inf.engagersAudience;
  };
  
  return (
    <div className="mt-6 space-y-8">
      {/* Quality & Notable */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Quality Metrics</h4>
        
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${influencers.length}, 1fr)` }}>
          <div className="text-gray-700 font-medium">Quality Score</div>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            return (
              <div key={inf.id} className="text-center py-3 bg-gray-50 rounded-lg font-medium">
                {data?.quality ? `${data.quality.toFixed(1)}%` : '-'}
              </div>
            );
          })}
        </div>
        
        <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${influencers.length}, 1fr)` }}>
          <div className="text-gray-700 font-medium">Notable {notableAudienceLabel}</div>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            return (
              <div key={inf.id} className="text-center py-3 bg-gray-50 rounded-lg font-medium">
                {data?.notablePct ? `${data.notablePct.toFixed(1)}%` : '-'}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Gender Distribution */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Gender Distribution</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            if (!data?.genderData) return <div key={inf.id} className="text-center text-gray-400">No data</div>;
            
            return (
              <div key={inf.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-600 font-medium">Male</span>
                  <span className="font-bold">{data.genderData.male.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${data.genderData.male}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3 mb-2">
                  <span className="text-pink-600 font-medium">Female</span>
                  <span className="font-bold">{data.genderData.female.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full"
                    style={{ width: `${data.genderData.female}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Age Distribution */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Age Distribution</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            if (!data?.ageData?.length) return <div key={inf.id} className="text-center text-gray-400 py-4">No data</div>;

            return (
              <div key={inf.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                {data.ageData.map((ag, idx) => {
                  const total = ag.male + ag.female;
                  const maxTotal = Math.max(...data.ageData!.map(a => a.male + a.female), 1);
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 w-12">{ag.ageRange}</span>
                        <span className="text-xs text-gray-500">{total.toFixed(1)}%</span>
                      </div>
                      <div className="flex gap-0.5 h-3">
                        <div
                          className="bg-blue-400 rounded-l h-full transition-all"
                          style={{ width: `${(ag.male / maxTotal) * 100}%` }}
                          title={`Male: ${ag.male.toFixed(1)}%`}
                        />
                        <div
                          className="bg-pink-400 rounded-r h-full transition-all"
                          style={{ width: `${(ag.female / maxTotal) * 100}%` }}
                          title={`Female: ${ag.female.toFixed(1)}%`}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5 text-[10px] text-gray-400">
                        <span>M: {ag.male.toFixed(1)}%</span>
                        <span>F: {ag.female.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-200 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-400" /> Male</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-pink-400" /> Female</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Countries */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Top Countries
        </h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            if (!data?.countries?.length) return <div key={inf.id} className="text-center text-gray-400">No data</div>;
            
            return (
              <div key={inf.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                {data.countries.slice(0, 6).map((country, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{country.country}</span>
                    <span className="font-medium">{country.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Top Cities */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Top Cities
        </h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            if (!data?.cities?.length) return <div key={inf.id} className="text-center text-gray-400">No data</div>;
            
            return (
              <div key={inf.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                {data.cities.slice(0, 6).map((city, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{city.city}</span>
                    <span className="font-medium">{city.percentage.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Interests */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Top Interests</h4>
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
          {influencers.map((inf) => {
            const data = getAudienceData(inf);
            if (!data?.interests?.length) return <div key={inf.id} className="text-center text-gray-400">No data</div>;
            
            return (
              <div key={inf.id} className="bg-gray-50 rounded-lg p-4 flex flex-wrap gap-2">
                {data.interests.slice(0, 5).map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                  >
                    {interest.interest}
                  </span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Posts Tab Component
const PostsTab = ({ influencers, formatNumber }: { influencers: Influencer[]; formatNumber: (n: number) => string }) => {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Top 10 Posts (Including Sponsored)</h4>
      
      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${influencers.length}, 1fr)` }}>
        {influencers.map((inf) => (
          <div key={inf.id} className="space-y-4">
            {!inf.topPosts?.length ? (
              <div className="text-center text-gray-400 py-8">No posts available</div>
            ) : (
              inf.topPosts.slice(0, 10).map((post, idx) => (
                <div
                  key={post.postId}
                  className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200"
                >
                  {post.thumbnailUrl && (
                    <img
                      src={post.thumbnailUrl}
                      alt={`Post ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-3">
                    {post.isSponsored && (
                      <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded mb-2">
                        Sponsored
                      </span>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {post.caption || 'No caption'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{formatNumber(post.likes)}</div>
                        <div className="text-gray-500">Likes</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{formatNumber(post.comments)}</div>
                        <div className="text-gray-500">Comments</div>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{formatNumber(post.views)}</div>
                        <div className="text-gray-500">Views</div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-xs">
                      <span className="text-purple-600 font-medium">ER: {post.engagementRate}%</span>
                      {post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Post
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
