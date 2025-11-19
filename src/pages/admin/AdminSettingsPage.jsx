import React, { useState, useEffect } from 'react';
import { authAPI, settingsAPI, publicDocumentsAPI } from '../../api';
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
    privacyPolicy: '',
    refundPolicy: ''
  });
  const [termsLoading, setTermsLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);
  const [policyMessage, setPolicyMessage] = useState({ type: '', text: '' });

  // Footer management state
  const [footerData, setFooterData] = useState({
    address: '',
    email: '',
    tel: ''
  });
  const [footerLoading, setFooterLoading] = useState(false);

  // Public Documents management state
  const [publicDocuments, setPublicDocuments] = useState([]);
  const [publicDocsLoading, setPublicDocsLoading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null
  });
  const [uploading, setUploading] = useState(false);

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

  // Fetch current policy and footer values on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [termsResponse, privacyResponse, refundResponse, addressResponse, emailResponse, telResponse] = await Promise.all([
          settingsAPI.getByKey('terms_of_service'),
          settingsAPI.getByKey('privacy_policy'),
          settingsAPI.getByKey('refund_policy'),
          settingsAPI.getByKey('footer_address').catch(() => ({ data: null })),
          settingsAPI.getByKey('footer_email').catch(() => ({ data: null })),
          settingsAPI.getByKey('footer_tel').catch(() => ({ data: null }))
        ]);

        setPolicyData({
          termsOfService: termsResponse.data?.value || '',
          privacyPolicy: privacyResponse.data?.value || '',
          refundPolicy: refundResponse.data?.value || ''
        });

        setFooterData({
          address: addressResponse.data?.value || '',
          email: emailResponse.data?.value || '',
          tel: telResponse.data?.value || ''
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch public documents when tab is active
  useEffect(() => {
    if (activeTab === 'publicDocs') {
      fetchPublicDocuments();
    }
  }, [activeTab]);

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

  const handleRefundChange = (value) => {
    setPolicyData(prev => ({
      ...prev,
      refundPolicy: value
    }));
    setPolicyMessage({ type: '', text: '' });
  };

  const handleRefundSubmit = async () => {
    setRefundLoading(true);
    setPolicyMessage({ type: '', text: '' });

    try {
      const response = await settingsAPI.update('refund_policy', policyData.refundPolicy);

      if (response.success) {
        setPolicyMessage({
          type: 'success',
          text: 'Refund Policy updated successfully!'
        });
      } else {
        setPolicyMessage({ type: 'error', text: response.message || 'Failed to update Refund Policy' });
      }
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update Refund Policy'
      });
    } finally {
      setRefundLoading(false);
    }
  };

  const handleFooterChange = (field, value) => {
    setFooterData(prev => ({ ...prev, [field]: value }));
    setPolicyMessage({ type: '', text: '' });
  };

  const handleFooterSubmit = async () => {
    setFooterLoading(true);
    setPolicyMessage({ type: '', text: '' });

    try {
      await Promise.all([
        settingsAPI.update('footer_address', footerData.address),
        settingsAPI.update('footer_email', footerData.email),
        settingsAPI.update('footer_tel', footerData.tel)
      ]);

      setPolicyMessage({
        type: 'success',
        text: 'Footer settings updated successfully!'
      });
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update footer settings'
      });
    } finally {
      setFooterLoading(false);
    }
  };

  // Public Documents handlers
  const fetchPublicDocuments = async () => {
    try {
      setPublicDocsLoading(true);
      const response = await publicDocumentsAPI.getAll();
      if (response.success) {
        setPublicDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching public documents:', error);
    } finally {
      setPublicDocsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setUploadData(prev => ({ ...prev, file }));
      setPolicyMessage({ type: '', text: '' });
    } else {
      setPolicyMessage({ type: 'error', text: 'Only PDF files are allowed' });
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!uploadData.title || !uploadData.file) {
      setPolicyMessage({ type: 'error', text: 'Title and file are required' });
      return;
    }

    setUploading(true);
    setPolicyMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('file', uploadData.file);

      const response = await publicDocumentsAPI.upload(formData);

      if (response.success) {
        setPolicyMessage({ type: 'success', text: 'Document uploaded successfully!' });
        setUploadData({ title: '', description: '', file: null });
        document.getElementById('fileInput').value = '';
        await fetchPublicDocuments();
      }
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to upload document'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCopyLink = (token) => {
    const publicLink = `${window.location.origin}/public/${token}`;
    navigator.clipboard.writeText(publicLink);
    setPolicyMessage({ type: 'success', text: 'Link copied to clipboard!' });
    setTimeout(() => setPolicyMessage({ type: '', text: '' }), 3000);
  };

  const handleDeleteDocument = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await publicDocumentsAPI.delete(id);
      if (response.success) {
        setPolicyMessage({ type: 'success', text: 'Document deleted successfully!' });
        await fetchPublicDocuments();
      }
    } catch (error) {
      setPolicyMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete document'
      });
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
            <button
              onClick={() => setActiveTab('footer')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'footer'
                  ? 'border-[#B12417] text-[#B12417]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Footer
            </button>
            <button
              onClick={() => setActiveTab('publicDocs')}
              className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                activeTab === 'publicDocs'
                  ? 'border-[#B12417] text-[#B12417]'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Public Documents
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
              <p className="text-sm text-gray-600 mt-1">Manage Terms of Service, Privacy Policy, and Refund Policy content</p>
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

              {/* Refund Policy */}
              <div>
                <label htmlFor="refundPolicy" className="block text-sm font-medium text-gray-700 mb-2">
                  Refund Policy
                </label>
                <div className="bg-white rounded-lg border border-gray-300">
                  <ReactQuill
                    theme="snow"
                    value={policyData.refundPolicy}
                    onChange={handleRefundChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Enter Refund Policy content..."
                    readOnly={refundLoading}
                    className="min-h-[300px]"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use the toolbar above to format your content - headings, bold, lists, etc.
                </p>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleRefundSubmit}
                    disabled={refundLoading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                  >
                    {refundLoading ? 'Saving...' : 'Save Refund Policy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Footer Section */}
          {activeTab === 'footer' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Footer Settings</h2>
              <p className="text-sm text-gray-600 mt-1">Manage footer contact information displayed on the landing page</p>
            </div>

            <div className="p-6 space-y-6">
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

              {/* Address */}
              <div>
                <label htmlFor="footerAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="footerAddress"
                  rows="3"
                  value={footerData.address}
                  onChange={(e) => handleFooterChange('address', e.target.value)}
                  placeholder="Enter company address..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Company address displayed in the footer
                </p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="footerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="footerEmail"
                  value={footerData.email}
                  onChange={(e) => handleFooterChange('email', e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact email displayed in the footer
                </p>
              </div>

              {/* Telephone */}
              <div>
                <label htmlFor="footerTel" className="block text-sm font-medium text-gray-700 mb-2">
                  Telephone
                </label>
                <input
                  type="tel"
                  id="footerTel"
                  value={footerData.tel}
                  onChange={(e) => handleFooterChange('tel', e.target.value)}
                  placeholder="+971 4 2288006"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Contact telephone number displayed in the footer
                </p>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleFooterSubmit}
                  disabled={footerLoading}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                >
                  {footerLoading ? 'Saving...' : 'Save Footer Settings'}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Public Documents Section */}
          {activeTab === 'publicDocs' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Public Documents</h2>
              <p className="text-sm text-gray-600 mt-1">Upload documents and generate public shareable links</p>
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

              {/* Upload Form */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h3>
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="docTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      id="docTitle"
                      value={uploadData.title}
                      onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter document title..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="docDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="docDescription"
                      value={uploadData.description}
                      onChange={(e) => setUploadData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter document description..."
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="fileInput" className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File *
                    </label>
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileChange}
                      accept="application/pdf"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only PDF files are allowed (max 50MB)
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
                  >
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                </form>
              </div>

              {/* Documents List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
                {publicDocsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin"></div>
                  </div>
                ) : publicDocuments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No public documents uploaded yet
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {publicDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{doc.title}</div>
                                {doc.description && (
                                  <div className="text-sm text-gray-500 mt-1">{doc.description}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600">
                              {new Date(doc.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                doc.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {doc.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleCopyLink(doc.public_token)}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                  title="Copy public link"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  title="Delete document"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
  );
};

export default AdminSettingsPage;
