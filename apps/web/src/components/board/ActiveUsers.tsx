import { useTheme } from '@/contexts/ThemeContext'
import { useBoardContext } from './BoardProvider'

export function ActiveUsers() {
  const { theme } = useTheme()
  const { state } = useBoardContext()
  const { activeUsers } = state

  if (activeUsers.length === 0) return null

  return (
    <span style={{ fontSize: 11, color: theme.textTertiary }}>
      {activeUsers.map((user, i) => (
        <span key={user.userId}>
          {i > 0 && ', '}
          <span style={{ color: theme.purple }}>{user.userName ?? 'user'}</span>
        </span>
      ))}
      <span style={{ color: theme.textTertiary }}>
        {' '}
        ({activeUsers.length} online)
      </span>
    </span>
  )
}
