import { Link } from 'react-router'
import {
  Pencil,
  Trash2,
  Play,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { RetroWithCounts } from '@/types/api'

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  SCHEDULED: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  COMPLETED: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
}

interface RetroCardProps {
  retro: RetroWithCounts
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
  onStatusTransition: (status: string) => void
}

export function RetroCard({
  retro,
  canManage,
  onEdit,
  onDelete,
  onStatusTransition,
}: RetroCardProps) {
  const badge = STATUS_BADGE[retro.status] ?? STATUS_BADGE.SCHEDULED

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{retro.name}</CardTitle>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground mb-3 flex gap-3 text-sm">
          <span>{new Date(retro.date).toLocaleDateString()}</span>
          <span>{retro.actionItemCount} action items</span>
        </div>
        <div className="flex gap-1">
          <Link to={`/retros/${retro.id}/board`}>
            <Button variant="ghost" size="xs">
              <LayoutDashboard className="size-3" />
              Open Board
            </Button>
          </Link>
          {retro.status === 'SCHEDULED' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusTransition('IN_PROGRESS')}
            >
              <Play className="size-3" />
              Start
            </Button>
          )}
          {retro.status === 'IN_PROGRESS' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onStatusTransition('COMPLETED')}
            >
              <CheckCircle2 className="size-3" />
              Complete
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
