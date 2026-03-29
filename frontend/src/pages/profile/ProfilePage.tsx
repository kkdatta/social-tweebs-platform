import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Bell,
  Save,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { profileApi, creditsApi } from '../../services/api';
import type { ProfileData, NotificationPreferences } from '../../types';

type ActiveTab = 'overview' | 'personal' | 'password' | 'notifications';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [usageChart, setUsageChart] = useState<{ labels: string[]; credits: number[]; debits: number[] } | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(false);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // Personal info form
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification preferences
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsMessage, setPrefsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
    loadUsageChart();
  }, []);

  useEffect(() => {
    if (activeTab === 'notifications' && !preferences) {
      loadPreferences();
    }
  }, [activeTab]);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setNameInput(data.name || '');
      setPhoneInput(data.phone || '');
    } catch {
      // fallback to auth context
      if (user) {
        setNameInput(user.name || '');
        setPhoneInput(user.phone || '');
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const loadUsageChart = async () => {
    setIsLoadingChart(true);
    try {
      const data = await creditsApi.getUsageChart(30);
      setUsageChart(data);
    } catch {
      setUsageChart(null);
    } finally {
      setIsLoadingChart(false);
    }
  };

  const loadPreferences = async () => {
    setIsLoadingPrefs(true);
    try {
      const data = await profileApi.getPreferences();
      setPreferences(data);
    } catch {
      setPreferences({
        notifyDiscoveryExport: true,
        notifyCollabExport: true,
        notifyOverlapReport: true,
        notifyContentDiscovery: true,
        notifyGroupImport: true,
        notifyCampaignImport: true,
        notifyReportShared: true,
      });
    } finally {
      setIsLoadingPrefs(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      await profileApi.updateProfile({ name: nameInput, phone: phoneInput });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      if (user) {
        updateUser({ ...user, name: nameInput, phone: phoneInput });
      }
      loadProfile();
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleTogglePreference = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    setIsSavingPrefs(true);
    setPrefsMessage(null);
    try {
      await profileApi.updatePreferences({ [key]: updated[key] });
      setPrefsMessage({ type: 'success', text: 'Preference updated.' });
    } catch {
      setPreferences({ ...preferences });
      setPrefsMessage({ type: 'error', text: 'Failed to update preference.' });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const totalCredits = usageChart?.credits.reduce((sum, v) => sum + v, 0) || 0;
  const totalDebits = usageChart?.debits.reduce((sum, v) => sum + v, 0) || 0;
  const maxChartVal = usageChart
    ? Math.max(...usageChart.credits, ...usageChart.debits, 1)
    : 1;

  const tabs: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  const NOTIFICATION_LABELS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
    { key: 'notifyDiscoveryExport', label: 'Influencer Discovery Export', description: 'Get notified when influencer discovery exports are ready' },
    { key: 'notifyCollabExport', label: 'Paid Collaboration Export', description: 'Get notified when paid collaboration exports are ready' },
    { key: 'notifyOverlapReport', label: 'Audience Overlap Report', description: 'Get notified when audience overlap reports are generated' },
    { key: 'notifyContentDiscovery', label: 'Content Discovery Report', description: 'Get notified about content discovery report updates' },
    { key: 'notifyGroupImport', label: 'Influencer Group Import', description: 'Get notified when influencer group imports complete' },
    { key: 'notifyCampaignImport', label: 'Campaign Tracking Import', description: 'Get notified when campaign tracking imports complete' },
    { key: 'notifyReportShared', label: 'Report Shared With You', description: 'Get notified when someone shares a report with you' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account, preferences, and security settings.</p>
      </div>

      {/* Profile Summary Card */}
      {!isLoadingProfile && profile && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">{profile.name}</h2>
              <p className="text-sm text-gray-500 truncate">{profile.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                  {profile.role?.replace('_', ' ')}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="text-right">
                <p className="text-xs text-gray-500">Credit Balance</p>
                <p className="text-xl font-bold text-amber-600">{profile.creditBalance?.toFixed(2)}</p>
              </div>
              {profile.daysRemaining !== undefined && (
                <p className={`text-xs ${profile.daysRemaining <= 7 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {profile.daysRemaining > 0
                    ? `${profile.daysRemaining} day${profile.daysRemaining !== 1 ? 's' : ''} remaining`
                    : 'Account expired'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab - Credit Usage Chart */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Credit Usage (Last 30 Days)</h3>
                  <p className="text-sm text-gray-500">Your credit activity for the past month</p>
                </div>
                <button
                  onClick={loadUsageChart}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Refresh chart"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingChart ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Credits Added</span>
                  </div>
                  <p className="text-2xl font-bold text-green-800 mt-2">{totalCredits.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-700">Credits Used</span>
                  </div>
                  <p className="text-2xl font-bold text-red-800 mt-2">{totalDebits.toFixed(2)}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">Current Balance</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-800 mt-2">
                    {profile?.creditBalance?.toFixed(2) || user?.credits?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              {/* Bar Chart */}
              {isLoadingChart ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                </div>
              ) : usageChart && usageChart.labels.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-green-500" />
                      <span className="text-xs text-gray-600">Credits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-red-400" />
                      <span className="text-xs text-gray-600">Debits</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <div className="flex items-end gap-1 min-w-[600px] h-48">
                      {usageChart.labels.map((label, i) => (
                        <div key={label} className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex items-end gap-0.5 h-40 w-full justify-center">
                            <div
                              className="w-3 bg-green-500 rounded-t-sm transition-all hover:opacity-80"
                              style={{ height: `${(usageChart.credits[i] / maxChartVal) * 100}%`, minHeight: usageChart.credits[i] > 0 ? '4px' : '0' }}
                              title={`Credits: ${usageChart.credits[i].toFixed(2)}`}
                            />
                            <div
                              className="w-3 bg-red-400 rounded-t-sm transition-all hover:opacity-80"
                              style={{ height: `${(usageChart.debits[i] / maxChartVal) * 100}%`, minHeight: usageChart.debits[i] > 0 ? '4px' : '0' }}
                              title={`Debits: ${usageChart.debits[i].toFixed(2)}`}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 truncate w-full text-center">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="font-medium">No usage data available</p>
                  <p className="text-sm mt-1">Credit usage will appear here once you start using the platform.</p>
                </div>
              )}
            </div>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <p className="text-sm text-gray-500 mt-1">Update your name and phone number.</p>
              </div>

              {profileMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {profileMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={profile?.businessName || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <input
                  type="text"
                  value={profile?.role?.replace('_', ' ') || user?.role?.replace('_', ' ') || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">Ensure your account is using a secure password.</p>
              </div>

              {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {passwordMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passwordMessage.text}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Re-enter new password"
                  required
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Change Password
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500 mt-1">Choose which email notifications you'd like to receive.</p>
              </div>

              {prefsMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  prefsMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {prefsMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {prefsMessage.text}
                </div>
              )}

              {isLoadingPrefs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                </div>
              ) : preferences ? (
                <div className="space-y-1">
                  {NOTIFICATION_LABELS.map(({ key, label, description }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-medium text-gray-900">{label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={preferences[key]}
                        onClick={() => handleTogglePreference(key)}
                        disabled={isSavingPrefs}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shrink-0 ${
                          preferences[key] ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
