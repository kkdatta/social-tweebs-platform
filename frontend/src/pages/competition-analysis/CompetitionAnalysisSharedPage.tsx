import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3,
  Users,
  FileText,
  Heart,
  Eye,
  MessageCircle,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';

interface Brand {
  id: string;
  brandName: string;
  hashtags?: string[];
  username?: string;
  displayColor?: string;
  influencerCount: number;
  postsCount: number;
  totalLikes: number;
  totalViews: number;
  avgEngagementRate?: number;
}

interface ReportDetail {
  id: string;
  title: string;
  platforms: string[];
  status: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  totalBrands: number;
  totalInfluencers: number;
  totalPosts: number;
  totalLikes: number;
  totalViews: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate?: number;
  brands: Brand[];
  categorization: any[];
  postTypeBreakdown: any[];
}

const CompetitionAnalysisSharedPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchReport();
    }
  }, [token]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/v1/competition-analysis/shared/${token}`);
      setReport(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Report not found or not publicly shared');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Report Not Found</h1>
        <p className="text-gray-500">{error || 'This report does not exist or is not publicly shared.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-indigo-600" />
            <span className="text-xl font-semibold text-indigo-600">SocialTweebs</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-gray-500 mt-1">
            Competition Analysis Report • {report.dateRangeStart} to {report.dateRangeEnd}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Brands</p>
            <p className="text-2xl font-bold text-gray-900">{report.totalBrands}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Influencers</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalInfluencers)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Posts</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalPosts)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Likes</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalLikes)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Views</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalViews)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Comments</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalComments)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Shares</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(report.totalShares)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Avg ER</p>
            <p className="text-2xl font-bold text-indigo-600">
              {report.avgEngagementRate?.toFixed(2) || '0'}%
            </p>
          </div>
        </div>

        {/* Brand Comparison Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Influencers</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Posts</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Likes</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Eng Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: brand.displayColor }}
                        />
                        <span className="font-medium text-gray-900">{brand.brandName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {brand.hashtags?.map(h => (
                          <span key={h} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{h}</span>
                        ))}
                        {brand.username && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{brand.username}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm">{brand.influencerCount}</td>
                    <td className="px-4 py-3 text-right text-sm">{brand.postsCount}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatNumber(brand.totalLikes)}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatNumber(brand.totalViews)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-indigo-600">
                      {brand.avgEngagementRate?.toFixed(2) || '0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Post Type Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Post Type Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.postTypeBreakdown.map((breakdown: any) => (
              <div key={breakdown.brandId} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-3">{breakdown.brandName}</p>
                <div className="space-y-2">
                  {[
                    { label: 'Photo', value: breakdown.photoPercentage, color: '#3b82f6' },
                    { label: 'Video', value: breakdown.videoPercentage, color: '#ef4444' },
                    { label: 'Carousel', value: breakdown.carouselPercentage, color: '#10b981' },
                    { label: 'Reel', value: breakdown.reelPercentage, color: '#f97316' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-20 text-xs text-gray-500">{item.label}</div>
                      <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.value}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                      <div className="w-12 text-xs text-right text-gray-500">{item.value.toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-8">
          <p>Generated by SocialTweebs • Competition Analysis Report</p>
        </div>
      </div>
    </div>
  );
};

export default CompetitionAnalysisSharedPage;
