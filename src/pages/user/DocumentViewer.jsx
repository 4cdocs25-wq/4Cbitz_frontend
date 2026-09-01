import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { SecurityProvider } from '../../contexts/SecurityContext'
import { convertPdfToImages, getPdfMetadata } from '../../utils/documentConverter'
import WatermarkedCanvas from '../../components/WatermarkedCanvas'

const DocumentViewer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalPages, setTotalPages] = useState(0)
  const [allPages, setAllPages] = useState([])
  const [converting, setConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)
  const [conversionCurrentPage, setConversionCurrentPage] = useState(0)
  const mountedRef = useRef(true)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Fetch document data and convert all pages
  useEffect(() => {
    if (!mountedRef.current) return

    const controller = new AbortController()

    const fetchDocument = async () => {
      try {
        if (!mountedRef.current) return

        if (!user) {
          setError('Please log in to view documents.')
          setLoading(false)
          return
        }

        setError(null)

        // Get document metadata
        const response = await documentsAPI.getById(id)

        if (!mountedRef.current) return

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

        setDocument(docData)

        if (!mountedRef.current) return

        const fileExtension = docData.file_url?.split('.').pop()?.toLowerCase() || 'pdf'

        if (fileExtension === 'pdf') {
          // Get PDF metadata for page count (used in progress display)
          const metadata = await getPdfMetadata(docData.file_url, controller.signal)

          if (!mountedRef.current) return

          if (metadata.success && metadata.totalPages > 0) {
            setTotalPages(metadata.totalPages)
            setLoading(false)
            setConverting(true)
            setConversionProgress(0)
            setConversionCurrentPage(0)

            // Convert all pages at once
            const result = await convertPdfToImages(docData.file_url, 6.0, (progress, currentPage, total) => {
              if (!mountedRef.current) return
              setConversionProgress(progress)
              setConversionCurrentPage(currentPage)
            })

            if (!mountedRef.current) return

            if (result.success && result.pages.length > 0) {
              setAllPages(result.pages)
              setConverting(false)
            } else {
              throw new Error('Failed to convert PDF pages')
            }
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
        setConverting(false)
      }
    }

    fetchDocument()

    return () => {
      controller.abort()
    }
  }, [id, user])

  const handleBack = () => {
    navigate('/documents')
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setAllPages([])
    setConverting(false)
    setConversionProgress(0)
    setConversionCurrentPage(0)
    window.location.reload()
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

  // Conversion progress screen
  if (converting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-12">
          <div className="w-16 h-16 mx-auto mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Preparing Document</h3>
          <p className="text-gray-600 mb-6">
            Converting page {conversionCurrentPage} of {totalPages}...
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${conversionProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 mb-6">{conversionProgress}% complete</p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-700">
              Rendering high-quality watermarked pages for secure viewing...
            </p>
          </div>
        </div>
      </div>
    )
  }

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
                <span className="mobile-show sm-tablet-hide">&#x27F3;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Document Content */}
      <div className="px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {allPages.map((page) => (
            <div key={page.pageNumber} className="bg-white/90 backdrop-blur-sm shadow-2xl border border-white/20 overflow-hidden rounded-3xl">
              {/* Page Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <span className="text-white font-bold text-sm">{page.pageNumber}</span>
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">Page {page.pageNumber}</h2>
                      <p className="text-blue-100 text-xs">of {totalPages} total pages</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-200 text-xs font-medium">Quality: 6.0x</span>
                  </div>
                </div>
              </div>

              {/* Watermarked Canvas Display */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 p-8">
                <div className="relative group">
                  <WatermarkedCanvas
                    imageData={page.imageData}
                    watermarkText="4Csecure"
                    pageNumber={page.pageNumber}
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
          ))}
        </div>
      </div>
    </div>
    </SecurityProvider>
  )
}

export default DocumentViewer