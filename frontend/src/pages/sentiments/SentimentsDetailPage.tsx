import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Share2, Trash2, Download, Edit3, ExternalLink,
  ThumbsUp, ThumbsDown, Minus, Heart, Smile, Frown, Angry,
  MessageCircle, Eye, ThumbsUpIcon, Instagram, Clock,
  CheckCircle, Loader, AlertCircle, Copy, Check, MoreVertical,
  Link, Users, X
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
  isPublic: boolean;
  shareUrl?: string;
  createdAt: string;
  completedAt?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export const SentimentsDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [sharingWithTeam, setSharingWithTeam] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await sentimentsApi.getById(id!);
      setReport(data);
      setNewTitle(data.title);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      setShareLoading(true);
      const response = await sentimentsApi.share(report.id);
      if (response.shareUrl) {
        await navigator.clipboard.writeText(response.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to share report');
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (report?.shareUrl) {
      const fullUrl = `${window.location.origin}${report.shareUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpdateTitle = async () => {
    if (!report || !newTitle.trim()) return;
    try {
      await sentimentsApi.update(report.id, { title: newTitle });
      setReport({ ...report, title: newTitle });
      setEditingTitle(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update title');
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm('Are you sure you want to delete this report?')) return;
    try {
      await sentimentsApi.delete(report.id);
      navigate('/sentiments');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      setDownloadingPdf(true);
      setMenuOpen(false);
      const blob = await sentimentsApi.downloadPdf(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_')}_sentiment_report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const openShareModal = async () => {
    setShareModalOpen(true);
    setMenuOpen(false);
    try {
      const response = await sentimentsApi.getTeamMembers();
      setTeamMembers(response.members || []);
    } catch (err) {
      console.error('Failed to load team members');
    }
  };

  const handleShareWithTeam = async () => {
    if (!report || !selectedMember) return;
    try {
      setSharingWithTeam(true);
      await sentimentsApi.share(report.id, { sharedWithUserId: selectedMember, permissionLevel: 'VIEW' });
      alert('Report shared successfully!');
      setShareModalOpen(false);
      setSelectedMember('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to share report');
    } finally {
      setSharingWithTeam(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROCESS: 'bg-blue-100 text-blue-800',
      AGGREGATING: 'bg-indigo-100 text-indigo-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      IN_PROCESS: <Loader className="w-4 h-4 animate-spin" />,
      AGGREGATING: <Loader className="w-4 h-4 animate-spin" />,
      PENDING: <Clock className="w-4 h-4" />,
      FAILED: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getEmotionIcon = (emotion: string) => {
    const icons: Record<string, any> = {
      love: <Heart className="w-5 h-5 text-pink-500" />,
      joy: <Smile className="w-5 h-5 text-yellow-500" />,
      admiration: <ThumbsUpIcon className="w-5 h-5 text-blue-500" />,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Report</h2>
        <p className="text-gray-500 mb-4">{error || 'Report not found'}</p>
        <button
          onClick={() => navigate('/sentiments')}
          className="text-purple-600 hover:text-purple-700"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/sentiments')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          
          <div className="flex items-center gap-4">
            {report.influencerAvatarUrl && (
              <img
                src={report.influencerAvatarUrl}
                alt={report.influencerName || ''}
                className="w-16 h-16 rounded-full border-2 border-white shadow-lg"
              />
            )}
            <div>
              <div className="flex items-center gap-3">
                {editingTitle ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateTitle}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-gray-500">
                  <Instagram className="w-4 h-4 text-pink-500" />
                  {report.influencerUsername || report.influencerName || 'Unknown'}
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500 capitalize">{report.reportType.toLowerCase()} Report</span>
                <span className="text-gray-300">|</span>
                {getStatusBadge(report.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Share Button */}
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {shareLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Link className="w-4 h-4" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          
          {/* Download PDF Button */}
          {report.status === 'COMPLETED' && (
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {downloadingPdf ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              PDF
            </button>
          )}
          
          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    setEditingTitle(true);
                    setMenuOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Report Title
                </button>
                <button
                  onClick={openShareModal}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Users className="w-4 h-4" />
                  Share with Team
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Copy className="w-4 h-4" />
                  Copy Share URL
                </button>
                {report.status === 'COMPLETED' && (
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                )}
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Message for Non-Completed Reports */}
      {report.status !== 'COMPLETED' && (
        <div className={`p-6 rounded-xl ${
          report.status === 'FAILED' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {report.status === 'FAILED' ? (
              <AlertCircle className="w-8 h-8 text-red-500" />
            ) : (
              <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">
                {report.status === 'FAILED' ? 'Report Failed' : 'Report Processing'}
              </h3>
              <p className="text-gray-600">
                {report.status === 'FAILED' 
                  ? report.errorMessage || 'An error occurred while processing this report.'
                  : 'Please wait while we analyze the sentiment data...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show if COMPLETED */}
      {report.status === 'COMPLETED' && (
        <>
          {/* Deep Brand Analysis Badge */}
          {report.deepBrandAnalysis && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4">
              <h4 className="font-medium text-purple-900">Deep Brand Analysis Enabled</h4>
              <div className="flex gap-6 mt-2 text-sm">
                <span className="text-gray-600">Brand: <span className="font-medium text-gray-900">{report.brandName}</span></span>
                <span className="text-gray-600">Username: <span className="font-medium text-gray-900">@{report.brandUsername}</span></span>
                {report.productName && (
                  <span className="text-gray-600">Product: <span className="font-medium text-gray-900">{report.productName}</span></span>
                )}
              </div>
            </div>
          )}

          {/* Sentiment Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-sm text-gray-500 mb-2">Overall Score</div>
              <div className="text-3xl font-bold text-gray-900">
                {report.overallSentimentScore?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                <ThumbsUp className="w-4 h-4" />
                Positive
              </div>
              <div className="text-3xl font-bold text-green-700">
                {report.positivePercentage?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Minus className="w-4 h-4" />
                Neutral
              </div>
              <div className="text-3xl font-bold text-gray-700">
                {report.neutralPercentage?.toFixed(1)}%
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
              <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                <ThumbsDown className="w-4 h-4" />
                Negative
              </div>
              <div className="text-3xl font-bold text-red-700">
                {report.negativePercentage?.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Sentiment Distribution Chart */}
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
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Positive</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">Neutral</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Negative</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emotions Distribution */}
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
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${emotion.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">({emotion.count})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Word Cloud */}
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

          {/* Posts Section */}
          {report.posts.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyzed Posts</h3>
              <div className="space-y-4">
                {report.posts.map((post) => (
                  <div key={post.id} className="flex gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    {post.thumbnailUrl && (
                      <img
                        src={post.thumbnailUrl}
                        alt="Post thumbnail"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {post.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" /> {post.likesCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" /> {post.commentsCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" /> {post.viewsCount.toLocaleString()}
                        </span>
                        {post.engagementRate && (
                          <span className="text-purple-600 font-medium">
                            {post.engagementRate.toFixed(2)}% ER
                          </span>
                        )}
                      </div>
                      {post.sentimentScore !== undefined && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500">Sentiment:</span>
                          <div className="flex items-center gap-1">
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
                        </div>
                      )}
                    </div>
                    {post.postUrl && (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm"
                      >
                        View <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Metadata */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
              {report.completedAt && (
                <span>Completed: {new Date(report.completedAt).toLocaleString()}</span>
              )}
              <span>Target URL: <a href={report.targetUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">{report.targetUrl}</a></span>
            </div>
          </div>
        </>
      )}

      {/* Share with Team Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share with Team</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Select a team member to share this report with. They will get view access.
            </p>
            
            {teamMembers.length > 0 ? (
              <>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </option>
                  ))}
                </select>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShareModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareWithTeam}
                    disabled={!selectedMember || sharingWithTeam}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sharingWithTeam ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No team members found</p>
              </div>
            )}
            
            <hr className="my-4" />
            
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Or share via link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={report?.shareUrl ? `${window.location.origin}${report.shareUrl}` : 'No share link yet'}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-xs"
                />
                <button
                  onClick={handleShare}
                  className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
