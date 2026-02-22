import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
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

  return (
    <div
      style={{
        flex: 1,
        minWidth: 240,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TerminalFrame
        title={`${column.name}${count > 0 ? ` (${count})` : ''}`}
        color={column.color}
        right={
          column.description && (
            <span
              style={{
                fontSize: 11,
                color: theme.textTertiary,
                opacity: 0.6,
              }}
            >
              {column.description}
            </span>
          )
        }
      >
        <div
          ref={setNodeRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
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
                columnColor={column.color}
              />
            ))}
          </SortableContext>
          <AddCardForm token={token} retroId={retroId} columnId={column.id} />
        </div>
      </TerminalFrame>
    </div>
  )
}
