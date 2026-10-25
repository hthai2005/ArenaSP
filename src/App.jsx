import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import AIAssistant from './pages/AIAssistant'
import BookingForm from './pages/BookingForm'
import BookingSimpleForm from './pages/BookingSimpleForm'
import Dashboard from './pages/Dashboard'
import Equipment from './pages/Equipment'
import Forbidden from './pages/Forbidden'
import Halls from './pages/Halls'
import Login from './pages/Login'
import MyBookings from './pages/MyBookings'
import Portal from './pages/Portal'
import Register from './pages/Register'
import ScheduleView from './pages/ScheduleView'
import Stadiums from './pages/Stadiums'
import StatusUpdate from './pages/StatusUpdate'

function RoleHome() {
  const { user } = useAuth()
  if (user.role === 'user') return <Navigate to="/portal" replace />
  return <Dashboard />
}

function Fallback() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'user' ? '/portal' : '/'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RoleHome />} />
        <Route
          path="/stadiums"
          element={
            <ProtectedRoute roles={['admin']}>
              <Stadiums />
            </ProtectedRoute>
          }
        />
        <Route path="/halls" element={<Halls />} />
        <Route
          path="/equipment"
          element={
            <ProtectedRoute roles={['admin', 'staff']}>
              <Equipment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/status"
          element={
            <ProtectedRoute roles={['staff']}>
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
        <Route path="/schedule" element={<ScheduleView />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute roles={['user']}>
              <MyBookings />
            </ProtectedRoute>
          }
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
        <Route path="/ai-assistant" element={<AIAssistant />} />
        <Route path="/403" element={<Forbidden />} />
      </Route>
      <Route path="*" element={<Fallback />} />
    </Routes>
  )
}
