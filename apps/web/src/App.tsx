import { Route, Routes } from 'react-router'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import BoardPage from '@/pages/BoardPage'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/retros/:retroId/board"
        element={
          <ProtectedRoute>
            <BoardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
