import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, CheckCircle, Calendar, AlertCircle, TrendingUp,
  Instagram, Youtube, RefreshCw,
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
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export const AudienceOverlapSharedPage = () => {
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
      const data = await audienceOverlapApi.getSharedReport(token);
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
            <span>Shared Audience Overlap Report</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{report.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              {report.platform === 'INSTAGRAM' ? (
                <Instagram className="w-4 h-4 text-pink-500" />
              ) : (
                <Youtube className="w-4 h-4 text-red-500" />
              )}
              {report.platform}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {formatNumber(report.totalFollowers)} total followers (audience)
            </span>
          </div>
        </div>

        {report.status === 'FAILED' && report.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <strong>Error:</strong> {report.errorMessage}
          </div>
        )}

        {(report.status === 'PENDING' || report.status === 'IN_PROCESS') && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
            <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              {report.status === 'PENDING' ? 'Report Queued' : 'Processing Report'}
            </h3>
            <p className="text-blue-600">
              {report.status === 'PENDING'
                ? 'This report is still in the queue.'
                : 'Audience overlap is being calculated.'}
            </p>
          </div>
        )}

        {report.status === 'COMPLETED' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{formatNumber(report.totalFollowers)}</div>
                <div className="text-sm text-gray-500 mt-1">Total Followers</div>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{formatNumber(report.uniqueFollowers)}</div>
                <div className="text-sm text-gray-500 mt-1">Unique Followers</div>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{formatNumber(report.overlappingFollowers)}</div>
                <div className="text-sm text-gray-500 mt-1">Overlapping</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 sm:p-6 shadow-sm text-white">
                <div className="text-2xl sm:text-3xl font-bold">{report.overlapPercentage?.toFixed(1)}%</div>
                <div className="text-sm text-purple-100 mt-1">Overlap Rate</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 sm:p-6 shadow-sm text-white">
                <div className="text-2xl sm:text-3xl font-bold">{report.uniquePercentage?.toFixed(1)}%</div>
                <div className="text-sm text-green-100 mt-1">Unique Rate</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience Overlap Visualization</h2>
              <div className="flex justify-center items-center py-8">
                <div className="relative">
                  <div className="flex items-center">
                    {report.influencers.map((inf, idx) => (
                      <div key={inf.id} className="relative" style={{ marginLeft: idx > 0 ? '-30px' : '0' }}>
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
          </>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Individual Influencer Analysis</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencer</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Followers</th>
                  {report.status === 'COMPLETED' && (
                    <>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unique %</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overlap</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Overlap %</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.influencers.map((inf) => (
                  <tr key={inf.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                          alt={inf.influencerName}
                          className="w-10 h-10 rounded-full shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{inf.influencerName}</div>
                          {inf.influencerUsername && (
                            <div className="text-sm text-gray-500">@{inf.influencerUsername}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right font-medium">{formatNumber(inf.followerCount)}</td>
                    {report.status === 'COMPLETED' && (
                      <>
                        <td className="px-4 sm:px-6 py-4 text-right text-green-600">{formatNumber(inf.uniqueFollowers)}</td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {inf.uniquePercentage?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-purple-600">{formatNumber(inf.overlappingFollowers)}</td>
                        <td className="px-4 sm:px-6 py-4 text-right">
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
        </div>

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
