import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, Trash2, Eye, Scale,
  CheckCircle, Clock, AlertCircle, Loader,
  Instagram, Youtube, Music
} from 'lucide-react';
import { tieBreakerApi } from '../../services/api';

interface Influencer {
  id: string;
  influencerName: string;
  influencerUsername?: string;
  profilePictureUrl?: string;
  followerCount: number;
  engagementRate: number;
}

interface Comparison {
  id: string;
  title: string;
  platform: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  influencerCount: number;
  influencers: Influencer[];
  createdAt: string;
  createdById: string;
  creditsUsed: number;
}

interface DashboardStats {
  totalComparisons: number;
  completedComparisons: number;
  pendingComparisons: number;
  processingComparisons: number;
  failedComparisons: number;
  comparisonsThisMonth: number;
  totalInfluencersCompared: number;
  totalCreditsUsed: number;
}

export const TieBreakerListPage = () => {
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [platform, setPlatform] = useState('ALL');
  const [status, setStatus] = useState('');
  const [createdBy, setCreatedBy] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  }, [platform, status, createdBy, page]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [comparisonsData, statsData] = await Promise.all([
        tieBreakerApi.list({
          platform: platform !== 'ALL' ? platform : undefined,
          status: status || undefined,
          createdBy,
          search: search || undefined,
          page,
          limit: 10,
        }),
        tieBreakerApi.getDashboard(),
      ]);
      setComparisons(comparisonsData.comparisons);
      setTotal(comparisonsData.total);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await tieBreakerApi.delete(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete comparison');
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
      COMPLETED: <CheckCircle className="w-3 h-3" />,
      PROCESSING: <Loader className="w-3 h-3 animate-spin" />,
      PENDING: <Clock className="w-3 h-3" />,
      FAILED: <AlertCircle className="w-3 h-3" />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'YOUTUBE':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'TIKTOK':
        return <Music className="w-5 h-5 text-black" />;
      default:
        return <Scale className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Influencer Tie Breaker</h1>
          <p className="text-sm text-gray-600 hidden sm:block">Compare up to 3 influencers side by side</p>
        </div>
        <button
          onClick={() => navigate('/tie-breaker/new')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          New Comparison
        </button>
      </div>

      {/* Credit Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-blue-800">
        <strong>Credit Info:</strong> 1 credit per influencer for unblurred profiles. 
        <span className="hidden sm:inline"> Already unlocked influencers are free to compare.</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalComparisons}</div>
            <div className="text-xs sm:text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedComparisons}</div>
            <div className="text-xs sm:text-sm text-gray-500">Completed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.processingComparisons}</div>
            <div className="text-xs sm:text-sm text-gray-500">Processing</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingComparisons}</div>
            <div className="text-xs sm:text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden sm:block">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.failedComparisons}</div>
            <div className="text-xs sm:text-sm text-gray-500">Failed</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm hidden sm:block">
            <div className="text-2xl font-bold text-purple-600">{stats.comparisonsThisMonth}</div>
            <div className="text-sm text-gray-500">This Month</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalInfluencersCompared}</div>
            <div className="text-sm text-gray-500">Influencers</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">{stats.totalCreditsUsed}</div>
            <div className="text-sm text-gray-500">Credits Used</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TIKTOK">TikTok</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Comparisons</option>
            <option value="ME">Created by Me</option>
            <option value="TEAM">Team Comparisons</option>
          </select>

          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search comparisons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Search
          </button>
        </div>
      </div>

      {/* Comparisons Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : comparisons.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Scale className="w-12 h-12 mb-4 text-gray-300" />
            <p>No comparisons found</p>
            <button
              onClick={() => navigate('/tie-breaker/new')}
              className="mt-4 text-purple-600 hover:text-purple-700"
            >
              Create your first comparison
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comparison</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influencers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {comparisons.map((comparison) => (
                <tr key={comparison.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    {getPlatformIcon(comparison.platform)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{comparison.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {comparison.influencers.slice(0, 3).map((inf, idx) => (
                          <img
                            key={idx}
                            src={inf.profilePictureUrl || `https://ui-avatars.com/api/?name=${inf.influencerName}`}
                            alt={inf.influencerName}
                            className="w-8 h-8 rounded-full border-2 border-white"
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {comparison.influencers.map(inf => inf.influencerUsername || inf.influencerName).join(' vs ')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(comparison.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {comparison.creditsUsed} credits
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(comparison.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/tie-breaker/${comparison.id}`)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                        title="View Comparison"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(comparison.id, comparison.title)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} comparisons
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 border border-gray-200 rounded-lg text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
