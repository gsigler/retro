import { useTheme } from '@/contexts/ThemeContext'
import { useQuery } from '@tanstack/react-query'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { ActionItemCard } from '@/components/ActionItemCard'
import { updateActionItem, fetchTeams, fetchTeam } from '@/lib/api'
import type { ActionItem, TeamMember } from '@/types/api'

interface ActionItemsSectionProps {
  token: string
  items: ActionItem[]
  onMutation: () => void
}

export function ActionItemsSection({
  token,
  items,
  onMutation,
}: ActionItemsSectionProps) {
  const { theme } = useTheme()

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(token),
    enabled: !!token,
  })

  const { data: allMembers } = useQuery({
    queryKey: ['all-team-members', teams?.map((t) => t.id)],
    queryFn: async () => {
      const details = await Promise.all(
        teams!.map((t) => fetchTeam(token, t.id)),
      )
      const memberMap = new Map<string, TeamMember>()
      for (const team of details) {
        for (const member of team.members) {
          memberMap.set(member.user.id, member)
        }
      }
      return Array.from(memberMap.values())
    },
    enabled: !!teams && teams.length > 0,
  })

  async function handleUpdate(
    itemId: string,
    data: {
      title?: string
      status?: string
      assigneeId?: string | null
      dueDate?: string | null
    },
  ) {
    try {
      await updateActionItem(token, itemId, data)
      onMutation()
    } catch {
      // silently fail
    }
  }

  const openCount = items.filter((i) => i.status !== 'DONE').length
  const doneCount = items.filter((i) => i.status === 'DONE').length

  return (
    <TerminalFrame
      title="$ retro actions --all"
      right={
        <span style={{ fontSize: 11, color: theme.textTertiary }}>
          <span style={{ color: theme.yellow }}>{openCount}</span> open{' '}
          <span style={{ color: theme.border }}>│</span>{' '}
          <span style={{ color: theme.green }}>{doneCount}</span> done
        </span>
      }
    >
      {items.length === 0 ? (
        <p style={{ fontSize: 12, color: theme.textTertiary }}>
          <span style={{ color: theme.green }}>&#10003;</span> All clear — no
          open action items.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {items.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              members={allMembers ?? []}
              onMarkDone={() => handleUpdate(item.id, { status: 'DONE' })}
              onMarkOpen={() => handleUpdate(item.id, { status: 'OPEN' })}
              onUpdate={(data) => handleUpdate(item.id, data)}
            />
          ))}
        </div>
      )}
    </TerminalFrame>
  )
}
