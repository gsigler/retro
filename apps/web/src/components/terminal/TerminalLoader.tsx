import { useTheme } from '@/contexts/ThemeContext'
import { BlinkingCursor } from '@/components/board/TypingEffect'

interface TerminalLoaderProps {
  command?: string
  message?: string
  inline?: boolean
}

export function TerminalLoader({
  command,
  message = 'Loading',
  inline = false,
}: TerminalLoaderProps) {
  const { theme } = useTheme()

  const content = (
    <div>
      {command && (
        <p style={{ color: theme.textTertiary, fontSize: 12, marginBottom: 4 }}>
          <span style={{ color: theme.green }}>$</span> {command}
        </p>
      )}
      <p
        style={{
          color: theme.green,
          fontSize: inline ? 12 : 13,
        }}
      >
        <span>{message}</span>
        <TerminalDots />
        <BlinkingCursor />
      </p>
    </div>
  )

  if (inline) return content

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
      {content}
    </div>
  )
}

function TerminalDots() {
  const { theme } = useTheme()

  return (
    <span
      style={{
        display: 'inline-block',
        width: '1.5em',
        textAlign: 'left',
        color: theme.green,
      }}
    >
      <span style={{ animation: 'terminal-dots 1.5s step-end infinite' }}>
        {/* The CSS animation swaps content via ::after, but since React
            can't animate content property on spans directly, we use a
            JS-driven approach with three dots that appear sequentially */}
      </span>
      <DotAnimation />
    </span>
  )
}

function DotAnimation() {
  const { theme } = useTheme()

  return (
    <>
      <span
        style={{
          animation: 'terminal-blink 1.5s step-end infinite',
          animationDelay: '0s',
          color: theme.green,
        }}
      >
        .
      </span>
      <span
        style={{
          animation: 'terminal-blink 1.5s step-end infinite',
          animationDelay: '0.5s',
          color: theme.green,
        }}
      >
        .
      </span>
      <span
        style={{
          animation: 'terminal-blink 1.5s step-end infinite',
          animationDelay: '1s',
          color: theme.green,
        }}
      >
        .
      </span>
    </>
  )
}
