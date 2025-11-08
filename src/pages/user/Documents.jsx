import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsAPI, usersAPI, paymentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

const Documents = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [verifyingPayment, setVerifyingPayment] = useState(false)

  // Debug: Component render
  console.log('📄 Documents component rendered', {
    userId: user?.id,
    authLoading,
    hasNavigate: !!navigate,
    location: window.location.href
  })

  useEffect(() => {
    console.log('🔍 Documents useEffect triggered', {
      user: user?.id,
      authLoading,
      hasNavigate: !!navigate,
      url: window.location.href
    })

    const verifyPaymentAndLoadDocuments = async () => {
      console.log('🔄 verifyPaymentAndLoadDocuments started', { authLoading, user: user?.id })

      // Wait for auth to finish loading
      if (authLoading) {
        console.log('⏳ Still loading auth, returning...')
        return
      }

      // If no user, ProtectedRoute will handle redirect
      if (!user) {
        console.log('❌ No user found, exiting...')
        setLoading(false)
        return
      }

      try {
        console.log('✅ User authenticated:', user.id)
        console.log('Checking payment status for user:', user.id)

        // Check if user is admin (role comes from user object now)
        const isAdmin = user.role === 'admin'
        console.log('👤 User role:', user.role, 'Is admin:', isAdmin)

        if (isAdmin) {
          console.log('👑 Admin user - bypassing payment check')
          await fetchDocuments()
          return
        }

        // Check URL for session_id (returned from Stripe)
        console.log('🔗 Checking URL for session_id...')
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')
        console.log('🔑 Session ID from URL:', sessionId)

        if (sessionId) {
          console.log('💳 Session ID found, verifying payment with backend...')
          setVerifyingPayment(true)

          try {
            // Call backend API to verify payment
            console.log('🚀 Calling verify payment API...')
            const response = await paymentsAPI.verifyPayment(sessionId)

            console.log('📥 API response:', response)

            setVerifyingPayment(false)

            if (response.success) {
              console.log('✅ Payment verified successfully!')
              // Clean URL
              window.history.replaceState({}, '', '/documents')
              // Load documents after successful payment
              await fetchDocuments()
              return
            } else {
              console.warn('⚠️ Payment verification returned unsuccessful:', response.message)
              setError('Payment verification was unsuccessful: ' + response.message)
            }
          } catch (verifyError) {
            console.error('💥 Exception calling verify payment API:', verifyError)
            setVerifyingPayment(false)
            setError('Failed to verify payment: ' + verifyError.message)
          }
        }

        // Check if user has purchases (backend will check payment status)
        console.log('💾 Checking user purchases...')
        const purchasesResponse = await usersAPI.getPurchases()

        console.log('💳 Purchases result:', purchasesResponse)

        if (purchasesResponse.success && purchasesResponse.data && purchasesResponse.data.length > 0) {
          console.log('✅ User has purchases - loading documents')
          await fetchDocuments()
        } else {
          console.log('❌ No purchases found - redirecting to subscription')
          navigate('/subscription')
        }
      } catch (error) {
        console.error('💥 Error checking payment:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    verifyPaymentAndLoadDocuments()
  }, [user, authLoading, navigate])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Fetching documents from backend API...')

      const response = await documentsAPI.getAll()

      console.log('API response:', response)

      if (response.success && response.data) {
        setDocuments(response.data)
        console.log('Documents loaded:', response.data.length)
      } else {
        throw new Error(response.message || 'Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message || 'Failed to load documents. Please try again.')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const handleDocumentClick = (document) => {
    navigate(`/documents/${document.id}`)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFileTypeIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'pdf':
        return (
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )
      case 'doc':
      case 'docx':
        return (
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
    }
  }

  const filteredDocuments = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Document Library
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-red-100">
              Your secure document collection awaits. Access premium content with complete privacy and security.
            </p>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-red-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Info Banner */}
      <div className="relative -mt-12 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-lg font-semibold">Access Granted!</p>
              <p className="text-blue-100">You now have full access to all premium documents with complete security protection.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">{filteredDocuments.length} documents</span>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        {authLoading || loading || verifyingPayment ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
              <div className="mt-4 text-center">
                <p className="text-gray-600 font-medium">
                  {authLoading ? 'Authenticating...' : verifyingPayment ? 'Verifying payment...' : 'Loading your documents...'}
                </p>
                <p className="text-gray-500 text-sm">
                  {authLoading ? 'Verifying your session' : verifyingPayment ? 'Please wait while we confirm your payment (this may take a few seconds)' : 'Please wait while we fetch your secure content'}
                </p>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="bg-red-50/80 backdrop-blur-sm rounded-3xl border-2 border-red-200 shadow-xl p-12 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Unable to Load Documents</h3>
              <p className="text-gray-700 mb-2 font-medium">{error}</p>
              <p className="text-gray-600 text-sm mb-6">
                This might be because the documents table hasn't been set up yet in your database.
              </p>
              <div className="space-y-3">
                <button
                  onClick={fetchDocuments}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Try Again
                </button>
                <p className="text-sm text-gray-500">
                  If this error persists, please contact your administrator
                </p>
              </div>
            </div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-12">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Documents Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm ? 'No documents match your search criteria.' : 'Documents will appear here once uploaded by administrators.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid mobile-grid-cols-1 sm-tablet-grid-cols-2 md-tablet-grid-cols-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredDocuments.map((document, index) => (
              <div
                key={document.id}
                onClick={() => handleDocumentClick(document)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 mobile-min-h-44"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    {getFileTypeIcon(document.file_name)}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2">
                    {document.title}
                  </h3>
                  
                  {document.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {document.description}
                    </p>
                  )}
                  
                  <div className="border-t border-gray-100 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    {/* Mobile layout */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>{formatFileSize(document.file_size)}</span>
                        </div>
                        <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Premium
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Secure View</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Desktop layout */}
                    <div className="hidden sm:block">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>{formatFileSize(document.file_size)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M3 21h18M5 21l1-14h12l1 14" />
                          </svg>
                          <span>{formatDate(document.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-gray-400">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span>Secure View</span>
                        </div>
                        <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          Premium
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Documents