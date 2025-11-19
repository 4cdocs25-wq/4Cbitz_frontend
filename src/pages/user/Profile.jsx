import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// Phone number validation rules by country code
const PHONE_VALIDATION = {
  '+971': { length: 9, country: 'UAE' },
  '+1': { length: 10, country: 'USA/Canada' },
  '+44': { length: 10, country: 'UK' },
  '+91': { length: 10, country: 'India' },
  '+966': { length: 9, country: 'Saudi Arabia' },
  '+974': { length: 8, country: 'Qatar' },
  '+965': { length: 8, country: 'Kuwait' },
  '+968': { length: 8, country: 'Oman' },
  '+973': { length: 8, country: 'Bahrain' },
  '+20': { length: 10, country: 'Egypt' },
  '+92': { length: 10, country: 'Pakistan' },
  '+880': { length: 10, country: 'Bangladesh' },
  '+94': { length: 9, country: 'Sri Lanka' },
  '+63': { length: 10, country: 'Philippines' },
  '+60': { length: 9, country: 'Malaysia' },
  '+65': { length: 8, country: 'Singapore' },
  '+86': { length: 11, country: 'China' },
  '+81': { length: 10, country: 'Japan' },
  '+82': { length: 10, country: 'South Korea' },
  '+61': { length: 9, country: 'Australia' },
  '+64': { length: 9, country: 'New Zealand' },
  '+27': { length: 9, country: 'South Africa' },
  '+33': { length: 9, country: 'France' },
  '+49': { length: 10, country: 'Germany' },
  '+39': { length: 10, country: 'Italy' },
  '+34': { length: 9, country: 'Spain' },
  '+7': { length: 10, country: 'Russia' },
  '+90': { length: 10, country: 'Turkey' },
  '+55': { length: 11, country: 'Brazil' },
  '+52': { length: 10, country: 'Mexico' },
  '+234': { length: 10, country: 'Nigeria' },
};

// Common country codes
const COUNTRY_CODES = [
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
];

const Profile = () => {
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [phoneError, setPhoneError] = useState(null);
  const [countryCode, setCountryCode] = useState('+971');
  const [phoneNumber, setPhoneNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    industry: '',
    contact_number: '',
    address: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getProfile();

      if (response.success && response.data) {
        // Parse contact_number into country code and phone number
        const fullNumber = response.data.contact_number || '';
        if (fullNumber) {
          // Find matching country code
          let foundCode = '+971'; // Default
          let foundPhone = '';

          for (const country of COUNTRY_CODES) {
            if (fullNumber.startsWith(country.code)) {
              foundCode = country.code;
              foundPhone = fullNumber.substring(country.code.length).trim();
              break;
            }
          }

          setCountryCode(foundCode);
          setPhoneNumber(foundPhone);
        }

        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          industry: response.data.industry || '',
          contact_number: response.data.contact_number || '',
          address: response.data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', text: '' });
  };

  // Validate phone number based on country code
  const validatePhoneNumber = (phone, code) => {
    // Remove spaces, dashes, and other non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    const validation = PHONE_VALIDATION[code];

    if (!validation) {
      return { isValid: true, error: null }; // No validation rule for this country
    }

    if (cleanPhone.length === 0) {
      return { isValid: false, error: 'Phone number is required' };
    }

    if (cleanPhone.length !== validation.length) {
      return {
        isValid: false,
        error: `${validation.country} numbers must be exactly ${validation.length} digits`
      };
    }

    return { isValid: true, error: null };
  };

  // Handle phone number input with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Only allow digits and spaces
    const filtered = value.replace(/[^\d\s]/g, '');

    // Get max length for current country
    const validation = PHONE_VALIDATION[countryCode];
    const maxLength = validation ? validation.length : 15; // Default to 15 if no rule

    // Remove spaces to count actual digits
    const digitsOnly = filtered.replace(/\s/g, '');

    // Prevent input if exceeds max length
    if (digitsOnly.length > maxLength) {
      return; // Don't update state if exceeds limit
    }

    setPhoneNumber(filtered);

    // Clear errors
    setMessage({ type: '', text: '' });
    if (phoneError) setPhoneError(null);

    // Validate if user has entered something
    if (filtered.trim()) {
      const phoneValidation = validatePhoneNumber(filtered, countryCode);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error);
      }
    }
  };

  // Handle country code change
  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value;
    setCountryCode(newCode);

    // Re-validate phone number with new country code
    if (phoneNumber.trim()) {
      const validation = validatePhoneNumber(phoneNumber, newCode);
      setPhoneError(validation.isValid ? null : validation.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate phone number
    const phoneValidation = validatePhoneNumber(phoneNumber, countryCode);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      return;
    }

    setSaving(true);

    try {
      // Combine country code and phone number
      const fullPhoneNumber = countryCode + phoneNumber.replace(/\s/g, '');

      const response = await usersAPI.updateProfile({
        name: formData.name,
        industry: formData.industry,
        contact_number: fullPhoneNumber,
        address: formData.address
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        await checkAuth(); // Refresh user data in context
      } else {
        setMessage({ type: 'error', text: response.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B12417] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#B12417] to-[#2B266F] bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="mt-4 text-gray-600 text-lg">
              Manage your personal information and preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-[#B12417] to-[#2B266F] px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              <p className="text-white/90 mt-1">Update your personal details below</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {/* Message */}
              {message.text && (
                <div className={`px-4 py-3 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email (Read Only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
              </div>

              {/* Industry */}
              <div>
                <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-2">
                  Industry *
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all"
                  placeholder="Enter your industry (e.g., Technology, Healthcare, Finance)"
                />
              </div>

              {/* Contact Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Number *
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={handleCountryCodeChange}
                    className="w-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all bg-white"
                    required
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="50 123 4567"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all"
                    required
                  />
                </div>
                {phoneError && (
                  <p className="mt-1 text-sm text-[#B12417]">{phoneError}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Address (Optional)
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all resize-none"
                  placeholder="Enter your business address"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-[#B12417] to-[#2B266F] text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
                >
                  {saving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
};

export default Profile;
