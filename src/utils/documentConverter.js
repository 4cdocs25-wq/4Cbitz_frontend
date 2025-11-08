import * as pdfjs from 'pdfjs-dist'

// Configure PDF.js worker - use local version to avoid conflicts
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString()

/**
 * Convert specific PDF page to image for visual accuracy
 * @param {string} pdfUrl - URL of the PDF file
 * @param {number} pageNumber - Specific page number to convert (1-based)
 * @param {number} scale - Scale factor for rendering (default: 1.8 for high quality)
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @param {boolean} isPreview - Whether this is a fast preview or final quality
 * @returns {Promise<object>} Object with page image and metadata
 */
export const convertPdfPageToImage = async (pdfUrl, pageNumber, scale = 1.8, signal = null, isPreview = false) => {
  try {
    // Dynamic timeout based on quality level
    const timeoutDuration = isPreview ? 5000 : 12000 // 5s for preview, 12s for final quality
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF conversion timeout'))
      }, timeoutDuration)
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('PDF conversion aborted'))
        })
      }
    })

    // Load the PDF document with timeout
    const loadingTask = pdfjs.getDocument(pdfUrl)
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise])
    
    // Check if operation was aborted
    if (signal?.aborted) {
      throw new Error('PDF conversion aborted')
    }

    // Get the specific page
    const page = await pdf.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    
    // Check if operation was aborted
    if (signal?.aborted) {
      throw new Error('PDF conversion aborted')
    }
    
    // Create high-quality canvas
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    // Set canvas dimensions
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // Dynamic quality based on preview vs final
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = isPreview ? 'medium' : 'high'
    
    // Optimize for text rendering in final quality
    if (!isPreview) {
      context.textRenderingOptimization = 'optimizeQuality'
    }
    
    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      intent: 'display'
    }
    
    const renderPromise = page.render(renderContext).promise
    await Promise.race([renderPromise, timeoutPromise])
    
    // Convert canvas with appropriate compression
    const pngQuality = isPreview ? 0.8 : 1.0 // Lower compression for preview, no compression for final
    const imageDataUrl = canvas.toDataURL('image/png', pngQuality)
    
    // Clean up canvas
    canvas.remove()
    
    return {
      pageNumber: pageNumber,
      imageData: imageDataUrl,
      width: viewport.width,
      height: viewport.height,
      originalWidth: page.view[2],
      originalHeight: page.view[3],
      totalPages: pdf.numPages,
      success: true,
      isPreview: isPreview,
      scale: scale
    }
    
  } catch (error) {
    console.error(`❌ Error converting page ${pageNumber}:`, error.message)
    throw new Error(`Failed to convert page ${pageNumber}: ${error.message}`)
  }
}

/**
 * Get PDF metadata without converting pages
 * @param {string} pdfUrl - URL of the PDF file
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<object>} PDF metadata
 */
export const getPdfMetadata = async (pdfUrl, signal = null) => {
  try {
    console.log('📄 Loading PDF metadata from:', pdfUrl)
    
    // Shorter timeout for metadata - 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF metadata timeout'))
      }, 10000)
      
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout)
          reject(new Error('PDF metadata request aborted'))
        })
      }
    })

    const loadingTask = pdfjs.getDocument(pdfUrl)
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise])
    
    return {
      totalPages: pdf.numPages,
      success: true
    }
  } catch (error) {
    console.error('❌ Error getting PDF metadata:', error.message)
    return {
      totalPages: 0,
      success: false,
      error: error.message
    }
  }
}

/**
 * Convert PDF pages to images for visual accuracy (LEGACY - for full conversion)
 * @param {string} pdfUrl - URL of the PDF file
 * @param {number} scale - Scale factor for rendering (default: 1.8 for high quality)
 * @returns {Promise<object>} Object with page images and metadata
 */
export const convertPdfToImages = async (pdfUrl, scale = 1.8, onProgress = null) => {
  try {
    console.log('📄 Loading PDF from:', pdfUrl)
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(pdfUrl)
    const pdf = await loadingTask.promise
    
    console.log('✅ PDF loaded successfully, pages:', pdf.numPages)
    
    let pages = []
    
    // Convert each page to canvas/image
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      // Report progress if callback provided (before processing page)
      if (onProgress) {
        const progressPercent = Math.round(((pageNum - 1) / pdf.numPages) * 100)
        onProgress(progressPercent, pageNum, pdf.numPages)
      }
      
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      
      // Create high-quality canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // Enable high-quality rendering
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.textRenderingOptimization = 'optimizeQuality'
      
      // Render page to canvas with high quality
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        intent: 'display'
      }
      
      await page.render(renderContext).promise
      
      // Convert canvas to high-quality PNG
      const imageDataUrl = canvas.toDataURL('image/png', 1.0) // Maximum quality
      
      pages.push({
        pageNumber: pageNum,
        imageData: imageDataUrl,
        width: viewport.width,
        height: viewport.height,
        originalWidth: page.view[2],
        originalHeight: page.view[3]
      })
      
      // Clean up canvas
      canvas.remove()
      
      // Report progress after completing page
      if (onProgress) {
        const progressPercent = Math.round((pageNum / pdf.numPages) * 100)
        onProgress(progressPercent, pageNum, pdf.numPages)
      }
    }
    
    console.log('✅ PDF converted to images successfully')
    return {
      pages,
      totalPages: pdf.numPages,
      success: true,
      renderScale: scale
    }
    
  } catch (error) {
    console.error('❌ Error converting PDF to images:', error)
    throw new Error('Failed to convert PDF to images: ' + error.message)
  }
}

/**
 * Convert various document types to images
 * @param {string} fileUrl - URL of the document
 * @param {string} fileType - Type of the document (pdf, txt, etc.)
 * @returns {Promise<object>} Document data
 */
export const convertDocumentToImages = async (fileUrl, fileType = 'pdf', onProgress = null) => {
  try {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return await convertPdfToImages(fileUrl, 3.0, onProgress) // Ultra high quality scale
      
      case 'txt':
      case 'text':
        // For text files, create a simple image representation
        const response = await fetch(fileUrl)
        const textContent = await response.text()
        
        // Create a canvas with the text content
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = 800
        canvas.height = Math.max(600, textContent.split('\n').length * 20 + 100)
        
        // Style the canvas
        context.fillStyle = 'white'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = 'black'
        context.font = '16px monospace'
        
        // Draw text line by line
        const lines = textContent.split('\n')
        lines.forEach((line, index) => {
          context.fillText(line, 20, 30 + (index * 20))
        })
        
        const imageDataUrl = canvas.toDataURL('image/png', 0.95)
        canvas.remove()
        
        return {
          pages: [{
            pageNumber: 1,
            imageData: imageDataUrl,
            width: canvas.width,
            height: canvas.height
          }],
          totalPages: 1,
          success: true,
          renderScale: 1.0
        }
      
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  } catch (error) {
    console.error('❌ Error converting document:', error)
    return {
      pages: [],
      totalPages: 0,
      success: false,
      error: error.message
    }
  }
}