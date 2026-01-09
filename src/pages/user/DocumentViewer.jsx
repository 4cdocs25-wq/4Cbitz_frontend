import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SecurityProvider } from '../../contexts/SecurityContext'
import { convertPdfPageToImage, getPdfMetadata } from '../../utils/documentConverter'
import WatermarkedCanvas from '../../components/WatermarkedCanvas'

const DocumentViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [pageCache, setPageCache] = useState(new Map())
  const [loadingPage, setLoadingPage] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInputValue, setPageInputValue] = useState('')
  const [abortController, setAbortController] = useState(null)
  const [failedPages, setFailedPages] = useState(new Set())
  const [isEnhancing, setIsEnhancing] = useState(false)
  const pageInputRef = useRef(null)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (abortController) {
        abortController.abort()
      }
    }
  }, [])

  // Fetch document data with proper error handling and retry logic
  useEffect(() => {
    if (!mountedRef.current) return

    // Create new abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)

    const fetchDocument = async (attemptNumber = 1) => {
      try {
        if (!mountedRef.current) return

        if (!user) {
          setError('Please log in to view documents.')
          setLoading(false)
          return
        }

        // Reset error state
        setError(null)

        // Get document metadata
        const response = await documentsAPI.getById(id)

        if (!mountedRef.current) {
          return
        }

        if (!response.success || !response.data) {
          setError('Document not found or access denied.')
          setLoading(false)
          return
        }

        const docData = response.data

        // Check if user has access to the document
        if (docData.hasAccess === false) {
          setError('You do not have access to this document. Please purchase it first.')
          setLoading(false)
          return
        }

        // Check if file_url exists
        if (!docData.file_url) {
          setError('Document file is not available. Please contact support.')
          setLoading(false)
          return
        }

        try {
          setDocument(docData)
        } catch (err) {
          console.error('❌ Error setting document:', err)
          throw err
        }

        if (!mountedRef.current) {
          return
        }

        // Get PDF metadata (total pages) without converting
        const fileExtension = docData.file_url?.split('.').pop()?.toLowerCase() || 'pdf'

        if (fileExtension === 'pdf') {
          const metadata = await getPdfMetadata(docData.file_url, controller.signal)

          if (!mountedRef.current) return

          if (metadata.success && metadata.totalPages > 0) {
            setTotalPages(metadata.totalPages)

            // Set initial state
            setCurrentPage(1)
            setLoading(false)

            // Load first page immediately
            setTimeout(() => {
              if (mountedRef.current) {
                loadPage(1, docData.file_url, controller.signal)
              }
            }, 100)
          } else {
            throw new Error('Failed to load PDF metadata: ' + (metadata.error || 'Unknown error'))
          }
        } else {
          // For non-PDF files, fall back to simple display
          setTotalPages(1)
          setLoading(false)
        }

      } catch (error) {
        if (!mountedRef.current) return
        
        console.error('Error fetching document:', error)
        
        setError(`Failed to load document: ${error.message}`)
        setLoading(false)
      }
    }

    fetchDocument()

    return () => {
      controller.abort()
    }
  }, [id, user])

  // Load only preview quality for preloading (doesn't trigger background upgrades)
  const loadPreviewOnly = async (pageNumber, fileUrl, signal = null) => {
    const previewKey = `${pageNumber}_preview`

    // Skip if already cached or failed
    if (pageCache.has(previewKey) || failedPages.has(pageNumber)) {
      return null
    }

    if (!mountedRef.current) return null

    try {
      const previewData = await convertPdfPageToImage(fileUrl, pageNumber, 1.0, signal, true)

      if (!mountedRef.current) return null

      if (previewData && previewData.success) {
        pageCache.set(previewKey, previewData)
        setPageCache(new Map(pageCache))
        return previewData
      }
    } catch (error) {
      // Silently fail preload
    }

    return null
  }

  const loadPage = async (pageNumber, fileUrl, signal = null) => {
    // Check if final quality page is already cached
    const cacheKey = `${pageNumber}_final`
    const previewKey = `${pageNumber}_preview`
    
    if (pageCache.has(cacheKey)) {
      return pageCache.get(cacheKey)
    }

    // Skip if page has failed before
    if (failedPages.has(pageNumber)) {
      return null
    }

    // Check if component is still mounted
    if (!mountedRef.current) return null

    setLoadingPage(true)

    try {
      // Step 1: Load fast preview with retry (up to 2 attempts)
      let previewData = null
      for (let attempt = 1; attempt <= 2 && !previewData; attempt++) {
        if (!mountedRef.current) return null
        try {
          previewData = await convertPdfPageToImage(fileUrl, pageNumber, 1.0, signal, true)
          if (!previewData?.success) previewData = null
        } catch (error) {
          console.error(`Preview attempt ${attempt}/2 failed for page ${pageNumber}:`, error.message)
          if (attempt < 2) await new Promise(r => setTimeout(r, 1500)) // Wait 1.5s before retry
        }
      }

      if (!mountedRef.current) return null

      if (previewData && previewData.success) {
        // Cache and display preview immediately (direct mutation for synchronous update)
        pageCache.set(previewKey, previewData)
        setPageCache(new Map(pageCache)) // Create new Map to trigger React re-render
        setLoadingPage(false)

        // Step 2: Load final quality (4.0x) in background with retry
        setTimeout(async () => {
          if (!mountedRef.current || failedPages.has(pageNumber)) return

          // Retry up to 2 times for 4.0x quality
          let finalData = null
          for (let attempt = 1; attempt <= 2 && !finalData; attempt++) {
            if (!mountedRef.current) return
            try {
              finalData = await convertPdfPageToImage(fileUrl, pageNumber, 4.0, null, false)
              if (!finalData?.success) finalData = null
            } catch (error) {
              console.error(`4.0x attempt ${attempt}/2 failed for page ${pageNumber}:`, error.message)
              if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
            }
          }

          if (!mountedRef.current || !finalData) return

          pageCache.set(cacheKey, finalData) // Add final quality
          setPageCache(new Map(pageCache)) // Trigger re-render with final quality

          // Step 3: Load ultra high quality (6.0x) after final quality with retry
          setTimeout(async () => {
            if (!mountedRef.current || failedPages.has(pageNumber)) return

            // Retry up to 2 times for 6.0x quality
            let ultraData = null
            for (let attempt = 1; attempt <= 2 && !ultraData; attempt++) {
              if (!mountedRef.current) return
              try {
                ultraData = await convertPdfPageToImage(fileUrl, pageNumber, 6.0, null, false)
                if (!ultraData?.success) ultraData = null
              } catch (error) {
                console.error(`6.0x attempt ${attempt}/2 failed for page ${pageNumber}:`, error.message)
                if (attempt < 2) await new Promise(r => setTimeout(r, 1000))
              }
            }

            if (!mountedRef.current || !ultraData) return

            const ultraKey = `${pageNumber}_ultra`
            pageCache.set(ultraKey, ultraData) // Add ultra high quality
            setPageCache(new Map(pageCache)) // Trigger re-render with ultra high quality

            // Delete preview and final quality after a delay for smooth transition
            setTimeout(() => {
              if (!mountedRef.current) return
              pageCache.delete(previewKey) // Remove preview
              pageCache.delete(cacheKey) // Remove final quality

              // Keep cache size reasonable (max 8 pages total)
              if (pageCache.size > 8) {
                const entries = Array.from(pageCache.entries())
                entries.slice(0, pageCache.size - 8).forEach(([key]) => {
                  pageCache.delete(key)
                })
              }

              setPageCache(new Map(pageCache)) // Update cache after cleanup
            }, 600) // 600ms allows smooth transition

            // Show enhancement indicator briefly
            if (pageNumber === currentPage) {
              setIsEnhancing(true)
              setTimeout(() => setIsEnhancing(false), 2000)
            }
          }, 2000) // Wait 2 seconds after final quality before loading ultra
        }, 500) // Load final quality after 500ms

        // Smart preloading DISABLED - was competing with quality upgrades for PDF.js worker
        // TODO: Re-enable after quality upgrades complete by tracking upgrade status
        // if (totalPages < 200 && pageNumber < totalPages) {
        //   for (let i = 1; i <= 3; i++) {
        //     const nextPage = pageNumber + i
        //     if (nextPage <= totalPages) {
        //       setTimeout(() => {
        //         if (!mountedRef.current) return
        //         const previewKey = `${nextPage}_preview`
        //         const finalKey = `${nextPage}_final`
        //         const ultraKey = `${nextPage}_ultra`
        //         if (!pageCache.has(previewKey) && !pageCache.has(finalKey) && !pageCache.has(ultraKey) && !failedPages.has(nextPage)) {
        //           loadPreviewOnly(nextPage, fileUrl, null).catch(() => {})
        //         }
        //       }, i * 500)
        //     }
        //   }
        // }
        
        return previewData
      } else {
        throw new Error('Failed to convert preview')
      }
    } catch (error) {
      if (!mountedRef.current) return null
      
      console.error(`Error loading page ${pageNumber}:`, error.message)
      
      // Mark page as failed
      setFailedPages(prev => new Set([...prev, pageNumber]))
      
      // Only show error for current page
      if (pageNumber === currentPage) {
        setError(`Failed to load page ${pageNumber}: ${error.message}`)
      }
    } finally {
      if (mountedRef.current) {
        setLoadingPage(false)
      }
    }
    
    return null
  }


  const handleBack = () => {
    navigate('/documents')
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setPageCache(new Map())
    setFailedPages(new Set())
    window.location.reload()
  }


  const goToPage = async (pageNum) => {
    if (!mountedRef.current) return

    const targetPage = Math.max(1, Math.min(pageNum, totalPages || 1))

    const ultraKey = `${targetPage}_ultra`
    const finalKey = `${targetPage}_final`
    const previewKey = `${targetPage}_preview`

    // Check if page exists in cache (preview, final, or ultra)
    const pageExists = pageCache.has(ultraKey) || pageCache.has(finalKey) || pageCache.has(previewKey)

    if (document?.file_url && !pageExists) {
      // Set loading state and current page BEFORE loading to prevent "Conversion Failed" flash
      setLoadingPage(true)
      setCurrentPage(targetPage)
      // Now load the page
      await loadPage(targetPage, document.file_url, abortController?.signal)
    } else {
      // Page already cached, just update current page
      setCurrentPage(targetPage)
    }
  }

  const handlePageInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(e.target.value) || 1
      goToPage(pageNum)
      setPageInputValue('') // Clear input to show placeholder
      e.target.blur() // Remove focus
    }
  }

  const handleGoClick = () => {
    if (pageInputRef.current) {
      const pageNum = parseInt(pageInputRef.current.value) || 1
      goToPage(pageNum)
      setPageInputValue('') // Clear input to show placeholder
      pageInputRef.current.blur() // Remove focus
    }
  }

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value)
  }

  const handlePageInputFocus = () => {
    if (pageInputValue === '') {
      setPageInputValue(currentPage.toString())
    }
  }

  const handlePageInputBlur = () => {
    if (pageInputValue.trim() === '' || pageInputValue === currentPage.toString()) {
      setPageInputValue('')
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading document...
          </p>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={handleRetry}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
            <button
              onClick={handleBack}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Documents
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show page loading for current page
  if (loadingPage && !pageCache.has(currentPage)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Loading Page {currentPage}</h3>
          <p className="text-gray-600 mb-6">Converting page {currentPage} of {totalPages}...</p>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-700">
              Rendering high-quality watermarked page for secure viewing...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Get the best available version of the current page (10.0x > 4.0x > preview)
  const ultraKey = `${currentPage}_ultra`
  const finalKey = `${currentPage}_final`
  const previewKey = `${currentPage}_preview`

  // Determine which quality level is currently displayed
  const isUltraQuality = pageCache.has(ultraKey)
  const isFinalQuality = !isUltraQuality && pageCache.has(finalKey)
  const isPreviewQuality = !isUltraQuality && !isFinalQuality && pageCache.has(previewKey)
  const currentQualityLabel = isUltraQuality ? '6.0x' : isFinalQuality ? '4.0x' : 'Preview'

  const currentPageData = pageCache.get(ultraKey) || pageCache.get(finalKey) || pageCache.get(previewKey)

  return (
    <SecurityProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 shadow-xl border-b border-white/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center min-w-0">
              <button
                onClick={handleBack}
                className="group flex items-center text-white/90 hover:text-white mr-3 sm:mr-6 transition-all duration-300 transform hover:scale-105 mobile-min-h-44"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center mr-1 sm:mr-2 group-hover:bg-white/20 transition-all duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </div>
                <span className="font-medium text-sm sm:text-base">Back</span>
              </button>
              
              <div className="flex items-center min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-white mr-2 sm:mr-4 truncate max-w-xs sm:max-w-md">
                  {document?.title}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="group relative bg-white/20 hover:bg-white/30 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl mobile-min-h-44"
              >
                <svg className="w-4 h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="mobile-hide sm-tablet-show">Refresh</span>
                <span className="mobile-show sm-tablet-hide">⟳</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Navigation */}
      {totalPages > 1 && (
        <div className="bg-white/90 backdrop-blur-sm border-b border-white/20 px-3 sm:px-4 py-3 sm:py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Navigation */}
            <div className="sm:hidden flex items-center justify-between">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="group flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:from-red-50 hover:to-red-100 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mobile-min-h-44"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 rounded-xl border border-red-200">
                <span className="text-xs font-medium text-red-700">{currentPage}</span>
                <span className="text-xs text-red-500">/</span>
                <span className="text-xs font-medium text-red-700">{totalPages}</span>
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="group flex items-center px-3 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:from-red-50 hover:to-red-100 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 mobile-min-h-44"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="group flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:from-red-50 hover:to-red-100 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-white disabled:hover:to-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
              
              <div className="flex items-center space-x-3 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2 rounded-xl border border-red-200">
                <span className="text-sm font-medium text-red-700">Page</span>
                <input
                  ref={pageInputRef}
                  type="number"
                  min="1"
                  max={totalPages}
                  value={pageInputValue}
                  onChange={handlePageInputChange}
                  onKeyPress={handlePageInputKeyPress}
                  onFocus={handlePageInputFocus}
                  onBlur={handlePageInputBlur}
                  placeholder={`1-${totalPages}`}
                  title={`Jump to page (1-${totalPages})`}
                  className="w-20 px-3 py-2 text-sm text-center border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 placeholder-red-400 bg-white/80"
                />
                <span className="text-sm font-medium text-red-700">of {totalPages}</span>
                <button
                  onClick={handleGoClick}
                  className="px-4 py-2 text-xs bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg border border-red-600 transition-all duration-300 font-semibold transform hover:scale-105 shadow-sm hover:shadow-md"
                  title="Go to page"
                >
                  Go
                </button>
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="group flex items-center px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-xl hover:from-red-50 hover:to-red-100 hover:border-red-300 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-white disabled:hover:to-gray-50 disabled:hover:border-gray-200 disabled:hover:text-gray-700 transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-sm hover:shadow-md"
              >
                Next
                <svg className="w-4 h-4 ml-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium text-red-700">Read Only Mode</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {currentPageData?.imageData ? (
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 overflow-hidden rounded-3xl">
              {/* Page Indicator */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <span className="text-white font-bold text-sm">{currentPage}</span>
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">Page {currentPage}</h2>
                      <p className="text-blue-100 text-xs">of {totalPages} total pages</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isPreviewQuality ? (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <span className="text-yellow-200 text-xs font-medium">Loading... (Preview)</span>
                      </>
                    ) : isFinalQuality ? (
                      <>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <span className="text-blue-200 text-xs font-medium">Quality: {currentQualityLabel}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-green-200 text-xs font-medium">Quality: {currentQualityLabel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Watermarked Canvas Display */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="relative group">
                  <WatermarkedCanvas
                    imageData={currentPageData.imageData}
                    watermarkText="4Csecure"
                    pageNumber={currentPage}
                    totalPages={totalPages}
                    userEmail={user?.email}
                    userId={user?.id}
                    className="rounded-2xl shadow-2xl border border-white/50 transition-all duration-500 group-hover:shadow-3xl"
                  />
                  
                  {/* Overlay gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"></div>
                  
                </div>
              </div>
            </div>
          ) : failedPages.has(currentPage) ? (
            /* Show "Conversion Failed" ONLY when page explicitly failed all attempts */
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Conversion Failed</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                {error || 'Unable to convert document to secure viewing format.'}
              </p>
              <button
                onClick={() => {
                  // Clear failed page from cache and retry
                  setError(null)
                  failedPages.delete(currentPage)
                  setFailedPages(new Set(failedPages))
                  pageCache.delete(`${currentPage}_preview`)
                  pageCache.delete(`${currentPage}_final`)
                  pageCache.delete(`${currentPage}_ultra`)
                  setPageCache(new Map(pageCache))
                  if (document?.file_url) {
                    setLoadingPage(true)
                    loadPage(currentPage, document.file_url, abortController?.signal)
                  }
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center mx-auto"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Page {currentPage}
              </button>
            </div>
          ) : (
            /* Show loading spinner for all other cases (including quality transitions) */
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Loading Page {currentPage}</h3>
              <p className="text-gray-600">Converting page for secure viewing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </SecurityProvider>
  )
}

export default DocumentViewer