import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const UserDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect user to subscription page
    navigate('/subscription')
  }, [navigate])

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-gray-900">Redirecting to subscription...</h1>
      </div>
    </div>
  )
}

export default UserDashboard