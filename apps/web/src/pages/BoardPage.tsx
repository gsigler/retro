import { useState } from 'react'
import { useParams, Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  DndContext,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { Card } from '@/types/api'
import { useAuth } from '@/contexts/AuthContext'
import { fetchBoard, moveCard } from '@/lib/api'
import {
  BoardProvider,
  useBoardContext,
} from '@/components/board/BoardProvider'
import { TemplatePicker } from '@/components/board/TemplatePicker'
import { BoardColumn } from '@/components/board/BoardColumn'
import { ActiveUsers } from '@/components/board/ActiveUsers'
import { ActionItemsPanel } from '@/components/board/ActionItemsPanel'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function BoardPage() {
  const { retroId } = useParams<{ retroId: string }>()
  const { token } = useAuth()

  const {
    data: board,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['board', retroId],
    queryFn: () => fetchBoard(token!, retroId!),
    enabled: !!token && !!retroId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div
          role="alert"
          className="bg-destructive/10 text-destructive rounded-lg p-4"
        >
          Failed to load board
        </div>
      </div>
    )
  }

  if (!token || !retroId) return null

  return (
    <BoardProvider token={token} retroId={retroId} initialBoard={board ?? null}>
      <BoardContent token={token} retroId={retroId} />
    </BoardProvider>
  )
}

function BoardContent({ token, retroId }: { token: string; retroId: string }) {
  const { state, dispatch } = useBoardContext()
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event: DragStartEvent) {
    const cardId = event.active.id as string
    for (const col of state.columns) {
      const found = col.cards.find((c) => c.id === cardId)
      if (found) {
        setActiveCard(found)
        break
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const cardId = active.id as string

    // Find which column the card is being dropped into
    let targetColumnId: string | null = null
    let targetPosition = 0

    for (const col of state.columns) {
      // Dropped directly onto a column
      if (col.id === over.id) {
        targetColumnId = col.id
        targetPosition = col.cards.length
        break
      }
      // Dropped onto another card — find its column
      const overCardIndex = col.cards.findIndex((c) => c.id === over.id)
      if (overCardIndex !== -1) {
        targetColumnId = col.id
        targetPosition = overCardIndex
        break
      }
    }

    if (!targetColumnId) return

    // Find the card data
    let movedCard = null
    for (const col of state.columns) {
      const found = col.cards.find((c) => c.id === cardId)
      if (found) {
        movedCard = found
        break
      }
    }
    if (!movedCard) return

    // Optimistic update
    dispatch({
      type: 'CARD_MOVED',
      card: {
        ...movedCard,
        columnId: targetColumnId,
        position: targetPosition,
      },
    })

    setActiveCard(null)

    try {
      await moveCard(token, retroId, cardId, {
        columnId: targetColumnId,
        position: targetPosition,
      })
    } catch {
      // Server broadcast will reconcile
    }
  }

  if (!state.initialized) {
    return (
      <div className="min-h-screen bg-muted/30">
        <header className="border-b bg-background">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon-xs">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Retro Board</h1>
          </div>
        </header>
        <TemplatePicker token={token} retroId={retroId} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon-xs">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Retro Board</h1>
          <div className="ml-auto">
            <ActiveUsers />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4">
            {state.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                token={token}
                retroId={retroId}
              />
            ))}
          </div>
          <DragOverlay>
            {activeCard ? (
              <div className="rounded-lg border bg-background p-3 shadow-lg">
                <p className="whitespace-pre-wrap text-sm">
                  {activeCard.content}
                </p>
                <div className="mt-2">
                  <span className="text-muted-foreground text-xs">
                    {activeCard.author.name ?? 'Anonymous'}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      <div className="border-t bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <ActionItemsPanel token={token} retroId={retroId} />
        </div>
      </div>
    </div>
  )
}
