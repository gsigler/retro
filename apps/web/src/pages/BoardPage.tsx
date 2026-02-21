import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import type { Card } from '@/types/api'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { fetchBoard, fetchRetro, fetchTeams, moveCard } from '@/lib/api'
import {
  BoardProvider,
  useBoardContext,
} from '@/components/board/BoardProvider'
import { TemplatePicker } from '@/components/board/TemplatePicker'
import { BoardColumn } from '@/components/board/BoardColumn'
import { ActiveUsers } from '@/components/board/ActiveUsers'
import { ActionItemsPanel } from '@/components/board/ActionItemsPanel'
import { StatusBar } from '@/components/board/StatusBar'
import { BlinkingCursor } from '@/components/board/TypingEffect'

export default function BoardPage() {
  const { retroId } = useParams<{ retroId: string }>()
  const { token } = useAuth()
  const { theme } = useTheme()

  const {
    data: board,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['board', retroId],
    queryFn: () => fetchBoard(token!, retroId!),
    enabled: !!token && !!retroId,
  })

  const { data: retro } = useQuery({
    queryKey: ['retro', retroId],
    queryFn: () => fetchRetro(token!, retroId!),
    enabled: !!token && !!retroId,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(token!),
    enabled: !!token,
  })

  const teamName = teams?.find((t) => t.id === retro?.teamId)?.name

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: theme.bg }}
      >
        <p style={{ color: theme.green, fontSize: 14 }}>
          Loading board...
          <BlinkingCursor />
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: theme.bg }}
      >
        <div
          role="alert"
          style={{
            color: theme.red,
            fontSize: 13,
            padding: 16,
          }}
        >
          Failed to load board
        </div>
      </div>
    )
  }

  if (!token || !retroId) return null

  return (
    <BoardProvider token={token} retroId={retroId} initialBoard={board ?? null}>
      <BoardContent
        token={token}
        retroId={retroId}
        teamName={teamName}
        retroName={retro?.name}
      />
    </BoardProvider>
  )
}

function BoardContent({
  token,
  retroId,
  teamName,
  retroName,
}: {
  token: string
  retroId: string
  teamName?: string
  retroName?: string
}) {
  const { state, dispatch } = useBoardContext()
  const { theme } = useTheme()
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const totalCards = state.columns.reduce(
    (sum, col) => sum + col.cards.length,
    0,
  )

  function handleDragStart(event: DragStartEvent) {
    const cardId = event.active.id as string
    for (const col of state.columns) {
      const found = col.cards.find((c) => c.id === cardId)
      if (found) {
        setActiveCard(found)
        return
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const cardId = active.id as string

    let targetColumnId: string | null = null
    let targetPosition = 0

    for (const col of state.columns) {
      if (col.id === over.id) {
        targetColumnId = col.id
        targetPosition = col.cards.length
        break
      }
      const overCardIndex = col.cards.findIndex((c) => c.id === over.id)
      if (overCardIndex !== -1) {
        targetColumnId = col.id
        targetPosition = overCardIndex
        break
      }
    }

    if (!targetColumnId) return

    let movedCard = null
    for (const col of state.columns) {
      const found = col.cards.find((c) => c.id === cardId)
      if (found) {
        movedCard = found
        break
      }
    }
    if (!movedCard) return

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
      <div>
        <div
          style={{
            borderBottom: `1px solid ${theme.border}`,
            padding: '8px 16px',
            fontSize: 12,
            color: theme.textTertiary,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Link
            to="/dashboard"
            style={{
              color: theme.cyan,
              textDecoration: 'none',
              fontFamily: 'inherit',
              fontSize: 12,
            }}
          >
            [&larr; dashboard]
          </Link>
          <span style={{ color: theme.border }}>|</span>
          {teamName && <span style={{ color: theme.cyan }}>{teamName}</span>}
          {teamName && retroName && (
            <span style={{ color: theme.border }}>|</span>
          )}
          {retroName && <span>{retroName}</span>}
          {(teamName || retroName) && (
            <span style={{ color: theme.border }}>|</span>
          )}
          <span>choose template</span>
        </div>
        <TemplatePicker token={token} retroId={retroId} />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 40px)',
      }}
    >
      {/* Board header */}
      <div
        style={{
          padding: '6px 16px',
          fontSize: 12,
          color: theme.textTertiary,
          borderBottom: `1px solid ${theme.border}40`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Link
          to="/dashboard"
          style={{
            color: theme.cyan,
            textDecoration: 'none',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          [&larr; dashboard]
        </Link>
        <span style={{ color: theme.border }}>|</span>
        {teamName && <span style={{ color: theme.cyan }}>{teamName}</span>}
        {teamName && retroName && (
          <span style={{ color: theme.border }}>|</span>
        )}
        {retroName && <span>{retroName}</span>}
        {(teamName || retroName) && (
          <span style={{ color: theme.border }}>|</span>
        )}
        <span style={{ color: theme.green }}>session active</span>
        <span style={{ color: theme.border }}>|</span>
        <span>{totalCards} items</span>
        <span style={{ color: theme.border }}>|</span>
        <span>{new Date().toLocaleDateString()}</span>
        <div style={{ marginLeft: 'auto' }}>
          <ActiveUsers />
        </div>
      </div>

      {/* Columns */}
      <main style={{ flex: 1, overflowX: 'auto', padding: 16 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div style={{ display: 'flex', gap: 12 }}>
            {state.columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                token={token}
                retroId={retroId}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={null}>
            {activeCard ? (
              <div
                style={{
                  borderLeft: `2px solid ${state.columns.find((c) => c.id === activeCard.columnId)?.color ?? theme.cyan}`,
                  padding: '6px 10px',
                  background: theme.bg,
                  fontSize: 12,
                  color: theme.textPrimary,
                  opacity: 0.9,
                  boxShadow: `0 2px 8px ${theme.border}40`,
                }}
              >
                <p style={{ whiteSpace: 'pre-wrap' }}>{activeCard.content}</p>
                <span
                  style={{
                    fontSize: 11,
                    color: theme.textTertiary,
                    opacity: 0.6,
                  }}
                >
                  {activeCard.author.name ?? 'Anonymous'}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Action items */}
      <div style={{ padding: '0 16px 16px', marginBottom: 24 }}>
        <ActionItemsPanel token={token} retroId={retroId} />
      </div>

      <StatusBar
        items={[
          `${state.columns.length} columns`,
          `${totalCards} cards`,
          `${state.activeUsers.length} online`,
        ]}
      />
    </div>
  )
}
