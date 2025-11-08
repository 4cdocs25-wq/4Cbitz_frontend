import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

const Layout = ({ children }) => {
  const location = useLocation()
  const isHomePage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className={isHomePage ? '' : 'max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'}>
        {children}
      </main>
    </div>
  )
}

export default Layout