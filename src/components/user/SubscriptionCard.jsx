import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SubscriptionCard = ({ subscription, onSubscriptionActivated }) => {
  const { user } = useAuth()
  const [activating, setActivating] = useState(false)

  const handleSubscribe = async () => {
    setActivating(true)
    try {
      // For now, we'll just create a lifetime subscription record
      // In future, this will integrate with payment gateway
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            plan_type: 'lifetime',
            status: 'active',
            start_date: new Date().toISOString(),
            end_date: null // lifetime subscription
          }
        ])
        .select()
        .single()

      if (error) throw error

      onSubscriptionActivated(data)
      alert('Subscription activated successfully! You now have lifetime access to all documents.')
    } catch (error) {
      console.error('Error activating subscription:', error)
      alert('Error activating subscription: ' + error.message)
    } finally {
      setActivating(false)
    }
  }

  const hasActiveSubscription = subscription && subscription.status === 'active'

  if (hasActiveSubscription) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800">Lifetime Subscription Active</h3>
            <p className="text-sm text-green-700 mt-1">
              You have unlimited access to all documents. Activated on {new Date(subscription.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Lifetime Access</h3>
        <p className="text-gray-600 mb-6">
          Get unlimited access to all documents with our one-time payment
        </p>
        
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
          <div className="text-4xl font-bold mb-2">₹999</div>
          <div className="text-lg opacity-90">One-time payment</div>
        </div>

        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Unlimited document access</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Download and view all files</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">No recurring payments</span>
          </div>
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-700">Future document updates included</span>
          </div>
        </div>

        <button
          onClick={handleSubscribe}
          disabled={activating}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {activating ? 'Activating...' : 'Subscribe Now (Demo Mode)'}
        </button>
        
        <p className="text-xs text-gray-500 mt-3">
          Demo Mode: Payment integration will be added in future phases
        </p>
      </div>
    </div>
  )
}

export default SubscriptionCard