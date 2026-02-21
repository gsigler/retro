import { useTheme } from '@/contexts/ThemeContext'
import type { TeamMember } from '@/types/api'

interface MemberListProps {
  members: TeamMember[]
  ownerId: string
  isOwner: boolean
  onRemove: (userId: string) => void
}

export function MemberList({
  members,
  ownerId,
  isOwner,
  onRemove,
}: MemberListProps) {
  const { theme } = useTheme()

  return (
    <div
      style={{
        fontFamily: 'inherit',
        fontSize: 12,
        lineHeight: 1.8,
      }}
    >
      {members.map((member) => {
        const isTeamOwner = member.user.id === ownerId
        const displayName = member.user.name ?? member.user.email

        return (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 4px',
              borderRadius: 3,
            }}
          >
            <span
              style={{
                color: isTeamOwner ? theme.green : theme.textTertiary,
                width: 12,
                flexShrink: 0,
                textAlign: 'center',
              }}
            >
              {isTeamOwner ? '*' : ' '}
            </span>
            <span
              style={{
                color: theme.textPrimary,
                minWidth: 180,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </span>
            <span
              style={{
                color: isTeamOwner ? theme.yellow : theme.textTertiary,
                minWidth: 64,
                textTransform: 'uppercase',
                fontSize: 11,
              }}
            >
              {member.role.toLowerCase()}
            </span>
            {isTeamOwner && (
              <span style={{ color: theme.textTertiary, fontSize: 11 }}>
                &larr; you
              </span>
            )}
            {isOwner && !isTeamOwner && (
              <button
                onClick={() => onRemove(member.user.id)}
                aria-label={`Remove ${displayName}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.red,
                  cursor: 'pointer',
                  padding: '0 4px',
                  fontFamily: 'inherit',
                  fontSize: 12,
                }}
              >
                [&times;]
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
