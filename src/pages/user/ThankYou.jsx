import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { paymentsAPI } from '../../api'

const ThankYou = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id')

      if (!sessionId) {
        setError('No payment session found')
        setVerifying(false)
        return
      }

      try {
        const response = await paymentsAPI.verifyPayment(sessionId)

        if (response.success) {
          setPaymentDetails({
            type: response.subscriptionType === 'lifetime' ? 'Lifetime Subscription' : 'Document Access',
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          })
        } else {
          setError('Payment verification failed')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setError('Failed to verify payment')
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams])

  useEffect(() => {
    if (!verifying && !error && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }

    if (countdown === 0) {
      navigate('/documents')
    }
  }, [countdown, verifying, error, navigate])

  const handleContinue = () => {
    navigate('/documents')
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#B12417]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-gradient-to-r from-[#B12417] to-[#9a1f13] hover:from-[#9a1f13] hover:to-[#821a10] text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Go to Subscription
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Success Icon & Header */}
          <div className="bg-gradient-to-r from-[#2B266F] to-[#211d57] px-8 py-12 text-center">
            {/* Animated Checkmark */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-white rounded-full flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                <svg
                  className="w-14 h-14 text-[#2B266F] animate-[check_0.5s_ease-out_0.3s_both]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-2">Thank You!</h1>
            <p className="text-white/90 text-lg">Your payment was successful</p>
          </div>

          {/* Payment Details */}
          <div className="px-8 py-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Purchase Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">{paymentDetails?.type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold text-gray-900">{paymentDetails?.date}</span>
                </div>
                <div className="border-t border-gray-300 pt-3 mt-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-[#2B266F] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>You now have full access to all premium documents with complete security protection.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-6">
              <p className="text-gray-700 text-lg mb-2">
                Welcome to your document library!
              </p>
              <p className="text-gray-500">
                Redirecting to documents in <span className="font-bold text-[#B12417]">{countdown}</span> seconds...
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-[#B12417] to-[#9a1f13] hover:from-[#9a1f13] hover:to-[#821a10] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Access Documents Now
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-300"
              >
                View Subscription Details
              </button>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-blue-50 px-8 py-4 border-t border-blue-100">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <p className="text-sm text-blue-800">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes check {
          0% {
            stroke-dashoffset: 50;
            stroke-dasharray: 50;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: 50;
          }
        }
      `}</style>
    </div>
  )
}

export default ThankYou
