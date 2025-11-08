import React, { useEffect, useRef } from 'react'

const WatermarkedCanvas = ({ 
  imageData, 
  watermarkText = "4Csecure", 
  pageNumber, 
  totalPages, 
  className = "",
  style = {},
  userEmail = null,
  userId = null 
}) => {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!imageData || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Set canvas dimensions to match image
        canvas.width = img.width
        canvas.height = img.height

        // Enable high-quality canvas rendering
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.textRenderingOptimization = 'optimizeQuality'

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw the original image with high quality
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Add comprehensive watermark overlay
        addWatermarkOverlay(ctx, canvas.width, canvas.height, watermarkText, userEmail, userId)

        // Add page number if multi-page
        if (totalPages > 1) {
          addPageNumber(ctx, canvas.width, pageNumber, totalPages)
        }
      } catch (error) {
        console.error('Error rendering canvas:', error)
      }
    }

    img.onerror = (error) => {
      console.error('Error loading image:', error)
    }

    // Add crossOrigin to handle CORS issues
    img.crossOrigin = 'anonymous'
    img.src = imageData
  }, [imageData, watermarkText, pageNumber, totalPages, userEmail, userId])

  const addWatermarkOverlay = (ctx, width, height, text, userEmail, userId) => {
    // Save current context
    ctx.save()

    // Main watermark (corner)
    ctx.globalAlpha = 0.7
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'

    const padding = 20
    const x = width - padding
    const y = height - padding

    // Draw main watermark with stroke
    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)

    // User-specific watermarks (multiple positions)
    if (userEmail) {
      // Semi-transparent user email watermarks
      ctx.globalAlpha = 0.15
      ctx.fillStyle = '#ff0000'
      ctx.font = 'bold 16px Arial'
      
      // Top-left user watermark
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      const userText = `${userEmail} • ${new Date().toLocaleDateString()}`
      ctx.fillText(userText, 20, 20)
      
      // Center diagonal watermarks
      ctx.globalAlpha = 0.08
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      const centerX = width / 2
      const centerY = height / 2
      
      // Rotate and add multiple diagonal watermarks
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(-Math.PI / 6) // -30 degrees
      ctx.fillText(`${text} • ${userEmail}`, 0, 0)
      ctx.restore()
      
      ctx.save()
      ctx.translate(centerX, centerY - 100)
      ctx.rotate(Math.PI / 6) // 30 degrees  
      ctx.fillText(`${text} • ${userEmail}`, 0, 0)
      ctx.restore()
      
      ctx.save()
      ctx.translate(centerX, centerY + 100)
      ctx.rotate(-Math.PI / 4) // -45 degrees
      ctx.fillText(`${text} • ${userEmail}`, 0, 0)
      ctx.restore()
    }

    // Invisible tracking watermark (for forensics)
    if (userId) {
      ctx.globalAlpha = 0.01 // Nearly invisible
      ctx.fillStyle = '#000001'
      ctx.font = '8px Arial'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillText(`ID:${userId}:${Date.now()}`, 5, height - 5)
    }

    // Timestamp watermark
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#666666'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    const timestamp = new Date().toLocaleString()
    ctx.fillText(`Viewed: ${timestamp}`, width - 10, 10)

    // Restore context
    ctx.restore()
  }

  const addPageNumber = (ctx, width, pageNumber, totalPages) => {
    // Save current context
    ctx.save()

    // Set page number style
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    const text = `Page ${pageNumber} of ${totalPages}`
    const padding = 12
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width
    const textHeight = 20

    // Draw background rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.fillRect(
      padding, 
      padding, 
      textWidth + padding * 2, 
      textHeight + padding
    )

    // Draw text
    ctx.fillStyle = '#ffffff'
    ctx.fillText(text, padding * 2, padding * 2)

    // Restore context
    ctx.restore()
  }

  // Comprehensive security event handlers
  const handleContextMenu = (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const handleDragStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const handleSelectStart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    return false
  }

  const handleKeyDown = (e) => {
    // Block common shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Prevent Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+S, Ctrl+P, etc.
      if (['a', 'c', 'v', 's', 'p', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
    
    // Block F12, F11, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' || e.key === 'F11' || 
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && e.key === 'U')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    
    // Block screenshot keys - comprehensive protection
    if (e.key === 'PrintScreen' || 
        e.keyCode === 44 || 
        e.which === 44 ||
        e.code === 'PrintScreen') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Block Windows + PrintScreen (Windows screenshot)
    if ((e.metaKey || e.key === 'Meta') && e.key === 'PrintScreen') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Block Alt + PrintScreen (window screenshot)
    if (e.altKey && e.key === 'PrintScreen') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Block Shift + Windows + S (Windows Snipping Tool)
    if (e.shiftKey && (e.metaKey || e.key === 'Meta') && e.key === 'S') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Block all function keys for additional security
    if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    
    // Block Escape key
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-auto ${className}`}
      style={{
        minHeight: '80vh',
        objectFit: 'contain',
        backgroundColor: 'white',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
        pointerEvents: 'auto',
        imageRendering: 'pixelated',
        WebkitImageRendering: 'crisp-edges',
        MozImageRendering: 'crisp-edges',
        WebkitUserDrag: 'none',
        WebkitAppRegion: 'no-drag',
        ...style
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onSelectStart={handleSelectStart}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Make focusable for key events
      onCopy={(e) => { e.preventDefault(); return false; }}
      onCut={(e) => { e.preventDefault(); return false; }}
      onPaste={(e) => { e.preventDefault(); return false; }}
    />
  )
}

export default WatermarkedCanvas