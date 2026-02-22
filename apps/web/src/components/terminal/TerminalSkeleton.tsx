import { useTheme } from '@/contexts/ThemeContext'

interface TerminalSkeletonProps {
  lines?: number
  widths?: number[]
}

const DEFAULT_WIDTHS = [85, 65, 45]

export function TerminalSkeleton({
  lines = 3,
  widths = DEFAULT_WIDTHS,
}: TerminalSkeletonProps) {
  const { theme } = useTheme()

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      aria-hidden="true"
    >
      {Array.from({ length: lines }, (_, i) => {
        const width = widths[i % widths.length]
        const charCount = Math.round(width * 0.4)
        return (
          <div
            key={i}
            style={{
              width: `${width}%`,
              fontSize: 12,
              lineHeight: 1.6,
              color: theme.textTertiary,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}
          >
            {'░'.repeat(charCount)}
          </div>
        )
      })}
    </div>
  )
}
