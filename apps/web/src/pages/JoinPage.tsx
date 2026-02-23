import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { joinTeam } from '@/lib/api'
import { TerminalLoader } from '@/components/terminal/TerminalLoader'
import { BlinkingCursor } from '@/components/board/TypingEffect'

const PENDING_INVITE_KEY = 'retro_pending_invite'

export function setPendingInvite(code: string) {
  localStorage.setItem(PENDING_INVITE_KEY, code)
}

export function consumePendingInvite(): string | null {
  const code = localStorage.getItem(PENDING_INVITE_KEY)
  if (code) localStorage.removeItem(PENDING_INVITE_KEY)
  return code
}

type Status = 'loading' | 'joining' | 'error' | 'redirect'

export default function JoinPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme } = useTheme()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMsg, setErrorMsg] = useState('Something went wrong')

  const code = searchParams.get('code')

  useEffect(() => {
    if (!code) {
      setErrorMsg('No invite code provided')
      setStatus('error')
      return
    }

    if (!user) {
      setPendingInvite(code)
      setStatus('redirect')
      navigate('/login', { replace: true })
      return
    }

    setStatus('joining')
    joinTeam(code)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => {
        setErrorMsg('Invalid or expired invite link')
        setStatus('error')
      })
  }, [code, user, navigate])

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
            <span style={{ color: theme.green }}>$</span> retro team --join
          </p>
          <p style={{ color: theme.red, fontSize: 12, marginBottom: 16 }}>
            ERR! {errorMsg}
          </p>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: theme.red,
              marginBottom: 8,
            }}
          >
            Could not join team
          </h1>
          <p
            style={{
              color: theme.textTertiary,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {errorMsg}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: theme.green }}>$</span>
            <Link
              to="/dashboard"
              style={{ color: theme.purple, textDecoration: 'none' }}
            >
              Go to dashboard
            </Link>
            <BlinkingCursor />
          </div>
        </div>
      </div>
    )
  }

  return <TerminalLoader command="retro team --join" message="Joining team" />
}
