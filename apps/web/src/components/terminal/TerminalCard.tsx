import type { CSSProperties, ReactNode } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface TerminalCardProps {
  className?: string
  style?: CSSProperties
  children: ReactNode
}

export function TerminalCard({
  className,
  style,
  children,
}: TerminalCardProps) {
  const { theme } = useTheme()

  return (
    <div
      className={className}
      style={{
        border: `1px solid ${theme.border}`,
        borderRadius: 6,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
