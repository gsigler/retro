import { useQuery } from '@tanstack/react-query'
import { fetchActionItems, updateActionItem } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { ActionItemCard } from '@/components/ActionItemCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActionItemsPanelProps {
  token: string
  retroId: string
}

export function ActionItemsPanel({ token, retroId }: ActionItemsPanelProps) {
  const queryClient = useQueryClient()

  const { data: items } = useQuery({
    queryKey: ['action-items', retroId],
    queryFn: () => fetchActionItems(token, retroId),
    enabled: !!token,
  })

  async function handleMarkDone(id: string) {
    await updateActionItem(token, id, { status: 'DONE' })
    queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        {!items || items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No action items yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                onMarkDone={() => handleMarkDone(item.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
