import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ActionItemCard } from '@/components/ActionItemCard'
import { updateActionItem } from '@/lib/api'
import type { ActionItem } from '@/types/api'

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
  async function handleMarkDone(itemId: string) {
    try {
      await updateActionItem(token, itemId, { status: 'DONE' })
      onMutation()
    } catch {
      // silently fail — item will remain unchecked
    }
  }

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Action Items</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              You're all caught up — no open action items.
            </p>
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
    </div>
  )
}
