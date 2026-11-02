import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
// Login/Register load ngay (không cần auth, cần nhanh)
import Login from './pages/Login'
import Register from './pages/Register'
import Forbidden from './pages/Forbidden'
// Các page nặng dùng lazy loading -> giảm initial bundle
const AIAssistant       = lazy(() => import('./pages/AIAssistant'))
const AdminUsers        = lazy(() => import('./pages/AdminUsers'))
const BookingForm       = lazy(() => import('./pages/BookingForm'))
const BookingSimpleForm = lazy(() => import('./pages/BookingSimpleForm'))
const Dashboard         = lazy(() => import('./pages/Dashboard'))
const Equipment         = lazy(() => import('./pages/Equipment'))
const Halls             = lazy(() => import('./pages/Halls'))
const MyBookings        = lazy(() => import('./pages/MyBookings'))
const Portal            = lazy(() => import('./pages/Portal'))
const ScheduleView      = lazy(() => import('./pages/ScheduleView'))
const Stadiums          = lazy(() => import('./pages/Stadiums'))
const StatusUpdate      = lazy(() => import('./pages/StatusUpdate'))

function RoleHome() {
  const { user } = useAuth()

  if (user.role === 'user') {
    return <Navigate to="/portal" replace />
  }

  return <Dashboard />
}

function Fallback() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to={user.role === 'user' ? '/portal' : '/'}
      replace
    />
  )
}

function PageFallback() {
  return (
    <div style={{ padding: '40px 28px', color: 'var(--muted)', fontSize: 14 }}>
      Đang tải trang...
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/"
          element={<RoleHome />}
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/stadiums"
          element={
            <ProtectedRoute
              roles={[
                'admin',
                'manager',
                'staff',
              ]}
            >
              <Stadiums />
            </ProtectedRoute>
          }
        />

        <Route
          path="/halls"
          element={<Halls />}
        />

        <Route
          path="/equipment"
          element={
            <ProtectedRoute
              roles={[
                'admin',
                'manager',
                'staff',
              ]}
            >
              <Equipment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/status"
          element={
            <ProtectedRoute
              roles={[
                'admin',
                'manager',
                'staff',
              ]}
            >
              <StatusUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal"
          element={
            <ProtectedRoute roles={['user']}>
              <Portal />
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={<ScheduleView />}
        />

        <Route
          path="/my-bookings"
          element={<MyBookings />}
        />

        <Route
          path="/booking/simple"
          element={
            <ProtectedRoute roles={['user']}>
              <BookingSimpleForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/booking/new"
          element={
            <ProtectedRoute roles={['user']}>
              <BookingForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-assistant"
          element={<AIAssistant />}
        />

        <Route
          path="/403"
          element={<Forbidden />}
        />
      </Route>

      <Route
        path="*"
        element={<Fallback />}
      />
    </Routes>
    </Suspense>
  )
}

