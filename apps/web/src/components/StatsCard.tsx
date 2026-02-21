import type { LucideIcon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

interface StatsCardProps {
  icon: LucideIcon
  label: string
  value: number
}

export function StatsCard({ icon: Icon, label, value }: StatsCardProps) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        padding: '12px 16px',
        border: `1px solid ${theme.border}`,
        borderRadius: 4,
        borderLeft: `3px solid ${theme.purple}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon
          style={{ width: 14, height: 14, color: theme.purple, flexShrink: 0 }}
        />
        <span style={{ fontSize: 12, color: theme.textTertiary }}>{label}</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 20,
            fontWeight: 700,
            color: theme.textPrimary,
          }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
