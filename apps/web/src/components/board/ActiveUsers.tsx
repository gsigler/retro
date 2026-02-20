import { useBoardContext } from './BoardProvider'

export function ActiveUsers() {
  const { state } = useBoardContext()
  const { activeUsers } = state

  if (activeUsers.length === 0) return null

  return (
    <div className="flex items-center gap-1">
      {activeUsers.map((user) => (
        <span
          key={user.userId}
          className="bg-primary/10 text-primary inline-flex size-7 items-center justify-center rounded-full text-xs font-medium"
          title={user.userName ?? 'User'}
        >
          {user.userName?.[0]?.toUpperCase() ?? '?'}
        </span>
      ))}
      <span className="text-muted-foreground ml-1 text-xs">
        {activeUsers.length} online
      </span>
    </div>
  )
}
