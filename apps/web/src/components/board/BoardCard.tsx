import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2 } from 'lucide-react'
import { deleteCard } from '@/lib/api'
import { useBoardContext } from './BoardProvider'
import type { Card } from '@/types/api'

interface BoardCardProps {
  card: Card
  token: string
  retroId: string
}

export function BoardCard({ card, token, retroId }: BoardCardProps) {
  const { dispatch } = useBoardContext()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  async function handleDelete() {
    try {
      dispatch({ type: 'CARD_DELETED', id: card.id })
      await deleteCard(token, retroId, card.id)
    } catch {
      // Socket broadcast will reconcile
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group rounded-lg border bg-background p-3 shadow-xs transition-shadow hover:shadow-sm ${
        isDragging ? 'opacity-50 shadow-md' : ''
      }`}
    >
      <p className="whitespace-pre-wrap text-sm">{card.content}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs">
          {card.author.name ?? 'Anonymous'}
        </span>
        <button
          onClick={handleDelete}
          className="text-muted-foreground hover:text-destructive opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete card"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
