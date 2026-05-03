import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader, AlertTriangle, Upload, Image } from 'lucide-react';
import { campaignsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'LINKEDIN', label: 'LinkedIn (Phase-2)' },
  { value: 'MULTI', label: 'Multi-Platform' },
];
const OBJECTIVES = [
  { value: 'BRAND_AWARENESS', label: 'Brand Awareness' },
  { value: 'ENGAGEMENT', label: 'Engagement' },
  { value: 'CONVERSIONS', label: 'Conversions' },
  { value: 'REACH', label: 'Reach' },
  { value: 'TRAFFIC', label: 'Traffic' },
  { value: 'SALES', label: 'Sales' },
];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];
const MIN_CREDITS_REQUIRED = 5;

export const CampaignFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditWarning, setCreditWarning] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['INSTAGRAM']);
  const [logoMode, setLogoMode] = useState<'url' | 'upload'>('url');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: '',
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
    } else {
      checkCredits();
    }
  }, [id]);

  const checkCredits = async () => {
    try {
      const notification = await campaignsApi.getCreditNotification();
      if (notification.balance < MIN_CREDITS_REQUIRED) {
        setCreditWarning(`You need at least ${MIN_CREDITS_REQUIRED} credits to create a campaign. Current balance: ${notification.balance} credits.`);
      }
    } catch (err) {
      // Silently handle
    }
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform];
      if (next.length === 0) return prev;
      setFormData(f => ({ ...f, platform: next.length > 1 ? 'MULTI' : next[0] }));
      return next;
    });
  };

  const loadCampaign = async () => {
    try {
      setLoading(true);
      const data = await campaignsApi.getById(id!);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        logoUrl: data.logoUrl || '',
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

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, GIF, or WebP)');
      e.target.value = '';
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setLocalLogoPreview(previewUrl);
    try {
      setUploadingLogo(true);
      setError(null);
      const result = await campaignsApi.uploadLogo(file);
      const url = result.logoUrl || result.path;
      setFormData(prev => ({ ...prev, logoUrl: url }));
      URL.revokeObjectURL(previewUrl);
      setLocalLogoPreview(null);
    } catch (err: any) {
      URL.revokeObjectURL(previewUrl);
      setLocalLogoPreview(null);
      setError(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    if (!formData.hashtags?.trim()) {
      setError('At least one hashtag is required to track the campaign');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Start date and end date are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        logoUrl: formData.logoUrl || undefined,
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
          {creditWarning && !isEditing && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertTriangle size={20} className="shrink-0" />
              <div>
                <p className="font-medium">Insufficient Credits</p>
                <p className="text-sm">{creditWarning}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              Creating a campaign requires <strong>1 credit</strong>. You must have at least <strong>{MIN_CREDITS_REQUIRED} credits</strong> in your account.
              {user && <span className="ml-1">Current balance: <strong>{(user as any)?.credits || 0}</strong> credits.</span>}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

            {/* Campaign Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Logo</label>
              <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit mb-3">
                <button
                  type="button"
                  onClick={() => setLogoMode('url')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    logoMode === 'url' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setLogoMode('upload')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    logoMode === 'upload' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Upload size={14} />
                  Upload
                </button>
              </div>
              <div className="flex items-start gap-4">
                {(localLogoPreview || formData.logoUrl) ? (
                  <img
                    src={localLogoPreview || formData.logoUrl}
                    alt="Logo"
                    className="w-20 h-20 rounded-lg object-cover border shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center shrink-0">
                    <Image size={28} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  {logoMode === 'url' ? (
                    <>
                      <input
                        type="url"
                        name="logoUrl"
                        value={formData.logoUrl}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="https://example.com/logo.png"
                      />
                      <p className="text-xs text-gray-500">Paste a public image URL for the campaign logo</p>
                    </>
                  ) : (
                    <>
                      <label className="flex flex-col items-start gap-2">
                        <span className="text-xs text-gray-600">Choose an image from your device</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleLogoFileChange}
                          disabled={uploadingLogo}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                      </label>
                      {uploadingLogo && (
                        <p className="text-xs text-purple-600 flex items-center gap-2">
                          <Loader className="animate-spin w-4 h-4" /> Uploading…
                        </p>
                      )}
                      <p className="text-xs text-gray-500">JPEG, PNG, GIF, or WebP, up to 5 MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

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

            {/* Platform Selection (Multi-select) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform (Social Networks) <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.filter(p => p.value !== 'MULTI').map(platform => (
                  <button
                    key={platform.value}
                    type="button"
                    onClick={() => handlePlatformToggle(platform.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedPlatforms.includes(platform.value)
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Select one or multiple platforms for this campaign</p>
            </div>

            {/* Objective */}
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Schedule & Budget</h2>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
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
                  End Date <span className="text-red-500">*</span>
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
                Hashtags <span className="text-red-500">*</span>
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
              disabled={saving || (!!creditWarning && !isEditing)}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
