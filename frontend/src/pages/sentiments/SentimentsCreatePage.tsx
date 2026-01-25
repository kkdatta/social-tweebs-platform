import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, X, Instagram, AlertCircle, Loader,
  FileText, Users, Sparkles, CreditCard
} from 'lucide-react';
import { sentimentsApi } from '../../services/api';

export const SentimentsCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  
  // Form state
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<'INSTAGRAM' | 'TIKTOK'>('INSTAGRAM');
  const [reportType, setReportType] = useState<'POST' | 'PROFILE'>('POST');
  const [urls, setUrls] = useState<string[]>(['']);
  const [multipleQuery, setMultipleQuery] = useState(false);
  const [deepBrandAnalysis, setDeepBrandAnalysis] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandUsername, setBrandUsername] = useState('');
  const [productName, setProductName] = useState('');

  const addUrl = () => {
    if (multipleQuery && urls.length < 10) {
      setUrls([...urls, '']);
    }
  };

  const removeUrl = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index));
    }
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validUrls = urls.filter(url => url.trim());
    if (validUrls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    // Calculate credits
    const creditCost = validUrls.length;
    if (!confirm(`This will use ${creditCost} credit(s). Continue?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await sentimentsApi.create({
        title: title || undefined,
        reportType,
        platform,
        urls: validUrls,
        deepBrandAnalysis,
        brandName: deepBrandAnalysis ? brandName : undefined,
        brandUsername: deepBrandAnalysis ? brandUsername : undefined,
        productName: deepBrandAnalysis ? productName : undefined,
      });

      if (response.success) {
        navigate('/sentiments');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create report';
      // Check if error is related to insufficient credits
      if (errorMessage.toLowerCase().includes('credit') || errorMessage.toLowerCase().includes('insufficient')) {
        setCreditsNeeded(validUrls.length);
        setShowCreditsModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/sentiments')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Sentiment Report</h1>
        <p className="text-gray-600">Analyze sentiment from posts or profiles (1 credit per URL)</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Q1 Campaign Sentiment Analysis"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Platform
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlatform('INSTAGRAM')}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                platform === 'INSTAGRAM'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Instagram className="w-6 h-6" />
              <span className="font-medium">Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('TIKTOK')}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                platform === 'TIKTOK'
                  ? 'border-black bg-gray-100 text-gray-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="font-medium">TikTok</span>
            </button>
          </div>
        </div>

        {/* Report Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReportType('POST')}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                reportType === 'POST'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Post</span>
            </button>
            <button
              type="button"
              onClick={() => setReportType('PROFILE')}
              className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                reportType === 'PROFILE'
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="font-medium">Profile</span>
            </button>
          </div>
        </div>

        {/* Multiple Query Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-900">Multiple URLs</h4>
            <p className="text-sm text-gray-500">Add multiple URLs in a single report</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={multipleQuery}
              onChange={(e) => setMultipleQuery(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {/* URLs Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {reportType === 'POST' ? 'Post URL(s)' : 'Profile URL(s)'}
          </label>
          <div className="space-y-3">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => updateUrl(index, e.target.value)}
                  placeholder={reportType === 'POST' 
                    ? 'https://instagram.com/p/ABC123' 
                    : 'https://instagram.com/username'}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {urls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeUrl(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {multipleQuery && urls.length < 10 && (
            <button
              type="button"
              onClick={addUrl}
              className="mt-3 flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Another URL
            </button>
          )}
        </div>

        {/* Deep Brand Analysis (only for POST type) */}
        {reportType === 'POST' && (
          <>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Deep Brand Analysis</h4>
                </div>
                <p className="text-sm text-gray-500 mt-1">Enable advanced brand-related sentiment analysis</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={deepBrandAnalysis}
                  onChange={(e) => setDeepBrandAnalysis(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {deepBrandAnalysis && (
              <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-purple-50/30">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g., Nike"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand Username
                  </label>
                  <input
                    type="text"
                    value={brandUsername}
                    onChange={(e) => setBrandUsername(e.target.value)}
                    placeholder="e.g., @nike"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Air Max 90"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Credit Cost Info */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">
              Credit Cost: {urls.filter(u => u.trim()).length || 1} credit{(urls.filter(u => u.trim()).length || 1) > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-amber-700 mt-1">1 credit is required per URL analyzed</p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/sentiments')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Report
              </>
            )}
          </button>
        </div>
      </form>

      {/* Insufficient Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Insufficient Credits</h3>
              <p className="text-gray-600 mb-4">
                You don't have enough credits to create this report. 
                You need <span className="font-semibold text-purple-600">{creditsNeeded} credit{creditsNeeded > 1 ? 's' : ''}</span> for this operation.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Please contact your administrator</strong> to get more credits allocated to your account.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => navigate('/credits')}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  View Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
