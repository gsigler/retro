import { Circle, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import type { ActionItem } from '@/types/api'

interface ActionItemCardProps {
  item: ActionItem
  onMarkDone: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ActionItemCard({
  item,
  onMarkDone,
  onEdit,
  onDelete,
}: ActionItemCardProps) {
  const isDone = item.status === 'DONE'
  const isOverdue =
    item.dueDate && !isDone && new Date(item.dueDate) < new Date()

  return (
    <div className="group flex items-start gap-3 rounded-lg border p-3">
      <button
        onClick={onMarkDone}
        disabled={isDone}
        className="text-muted-foreground hover:text-primary mt-0.5 shrink-0 disabled:opacity-50"
        aria-label={isDone ? 'Completed' : 'Mark as done'}
      >
        {isDone ? (
          <CheckCircle2 className="size-5 text-green-600" />
        ) : (
          <Circle className="size-5" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : ''}`}
        >
          {item.title}
        </p>
        <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            {item.assignee ? (
              <>
                {item.assignee.avatarUrl ? (
                  <img
                    src={item.assignee.avatarUrl}
                    alt=""
                    className="size-4 rounded-full"
                  />
                ) : (
                  <span className="bg-muted inline-flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                    {item.assignee.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                {item.assignee.name ?? 'Unnamed'}
              </>
            ) : (
              <span className="italic">Unassigned</span>
            )}
          </span>
          {item.dueDate && (
            <span className={isOverdue ? 'text-destructive font-medium' : ''}>
              Due {new Date(item.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-muted-foreground hover:text-primary"
            aria-label="Edit action item"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
            aria-label="Delete action item"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
