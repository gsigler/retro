import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTheme } from '@/contexts/ThemeContext'
import { deleteCard } from '@/lib/api'
import { useBoardContext } from './BoardProvider'
import type { Card } from '@/types/api'

interface BoardCardProps {
  card: Card
  token: string
  retroId: string
  columnColor?: string
}

export function BoardCard({
  card,
  token,
  retroId,
  columnColor,
}: BoardCardProps) {
  const { theme } = useTheme()
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
    borderLeft: `2px solid ${columnColor ?? theme.border}`,
    borderRadius: 0,
    padding: '6px 10px',
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    position: 'relative' as const,
    borderBottom: `1px solid ${theme.border}22`,
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
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <p
        style={{
          whiteSpace: 'pre-wrap',
          fontSize: 12,
          color: theme.textPrimary,
        }}
      >
        {card.content}
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 11, color: theme.textTertiary, opacity: 0.6 }}>
          {card.author.name ?? 'Anonymous'}
        </span>
        <button
          onClick={handleDelete}
          aria-label="Delete card"
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.textTertiary,
            cursor: 'pointer',
            fontSize: 11,
            padding: 0,
            fontFamily: 'inherit',
            opacity: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.color = theme.red
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0'
            e.currentTarget.style.color = theme.textTertiary
          }}
        >
          [rm]
        </button>
      </div>
    </div>
  )
}
