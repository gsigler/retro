import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { BlinkingCursor } from '@/components/board/TypingEffect'
import { TerminalLoader } from '@/components/terminal/TerminalLoader'

type Status = 'loading' | 'error'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { theme } = useTheme()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      return
    }

    window.history.replaceState({}, '', window.location.pathname)

    login(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setStatus('error'))
  }, [searchParams, login, navigate])

  if (status === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.bg,
          padding: 16,
        }}
      >
        <div style={{ maxWidth: 480, fontFamily: 'inherit' }}>
          <p style={{ color: theme.red, fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: theme.green }}>$</span> retro auth --callback
          </p>
          <p style={{ color: theme.red, fontSize: 12, marginBottom: 16 }}>
            ERR! authentication failed
          </p>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.red,
              marginBottom: 8,
            }}
          >
            Authentication failed
          </h1>
          <p
            style={{
              color: theme.textTertiary,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            Something went wrong during sign in.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.green }}>$</span>
            <Link
              to="/login"
              style={{ color: theme.purple, textDecoration: 'none' }}
            >
              Try again
            </Link>
            <BlinkingCursor />
          </div>
        </div>
      </div>
    )
  }

  return (
    <TerminalLoader command="retro auth --callback" message="Signing you in" />
  )
}
