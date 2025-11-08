import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, userRole, loading } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: State changed', {
      loading,
      hasUser: !!user,
      userRole,
      requiredRole
    })

    // Show timeout message after 8 seconds of loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ ProtectedRoute: Loading timeout - still loading after 8 seconds')
        setShowTimeout(true)
      }
    }, 8000)

    return () => clearTimeout(timeoutId)
  }, [loading, user, userRole, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 mx-auto rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
          </div>
          <div className="text-lg font-medium text-gray-700 mb-2">
            {showTimeout ? 'Still loading...' : 'Loading...'}
          </div>
          <div className="text-sm text-gray-500">
            {showTimeout ? (
              <>
                <p className="mb-2">This is taking longer than usual.</p>
                <p>Check the browser console for details.</p>
              </>
            ) : (
              'Please wait'
            )}
          </div>
        </div>
      </div>
    )
  }

  console.log('🛡️ ProtectedRoute: Loading complete, checking access...')

  if (!user) {
    console.log('🛡️ ProtectedRoute: No user, redirecting to /')
    return <Navigate to="/" />
  }

  if (requiredRole && userRole !== requiredRole) {
    console.log('🛡️ ProtectedRoute: Role mismatch, redirecting to /', {
      required: requiredRole,
      actual: userRole
    })
    return <Navigate to="/" />
  }

  console.log('🛡️ ProtectedRoute: Access granted, rendering children')
  return children
}

export default ProtectedRoute