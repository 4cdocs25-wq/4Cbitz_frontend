import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { loadStripe } from '@stripe/stripe-js'
import { paymentsAPI, usersAPI, settingsAPI } from '../../api'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const Subscription = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(true)
  const [price, setPrice] = useState(null)

  useEffect(() => {
    checkSubscriptionStatus()
    fetchPrice()
  }, [])

  const fetchPrice = async () => {
    try {
      const response = await settingsAPI.getPublicByKey('lifetime_subscription_price')
      if (response.success && response.data) {
        setPrice(response.data.value)
      }
    } catch (error) {
      console.error('Error fetching price:', error)
      // Keep default price of 29.99 if fetch fails
    }
  }

  const checkSubscriptionStatus = async () => {
    try {
      const response = await usersAPI.getPurchases()
      if (response.success && response.data) {
        // Check if user has any purchases (lifetime subscription)
        setHasSubscription(response.data.length > 0)
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      // Note: We're not specifying a document ID - backend will handle lifetime access
      // Call backend API to create Stripe Checkout session
      const response = await paymentsAPI.createCheckout()

      if (response.success && response.data?.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl
      } else {
        throw new Error(response.message || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed: ' + (error.message || 'Please try again'))
      setIsProcessing(false)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-700 to-red-800 px-4 py-10 md:py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-red-500/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-red-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>

        <div className="relative z-10 mx-auto max-w-7xl text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Unlock Premium Access
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-red-100">
            Get lifetime access to all business setup documents and resources
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative -mt-12 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* Pricing Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden">
          {/* Ribbon */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 text-center">
            <p className="text-sm font-semibold">🎉 One-Time Payment • Lifetime Access • No Recurring Fees</p>
          </div>

          <div className="p-8 sm:p-12">
            {/* Price */}
            <div className="text-center mb-10">
              <div className="inline-block bg-gradient-to-r from-red-600 to-red-700 rounded-2xl px-8 py-6 mb-6">
                <div className="text-5xl sm:text-6xl font-bold text-white mb-2">
                  {price ? `$${price}` : '$00.00'}
                </div>
                <div className="text-red-100 text-lg">One-time payment</div>
              </div>
              <p className="text-gray-600 text-lg">Lifetime access • No hidden fees</p>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">All Premium Documents</h3>
                  <p className="text-gray-600 text-sm">Access entire library instantly</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Secure Viewing</h3>
                  <p className="text-gray-600 text-sm">Protected against copying</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Regular Updates</h3>
                  <p className="text-gray-600 text-sm">New content added monthly</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Priority Support</h3>
                  <p className="text-gray-600 text-sm">Get help when you need it</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Money-Back Guarantee</h3>
                  <p className="text-gray-600 text-sm">30-day refund policy</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">No Hidden Fees</h3>
                  <p className="text-gray-600 text-sm">Pay once, access forever</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
                </div>
              ) : hasSubscription ? (
                /* Already Subscribed */
                <div className="space-y-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="flex justify-center mb-4">
                      <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">You're Already Subscribed!</h3>
                    <p className="text-green-700 mb-6">You have lifetime access to all premium documents</p>
                    <button
                      onClick={() => navigate('/documents')}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      View All Documents →
                    </button>
                  </div>
                </div>
              ) : (
                /* Not Subscribed - Show Payment Button */
                <>
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform shadow-lg ${
                      isProcessing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-105 hover:shadow-xl text-white'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        <span>Pay with Stripe</span>
                      </div>
                    )}
                  </button>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 pt-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Secure Payment • SSL Encrypted</span>
                  </div>
                </>
              )}
            </div>

            {/* User Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-center text-gray-600">
                Logged in as: <span className="font-semibold text-gray-900">{user?.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-gray-900">1000+</div>
            <div className="text-gray-600 text-sm">Happy Customers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">50+</div>
            <div className="text-gray-600 text-sm">Documents</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">100%</div>
            <div className="text-gray-600 text-sm">Satisfaction</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Subscription
