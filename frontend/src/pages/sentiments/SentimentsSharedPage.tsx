import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Heart, MessageCircle, Eye, ExternalLink, Instagram, AlertCircle, TrendingUp,
  ThumbsUp, ThumbsDown, Minus, Smile, Frown, Angry, Loader, CheckCircle,
} from 'lucide-react';
import { sentimentsApi } from '../../services/api';

interface PostData {
  id: string;
  postUrl?: string;
  thumbnailUrl?: string;
  description?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  engagementRate?: number;
  sentimentScore?: number;
  positivePercentage?: number;
  neutralPercentage?: number;
  negativePercentage?: number;
  commentsAnalyzed: number;
  postDate?: string;
}

interface EmotionData {
  emotion: string;
  percentage: number;
  count: number;
}

interface WordCloudItem {
  word: string;
  frequency: number;
  sentiment?: string;
}

interface ReportDetail {
  id: string;
  title: string;
  platform: string;
  reportType: 'POST' | 'PROFILE';
  targetUrl: string;
  influencerName?: string;
  influencerUsername?: string;
  influencerAvatarUrl?: string;
  status: string;
  errorMessage?: string;
  overallSentimentScore?: number;
  positivePercentage?: number;
  neutralPercentage?: number;
  negativePercentage?: number;
  deepBrandAnalysis: boolean;
  brandName?: string;
  brandUsername?: string;
  productName?: string;
  posts: PostData[];
  emotions: EmotionData[];
  wordCloud: WordCloudItem[];
  createdAt: string;
  completedAt?: string;
}

const getEmotionIcon = (emotion: string) => {
  const icons: Record<string, React.ReactNode> = {
    love: <Heart className="w-5 h-5 text-pink-500" />,
    joy: <Smile className="w-5 h-5 text-yellow-500" />,
    admiration: <ThumbsUp className="w-5 h-5 text-blue-500" />,
    neutral: <Minus className="w-5 h-5 text-gray-500" />,
    disappointment: <Frown className="w-5 h-5 text-orange-500" />,
    anger: <Angry className="w-5 h-5 text-red-500" />,
  };
  return icons[emotion.toLowerCase()] || <MessageCircle className="w-5 h-5 text-gray-500" />;
};

const getWordColor = (sentiment?: string) => {
  if (sentiment === 'POSITIVE') return 'text-green-600 bg-green-50';
  if (sentiment === 'NEGATIVE') return 'text-red-600 bg-red-50';
  return 'text-gray-600 bg-gray-100';
};

