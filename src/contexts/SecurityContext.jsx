import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

const SecurityContext = createContext({})

export const useSecurity = () => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}

export const SecurityProvider = ({ children }) => {
  const { user } = useAuth()
  const securityViolations = useRef(0)

  useEffect(() => {
    if (!user) return

    // Initialize only essential security measures
    initializeKeyBlocking()
    initializeScreenshotProtection()
    initializeContextMenuProtection()
    initializeSelectionProtection()

    return () => {
      // Cleanup on unmount
      console.log('🔒 4CSecure security cleaned up')
    }
  }, [user])

  const initializeKeyBlocking = () => {
    const blockDangerousKeys = (e) => {
      // Block F12 (Developer Tools)
      if (e.keyCode === 123 || e.key === 'F12') {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('F12 developer tools blocked')
        return false
      }

      // Block Ctrl+Shift+I (Inspector)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.key === 'I')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Inspector shortcut blocked')
        return false
      }

      // Block Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 74 || e.key === 'J')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Console shortcut blocked')
        return false
      }

      // Block Ctrl+U (View Source)
      if (e.ctrlKey && (e.keyCode === 85 || e.key === 'u' || e.key === 'U')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('View source blocked')
        return false
      }

      // Block Ctrl+Shift+C (Element Inspector)
      if (e.ctrlKey && e.shiftKey && (e.keyCode === 67 || e.key === 'C')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Element inspector blocked')
        return false
      }

      // Block copying shortcuts
      if (e.ctrlKey || e.metaKey) {
        const blockedKeys = ['a', 'c', 'v', 'x', 's', 'p', 'z', 'y', 'f', 'h', 'r']
        if (blockedKeys.includes(e.key.toLowerCase())) {
          e.preventDefault()
          e.stopPropagation()
          logSecurityViolation(`Keyboard shortcut Ctrl+${e.key} blocked`)
          return false
        }
      }

      // Block all function keys
      if (e.key.startsWith('F') && e.key.length > 1) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation(`Function key ${e.key} blocked`)
        return false
      }
    }

    document.addEventListener('keydown', blockDangerousKeys, true)
    document.addEventListener('keyup', blockDangerousKeys, true)
    document.addEventListener('keypress', blockDangerousKeys, true)
  }

  const initializeScreenshotProtection = () => {
    const blockScreenshots = (e) => {
      // Block Print Screen key
      if (e.keyCode === 44 || e.which === 44 || e.code === 'PrintScreen' || e.key === 'PrintScreen') {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        logSecurityViolation('Screenshot attempt blocked')
        return false
      }

      // Block Windows + Print Screen
      if ((e.metaKey || e.key === 'Meta') && (e.keyCode === 44 || e.code === 'PrintScreen')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Windows screenshot blocked')
        return false
      }

      // Block Alt + Print Screen
      if (e.altKey && (e.keyCode === 44 || e.code === 'PrintScreen')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Window screenshot blocked')
        return false
      }

      // Block Snipping Tool (Windows + Shift + S)
      if ((e.metaKey || e.key === 'Meta') && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault()
        e.stopPropagation()
        logSecurityViolation('Snipping tool blocked')
        return false
      }
    }

    document.addEventListener('keydown', blockScreenshots, true)
    document.addEventListener('keyup', blockScreenshots, true)

    // Add CSS to prevent selection and copying
    const style = document.createElement('style')
    style.textContent = `
      .security-protected * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
        -webkit-user-drag: none !important;
        -webkit-app-region: no-drag !important;
      }
    `
    document.head.appendChild(style)
  }

  const initializeContextMenuProtection = () => {
    const blockContextMenu = (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      logSecurityViolation('Context menu blocked')
      return false
    }

    document.addEventListener('contextmenu', blockContextMenu, true)
    document.addEventListener('selectstart', blockContextMenu, true)
    document.addEventListener('dragstart', blockContextMenu, true)
  }

  const initializeSelectionProtection = () => {
    // Prevent text selection
    document.addEventListener('selectstart', (e) => {
      e.preventDefault()
      return false
    }, true)

    // Prevent drag and drop
    document.addEventListener('dragstart', (e) => {
      e.preventDefault()
      return false
    }, true)

    // Prevent mouse selection
    document.addEventListener('mousedown', (e) => {
      if (e.detail > 1) { // Prevent double/triple click selection
        e.preventDefault()
        return false
      }
    }, true)
  }

  const logSecurityViolation = (violation) => {
    securityViolations.current++
    console.warn(`🔒 4CSecure: ${violation}`)
    
    // In production, you'd send this to your analytics/security service
    // analytics.track('security_violation', { 
    //   user: user?.email, 
    //   violation, 
    //   timestamp: new Date().toISOString() 
    // })
  }

  const value = {
    securityViolations: securityViolations.current,
    logSecurityViolation
  }

  return (
    <SecurityContext.Provider value={value}>
      <div className="security-protected">
        {children}
      </div>
    </SecurityContext.Provider>
  )
}