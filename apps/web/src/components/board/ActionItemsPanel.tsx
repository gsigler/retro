import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus } from 'lucide-react'
import {
  fetchActionItems,
  fetchRetroMembers,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  reorderActionItems,
} from '@/lib/api'
import { ActionItemCard } from '@/components/ActionItemCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBoardContext } from './BoardProvider'
import type { ActionItem } from '@/types/api'

interface ActionItemsPanelProps {
  token: string
  retroId: string
}

interface ActionItemFormState {
  title: string
  description: string
  assigneeId: string
  dueDate: string
}

const emptyForm: ActionItemFormState = {
  title: '',
  description: '',
  assigneeId: '',
  dueDate: '',
}

function SortableActionItem({
  item,
  onMarkDone,
  onEdit,
  onDelete,
}: {
  item: ActionItem
  onMarkDone: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ActionItemCard
        item={item}
        onMarkDone={onMarkDone}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

export function ActionItemsPanel({ token, retroId }: ActionItemsPanelProps) {
  const queryClient = useQueryClient()
  const { socket } = useBoardContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null)
  const [form, setForm] = useState<ActionItemFormState>(emptyForm)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const { data: items } = useQuery({
    queryKey: ['action-items', retroId],
    queryFn: () => fetchActionItems(token, retroId),
    enabled: !!token,
  })

  const { data: members } = useQuery({
    queryKey: ['retro-members', retroId],
    queryFn: () => fetchRetroMembers(token, retroId),
    enabled: !!token,
  })

  const invalidateItems = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
  }, [queryClient, retroId])

  useEffect(() => {
    if (!socket) return

    socket.on('action-item:created', invalidateItems)
    socket.on('action-item:updated', invalidateItems)
    socket.on('action-item:deleted', invalidateItems)
    socket.on('action-item:reordered', invalidateItems)

    return () => {
      socket.off('action-item:created', invalidateItems)
      socket.off('action-item:updated', invalidateItems)
      socket.off('action-item:deleted', invalidateItems)
      socket.off('action-item:reordered', invalidateItems)
    }
  }, [socket, invalidateItems])

  function openCreate() {
    setEditingItem(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEdit(item: ActionItem) {
    setEditingItem(item)
    setForm({
      title: item.title,
      description: item.description ?? '',
      assigneeId: item.assignee?.id ?? '',
      dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assigneeId: form.assigneeId || undefined,
      dueDate: form.dueDate || undefined,
    }

    if (editingItem) {
      await updateActionItem(token, editingItem.id, {
        ...payload,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      })
    } else {
      await createActionItem(token, retroId, payload)
    }

    invalidateItems()
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    await deleteActionItem(token, id)
    invalidateItems()
  }

  async function handleMarkDone(id: string) {
    await updateActionItem(token, id, { status: 'DONE' })
    invalidateItems()
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id || !items) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)

    queryClient.setQueryData(['action-items', retroId], reordered)

    await reorderActionItems(
      token,
      retroId,
      reordered.map((i) => i.id),
    )
    invalidateItems()
  }

  const activeItem = activeId ? items?.find((i) => i.id === activeId) : null

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Action Items</CardTitle>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            New Action Item
          </Button>
        </CardHeader>
        <CardContent>
          {!items || items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No action items yet</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map((i) => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item) => (
                    <SortableActionItem
                      key={item.id}
                      item={item}
                      onMarkDone={() => handleMarkDone(item.id)}
                      onEdit={() => openEdit(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <ActionItemCard item={activeItem} onMarkDone={() => {}} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Action Item' : 'New Action Item'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-title">Title</Label>
              <Input
                id="ai-title"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="Action item title"
                required
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-description">Description</Label>
              <Input
                id="ai-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-assignee">Assignee</Label>
              <Select
                value={form.assigneeId}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    assigneeId: v === 'unassigned' ? '' : v,
                  }))
                }
              >
                <SelectTrigger id="ai-assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name ?? m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-due">Due Date</Label>
              <Input
                id="ai-due"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingItem ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