export const SentimentsSharedPage = () => {
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
      const data = await sentimentsApi.getSharedReport(token);
      setReport(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(message || 'Report not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
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

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span>Shared Sentiment Analysis</span>
          </div>
          <div className="flex items-start gap-4">
            {report.influencerAvatarUrl && (
              <img
                src={report.influencerAvatarUrl}
                alt={report.influencerName || ''}
                className="w-16 h-16 rounded-full border-2 border-white shadow-lg shrink-0"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  {report.influencerUsername || report.influencerName || '—'}
                </span>
                <span className="text-gray-300">|</span>
                <span className="capitalize">{report.reportType.toLowerCase()} report</span>
              </div>
            </div>
          </div>
        </div>

        {report.status !== 'COMPLETED' && (
          <div
            className={`p-6 rounded-xl ${
              report.status === 'FAILED' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {report.status === 'FAILED' ? (
                <AlertCircle className="w-8 h-8 text-red-500 shrink-0" />
              ) : (
                <Loader className="w-8 h-8 text-blue-500 animate-spin shrink-0" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {report.status === 'FAILED' ? 'Report Failed' : 'Report Processing'}
                </h3>
                <p className="text-gray-600">
                  {report.status === 'FAILED'
                    ? report.errorMessage || 'An error occurred while processing this report.'
                    : 'This sentiment report is not ready yet.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {report.status === 'COMPLETED' && (
          <>
            {report.deepBrandAnalysis && (
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
                <h4 className="font-medium text-purple-900">Deep Brand Analysis</h4>
                <div className="flex flex-wrap gap-6 mt-2 text-sm">
                  <span className="text-gray-600">
                    Brand: <span className="font-medium text-gray-900">{report.brandName}</span>
                  </span>
                  <span className="text-gray-600">
                    Username: <span className="font-medium text-gray-900">@{report.brandUsername}</span>
                  </span>
                  {report.productName && (
                    <span className="text-gray-600">
                      Product: <span className="font-medium text-gray-900">{report.productName}</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="text-sm text-gray-500 mb-2">Overall Score</div>
                <div className="text-3xl font-bold text-gray-900">{report.overallSentimentScore?.toFixed(1)}%</div>
              </div>
              <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-100">
                <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                  <ThumbsUp className="w-4 h-4" />
                  Positive
                </div>
                <div className="text-3xl font-bold text-green-700">{report.positivePercentage?.toFixed(1)}%</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Minus className="w-4 h-4" />
                  Neutral
                </div>
                <div className="text-3xl font-bold text-gray-700">{report.neutralPercentage?.toFixed(1)}%</div>
              </div>
              <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
                <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                  <ThumbsDown className="w-4 h-4" />
                  Negative
                </div>
                <div className="text-3xl font-bold text-red-700">{report.negativePercentage?.toFixed(1)}%</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Sentiment Distribution</h3>
              <div className="h-8 flex rounded-full overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${report.positivePercentage || 0}%` }}
                >
                  {(report.positivePercentage || 0) > 10 && `${report.positivePercentage?.toFixed(0)}%`}
                </div>
                <div
                  className="bg-gray-400 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${report.neutralPercentage || 0}%` }}
                >
                  {(report.neutralPercentage || 0) > 10 && `${report.neutralPercentage?.toFixed(0)}%`}
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${report.negativePercentage || 0}%` }}
                >
                  {(report.negativePercentage || 0) > 10 && `${report.negativePercentage?.toFixed(0)}%`}
                </div>
              </div>
              <div className="flex gap-6 mt-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span className="text-sm text-gray-600">Neutral</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Negative</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Emotions Distribution</h3>
                <div className="space-y-4">
                  {report.emotions.map((emotion, index) => (
                    <div key={index} className="flex items-center gap-4">
                      {getEmotionIcon(emotion.emotion)}
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">{emotion.emotion}</span>
                          <span className="text-sm text-gray-500">{emotion.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${emotion.percentage}%` }} />
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">({emotion.count})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud</h3>
                <div className="flex flex-wrap gap-2">
                  {report.wordCloud.map((item, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${getWordColor(item.sentiment)}`}
                      style={{ fontSize: `${Math.max(0.75, Math.min(1.5, item.frequency / 30))}rem` }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {report.posts.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyzed Posts</h3>
                <div className="space-y-4">
                  {report.posts.map((post) => (
                    <div key={post.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg">
                      {post.thumbnailUrl && (
                        <img src={post.thumbnailUrl} alt="" className="w-24 h-24 object-cover rounded-lg shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.description || 'No description'}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" /> {post.likesCount.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" /> {post.commentsCount.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" /> {post.viewsCount.toLocaleString()}
                          </span>
                          {post.engagementRate !== undefined && (
                            <span className="text-purple-600 font-medium">{post.engagementRate.toFixed(2)}% ER</span>
                          )}
                        </div>
                        {post.sentimentScore !== undefined && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Sentiment:</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">
                              +{post.positivePercentage?.toFixed(0)}%
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {post.neutralPercentage?.toFixed(0)}%
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                              -{post.negativePercentage?.toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {post.postUrl && (
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm shrink-0"
                        >
                          View <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:justify-between">
              <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
              {report.completedAt && <span>Completed: {new Date(report.completedAt).toLocaleString()}</span>}
              <span>
                Target:{' '}
                <a href={report.targetUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline break-all">
                  {report.targetUrl}
                </a>
              </span>
            </div>
          </>
        )}

        <div className="text-center py-8 text-gray-500 text-sm">
          <p>
            This report was generated by <strong>SocialTweebs</strong>
          </p>
          <Link to="/signup" className="text-purple-600 hover:text-purple-700">
            Create your free account →
          </Link>
        </div>
      </div>
    </div>
  );
};
