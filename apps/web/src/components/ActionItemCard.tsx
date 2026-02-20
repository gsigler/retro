import { Pencil, Trash2, Play, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { ActionItem } from '@/types/api'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: 'Open',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  DONE: {
    label: 'Done',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
}

interface ActionItemCardProps {
  item: ActionItem
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onStatusTransition: (status: string) => void
}

export function ActionItemCard({
  item,
  canManage,
  onEdit,
  onDelete,
  onStatusTransition,
}: ActionItemCardProps) {
  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.OPEN

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{item.title}</CardTitle>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {item.description && (
          <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
            {item.description}
          </p>
        )}
        <div className="text-muted-foreground mb-3 flex flex-wrap gap-3 text-sm">
          {item.assignee && (
            <div className="flex items-center gap-1">
              {item.assignee.avatarUrl ? (
                <img
                  src={item.assignee.avatarUrl}
                  alt=""
                  className="size-4 rounded-full"
                />
              ) : (
                <div className="bg-muted flex size-4 items-center justify-center rounded-full text-[10px]">
                  {item.assignee.name?.[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <span>{item.assignee.name ?? 'Unassigned'}</span>
            </div>
          )}
          {item.dueDate && (
            <span>Due {new Date(item.dueDate).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex gap-1">
          {item.status === 'OPEN' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusTransition('IN_PROGRESS')}
            >
              <Play className="size-3" />
              Start
            </Button>
          )}
          {item.status === 'IN_PROGRESS' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusTransition('DONE')}
            >
              <CheckCircle2 className="size-3" />
              Done
            </Button>
          )}
          {canManage && (
            <>
              <Button variant="ghost" size="icon-xs" onClick={onEdit}>
                <Pencil className="size-3" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onDelete}>
                <Trash2 className="size-3" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
