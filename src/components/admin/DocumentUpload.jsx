import React, { useState } from 'react'
import { documentsAPI } from '../../api'
import { useAuth } from '../../contexts/AuthContext'

const DocumentUpload = ({ onDocumentUploaded }) => {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file: null
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        alert('File size exceeds 500MB limit. Please select a smaller PDF file.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "") // Auto-fill title if empty
      }))
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      
      // Check file size (500MB limit)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        alert('File size exceeds 500MB limit. Please select a smaller PDF file.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.file || !formData.title) return

    setUploading(true)
    setUploadProgress(0)

    let progressInterval = null

    try {
      // Simulate progress for better UX
      let currentProgress = 0
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 10
        if (currentProgress < 90) {
          setUploadProgress(Math.min(currentProgress, 90))
        }
      }, 300)

      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('file', formData.file)
      uploadData.append('title', formData.title)
      uploadData.append('description', formData.description)

      // Upload document through backend API
      const response = await documentsAPI.upload(uploadData)

      // Clear progress interval
      if (progressInterval) clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.success && response.data) {
        // Success - reset form after brief delay
        setTimeout(() => {
          onDocumentUploaded(response.data)
          setFormData({ title: '', description: '', file: null })
          setUploadProgress(0)
          setUploading(false)

          // Reset file input
          const fileInput = document.getElementById('file-upload')
          if (fileInput) fileInput.value = ''
        }, 1000)
      } else {
        throw new Error(response.message || 'Upload failed')
      }

    } catch (error) {
      if (progressInterval) clearInterval(progressInterval)

      console.error('Error uploading document:', error)

      // Provide helpful error messages
      let errorMessage = 'Error uploading document: '

      if (error.message?.includes('413') || error.message?.includes('too large')) {
        errorMessage += 'File is too large. Please try a smaller file or compress the PDF.'
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorMessage += 'You are not authorized. Please ensure you are logged in as an admin.'
      } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        errorMessage += 'Permission denied. Only admin users can upload documents.'
      } else {
        errorMessage += error.message || 'Unknown error occurred. Please try again.'
      }

      alert(errorMessage)
      setUploadProgress(0)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.834-1.962-.834-2.732 0L4.072 16.5c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-amber-800">
              Important: PDF Files Only
            </h3>
            <p className="mt-1 text-sm text-amber-700">
              To ensure secure document viewing with watermark protection, only PDF files can be uploaded. 
              Other formats (DOC, DOCX, TXT) cannot be converted to the secure viewing format.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">
            PDF Document *
          </label>
          
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
              dragActive
                ? 'border-blue-400 bg-blue-50 scale-105'
                : formData.file
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              onChange={handleFileChange}
              required
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf"
            />
            
            {formData.file ? (
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="font-medium text-green-700 truncate max-w-full px-4">{formData.file.name}</p>
                <p className="text-sm text-green-600">{formatFileSize(formData.file.size)}</p>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                  className="text-xs text-red-600 hover:text-red-700 underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-700">
                  Drop your PDF here, or{' '}
                  <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-sm text-gray-500">
                  Only PDF files are supported (up to 500MB)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
              Document Title *
            </label>
            <div className="relative">
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter document title"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description
            </label>
            <div className="relative">
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add a description to help users understand this document"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 placeholder-gray-400 resize-none"
              />
              <div className="absolute top-3 right-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !formData.file || !formData.title}
            className="relative overflow-hidden group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <span className="relative z-10 flex items-center">
              {uploading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Document
                </>
              )}
            </span>
            
            {uploading && (
              <div 
                className="absolute inset-0 bg-white/20 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default DocumentUpload