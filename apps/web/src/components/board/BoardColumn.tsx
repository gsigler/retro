import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BoardCard } from './BoardCard'
import { AddCardForm } from './AddCardForm'
import type { Column } from '@/types/api'

interface BoardColumnProps {
  column: Column
  token: string
  retroId: string
}

export function BoardColumn({ column, token, retroId }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-3">
        <div
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold">{column.name}</h3>
        <span className="text-muted-foreground ml-auto text-xs">
          {column.cards.length}
        </span>
      </div>
      {column.description && (
        <p className="text-muted-foreground px-3 pb-2 text-xs">
          {column.description}
        </p>
      )}
      <div
        ref={setNodeRef}
        className="flex min-h-[2rem] flex-1 flex-col gap-2 px-3 pb-3"
      >
        <SortableContext
          items={column.cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.cards.map((card) => (
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
