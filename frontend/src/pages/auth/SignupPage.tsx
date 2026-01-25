import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, Mail, Lock, User, Phone, Building, ArrowRight, Check } from 'lucide-react';
import { authApi } from '../../services/api';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    businessName: '',
    campaignFrequency: '' as '' | '10-100' | '100-1000' | '1000+',
    message: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName,
        campaignFrequency: formData.campaignFrequency as '10-100' | '100-1000' | '1000+',
        message: formData.message || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gray-50 p-4 sm:p-8 safe-top safe-bottom">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Registration Successful!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Thank you for signing up! Our team will review your application and contact you shortly. 
            You'll receive an email once your account is activated.
          </p>
          <Link to="/login" className="btn btn-primary w-full sm:w-auto px-6">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 xl:w-12 xl:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 xl:w-7 xl:h-7 text-white" />
            </div>
            <span className="text-xl xl:text-2xl font-bold text-white">SocialTweebs</span>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-2xl xl:text-3xl font-bold text-white mb-4 xl:mb-6">
            Start Your Influencer Marketing Journey
          </h1>
          <p className="text-base xl:text-lg text-primary-100 mb-6 xl:mb-8">
            Join thousands of brands and agencies who trust SocialTweebs for their influencer campaigns.
          </p>
          
          {/* Benefits */}
          <div className="space-y-3 xl:space-y-4">
            {[
              'Access 100M+ influencer profiles',
              'Deep audience analytics',
              'Dedicated support team',
              'Flexible credit system',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 xl:w-6 xl:h-6 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 xl:w-4 xl:h-4 text-white" />
                </div>
                <span className="text-sm xl:text-base text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-xl p-4 xl:p-6">
          <p className="text-sm xl:text-base text-white/90 italic mb-3 xl:mb-4">
            "SocialTweebs has transformed how we discover and work with influencers."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 xl:w-10 xl:h-10 bg-white/20 rounded-full"></div>
            <div>
              <p className="text-sm xl:text-base text-white font-medium">Marketing Director</p>
              <p className="text-xs xl:text-sm text-primary-200">Fortune 500 Company</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50 overflow-y-auto safe-top safe-bottom">
        <div className="w-full max-w-lg py-4 sm:py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900">SocialTweebs</span>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-sm text-gray-500 mt-1 sm:mt-2">Fill in your details to get started</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-slideUp">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="label text-sm">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="input pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder="John Doe"
                    autoComplete="name"
                    autoCapitalize="words"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phoneNumber" className="label text-sm">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="input pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder="1234567890"
                    pattern="[0-9]{10,15}"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label text-sm">Business Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-9 sm:pl-10 text-sm sm:text-base"
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoCapitalize="none"
                  required
                />
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="label text-sm">Business Name *</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  className="input pl-9 sm:pl-10 text-sm sm:text-base"
                  placeholder="Your Company"
                  autoComplete="organization"
                  required
                />
              </div>
            </div>

            {/* Campaign Frequency */}
            <div>
              <label htmlFor="campaignFrequency" className="label text-sm">Yearly Campaign Frequency *</label>
              <select
                id="campaignFrequency"
                name="campaignFrequency"
                value={formData.campaignFrequency}
                onChange={handleChange}
                className="input text-sm sm:text-base"
                required
              >
                <option value="">Select frequency</option>
                <option value="10-100">10 - 100 campaigns</option>
                <option value="100-1000">100 - 1000 campaigns</option>
                <option value="1000+">1000+ campaigns</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="label text-sm">Message (Optional)</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="input min-h-[80px] sm:min-h-[100px] resize-none text-sm sm:text-base"
                placeholder="Tell us about your needs..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="label text-sm">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-9 sm:pl-10 pr-10 text-sm sm:text-base"
                    placeholder="Min 8 characters"
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="label text-sm">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input pl-9 sm:pl-10 text-sm sm:text-base"
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-0.5"
                required
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-gray-600">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-2.5 sm:py-3 text-sm sm:text-base"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </div>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6 sm:mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
