import { Route, Routes } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemePicker } from '@/components/ThemePicker'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import BoardPage from '@/pages/BoardPage'
import ProtectedRoute from '@/components/ProtectedRoute'

function TitleBar() {
  const { theme } = useTheme()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: theme.dotRed,
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: theme.dotYellow,
            }}
          />
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: theme.dotGreen,
            }}
          />
        </div>
        <span
          style={{ color: theme.textTertiary, fontSize: 12, fontWeight: 600 }}
        >
          retro
        </span>
      </div>
      <ThemePicker />
    </div>
  )
}

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
      <TitleBar />
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
