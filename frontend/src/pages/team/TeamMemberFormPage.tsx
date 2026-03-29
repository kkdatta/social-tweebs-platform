import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  UserPlus,
  Edit,
} from 'lucide-react';
import { teamApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'Client (External User)', description: 'Becomes an Admin user' },
  { value: 'BUSINESS_TEAM', label: 'Business Team (Internal)', description: 'Internal sub-user' },
  { value: 'FINANCE_TEAM', label: 'Finance Team (Internal)', description: 'Internal sub-user' },
  { value: 'SALES_TEAM', label: 'Sales Team (Internal)', description: 'Internal sub-user' },
  { value: 'SUPPORT_TEAM', label: 'Support Team (Internal)', description: 'Internal sub-user' },
  { value: 'TECHNICAL_TEAM', label: 'Technical Team (Internal)', description: 'Internal sub-user' },
];

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

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'Singapore', 'UAE',
  'Saudi Arabia', 'Brazil', 'South Africa', 'Indonesia', 'Other',
];

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  roleType: string;
  validityStart: string;
  validityEnd: string;
  validityNotificationEnabled: boolean;
  enabledFeatures: string[];
  enabledActions: string[];
  initialCredits: number;
  creditComment: string;
}

const TeamMemberFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEdit = !!id;

  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    roleType: '',
    validityStart: '',
    validityEnd: '',
    validityNotificationEnabled: true,
    enabledFeatures: [],
    enabledActions: [],
    initialCredits: 0,
    creditComment: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [memberFeatures, setMemberFeatures] = useState<{ featureName: string; isEnabled: boolean }[]>([]);
  const [memberActions, setMemberActions] = useState<{ actionName: string; isEnabled: boolean }[]>([]);

  // Admin users can't assign CLIENT role
  const filteredRoles = user?.role === 'ADMIN'
    ? ROLE_OPTIONS.filter(r => r.value !== 'CLIENT')
    : ROLE_OPTIONS;

  useEffect(() => {
    if (isEdit && id) {
      loadMember(id);
    }
  }, [id]);

  const loadMember = async (memberId: string) => {
    try {
      setFetchLoading(true);
      const [member, features, actions] = await Promise.all([
        teamApi.getMember(memberId),
        teamApi.getFeatures(memberId),
        teamApi.getActions(memberId),
      ]);

      setForm({
        name: member.name || '',
        email: member.email || '',
        password: '',
        phone: member.phone || '',
        country: member.country || '',
        roleType: member.internalRoleType || '',
        validityStart: member.validityStart ? new Date(member.validityStart).toISOString().split('T')[0] : '',
        validityEnd: member.validityEnd ? new Date(member.validityEnd).toISOString().split('T')[0] : '',
        validityNotificationEnabled: true,
        enabledFeatures: features.filter((f: any) => f.isEnabled).map((f: any) => f.featureName),
        enabledActions: actions.filter((a: any) => a.isEnabled).map((a: any) => a.actionName),
        initialCredits: 0,
        creditComment: '',
      });
      setMemberFeatures(features);
      setMemberActions(actions);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load member details');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.roleType || !form.validityStart || !form.validityEnd) {
      setError('Please fill in all mandatory fields');
      return;
    }

    if (!isEdit && !form.email) {
      setError('Email is required');
      return;
    }

    if (!isEdit && (!form.password || form.password.length < 8)) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        await teamApi.updateMember(id, {
          name: form.name,
          phone: form.phone,
          country: form.country,
          roleType: form.roleType,
          validityStart: form.validityStart,
          validityEnd: form.validityEnd,
          validityNotificationEnabled: form.validityNotificationEnabled,
        });

        await teamApi.updateFeatures(id, FEATURE_OPTIONS.map(f => ({
          featureName: f.value,
          isEnabled: form.enabledFeatures.includes(f.value),
        })));

        await teamApi.updateActions(id, ACTION_OPTIONS.map(a => ({
          actionName: a.value,
          isEnabled: form.enabledActions.includes(a.value),
        })));
      } else {
        await teamApi.createMember({
          name: form.name,
          email: form.email,
          password: form.password,
          roleType: form.roleType as any,
          validityStart: form.validityStart,
          validityEnd: form.validityEnd,
          phone: form.phone || undefined,
          country: form.country || undefined,
          enabledFeatures: form.enabledFeatures,
          enabledActions: form.enabledActions,
          initialCredits: form.initialCredits || undefined,
          creditComment: form.creditComment || undefined,
          validityNotificationEnabled: form.validityNotificationEnabled,
        });
      }

      navigate('/team');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} member`);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = (feature: string) => {
    setForm(prev => ({
      ...prev,
      enabledFeatures: prev.enabledFeatures.includes(feature)
        ? prev.enabledFeatures.filter(f => f !== feature)
        : [...prev.enabledFeatures, feature],
    }));
  };

  const toggleAction = (action: string) => {
    setForm(prev => ({
      ...prev,
      enabledActions: prev.enabledActions.includes(action)
        ? prev.enabledActions.filter(a => a !== action)
        : [...prev.enabledActions, action],
    }));
  };

  const toggleAllFeatures = () => {
    if (form.enabledFeatures.length === FEATURE_OPTIONS.length) {
      setForm(prev => ({ ...prev, enabledFeatures: [] }));
    } else {
      setForm(prev => ({ ...prev, enabledFeatures: FEATURE_OPTIONS.map(f => f.value) }));
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/team')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                {isEdit ? <Edit className="w-6 h-6 text-purple-600" /> : <UserPlus className="w-6 h-6 text-purple-600" />}
                {isEdit ? 'Edit Member' : 'Add New Member'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isEdit ? 'Update member details and permissions' : 'Create a new team member account'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="user@example.com"
                  disabled={isEdit}
                  required={!isEdit}
                />
                {isEdit && <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>}
              </div>

              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Min 8 characters"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No.</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={form.country}
                  onChange={(e) => setForm(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.roleType}
                  onChange={(e) => setForm(prev => ({ ...prev, roleType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Select role</option>
                  {filteredRoles.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                {form.roleType && (
                  <p className="text-xs text-gray-400 mt-1">
                    {ROLE_OPTIONS.find(r => r.value === form.roleType)?.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Access Validity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Access Validity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.validityStart}
                  onChange={(e) => setForm(prev => ({ ...prev, validityStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.validityEnd}
                  onChange={(e) => setForm(prev => ({ ...prev, validityEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  min={form.validityStart}
                  required
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="notification"
                checked={form.validityNotificationEnabled}
                onChange={(e) => setForm(prev => ({ ...prev, validityNotificationEnabled: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="notification" className="text-sm text-gray-700">
                Enable expiration notifications (2-5 days before expiry)
              </label>
            </div>
          </div>

          {/* Allowed Services */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Allowed Services</h3>
              <button
                type="button"
                onClick={toggleAllFeatures}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {form.enabledFeatures.length === FEATURE_OPTIONS.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">Enable or disable platform features for this member</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURE_OPTIONS.map((feature) => (
                <label
                  key={feature.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.enabledFeatures.includes(feature.value)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.enabledFeatures.includes(feature.value)}
                    onChange={() => toggleFeature(feature.value)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Allowed Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACTION_OPTIONS.map((action) => (
                <label
                  key={action.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.enabledActions.includes(action.value)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.enabledActions.includes(action.value)}
                    onChange={() => toggleAction(action.value)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Manage Credits (only for new member or via separate page for edit) */}
          {!isEdit && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Initial Credits</h3>
              <p className="text-sm text-gray-500 mb-4">
                Allocate initial credits to this member. {user?.role === 'ADMIN' && 'Credits will be deducted from your balance.'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credit Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.initialCredits}
                    onChange={(e) => setForm(prev => ({ ...prev, initialCredits: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <input
                    type="text"
                    value={form.creditComment}
                    onChange={(e) => setForm(prev => ({ ...prev, creditComment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Initial credit allocation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pb-6">
            <button
              type="button"
              onClick={() => navigate('/team')}
              className="px-6 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Member' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamMemberFormPage;
