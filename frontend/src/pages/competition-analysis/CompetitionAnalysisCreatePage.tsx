import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Hash,
  AtSign,
  Search,
  Calendar,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

interface BrandInput {
  id: string;
  brandName: string;
  hashtags: string;
  username: string;
  keywords: string;
}

const BRAND_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const CompetitionAnalysisCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM']);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [brands, setBrands] = useState<BrandInput[]>([
    { id: '1', brandName: '', hashtags: '', username: '', keywords: '' },
    { id: '2', brandName: '', hashtags: '', username: '', keywords: '' },
  ]);

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      if (platforms.length > 1) {
        setPlatforms(platforms.filter(p => p !== platform));
      }
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  const addBrand = () => {
    if (brands.length >= 5) return;
    setBrands([
      ...brands,
      { id: Date.now().toString(), brandName: '', hashtags: '', username: '', keywords: '' }
    ]);
  };

  const removeBrand = (id: string) => {
    if (brands.length <= 2) return;
    setBrands(brands.filter(b => b.id !== id));
  };

  const updateBrand = (id: string, field: keyof BrandInput, value: string) => {
    setBrands(brands.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const validateForm = (): string | null => {
    if (!dateRangeStart || !dateRangeEnd) {
      return 'Please select a date range';
    }
    if (new Date(dateRangeStart) > new Date(dateRangeEnd)) {
      return 'Start date must be before end date';
    }
    for (const brand of brands) {
      if (!brand.brandName.trim()) {
        return 'All brands must have a name';
      }
      if (!brand.hashtags.trim() && !brand.username.trim() && !brand.keywords.trim()) {
        return `Brand "${brand.brandName}" must have at least one of: hashtags, username, or keywords`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title || `Competition Report - ${new Date().toLocaleDateString()}`,
        platforms,
        dateRangeStart,
        dateRangeEnd,
        autoRefreshEnabled,
        brands: brands.map(b => ({
          brandName: b.brandName.trim(),
          hashtags: b.hashtags.split(',').map(h => h.trim()).filter(Boolean),
          username: b.username.trim() || undefined,
          keywords: b.keywords.split(',').map(k => k.trim()).filter(Boolean),
        })),
      };

      const response = await api.post('/competition-analysis', payload);
      navigate(`/competition-analysis/${response.data.report.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/competition-analysis')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Competition Report</h1>
          <p className="text-gray-500 mt-1">Compare 2-5 brands' influencer marketing performance</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Nike vs Adidas Q1 2024"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platforms
              </label>
              <div className="flex gap-3">
                {['INSTAGRAM', 'TIKTOK'].map((platform) => (
                  <button
                    key={platform}
                    type="button"
                    onClick={() => handlePlatformToggle(platform)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      platforms.includes(platform)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {platform === 'INSTAGRAM' ? 'Instagram' : 'TikTok'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="autoRefresh" className="text-sm text-gray-700">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Enable auto-refresh (track into the future daily)
              </label>
            </div>
          </div>
        </div>

        {/* Brands */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Brands to Compare</h2>
              <p className="text-sm text-gray-500">Add 2-5 brands to compare their influencer marketing</p>
            </div>
            {brands.length < 5 && (
              <button
                type="button"
                onClick={addBrand}
                className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Brand
              </button>
            )}
          </div>

          <div className="space-y-4">
            {brands.map((brand, index) => (
              <div
                key={brand.id}
                className="p-4 border border-gray-200 rounded-lg"
                style={{ borderLeftWidth: '4px', borderLeftColor: BRAND_COLORS[index] }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Brand {index + 1}</h3>
                  {brands.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeBrand(brand.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      value={brand.brandName}
                      onChange={(e) => updateBrand(brand.id, 'brandName', e.target.value)}
                      placeholder="e.g., Nike"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Hash className="w-3.5 h-3.5 inline mr-1" />
                      Hashtags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={brand.hashtags}
                      onChange={(e) => updateBrand(brand.id, 'hashtags', e.target.value)}
                      placeholder="e.g., #nike, #justdoit"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <AtSign className="w-3.5 h-3.5 inline mr-1" />
                      Username (@mention)
                    </label>
                    <input
                      type="text"
                      value={brand.username}
                      onChange={(e) => updateBrand(brand.id, 'username', e.target.value)}
                      placeholder="e.g., @nike"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Search className="w-3.5 h-3.5 inline mr-1" />
                      Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={brand.keywords}
                      onChange={(e) => updateBrand(brand.id, 'keywords', e.target.value)}
                      placeholder="e.g., nike shoes, air jordan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Credit Usage</p>
              <p className="text-sm text-amber-700">
                Creating this report will use 1 credit from your account.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/competition-analysis')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating Report...' : 'Create Report (1 Credit)'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompetitionAnalysisCreatePage;
