import { type ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface TerminalFrameProps {
  title?: string
  color?: string
  right?: ReactNode
  children: ReactNode
}

export function TerminalFrame({
  title,
  color,
  right,
  children,
}: TerminalFrameProps) {
  const { theme } = useTheme()
  const lineColor = color ?? theme.border

  return (
    <div
      style={{
        border: `1px solid ${lineColor}40`,
        borderRadius: 6,
        position: 'relative',
      }}
    >
      {/* Header bar */}
      {(title || right) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            borderBottom: `1px solid ${lineColor}40`,
            gap: 12,
          }}
        >
          {title && (
            <span
              style={{
                fontSize: 11,
                color: color ?? theme.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
              }}
            >
              {title}
            </span>
          )}
          {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 16px' }}>{children}</div>
    </div>
  )
}
