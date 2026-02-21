import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  fetchActionItems,
  fetchRetroMembers,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  reorderActionItems,
} from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { ActionItemCard } from '@/components/ActionItemCard'
import { useBoardContext } from './BoardProvider'
import type { ActionItem } from '@/types/api'

interface ActionItemsPanelProps {
  token: string
  retroId: string
}

export function ActionItemsPanel({ token, retroId }: ActionItemsPanelProps) {
  const { theme } = useTheme()
  const queryClient = useQueryClient()
  const { socketRef } = useBoardContext()
  const [showForm, setShowForm] = useState(false)

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

  // WebSocket sync
  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    function invalidate() {
      queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
    }

    socket.on('action-item:created', invalidate)
    socket.on('action-item:updated', invalidate)
    socket.on('action-item:deleted', invalidate)
    socket.on('action-item:reordered', invalidate)

    return () => {
      socket.off('action-item:created', invalidate)
      socket.off('action-item:updated', invalidate)
      socket.off('action-item:deleted', invalidate)
      socket.off('action-item:reordered', invalidate)
    }
  }, [socketRef, queryClient, retroId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id || !items) return

    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(items, oldIndex, newIndex)
    // Optimistic update
    queryClient.setQueryData(['action-items', retroId], reordered)

    try {
      await reorderActionItems(
        token,
        retroId,
        reordered.map((i) => i.id),
      )
    } catch {
      queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
    }
  }

  async function handleUpdate(
    id: string,
    data: {
      title?: string
      status?: string
      assigneeId?: string | null
      dueDate?: string | null
    },
  ) {
    await updateActionItem(token, id, data)
    queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
  }

  async function handleDelete(id: string) {
    await deleteActionItem(token, id)
    queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
  }

  async function handleCreate(data: {
    title: string
    assigneeId?: string
    dueDate?: string
  }) {
    await createActionItem(token, retroId, data)
    queryClient.invalidateQueries({ queryKey: ['action-items', retroId] })
  }

  // Convert members to TeamMember-like shape for ActionItemCard
  const membersList = (members ?? []).map((m) => ({
    id: m.id,
    role: 'MEMBER',
    joinedAt: '',
    user: { id: m.id, email: '', name: m.name, avatarUrl: m.avatarUrl },
  }))

  const count = items?.length ?? 0

  return (
    <TerminalFrame
      title={`action items${count > 0 ? ` (${count})` : ''}`}
      right={
        !showForm && (
          <span
            onClick={() => setShowForm(true)}
            style={{
              cursor: 'pointer',
              color: theme.green,
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            [+ new]
          </span>
        )
      }
    >
      {!items || items.length === 0 ? (
        !showForm && (
          <p style={{ fontSize: 12, color: theme.textTertiary }}>
            No action items yet
          </p>
        )
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((item) => (
                <SortableActionItem
                  key={item.id}
                  item={item}
                  members={membersList}
                  onMarkDone={() => handleUpdate(item.id, { status: 'DONE' })}
                  onMarkOpen={() => handleUpdate(item.id, { status: 'OPEN' })}
                  onUpdate={(data) => handleUpdate(item.id, data)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      {showForm && (
        <InlineActionItemForm
          members={membersList}
          onSubmit={async (data) => {
            await handleCreate(data)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </TerminalFrame>
  )
}

function SortableActionItem(props: {
  item: ActionItem
  members: {
    id: string
    role: string
    joinedAt: string
    user: {
      id: string
      email: string
      name: string | null
      avatarUrl: string | null
    }
  }[]
  onMarkDone: () => void
  onMarkOpen: () => void
  onUpdate: (data: {
    title?: string
    assigneeId?: string | null
    dueDate?: string | null
  }) => Promise<void>
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.item.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <ActionItemCard
        item={props.item}
        members={props.members}
        onMarkDone={props.onMarkDone}
        onMarkOpen={props.onMarkOpen}
        onUpdate={props.onUpdate}
        onDelete={props.onDelete}
      />
    </div>
  )
}

interface InlineActionItemFormProps {
  members: {
    id: string
    role: string
    joinedAt: string
    user: {
      id: string
      email: string
      name: string | null
      avatarUrl: string | null
    }
  }[]
  onSubmit: (data: {
    title: string
    assigneeId?: string
    dueDate?: string
  }) => Promise<void>
  onCancel: () => void
}

function InlineActionItemForm({
  members,
  onSubmit,
  onCancel,
}: InlineActionItemFormProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit({
        title: trimmed,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      })
    } catch {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel()
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        borderTop: `1px solid ${theme.border}44`,
        padding: '4px 8px',
        marginTop: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
        }}
      >
        <span
          style={{
            color: theme.textTertiary,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          [ ]
        </span>
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.textPrimary,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
          }}
        />

        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            color: assigneeId ? theme.cyan : theme.textTertiary,
            fontFamily: 'inherit',
            fontSize: 11,
            padding: 0,
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <option value="">@assignee</option>
          {members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              @{m.user.name ?? m.user.email}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            background: 'transparent',
            border: 'none',
            color: dueDate ? theme.textTertiary : theme.textTertiary,
            fontFamily: 'inherit',
            fontSize: 11,
            padding: 0,
            outline: 'none',
            flexShrink: 0,
            colorScheme: 'dark',
          }}
        />
      </div>

      <div
        style={{
          fontSize: 11,
          color: theme.textTertiary,
          marginTop: 4,
          paddingLeft: 28,
        }}
      >
        Enter to add &middot;{' '}
        <span onClick={onCancel} style={{ cursor: 'pointer' }}>
          Esc to cancel
        </span>
      </div>
    </form>
  )
}
