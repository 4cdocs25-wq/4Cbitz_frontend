import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsAPI, usersAPI, paymentsAPI, foldersAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import FolderTree from '../../components/folders/FolderTree'

const Documents = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [documents, setDocuments] = useState([])
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [folderPath, setFolderPath] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [showFolderSidebar, setShowFolderSidebar] = useState(true)

  useEffect(() => {
    const verifyPaymentAndLoadDocuments = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }

      // If no user, ProtectedRoute will handle redirect
      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Check if user is admin (role comes from user object now)
        const isAdmin = user.role === 'admin'

        if (isAdmin) {
          await fetchDocuments()
          return
        }

        // Check if profile is completed (regular users only)
        if (!user.profile_completed) {
          navigate('/profile-completion')
          return
        }

        // Check URL for session_id (returned from Stripe)
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')

        if (sessionId) {
          setVerifyingPayment(true)

          try {
            // Call backend API to verify payment
            const response = await paymentsAPI.verifyPayment(sessionId)

            setVerifyingPayment(false)

            if (response.success) {
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
        const purchasesResponse = await usersAPI.getPurchases()

        if (purchasesResponse.success && purchasesResponse.data && purchasesResponse.data.length > 0) {
          await fetchDocuments()
        } else {
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

  const fetchFolders = async () => {
    try {
      const response = await foldersAPI.getTree()
      if (response.success && response.data) {
        setFolders(response.data)
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await documentsAPI.getAll(selectedFolder)

      if (response.success && response.data) {
        setDocuments(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch documents')
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      setError(error.message || 'Failed to load documents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchFolderPath = async () => {
    if (!selectedFolder) {
      setFolderPath([])
      return
    }
    try {
      const response = await foldersAPI.getPath(selectedFolder)
      if (response.success && response.data) {
        setFolderPath(response.data)
      }
    } catch (error) {
      console.error('Error fetching folder path:', error)
    }
  }

  // Fetch folders on mount and whenever selectedFolder changes
  useEffect(() => {
    if (user && !authLoading) {
      fetchFolders()
    }
  }, [user, authLoading])

  // Fetch documents when selected folder changes
  useEffect(() => {
    if (user && !authLoading && !verifyingPayment) {
      fetchDocuments()
      fetchFolderPath()
    }
  }, [selectedFolder])

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

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder?.id || null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-4 py-4 sm:py-6 md:py-8 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative mx-auto max-w-7xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-white/90 hover:text-white transition-all duration-300 group mb-3 md:mb-4 md:absolute md:top-0 md:left-0"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm md:text-base font-medium">Back</span>
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <div className="p-2 md:p-3 bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/20">
                <svg className="w-7 h-7 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
              Document Library
            </h1>
            <p className="mx-auto mt-2 md:mt-4 max-w-2xl text-sm md:text-base lg:text-lg leading-6 md:leading-8 text-red-100 px-4">
              Your secure document collection awaits. Access premium content with complete privacy and security.
            </p>
          </div>
        </div>

        {/* Animated background elements - hidden on mobile */}
        <div className="hidden md:block absolute top-0 left-1/4 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="hidden md:block absolute bottom-0 right-1/4 w-72 h-72 bg-red-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>

      {/* Info Banner */}
      <div className="relative mt-4 md:mt-2 lg:-mt-4 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 md:mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl border border-white/20 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-base md:text-lg font-semibold">Access Granted!</p>
              <p className="text-sm md:text-base text-blue-100">You now have full access to all premium documents with complete security protection.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Folder Sidebar - Drawer on Mobile, Fixed on Desktop */}
          {/* Mobile Backdrop */}
          {showFolderSidebar && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
              onClick={() => setShowFolderSidebar(false)}
            ></div>
          )}

          {/* Sidebar/Drawer */}
          <div className={`
            ${showFolderSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            fixed lg:sticky top-0 left-0 h-screen lg:h-auto z-50 lg:z-0
            w-80 max-w-[85vw] lg:w-64
            lg:flex-shrink-0 lg:top-4
            transition-transform duration-300 ease-in-out
            ${!showFolderSidebar ? 'lg:w-0 lg:hidden' : ''}
          `}>
            {(showFolderSidebar || window.innerWidth >= 1024) && (
              <div className="h-full lg:h-auto bg-white lg:bg-white/80 lg:backdrop-blur-sm rounded-none lg:rounded-2xl border-r lg:border border-gray-200 lg:border-white/20 shadow-2xl lg:shadow-xl p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-sm font-semibold text-gray-900">Browse by Folder</h3>
                  <button
                    onClick={() => setShowFolderSidebar(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Close folder browser"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-[calc(100vh-120px)] lg:max-h-[600px] overflow-y-auto">
                  <FolderTree
                    folders={folders}
                    selectedId={selectedFolder}
                    onSelect={handleFolderSelect}
                    readOnly={true}
                    showRoot={true}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Documents Area */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb & Search Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl border border-white/20 shadow-xl p-4 md:p-6 mb-6 md:mb-8">
              {/* Breadcrumb */}
              {folderPath.length > 0 && (
                <nav className="flex items-center space-x-2 text-xs md:text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className="hover:text-gray-900 transition-colors flex-shrink-0"
                  >
                    All Documents
                  </button>
                  {folderPath.map((folder, index) => (
                    <React.Fragment key={folder.id}>
                      <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">{folder.name}</span>
                    </React.Fragment>
                  ))}
                </nav>
              )}

              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
                    className="block w-full pl-10 pr-3 py-2.5 md:py-3 border border-gray-300 rounded-lg md:rounded-xl text-sm md:text-base leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredDocuments.map((document, index) => (
              <div
                key={document.id}
                onClick={() => handleDocumentClick(document)}
                className="group relative bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white/20 shadow-lg hover:shadow-2xl md:hover:scale-105 md:hover:-translate-y-2 active:scale-98 transition-all duration-300 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-4 md:p-6">
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

        {/* Floating Action Button - Mobile Only */}
        <button
          onClick={() => setShowFolderSidebar(true)}
          className="fixed bottom-6 right-6 z-30 lg:hidden p-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 active:scale-95"
          aria-label="Open folder browser"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default Documents