import { useTheme } from '@/contexts/ThemeContext'

interface StatusBarProps {
  items?: string[]
  connected?: boolean
}

export function StatusBar({ items = [], connected = true }: StatusBarProps) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: theme.bgSecondary,
        borderTop: `1px solid ${theme.border}`,
        padding: '4px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 11,
        color: theme.textTertiary,
        zIndex: 40,
      }}
    >
      <span>
        <span
          className="box-drawing"
          style={{ color: connected ? theme.green : theme.red }}
        >
          █
        </span>{' '}
        {connected ? 'connected' : 'disconnected'}
      </span>
      {items.map((item, i) => (
        <span key={i}>
          <span style={{ color: theme.border }}>│</span> {item}
        </span>
      ))}
    </div>
  )
}
