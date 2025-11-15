import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

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
}

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
]

const ProfileCompletion = () => {
  const navigate = useNavigate()
  const { user, checkAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [phoneError, setPhoneError] = useState(null)
  const [countryCode, setCountryCode] = useState('+971')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    address: ''
  })

  useEffect(() => {
    // Pre-fill name from Google profile
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        name: user.name
      }))
    }
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  // Validate phone number based on country code
  const validatePhoneNumber = (phone, code) => {
    // Remove spaces, dashes, and other non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    const validation = PHONE_VALIDATION[code]

    if (!validation) {
      return { isValid: true, error: null } // No validation rule for this country
    }

    if (cleanPhone.length === 0) {
      return { isValid: false, error: 'Phone number is required' }
    }

    if (cleanPhone.length !== validation.length) {
      return {
        isValid: false,
        error: `${validation.country} numbers must be exactly ${validation.length} digits`
      }
    }

    return { isValid: true, error: null }
  }

  // Handle phone number input with validation
  const handlePhoneChange = (e) => {
    const value = e.target.value
    // Only allow digits and spaces
    const filtered = value.replace(/[^\d\s]/g, '')

    // Get max length for current country
    const validation = PHONE_VALIDATION[countryCode]
    const maxLength = validation ? validation.length : 15 // Default to 15 if no rule

    // Remove spaces to count actual digits
    const digitsOnly = filtered.replace(/\s/g, '')

    // Prevent input if exceeds max length
    if (digitsOnly.length > maxLength) {
      return // Don't update state if exceeds limit
    }

    setPhoneNumber(filtered)

    // Clear errors
    if (error) setError(null)
    if (phoneError) setPhoneError(null)

    // Validate if user has entered something
    if (filtered.trim()) {
      const phoneValidation = validatePhoneNumber(filtered, countryCode)
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error)
      }
    }
  }

  // Handle country code change
  const handleCountryCodeChange = (e) => {
    const newCode = e.target.value
    setCountryCode(newCode)

    // Re-validate phone number with new country code
    if (phoneNumber.trim()) {
      const validation = validatePhoneNumber(phoneNumber, newCode)
      setPhoneError(validation.isValid ? null : validation.error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setPhoneError(null)

    try {
      // Validation
      if (!formData.industry.trim()) {
        setError('Industry is required')
        setLoading(false)
        return
      }

      if (!phoneNumber.trim()) {
        setError('Contact number is required')
        setLoading(false)
        return
      }

      // Validate phone number
      const phoneValidation = validatePhoneNumber(phoneNumber, countryCode)
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error)
        setLoading(false)
        return
      }

      // Combine country code and phone number
      const fullContactNumber = `${countryCode} ${phoneNumber.trim()}`

      // Call API to update profile
      const response = await usersAPI.updateProfile({
        name: formData.name.trim(),
        industry: formData.industry.trim(),
        contact_number: fullContactNumber,
        address: formData.address.trim() || null
      })

      if (response.success) {
        // Refresh user data to get updated profile_completed flag
        await checkAuth()

        // Navigate to subscription page
        navigate('/subscription')
      } else {
        setError(response.message || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#B12417] via-[#9a1f13] to-[#821a10] px-4 py-8 md:py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Complete Your Profile
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/90">
            We need a few more details to personalize your experience and provide you with the best service.
          </p>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-[#B12417]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#9a1f13]/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Form Section */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-8 sm:p-12">
          {error && (
            <div className="mb-6 p-4 bg-[#B12417]/5 border-l-4 border-[#B12417] rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-red-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                <p className="ml-3 text-sm text-[#9a1f13]">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                placeholder="Enter your full name"
              />
              <p className="mt-1 text-xs text-gray-500">Your name from Google profile</p>
            </div>

            {/* Industry Field */}
            <div>
              <label htmlFor="industry" className="block text-sm font-semibold text-gray-900 mb-2">
                Industry <span className="text-[#B12417]">*</span>
              </label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400"
                placeholder="e.g., Real Estate, Technology, Healthcare"
              />
              <p className="mt-1 text-xs text-gray-500">What industry is your business in?</p>
            </div>

            {/* Contact Number Field with Country Code */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-semibold text-gray-900 mb-2">
                Contact Number <span className="text-[#B12417]">*</span>
              </label>
              <div className="flex gap-2">
                {/* Country Code Dropdown */}
                <select
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  className="w-32 px-3 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all duration-300 text-gray-900 bg-white cursor-pointer"
                >
                  {COUNTRY_CODES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>

                {/* Phone Number Input */}
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  required
                  className={`flex-1 px-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400 ${
                    phoneError
                      ? 'border-[#B12417] focus:ring-[#B12417]'
                      : 'border-gray-300 focus:ring-[#B12417]'
                  }`}
                  placeholder="50 123 4567"
                />
              </div>
              {phoneError ? (
                <p className="mt-1 text-xs text-[#B12417]">{phoneError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-500">
                  {PHONE_VALIDATION[countryCode]
                    ? `${PHONE_VALIDATION[countryCode].country} numbers must be ${PHONE_VALIDATION[countryCode].length} digits`
                    : 'Select your country code and enter your phone number'}
                </p>
              )}
            </div>

            {/* Address Field (Optional) */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-900 mb-2">
                Business Address <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-[#B12417] focus:border-transparent transition-all duration-300 text-gray-900 placeholder-gray-400 resize-none"
                placeholder="Enter your business address"
              />
              <p className="mt-1 text-xs text-gray-500">Your business location (optional)</p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#B12417] to-[#9a1f13] hover:from-[#9a1f13] hover:to-[#821a10] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving Profile...
                  </span>
                ) : (
                  'Continue to Subscription'
                )}
              </button>
            </div>
          </form>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Why do we need this?</span><br/>
                  This information helps us provide you with personalized recommendations and ensures we can reach you for important updates about your subscription and documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletion
