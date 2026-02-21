import { Link } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { BlinkingCursor } from '@/components/board/TypingEffect'
import { ThemePicker } from '@/components/ThemePicker'
import { AsciiLogo } from '@/components/AsciiLogo'

const features = [
  {
    cmd: 'insights',
    flag: '--ai',
    title: 'AI-Powered Insights',
    description:
      'Automatically surface themes, sentiment trends, and actionable takeaways from your retro feedback.',
  },
  {
    cmd: 'join',
    flag: '--link',
    title: 'Zero-Friction Joining',
    description:
      'Participants join via a simple link — no account required. Start collaborating in seconds.',
  },
  {
    cmd: 'sync',
    flag: '--realtime',
    title: 'Real-Time Collaboration',
    description:
      'Add cards, vote, and discuss together in real time. Everyone stays in sync, no refresh needed.',
  },
]

export default function LandingPage() {
  const { theme } = useTheme()

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.bg,
        color: theme.textPrimary,
      }}
    >
      {/* Title bar */}
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
          <span style={{ color: theme.textTertiary, fontSize: 12 }}>
            retro — welcome
          </span>
        </div>
        <ThemePicker />
      </div>

      {/* Hero */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 680,
            width: '100%',
          }}
        >
          <AsciiLogo size="lg" />

          {/* Terminal output block */}
          <div style={{ marginTop: 24, marginBottom: 32 }}>
            <p style={{ color: theme.textTertiary, fontSize: 12 }}>
              Last login: {new Date().toDateString()} on ttys001
            </p>
            <div style={{ marginTop: 16 }}>
              <span style={{ color: theme.green }}>$</span>{' '}
              <span style={{ color: theme.textTertiary }}>retro</span>{' '}
              <span style={{ color: theme.cyan }}>--version</span>
            </div>
            <p
              style={{
                color: theme.green,
                fontSize: 11,
                marginTop: 4,
                letterSpacing: '0.05em',
              }}
            >
              Now in Early Access
            </p>
          </div>

          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            Run better retros with{' '}
            <span style={{ color: theme.purple }}>AI-powered insights</span>
          </h1>

          <p
            style={{
              color: theme.textTertiary,
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 520,
            }}
          >
            AI-powered team retrospectives with zero-friction participation.
            Share a link and start collaborating — no sign-up required for
            participants.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: theme.green }}>$</span>
            <Link to="/login">
              <TerminalButton variant="submit" size="lg">
                Get Started
              </TerminalButton>
            </Link>
            <BlinkingCursor />
          </div>
        </div>
      </section>

      {/* Features — man page style */}
      <section
        style={{
          borderTop: `1px solid ${theme.border}`,
          padding: '64px 24px',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p
            style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 8 }}
          >
            <span style={{ color: theme.green }}>$</span> retro{' '}
            <span style={{ color: theme.cyan }}>--help</span>
          </p>
          <p
            style={{
              color: theme.textTertiary,
              marginBottom: 32,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Available commands:
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {features.map((feature) => (
              <div
                key={feature.cmd}
                style={{
                  padding: '12px 16px',
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: theme.green }}>&gt; </span>
                  <span style={{ color: theme.yellow }}>
                    {feature.cmd}
                  </span>{' '}
                  <span style={{ color: theme.cyan }}>{feature.flag}</span>
                  <span
                    style={{
                      float: 'right',
                      color: theme.textPrimary,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {feature.title}
                  </span>
                </div>
                <p
                  style={{
                    color: theme.textTertiary,
                    fontSize: 12,
                    paddingLeft: 16,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${theme.border}`,
          padding: '12px 24px',
          fontSize: 11,
          color: theme.textTertiary,
          display: 'flex',
          justifyContent: 'space-between',
          background: theme.bgSecondary,
        }}
      >
        <span>
          &copy; {new Date().getFullYear()} Retro. All rights reserved.
        </span>
        <span style={{ color: theme.green }}>exit 0</span>
      </footer>
    </div>
  )
}
