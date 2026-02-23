import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTheme } from '@/contexts/ThemeContext'
import { BoardCard } from './BoardCard'
import { AddCardForm } from './AddCardForm'
import type { Column } from '@/types/api'

interface BoardColumnProps {
  column: Column
  token: string
  retroId: string
}

export function BoardColumn({ column, token, retroId }: BoardColumnProps) {
  const { theme } = useTheme()
  const { setNodeRef } = useDroppable({ id: column.id })

  const topLevelCards = column.cards.filter((c) => !c.parentCardId)
  const count = topLevelCards.length

  const lineColor = column.color ?? theme.border

  return (
    <div
      style={{
        flex: 1,
        minWidth: 240,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${lineColor}40`,
        borderRadius: 6,
        position: 'relative',
      }}
    >
      {/* Sticky column header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 5,
          background: theme.bgSecondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          borderBottom: `1px solid ${lineColor}40`,
          borderRadius: '6px 6px 0 0',
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: column.color ?? theme.textTertiary,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {column.name}
          {count > 0 ? ` (${count})` : ''}
        </span>
        {column.description && (
          <div style={{ marginLeft: 'auto' }}>
            <span
              style={{
                fontSize: 11,
                color: theme.textTertiary,
                opacity: 0.6,
              }}
            >
              {column.description}
            </span>
          </div>
        )}
      </div>

      {/* Scrollable card area */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          minHeight: 24,
        }}
      >
        <SortableContext
          items={topLevelCards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {topLevelCards.map((card) => (
            <BoardCard
              key={card.id}
              card={card}
              token={token}
              retroId={retroId}
            />
          ))}
        </SortableContext>
        <AddCardForm token={token} retroId={retroId} columnId={column.id} />
      </div>
    </div>
  )
}
