import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActionItemCard } from '@/components/ActionItemCard'
import { ActionItemFormDialog } from '@/components/ActionItemFormDialog'
import {
  fetchActionItems,
  fetchTeam,
  fetchTeams,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '@/lib/api'
import type { ActionItem, TeamMember } from '@/types/api'

interface ActionItemsSectionProps {
  token: string
  userId: string
  retroId: string
  onMutation: () => void
}

export function ActionItemsSection({
  token,
  userId,
  retroId,
  onMutation,
}: ActionItemsSectionProps) {
  const [items, setItems] = useState<ActionItem[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null)

  const loadItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchActionItems(token, retroId)
      setItems(data)

      // Load team members for the assignee dropdown
      const teams = await fetchTeams(token)
      if (teams.length > 0) {
        const team = teams.find((t) => t.ownerId === userId) ?? teams[0]
        setTeamOwnerId(team.ownerId)
        const detail = await fetchTeam(token, team.id)
        setMembers(detail.members)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [token, retroId, userId])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const refresh = useCallback(async () => {
    await loadItems()
    onMutation()
  }, [loadItems, onMutation])

  async function handleCreate(data: {
    title: string
    description?: string
    assigneeId?: string
    dueDate?: string
  }) {
    await createActionItem(token, retroId, data)
    await refresh()
  }

  async function handleEdit(data: {
    title: string
    description?: string
    assigneeId?: string
    dueDate?: string
  }) {
    if (!editingItem) return
    await updateActionItem(token, editingItem.id, data)
    setEditingItem(null)
    await refresh()
  }

  async function handleDelete(itemId: string) {
    await deleteActionItem(token, itemId)
    await refresh()
  }

  async function handleStatusTransition(itemId: string, status: string) {
    await updateActionItem(token, itemId, { status })
    await refresh()
  }

  function canManageItem(item: ActionItem) {
    return item.createdBy.id === userId || teamOwnerId === userId
  }

  if (isLoading) {
    return <div className="bg-muted/50 mt-6 h-48 animate-pulse rounded-xl" />
  }

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Action Items</CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="size-4" />
              New Action Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No action items yet. Create one to track follow-ups.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <ActionItemCard
                  key={item.id}
                  item={item}
                  canManage={canManageItem(item)}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item.id)}
                  onStatusTransition={(status) =>
                    handleStatusTransition(item.id, status)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ActionItemFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
        members={members}
        mode="create"
      />

      {editingItem && (
        <ActionItemFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null)
          }}
          onSubmit={handleEdit}
          initialValues={{
            title: editingItem.title,
            description: editingItem.description ?? undefined,
            assigneeId: editingItem.assignee?.id,
            dueDate: editingItem.dueDate?.split('T')[0],
          }}
          members={members}
          mode="edit"
        />
      )}
    </div>
  )
}
