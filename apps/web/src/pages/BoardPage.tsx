import { Link, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from 'react'
import type { UserVotes } from '@/types/api'
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
import {
  fetchBoard,
  fetchRetro,
  fetchTeams,
  fetchUserVotes,
  moveCard,
  updateRetroPhase,
} from '@/lib/api'
import {
  BoardProvider,
  useBoardContext,
} from '@/components/board/BoardProvider'
import { BoardColumn } from '@/components/board/BoardColumn'
import { ActionItemsPanel } from '@/components/board/ActionItemsPanel'
import { RetroStepper } from '@/components/board/RetroStepper'
import { IceBreaker } from '@/components/board/IceBreaker'
import { ThemePicker } from '@/components/ThemePicker'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalLoader } from '@/components/terminal/TerminalLoader'
import { TerminalSkeleton } from '@/components/terminal/TerminalSkeleton'

export default function BoardPage() {
  const { retroId } = useParams<{ retroId: string }>()
  const { user } = useAuth()
  const { theme } = useTheme()

  const {
    data: board,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['board', retroId],
    queryFn: () => fetchBoard(retroId!),
    enabled: !!retroId,
  })

  const { data: retro } = useQuery({
    queryKey: ['retro', retroId],
    queryFn: () => fetchRetro(retroId!),
    enabled: !!retroId,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(),
  })

  const teamName = teams?.find((t) => t.id === retro?.teamId)?.name

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: theme.bg,
        }}
      >
        {/* Skeleton header bar */}
        <div
          style={{
            padding: '6px 16px',
            fontSize: 12,
            borderBottom: `1px solid ${theme.border}40`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TerminalSkeleton lines={1} widths={[100]} />
        </div>

        {/* Skeleton phase stepper */}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${theme.border}40`,
          }}
        >
          <TerminalSkeleton lines={1} widths={[60]} />
        </div>

        {/* Skeleton columns */}
        <main style={{ flex: 1, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  border: `1px solid ${theme.border}40`,
                  borderRadius: 6,
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <TerminalSkeleton lines={1} widths={[50]} />
                <div
                  style={{
                    borderTop: `1px solid ${theme.border}20`,
                    paddingTop: 8,
                  }}
                >
                  <TerminalSkeleton lines={3} widths={[90, 70, 80]} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <TerminalLoader command="retro board --load" inline />
          </div>
        </main>

        {/* Skeleton status bar */}
        <div
          style={{
            padding: '4px 16px',
            borderTop: `1px solid ${theme.border}`,
            background: theme.bgSecondary,
          }}
        >
          <TerminalSkeleton lines={1} widths={[40]} />
        </div>
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

  if (!retroId) return null

  return (
    <div className="fade-in">
      <BoardProvider
        retroId={retroId}
        userId={user!.id}
        userName={user!.name ?? undefined}
        initialBoard={board ?? null}
        initialPhase={retro?.phase}
      >
        <BoardContent
          retroId={retroId}
          teamName={teamName}
          retroName={retro?.name}
          retroCreatedById={retro?.createdBy.id}
        />
      </BoardProvider>
    </div>
  )
}

function BoardContent({
  retroId,
  teamName,
  retroName,
  retroCreatedById,
}: {
  retroId: string
  teamName?: string
  retroName?: string
  retroCreatedById?: string
}) {
  const { state, dispatch, mergeSelection } = useBoardContext()
  const { user } = useAuth()
  const { theme } = useTheme()
  const isFacilitator =
    !!user && !!retroCreatedById && user.id === retroCreatedById
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [actionPanelOpen, setActionPanelOpen] = useState(
    state.phase === 'DISCUSS_ACTION',
  )
  const toggleActionPanel = useCallback(() => setActionPanelOpen((v) => !v), [])

  useEffect(() => {
    if (state.phase === 'DISCUSS_ACTION') {
      setActionPanelOpen(true)
    }
  }, [state.phase])

  const isDragEnabled =
    state.phase === 'RETROSPECT' || state.phase === 'GROUP_VOTE'
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const totalCards = state.columns.reduce(
    (sum, col) => sum + col.cards.filter((c) => !c.parentCardId).length,
    0,
  )

  const { data: userVotes } = useQuery<UserVotes>({
    queryKey: ['user-votes', retroId],
    queryFn: () => fetchUserVotes(retroId),
    enabled: state.phase === 'GROUP_VOTE',
  })

  useEffect(() => {
    if (userVotes) {
      dispatch({
        type: 'SET_VOTES',
        votedCardIds: userVotes.votedCardIds,
        maxVotes: userVotes.maxVotes,
        remainingVotes: userVotes.remainingVotes,
      })
    }
  }, [userVotes, dispatch])

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
    const overId = over.id as string

    let targetColumnId: string | null = null
    let targetPosition = 0

    for (const col of state.columns) {
      if (col.id === overId) {
        targetColumnId = col.id
        targetPosition = col.cards.length
        break
      }
      const overCardIndex = col.cards.findIndex((c) => c.id === overId)
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
      await moveCard(retroId, cardId, {
        columnId: targetColumnId,
        position: targetPosition,
      })
    } catch {
      // Server broadcast will reconcile
    }
  }

  if (!state.initialized) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center"
        style={{ background: theme.bg }}
      >
        <p
          style={{ color: theme.textTertiary, fontSize: 13, marginBottom: 12 }}
        >
          Board not initialized. Go back and create a retro with a template.
        </p>
        <Link
          to="/dashboard"
          style={{
            color: theme.cyan,
            textDecoration: 'none',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          [&larr; back to dashboard]
        </Link>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      {/* Phase stepper */}
      <RetroStepper
        phase={state.phase}
        isFacilitator={isFacilitator}
        retroId={retroId}
        teamName={teamName}
        retroName={retroName}
        onPhaseChange={async (phase) => {
          dispatch({ type: 'PHASE_CHANGED', phase })
          try {
            await updateRetroPhase(retroId, phase)
          } catch {
            // Server broadcast will reconcile
          }
        }}
      />

      {/* Phase extras — only render when there's contextual info */}
      {(state.phase === 'RETROSPECT' ||
        state.phase === 'GROUP_VOTE' ||
        mergeSelection.selectedIds.length >= 2) && (
        <div
          style={{
            padding: '6px 16px',
            fontSize: 12,
            color: theme.textTertiary,
            borderBottom: `1px solid ${theme.border}40`,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {state.phase === 'RETROSPECT' && (
            <span style={{ color: theme.yellow }}>
              Cards are anonymous &mdash; only you can see yours
            </span>
          )}

          {state.phase === 'GROUP_VOTE' && (
            <>
              <span style={{ color: theme.yellow }}>
                Votes: {state.remainingVotes}/{state.maxVotes} remaining
              </span>
              <span style={{ color: theme.border }}>|</span>
              <span>use +/- to vote, [ ] to select for merge</span>
            </>
          )}

          {mergeSelection.selectedIds.length >= 2 &&
            (() => {
              const selectedColumns = new Set(
                mergeSelection.selectedIds.map((id) => {
                  for (const col of state.columns) {
                    if (col.cards.some((c) => c.id === id)) return col.id
                  }
                  return null
                }),
              )
              const sameColumn = selectedColumns.size === 1
              return (
                <>
                  {state.phase === 'GROUP_VOTE' && (
                    <span style={{ color: theme.border }}>|</span>
                  )}
                  <span style={{ color: theme.cyan }}>
                    {mergeSelection.selectedIds.length} cards selected
                  </span>
                  {!sameColumn && (
                    <span style={{ color: theme.yellow, fontSize: 11 }}>
                      (must be from same column)
                    </span>
                  )}
                  <TerminalButton
                    onClick={mergeSelection.doMerge}
                    disabled={!sameColumn}
                    size="sm"
                  >
                    merge
                  </TerminalButton>
                  <TerminalButton
                    onClick={mergeSelection.clearSelection}
                    size="sm"
                    style={{ color: theme.textTertiary }}
                  >
                    cancel
                  </TerminalButton>
                </>
              )
            })()}
        </div>
      )}

      {/* Icebreaker content */}
      {state.phase === 'ICEBREAKER' && (
        <div style={{ flex: 1, padding: '16px 16px 0', minHeight: 0 }}>
          <IceBreaker retroId={retroId} isFacilitator={isFacilitator} />
        </div>
      )}

      {state.phase !== 'ICEBREAKER' && (
        <main
          style={{
            flex: 1,
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: 16,
            minHeight: 0,
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={isDragEnabled ? handleDragStart : undefined}
            onDragEnd={isDragEnabled ? handleDragEnd : undefined}
          >
            <div style={{ display: 'flex', gap: 12, height: '100%' }}>
              {state.columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
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
      )}

      {/* Bottom bar: status + action items */}
      <div
        style={{
          flexShrink: 0,
          background: theme.bgSecondary,
          borderTop: `1px solid ${theme.border}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px 16px',
            fontSize: 11,
            color: theme.textTertiary,
            gap: 16,
          }}
        >
          <ThemePicker />
          <span style={{ color: theme.border }}>│</span>
          <span>
            <span className="box-drawing" style={{ color: theme.green }}>
              █
            </span>{' '}
            connected
          </span>
          <span>
            <span style={{ color: theme.border }}>│</span> {totalCards} cards
          </span>
          <span>
            <span style={{ color: theme.border }}>│</span>{' '}
            {state.activeUsers.length} online
          </span>
          {state.phase === 'GROUP_VOTE' && (
            <span>
              <span style={{ color: theme.border }}>│</span>{' '}
              {state.remainingVotes}/{state.maxVotes} votes left
            </span>
          )}
          <button
            onClick={toggleActionPanel}
            aria-label={
              actionPanelOpen ? 'Collapse action items' : 'Expand action items'
            }
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              color: theme.textTertiary,
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'inherit',
              padding: 0,
            }}
          >
            {actionPanelOpen ? '▾ action items' : '▸ action items'}
          </button>
        </div>
        {actionPanelOpen && (
          <div
            style={{
              maxHeight: 260,
              overflowY: 'auto',
              borderTop: `1px solid ${theme.border}40`,
            }}
          >
            <ActionItemsPanel retroId={retroId} />
          </div>
        )}
      </div>
    </div>
  )
}
