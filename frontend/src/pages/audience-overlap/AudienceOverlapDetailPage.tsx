import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, RefreshCw, Trash2, Share2,
  CheckCircle, Clock, AlertCircle, Instagram, Youtube
} from 'lucide-react';
import { audienceOverlapApi } from '../../services/api';

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  profilePictureUrl?: string;
  platform: string;
  followerCount: number;
  uniqueFollowers: number;
  uniquePercentage?: number;
  overlappingFollowers: number;
  overlappingPercentage?: number;
}

interface ReportDetail {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'IN_PROCESS' | 'COMPLETED' | 'FAILED';
  totalFollowers: number;
  uniqueFollowers: number;
  overlappingFollowers: number;
  overlapPercentage?: number;
  uniquePercentage?: number;
  influencers: Influencer[];
  isPublic: boolean;
  shareUrl?: string;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export const AudienceOverlapDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadReport();
  }, [id]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await audienceOverlapApi.getById(id!);
      setReport(data);
      setNewTitle(data.title);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTitle = async () => {
    if (!report || !newTitle.trim()) return;
    try {
      await audienceOverlapApi.update(report.id, { title: newTitle });
      setReport({ ...report, title: newTitle });
      setEditingTitle(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update title');
    }
  };

  const handleRetry = async () => {
    if (!report) return;
    if (!confirm('Retrying will cost 1 credit. Continue?')) return;
    try {
      await audienceOverlapApi.retry(report.id);
      loadReport();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry report');
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    if (!confirm(`Are you sure you want to delete "${report.title}"?`)) return;
    try {
      await audienceOverlapApi.delete(report.id);
      navigate('/audience-overlap');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete report');
    }
  };

  const handleShare = async () => {
    if (!report) return;
    try {
      const result = await audienceOverlapApi.share(report.id);
      setShareUrl(result.shareUrl);
      navigator.clipboard.writeText(result.shareUrl);
      alert('Share URL copied to clipboard!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate share URL');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      IN_PROCESS: 'bg-blue-100 text-blue-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      FAILED: 'bg-red-100 text-red-800',
    };
    const icons: Record<string, any> = {
      COMPLETED: <CheckCircle className="w-4 h-4" />,
      IN_PROCESS: <RefreshCw className="w-4 h-4 animate-spin" />,
      PENDING: <Clock className="w-4 h-4" />,
      FAILED: <AlertCircle className="w-4 h-4" />,
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Report not found</p>
        <button
          onClick={() => navigate('/audience-overlap')}
          className="mt-4 text-purple-600 hover:text-purple-700"
        >
          Back to reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/audience-overlap')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-2xl font-bold border-b-2 border-purple-500 focus:outline-none"
                autoFocus
              />
              <button
                onClick={handleUpdateTitle}
                className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingTitle(false);
                  setNewTitle(report.title);
                }}
                className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
              <button
                onClick={() => setEditingTitle(true)}
                className="p-1 text-gray-400 hover:text-purple-600"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              {report.platform === 'INSTAGRAM' ? (
                <Instagram className="w-4 h-4 text-pink-500" />
              ) : (
                <Youtube className="w-4 h-4 text-red-500" />
              )}
              {report.platform}
            </span>
            <span>Created {new Date(report.createdAt).toLocaleDateString()}</span>
            {report.completedAt && (
              <span>Completed {new Date(report.completedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(report.status)}
          {report.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Error Message */}
      {report.status === 'FAILED' && report.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          <strong>Error:</strong> {report.errorMessage}
          {report.retryCount > 0 && (
            <span className="ml-2 text-sm">({report.retryCount} retry attempts)</span>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {report.status === 'COMPLETED' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{formatNumber(report.totalFollowers)}</div>
            <div className="text-sm text-gray-500 mt-1">Total Followers</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{formatNumber(report.uniqueFollowers)}</div>
            <div className="text-sm text-gray-500 mt-1">Unique Followers</div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl font-bold text-purple-600">{formatNumber(report.overlappingFollowers)}</div>
            <div className="text-sm text-gray-500 mt-1">Overlapping Followers</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 shadow-sm text-white">
            <div className="text-3xl font-bold">{report.overlapPercentage?.toFixed(1)}%</div>
            <div className="text-sm text-purple-100 mt-1">Overlap Rate</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-sm text-white">
            <div className="text-3xl font-bold">{report.uniquePercentage?.toFixed(1)}%</div>
            <div className="text-sm text-green-100 mt-1">Unique Rate</div>
          </div>
        </div>
      )}

      {/* Overlap Visualization */}
      {report.status === 'COMPLETED' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience Overlap Visualization</h2>
          <div className="flex justify-center items-center py-8">
            <div className="relative">
              {/* Simple Venn Diagram Representation */}
              <div className="flex items-center">
                {report.influencers.map((inf, idx) => (
                  <div
                    key={inf.id}
                    className="relative"
                    style={{ marginLeft: idx > 0 ? '-30px' : '0' }}
                  >
                    <div
                      className={`w-32 h-32 rounded-full flex items-center justify-center ${
                        ['bg-purple-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200'][idx % 4]
                      } opacity-70`}
                    >
                      <div className="text-center">
                        <img
                          src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                          alt={inf.influencerName}
                          className="w-12 h-12 rounded-full mx-auto mb-1"
                        />
                        <div className="text-xs font-medium truncate max-w-[100px]">{inf.influencerName}</div>
                        <div className="text-xs text-gray-600">{formatNumber(inf.followerCount)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <div className="text-2xl font-bold text-purple-600">{report.overlapPercentage?.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Combined Overlap</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Influencer Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Individual Influencer Analysis</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
              {report.status === 'COMPLETED' && (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique %</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overlap</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overlap %</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.influencers.map((inf) => (
              <tr key={inf.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                      alt={inf.influencerName}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{inf.influencerName}</div>
                      {inf.influencerUsername && (
                        <div className="text-sm text-gray-500">@{inf.influencerUsername}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-medium">{formatNumber(inf.followerCount)}</td>
                {report.status === 'COMPLETED' && (
                  <>
                    <td className="px-6 py-4 text-right text-green-600">{formatNumber(inf.uniqueFollowers)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {inf.uniquePercentage?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-purple-600">{formatNumber(inf.overlappingFollowers)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {inf.overlappingPercentage?.toFixed(1)}%
                      </span>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Processing Status */}
      {(report.status === 'PENDING' || report.status === 'IN_PROCESS') && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
          </h3>
          <p className="text-blue-600">
            {report.status === 'PENDING'
              ? 'Your report is in queue and will be processed shortly.'
              : 'Analyzing audience data. This may take a few moments.'}
          </p>
        </div>
      )}
    </div>
  );
};
