import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, Heart, Eye, MessageCircle, Share, TrendingUp, Users,
  CheckCircle, ExternalLink, Calendar, Tag, AlertCircle
} from 'lucide-react';
import { collabCheckApi } from '../../services/api';

interface Post {
  id: string;
  postUrl?: string;
  postType?: string;
  thumbnailUrl?: string;
  description?: string;
  matchedKeywords?: string[];
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  sharesCount: number;
  engagementRate?: number;
  postDate?: string;
}

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  platform: string;
  profilePictureUrl?: string;
  followerCount: number;
  postsCount: number;
  likesCount: number;
  avgEngagementRate?: number;
}

interface ReportDetail {
  id: string;
  title: string;
  platform: string;
  status: string;
  timePeriod: string;
  queries: string[];
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  totalFollowers: number;
  influencers: Influencer[];
  posts: Post[];
  createdAt: string;
  completedAt?: string;
}

export const CollabCheckSharedPage = () => {
  const { token } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [token]);

  const loadReport = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await collabCheckApi.getSharedReport(token);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Report not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const formatTimePeriod = (period: string) => {
    const map: Record<string, string> = {
      '1_MONTH': '1 Month',
      '3_MONTHS': '3 Months',
      '6_MONTHS': '6 Months',
      '1_YEAR': '1 Year',
    };
    return map[period] || period;
  };

  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords?.length) return text;
    
    let highlighted = text;
    keywords.forEach(kw => {
      const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
    });
    return highlighted;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Report Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This report may have been deleted or is no longer shared.'}</p>
          <Link to="/login" className="text-purple-600 hover:text-purple-700">
            Sign in to SocialTweebs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            <span className="font-bold text-lg">SocialTweebs</span>
          </div>
          <Link 
            to="/login" 
            className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium hover:bg-gray-100"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Report Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Shared Collab Check Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {report.totalFollowers.toLocaleString()} followers
            </span>
            <span>{formatTimePeriod(report.timePeriod)}</span>
          </div>
          
          {/* Queries */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Tag className="w-4 h-4 text-gray-400" />
            {report.queries.map((q, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                {q}
              </span>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-xs">Posts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{report.totalPosts.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-xs">Likes</span>
            </div>
            <div className="text-2xl font-bold text-pink-600">{report.totalLikes.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{report.totalViews.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">Comments</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{report.totalComments.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Share className="w-4 h-4" />
              <span className="text-xs">Shares</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{report.totalShares.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Avg ER</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{report.avgEngagementRate?.toFixed(2) || '0'}%</div>
          </div>
        </div>

        {/* Influencers */}
        {report.influencers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Influencers ({report.influencers.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.influencers.map((inf) => (
                <div key={inf.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                      alt={inf.influencerName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-medium">{inf.influencerName}</div>
                      {inf.influencerUsername && (
                        <div className="text-sm text-gray-500">@{inf.influencerUsername}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Followers:</span>
                      <span className="ml-1 font-medium">{inf.followerCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Posts:</span>
                      <span className="ml-1 font-medium">{inf.postsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Likes:</span>
                      <span className="ml-1 font-medium">{inf.likesCount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">ER:</span>
                      <span className="ml-1 font-medium">{inf.avgEngagementRate?.toFixed(2) || '0'}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {report.posts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Posts ({report.posts.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.posts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {post.thumbnailUrl && (
                    <img
                      src={post.thumbnailUrl}
                      alt="Post"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    {post.description && (
                      <p
                        className="text-sm text-gray-600 mb-3 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: highlightKeywords(post.description, post.matchedKeywords || [])
                        }}
                      />
                    )}
                    
                    {post.matchedKeywords && post.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.matchedKeywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likesCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.commentsCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.viewsCount.toLocaleString()}
                      </span>
                    </div>
                    
                    {post.engagementRate !== undefined && (
                      <div className="text-xs text-gray-500 mb-3">
                        ER: {post.engagementRate.toFixed(2)}%
                      </div>
                    )}
                    
                    {post.postUrl && (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
                      >
                        View Post
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>This report was generated by <strong>SocialTweebs</strong></p>
          <Link to="/signup" className="text-purple-600 hover:text-purple-700">
            Create your free account →
          </Link>
        </div>
      </div>
    </div>
  );
};
