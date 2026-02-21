import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { BlinkingCursor } from '@/components/board/TypingEffect'

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, isLoading } = useAuth()
  const { theme } = useTheme()

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
        }}
      >
        <div>
          <p
            style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}
          >
            <span style={{ color: theme.green }}>$</span> retro session --verify
          </p>
          <p style={{ color: theme.green, fontSize: 13 }}>
            Loading...
            <BlinkingCursor />
          </p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
