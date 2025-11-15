import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { usersAPI } from '../../api'

const Navbar = () => {
  const { user, userRole, handleLogout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Check if user has subscription
  useEffect(() => {
    const checkSubscription = async () => {
      if (user && userRole === 'user') {
        try {
          const response = await usersAPI.getPurchases()

          // Check if user has any purchases (including lifetime subscription)
          if (response && response.data && response.data.length > 0) {
            setHasSubscription(true)
          } else {
            setHasSubscription(false)
          }
        } catch (error) {
          console.error('Error checking subscription:', error)
          // Show button even if API fails (fail-open) - let Documents page handle access control
          setHasSubscription(true)
        }
      } else {
        setHasSubscription(false)
      }
    }

    checkSubscription()
  }, [user, userRole, location])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false)
      }
    }

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isProfileDropdownOpen])

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent double-clicks

    setIsSigningOut(true)
    setIsMobileMenuOpen(false) // Close mobile menu immediately

    try {
      await handleLogout()

      // Small delay to ensure auth state has updated
      setTimeout(() => {
        navigate('/')
        setIsSigningOut(false)
      }, 200)

    } catch (error) {
      console.error('Logout error:', error)
      alert(`Logout failed: ${error.message || 'Unknown error'}. Please try again.`)
      setIsSigningOut(false)
    }
  }

  return (
    <nav className="bg-white shadow-md backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center transition-all duration-300 hover:opacity-80"
            >
              <img
                src="/PNG/Horizontal_Logo.png"
                alt="4C Management BZ Services"
                className="h-5 sm:h-6 md:h-7 lg:h-8 w-auto"
              />
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="group relative p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-all duration-300 mobile-min-h-44 mobile-min-w-44"
              aria-label="Toggle mobile menu"
            >
              <div className="flex flex-col space-y-1">
                <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 transform ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-6 h-0.5 bg-gray-800 transition-all duration-300 transform ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {user ? (
              <>
                <div className="bg-gray-100 rounded-lg px-3 lg:px-4 py-2 border border-gray-300 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                    userRole === 'admin' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                  <span className="text-xs lg:text-sm text-gray-700 whitespace-nowrap">
                    <span className="font-medium">{userRole === 'admin' ? 'Admin' : 'User'}</span>
                    <span className="mx-2">|</span>
                    <span className="truncate max-w-[120px] lg:max-w-[200px] inline-block align-bottom">{user.email}</span>
                  </span>
                </div>
                {userRole === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="group relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-3 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg mobile-min-h-44"
                  >
                    <span className="relative z-10 flex items-center">
                      <svg className="w-4 h-4 mr-1 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="hidden lg:inline">Admin Panel</span>
                      <span className="lg:hidden">Admin</span>
                    </span>
                  </Link>
                )}
                {userRole === 'user' && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                      className="group relative bg-gradient-to-r from-[#B12417] to-[#2B266F] hover:from-[#8f1d12] hover:to-[#1e1a4f] text-white p-2.5 lg:p-3 rounded-full text-xs lg:text-sm font-semibold transition-all duration-300 transform hover:scale-110 hover:shadow-lg mobile-min-h-44 flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fadeIn">
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 group"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-600 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-gray-700 group-hover:text-purple-600 font-medium">Profile</span>
                        </Link>

                        {hasSubscription && (
                          <Link
                            to="/documents"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-all duration-200 group"
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-600 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-gray-700 group-hover:text-emerald-600 font-medium">Documents</span>
                          </Link>
                        )}

                        <Link
                          to="/payment-history"
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all duration-200 group"
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          <span className="text-gray-700 group-hover:text-blue-600 font-medium">Payment History</span>
                        </Link>

                        <hr className="my-2 border-gray-200" />

                        <button
                          onClick={() => {
                            setIsProfileDropdownOpen(false)
                            handleSignOut()
                          }}
                          disabled={isSigningOut}
                          className="flex items-center w-full px-4 py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSigningOut ? (
                            <svg className="animate-spin w-5 h-5 mr-3 text-gray-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 mr-3 text-gray-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          )}
                          <span className="text-gray-700 group-hover:text-red-600 font-medium">
                            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className={`group relative bg-gradient-to-r ${isSigningOut
                      ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                      : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                    } text-white px-3 lg:px-6 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300 ${
                      !isSigningOut ? 'transform hover:scale-105 hover:shadow-lg' : ''
                    } flex items-center mobile-min-h-44`}
                  >
                    {isSigningOut ? (
                      <svg className="animate-spin w-4 h-4 mr-1 lg:mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-1 lg:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    )}
                    <span className="hidden lg:inline">{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
                    <span className="lg:hidden">{isSigningOut ? '...' : 'Out'}</span>
                  </button>
                )}
              </>
            ) : null}
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      } overflow-hidden bg-gray-50 border-t border-gray-200`}>
        <div className="px-4 py-4 space-y-3">
          {user ? (
            <>
              <div className="bg-white rounded-lg p-3 border border-gray-300 shadow-sm">
                <span className="text-sm text-gray-700">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    userRole === 'admin' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                  {userRole === 'admin' ? 'Admin' : 'User'} | {user.email}
                </span>
              </div>
              {userRole === 'admin' && (
                <Link 
                  to="/admin" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 transform hover:scale-105 mobile-min-h-44 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </Link>
              )}
              {userRole === 'user' && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full bg-white hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border border-gray-200 mobile-min-h-44 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>

                  {hasSubscription && (
                    <Link
                      to="/documents"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full bg-white hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border border-gray-200 mobile-min-h-44 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Documents
                    </Link>
                  )}

                  <Link
                    to="/payment-history"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 text-gray-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 border border-gray-200 mobile-min-h-44 flex items-center"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Payment History
                  </Link>

                  <hr className="my-2 border-gray-300" />
                </>
              )}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className={`block w-full bg-gradient-to-r ${isSigningOut 
                  ? 'from-gray-400 to-gray-500 cursor-not-allowed' 
                  : 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                } text-white px-4 py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 ${
                  !isSigningOut ? 'transform hover:scale-105' : ''
                } mobile-min-h-44 flex items-center justify-center`}
              >
                {isSigningOut ? (
                  <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}

export default Navbar