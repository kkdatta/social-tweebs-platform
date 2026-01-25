import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader } from 'lucide-react';
import { campaignsApi } from '../../services/api';

const PLATFORMS = ['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'MULTI'];
const OBJECTIVES = [
  { value: 'BRAND_AWARENESS', label: 'Brand Awareness' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'CONVERSIONS', label: 'Conversions' },
  { value: 'REACH', label: 'Reach' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'SALES', label: 'Sales' },
];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

export const CampaignFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    platform: 'INSTAGRAM',
    objective: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'INR',
    hashtags: '',
    mentions: '',
  });

  useEffect(() => {
    if (isEditing) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await campaignsApi.getById(id!);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        platform: data.platform || 'INSTAGRAM',
        objective: data.objective || '',
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        budget: data.budget?.toString() || '',
        currency: data.currency || 'INR',
        hashtags: data.hashtags?.join(', ') || '',
        mentions: data.mentions?.join(', ') || '',
      });
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        platform: formData.platform,
        objective: formData.objective || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        currency: formData.currency,
        hashtags: formData.hashtags ? formData.hashtags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        mentions: formData.mentions ? formData.mentions.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      };

      if (isEditing) {
        await campaignsApi.update(id!, payload);
      } else {
        const result = await campaignsApi.create(payload);
        navigate(`/campaigns/${result.campaign.id}`);
        return;
      }

      navigate(`/campaigns/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isEditing ? `/campaigns/${id}` : '/campaigns')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Campaign' : 'Create Campaign'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Update campaign details' : 'Set up a new influencer marketing campaign'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Summer Fashion Collection 2026"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Describe the campaign objectives and key details..."
              />
            </div>

            {/* Platform & Objective */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
                  Platform <span className="text-red-500">*</span>
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {PLATFORMS.map(platform => (
                    <option key={platform} value={platform}>{platform}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-1">
                  Objective
                </label>
                <select
                  id="objective"
                  name="objective"
                  value={formData.objective}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select objective...</option>
                  {OBJECTIVES.map(obj => (
                    <option key={obj.value} value={obj.value}>{obj.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Schedule & Budget</h2>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Budget */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g., 500000"
                />
              </div>
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Tracking</h2>

            {/* Hashtags */}
            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-1">
                Hashtags
              </label>
              <input
                type="text"
                id="hashtags"
                name="hashtags"
                value={formData.hashtags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., #BrandName, #CampaignName (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter hashtags separated by commas</p>
            </div>

            {/* Mentions */}
            <div>
              <label htmlFor="mentions" className="block text-sm font-medium text-gray-700 mb-1">
                Mentions
              </label>
              <input
                type="text"
                id="mentions"
                name="mentions"
                value={formData.mentions}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., @brandofficial, @campaignhandle (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Enter @ mentions separated by commas</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(isEditing ? `/campaigns/${id}` : '/campaigns')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {isEditing ? 'Update Campaign' : 'Create Campaign'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignFormPage;
