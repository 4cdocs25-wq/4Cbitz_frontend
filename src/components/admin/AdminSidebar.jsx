import { Link, useLocation } from 'react-router-dom'
import { useSidebar } from '../../contexts/SidebarContext'

// Icon components
const HomeIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const FolderDocumentIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6" />
  </svg>
)

const BanknotesIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const PricingIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const SettingsIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const AdminSidebar = () => {
  const location = useLocation()
  const { isSidebarOpen, isSidebarCollapsed, closeSidebar } = useSidebar()

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin',
      icon: HomeIcon,
      exact: true
    },
    {
      name: 'Document Manager',
      path: '/admin/documents',
      icon: FolderDocumentIcon
    },
    {
      name: 'Transactions',
      path: '/admin/transactions',
      icon: BanknotesIcon
    },
    {
      name: 'Users',
      path: '/admin/users',
      icon: UsersIcon
    },
    {
      name: 'Pricing',
      path: '/admin/pricing',
      icon: PricingIcon
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: SettingsIcon
    }
  ]

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path
    }
    return location.pathname.startsWith(item.path)
  }

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          flex-shrink-0
          fixed top-[73px] bottom-0 left-0 z-40
          bg-white shadow-lg
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64
        `}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className={`p-6 border-b border-gray-200 ${isSidebarCollapsed ? 'lg:p-4' : ''}`}>
            {!isSidebarCollapsed && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
                  {/* Close button for mobile */}
                  <button
                    onClick={closeSidebar}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close sidebar"
                  >
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">Manage your platform</p>
              </>
            )}

            {isSidebarCollapsed && (
              <div className="hidden lg:flex justify-center">
                <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto p-4 ${isSidebarCollapsed ? 'lg:p-2' : ''}`}>
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        closeSidebar()
                      }
                    }}
                    className={`
                      group relative flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${active
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-red-600'
                      }
                      ${isSidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                    `}
                    title={isSidebarCollapsed ? item.name : ''}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className={`font-medium ${isSidebarCollapsed ? 'lg:hidden' : ''}`}>
                      {item.name}
                    </span>

                    {/* Tooltip for collapsed state */}
                    {isSidebarCollapsed && (
                      <div className="hidden lg:block absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          {!isSidebarCollapsed && (
            <div className="p-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p className="font-semibold mb-1">Quick Stats</p>
                <p>Platform Version 1.0</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export default AdminSidebar
