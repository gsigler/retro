import { Link } from 'react-router'
import { useTheme } from '@/contexts/ThemeContext'
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

  const linkStyle = {
    color: theme.cyan,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer' as const,
    fontFamily: 'inherit',
    fontSize: 12,
    padding: 0,
    textDecoration: 'none',
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        fontSize: 12,
        borderBottom: `1px solid ${theme.border}22`,
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
        <Link to={`/retros/${retro.id}/board`} style={linkStyle}>
          [open]
        </Link>
        {canManage && (
          <>
            <button style={linkStyle} onClick={onEdit}>
              [edit]
            </button>
            <button
              style={{ ...linkStyle, color: theme.red }}
              onClick={onDelete}
            >
              [rm]
            </button>
          </>
        )}
      </div>
    </div>
  )
}
