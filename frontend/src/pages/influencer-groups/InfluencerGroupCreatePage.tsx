import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, Youtube, Check } from 'lucide-react';
import { influencerGroupsApi } from '../../services/api';

const PLATFORMS = [
  { id: 'INSTAGRAM', name: 'Instagram', icon: Instagram, color: 'pink' },
  { id: 'YOUTUBE', name: 'YouTube', icon: Youtube, color: 'red' },
  { id: 'TIKTOK', name: 'TikTok', icon: null, color: 'black' },
];

export const InfluencerGroupCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    setLoading(true);
    try {
      const response = await influencerGroupsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        platforms: selectedPlatforms,
      });
      navigate(`/influencer-groups/${response.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/influencer-groups')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Groups
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Create New Group</h1>
        <p className="text-sm text-gray-600 mt-1">
          Create a group to organize your influencers for campaigns
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Group Name */}
        <div className="mb-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Group Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Fashion Influencers Q1 2026"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
            maxLength={255}
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the group's purpose..."
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm sm:text-base"
          />
        </div>

        {/* Platform Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platforms <span className="text-red-500">*</span>
          </label>
          <p className="text-xs sm:text-sm text-gray-500 mb-3">
            Select the platforms from which influencers can be added to this group
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {PLATFORMS.map((platform) => {
              const isSelected = selectedPlatforms.includes(platform.id);
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`relative flex flex-col items-center justify-center p-3 sm:p-4 border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2">
                      <Check className="w-3 sm:w-4 h-3 sm:h-4 text-indigo-600" />
                    </div>
                  )}
                  {Icon ? (
                    <Icon
                      className={`w-6 sm:w-8 h-6 sm:h-8 ${
                        platform.color === 'pink'
                          ? 'text-pink-500'
                          : platform.color === 'red'
                          ? 'text-red-500'
                          : 'text-black'
                      }`}
                    />
                  ) : (
                    <span className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center text-base sm:text-xl font-bold text-black">
                      TT
                    </span>
                  )}
                  <span className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-gray-900">
                    {platform.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/influencer-groups')}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InfluencerGroupCreatePage;
