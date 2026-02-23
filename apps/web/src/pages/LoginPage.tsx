import { Link } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { BlinkingCursor } from '@/components/board/TypingEffect'
import { AsciiLogo } from '@/components/AsciiLogo'

export default function LoginPage() {
  const { theme } = useTheme()
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Window chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
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
          <span style={{ color: theme.textTertiary, fontSize: 12 }}>
            retroation — login
          </span>
        </div>

        {/* Terminal body */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <AsciiLogo size="sm" />
          </div>

          <p
            style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}
          >
            <span style={{ color: theme.green }}>$</span> retroation auth
          </p>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: theme.textPrimary,
              marginBottom: 4,
            }}
          >
            Sign in to Retroation
          </h1>
          <p
            style={{
              fontSize: 12,
              color: theme.textTertiary,
              marginBottom: 24,
            }}
          >
            Use your Google account to continue
          </p>

          <p
            style={{
              fontSize: 11,
              color: theme.textTertiary,
              marginBottom: 12,
            }}
          >
            <span style={{ color: theme.yellow }}>?</span> Select authentication
            provider:
          </p>
          <a
            href={`${apiUrl}/auth/google`}
            style={{ marginBottom: 20, display: 'block' }}
          >
            <TerminalButton variant="submit" style={{ width: '100%' }}>
              Sign in with Google
            </TerminalButton>
          </a>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
            }}
          >
            <span style={{ color: theme.green }}>$</span>
            <Link
              to="/"
              style={{ color: theme.textTertiary, textDecoration: 'none' }}
            >
              Back to home
            </Link>
            <BlinkingCursor />
          </div>
        </div>
      </div>
    </div>
  )
}
