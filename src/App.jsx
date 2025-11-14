import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import AdminLogin from './pages/auth/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import DocumentManagerPage from './pages/admin/DocumentManagerPage'
import AdminDocumentViewer from './pages/admin/AdminDocumentViewer'
import TransactionsPage from './pages/admin/TransactionsPage'
import UsersManagementPage from './pages/admin/UsersManagementPage'
import PricingPage from './pages/admin/PricingPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import UserDashboard from './pages/user/UserDashboard'
import Subscription from './pages/user/Subscription'
import Documents from './pages/user/Documents'
import DocumentViewer from './pages/user/DocumentViewer'
import ProfileCompletion from './pages/user/ProfileCompletion'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Admin Login (Public) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents"
              element={
                <ProtectedRoute requiredRole="admin">
                  <DocumentManagerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/transactions"
              element={
                <ProtectedRoute requiredRole="admin">
                  <TransactionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/documents/view/:id"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDocumentViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/pricing"
              element={
                <ProtectedRoute requiredRole="admin">
                  <PricingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminSettingsPage />
                </ProtectedRoute>
              }
            />

            {/* User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="user">
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-completion"
              element={
                <ProtectedRoute requiredRole="user">
                  <ProfileCompletion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscription"
              element={
                <ProtectedRoute requiredRole="user">
                  <Subscription />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute requiredRole="user">
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:id"
              element={
                <ProtectedRoute requiredRole="user">
                  <DocumentViewer />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App