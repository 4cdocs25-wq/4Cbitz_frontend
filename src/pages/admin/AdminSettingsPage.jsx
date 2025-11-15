import React, { useState, useEffect } from 'react';
import { authAPI, settingsAPI } from '../../api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const AdminSettingsPage = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('security');

  // Policy management state
  const [policyData, setPolicyData] = useState({
    termsOfService: '',
    privacyPolicy: ''
  });
  const [termsLoading, setTermsLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [policyMessage, setPolicyMessage] = useState({ type: '', text: '' });

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordData.password.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.setAdminPassword(
        passwordData.password,
        passwordData.currentPassword || null
      );

      if (response.success) {
        setMessage({
          type: 'success',
          text: 'Password set successfully! You can now use email/password login at /admin/login'
        });
        setPasswordData({ currentPassword: '', password: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to set password' });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to set password'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch current policy values on component mount
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const [termsResponse, privacyResponse] = await Promise.all([
          settingsAPI.getByKey('terms_of_service'),
          settingsAPI.getByKey('privacy_policy')
        ]);

        setPolicyData({
          termsOfService: termsResponse.data?.value || '',
          privacyPolicy: privacyResponse.data?.value || ''
        });
      } catch (error) {
        console.error('Error fetching policies:', error);
      }
    };

    fetchPolicies();
  }, []);

  const handlePolicyChange = (e) => {
    const { name, value } = e.target;
    setPolicyData(prev => ({
      ...prev,
      [name]: value
    }));
    setPolicyMessage({ type: '', text: '' });
  };

  const handleTermsChange = (value) => {
    setPolicyData(prev => ({
      ...prev,
      termsOfService: value
    }));
    setPolicyMessage({ type: '', text: '' });
  };

  const handlePrivacyChange = (value) => {
    setPolicyData(prev => ({
      ...prev,
      privacyPolicy: value
    }));
    setPolicyMessage({ type: '', text: '' });
  };

  const handleTermsSubmit = async () => {
    setTermsLoading(true);
    setPolicyMessage({ type: '', text: '' });

    try {
      const response = await settingsAPI.update('terms_of_service', policyData.termsOfService);

      if (response.success) {
        setPolicyMessage({
          type: 'success',
          text: 'Terms of Service updated successfully!'
        });
      } else {
        setPolicyMessage({ type: 'error', text: response.message || 'Failed to update Terms of Service' });
      }
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update Terms of Service'
      });
    } finally {
      setTermsLoading(false);
    }
  };

  const handlePrivacySubmit = async () => {
    setPrivacyLoading(true);
    setPolicyMessage({ type: '', text: '' });

    try {
      const response = await settingsAPI.update('privacy_policy', policyData.privacyPolicy);

      if (response.success) {
        setPolicyMessage({
          type: 'success',
          text: 'Privacy Policy updated successfully!'
        });
      } else {
        setPolicyMessage({ type: 'error', text: response.message || 'Failed to update Privacy Policy' });
      }
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update Privacy Policy'
      });
    } finally {
      setPrivacyLoading(false);
    }
  };

  return (
    <div className="p-8 overflow-y-auto h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'security'
                  ? 'border-[#B12417] text-[#B12417]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security
            </button>
            <button
              onClick={() => setActiveTab('legal')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'legal'
                  ? 'border-[#B12417] text-[#B12417]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Legal Documents
            </button>
          </div>

          {/* Security Section */}
          {activeTab === 'security' && (
            <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
              <p className="text-sm text-gray-600 mt-1">Set or update your password for email/password login</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Message */}
                {message.text && (
                  <div
                    className={`px-4 py-3 rounded-lg text-sm ${
                      message.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900">About Password Login</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Setting a password will allow you to login using email/password at <span className="font-mono">/admin/login</span>.
                        You can still continue using Google login as well.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Password Field */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter current password"
                    disabled={loading}
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={passwordData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter new password (min 8 characters)"
                    disabled={loading}
                  />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Setting Password...
                      </span>
                    ) : (
                      'Set Password'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Password Requirements */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Password Requirements:</h3>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Minimum 8 characters long</li>
              <li>Both passwords must match</li>
              <li>Choose a strong, unique password</li>
            </ul>
          </div>
          </>
          )}

          {/* Legal Documents Section */}
          {activeTab === 'legal' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Legal Documents</h2>
              <p className="text-sm text-gray-600 mt-1">Manage Terms of Service and Privacy Policy content</p>
            </div>

            <div className="p-6 space-y-8">
              {/* Message */}
              {policyMessage.text && (
                <div
                  className={`px-4 py-3 rounded-lg text-sm ${
                    policyMessage.type === 'success'
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                >
                  {policyMessage.text}
                </div>
              )}

              {/* Terms of Service */}
              <div>
                <label htmlFor="termsOfService" className="block text-sm font-medium text-gray-700 mb-2">
                  Terms of Service
                </label>
                <div className="bg-white rounded-lg border border-gray-300">
                  <ReactQuill
                    theme="snow"
                    value={policyData.termsOfService}
                    onChange={handleTermsChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter Terms of Service content..."
                    readOnly={termsLoading}
                    className="min-h-[300px]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use the toolbar above to format your content - headings, bold, lists, etc.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleTermsSubmit}
                    disabled={termsLoading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                  >
                    {termsLoading ? 'Saving...' : 'Save Terms of Service'}
                  </button>
                </div>
              </div>

              {/* Privacy Policy */}
              <div>
                <label htmlFor="privacyPolicy" className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Policy
                </label>
                <div className="bg-white rounded-lg border border-gray-300">
                  <ReactQuill
                    theme="snow"
                    value={policyData.privacyPolicy}
                    onChange={handlePrivacyChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter Privacy Policy content..."
                    readOnly={privacyLoading}
                    className="min-h-[300px]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use the toolbar above to format your content - headings, bold, lists, etc.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handlePrivacySubmit}
                    disabled={privacyLoading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                  >
                    {privacyLoading ? 'Saving...' : 'Save Privacy Policy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
  );
};

export default AdminSettingsPage;
