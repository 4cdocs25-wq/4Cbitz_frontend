import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/layout/Layout'
import AdminLayout from './components/layout/AdminLayout'
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
import Profile from './pages/user/Profile'
import PaymentHistory from './pages/user/PaymentHistory'
import ThankYou from './pages/user/ThankYou'
import PublicDocument from './pages/PublicDocument'
import NotFound from './pages/NotFound'

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Admin Login (Public) */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes with AdminLayout */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="documents" element={<DocumentManagerPage />} />
              <Route path="documents/view/:id" element={<AdminDocumentViewer />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="pricing" element={<PricingPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

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
              path="/profile"
              element={
                <ProtectedRoute requiredRole="user">
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-history"
              element={
                <ProtectedRoute requiredRole="user">
                  <PaymentHistory />
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
              path="/thank-you"
              element={
                <ProtectedRoute requiredRole="user">
                  <ThankYou />
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

            {/* Public Document Access (No Authentication Required) */}
            <Route path="/public/:token" element={<PublicDocument />} />

            {/* 404 Not Found - Catch all undefined routes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App