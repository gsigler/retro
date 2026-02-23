import { Route, Routes } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import BoardPage from '@/pages/BoardPage'
import ProtectedRoute from '@/components/ProtectedRoute'

function AppShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <div
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function App() {
  const { theme } = useTheme()

  return (
    <div
      style={{
        background: theme.bg,
        color: theme.textPrimary,
        minHeight: '100vh',
      }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <DashboardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/retros/:retroId/board"
          element={
            <ProtectedRoute>
              <AppShell>
                <BoardPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
