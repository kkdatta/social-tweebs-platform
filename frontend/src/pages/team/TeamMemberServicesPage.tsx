import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { teamApi } from '../../services/api';

const FEATURE_OPTIONS = [
  { value: 'INFLUENCER_DISCOVERY', label: 'Influencer Discovery' },
  { value: 'INFLUENCER_INSIGHTS', label: 'Influencer Insights' },
  { value: 'PAID_COLLABORATION', label: 'Paid Collaboration' },
  { value: 'AUDIENCE_OVERLAP', label: 'Audience Overlap' },
  { value: 'INFLUENCER_TIE_BREAKER', label: 'Influencer Tie Breaker' },
  { value: 'PAID_COMPARISON', label: 'Paid Comparison' },
  { value: 'CUSTOM_ER_CALCULATOR', label: 'Custom ER Calculator' },
  { value: 'SOCIAL_SENTIMENTS', label: 'Social Sentiments' },
  { value: 'INFLUENCER_COLLAB_CHECK', label: 'Influencer Collab Check' },
  { value: 'MENTION_TRACKING', label: 'Mention Tracking' },
  { value: 'CAMPAIGN_TRACKING', label: 'Campaign Tracking' },
  { value: 'INFLUENCERS_GROUP', label: 'Influencers Group' },
  { value: 'COMPETITION_ANALYSIS', label: 'Competition Analysis' },
];

const ACTION_OPTIONS = [
  { value: 'EXCEL_REPORT_DOWNLOAD', label: 'Excel Report Download (for Insights)' },
  { value: 'CRM_INVITE_FORM', label: 'CRM Invite Form Access' },
];

const TeamMemberServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<any>(null);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [actions, setActions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  const loadData = async (memberId: string) => {
    try {
      setLoading(true);
      const [memberData, featureData, actionData] = await Promise.all([
        teamApi.getMember(memberId),
        teamApi.getFeatures(memberId),
        teamApi.getActions(memberId),
      ]);
      setMember(memberData);

      const featMap: Record<string, boolean> = {};
      featureData.forEach((f: any) => { featMap[f.featureName] = f.isEnabled; });
      setFeatures(featMap);

      const actMap: Record<string, boolean> = {};
      actionData.forEach((a: any) => { actMap[a.actionName] = a.isEnabled; });
      setActions(actMap);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member services');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await Promise.all([
        teamApi.updateFeatures(id, FEATURE_OPTIONS.map(f => ({
          featureName: f.value,
          isEnabled: features[f.value] || false,
        }))),
        teamApi.updateActions(id, ACTION_OPTIONS.map(a => ({
          actionName: a.value,
          isEnabled: actions[a.value] || false,
        }))),
      ]);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update services');
    } finally {
      setSaving(false);
    }
  };

  const toggleAllFeatures = () => {
    const allEnabled = FEATURE_OPTIONS.every(f => features[f.value]);
    const updated: Record<string, boolean> = {};
    FEATURE_OPTIONS.forEach(f => { updated[f.value] = !allEnabled; });
    setFeatures(updated);
  };

  const enabledCount = FEATURE_OPTIONS.filter(f => features[f.value]).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/team')} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Manage Services
              </h1>
              {member && (
                <p className="text-sm text-gray-500 mt-1">
                  {member.name} ({member.email})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">Services updated successfully!</p>
          </div>
        )}

        {/* Feature Access */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Feature Access</h3>
              <p className="text-sm text-gray-500 mt-1">{enabledCount} of {FEATURE_OPTIONS.length} features enabled</p>
            </div>
            <button type="button" onClick={toggleAllFeatures} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
              {enabledCount === FEATURE_OPTIONS.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURE_OPTIONS.map((feature) => (
              <label
                key={feature.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  features[feature.value]
                    ? 'border-purple-300 bg-purple-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={features[feature.value] || false}
                  onChange={() => setFeatures(prev => ({ ...prev, [feature.value]: !prev[feature.value] }))}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{feature.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Action Permissions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Permissions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACTION_OPTIONS.map((action) => (
              <label
                key={action.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  actions[action.value]
                    ? 'border-purple-300 bg-purple-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={actions[action.value] || false}
                  onChange={() => setActions(prev => ({ ...prev, [action.value]: !prev[action.value] }))}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{action.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <button onClick={() => navigate('/team')} className="px-6 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberServicesPage;
