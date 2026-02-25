import { useState } from 'react'
import { Link } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import type { RetroWithCounts } from '@/types/api'

interface RetroCardProps {
  retro: RetroWithCounts
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}

export function RetroCard({
  retro,
  canManage,
  onEdit,
  onDelete,
}: RetroCardProps) {
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        fontSize: 12,
        borderBottom: `1px solid ${theme.border}22`,
        background: isHovered ? theme.bgHover : 'transparent',
        transition: 'background 150ms ease',
        animation: 'slide-in 0.2s ease-out',
      }}
    >
      <Link
        to={`/retros/${retro.id}/board`}
        style={{
          color: theme.textPrimary,
          fontWeight: 600,
          textDecoration: 'none',
          minWidth: 120,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {retro.name}
      </Link>
      <span style={{ color: theme.textTertiary, flexShrink: 0 }}>
        {new Date(retro.date).toLocaleDateString()}
      </span>
      <span style={{ color: theme.purple, flexShrink: 0 }}>
        {retro.actionItemCount} actions
      </span>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <TerminalButton size="sm" asChild href={`/retros/${retro.id}/board`}>
          open
        </TerminalButton>
        {canManage && (
          <>
            <TerminalButton size="sm" onClick={onEdit}>
              edit
            </TerminalButton>
            <TerminalButton
              size="sm"
              style={{ color: theme.red }}
              onClick={onDelete}
            >
              rm
            </TerminalButton>
          </>
        )}
      </div>
    </div>
  )
}
