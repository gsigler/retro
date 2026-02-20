import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TeamMember } from '@/types/api'

interface MemberListProps {
  members: TeamMember[]
  ownerId: string
  isOwner: boolean
  onRemove: (userId: string) => void
}

export function MemberList({
  members,
  ownerId,
  isOwner,
  onRemove,
}: MemberListProps) {
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border px-4 py-2"
        >
          <div className="flex items-center gap-3">
            {member.user.avatarUrl ? (
              <img
                src={member.user.avatarUrl}
                alt=""
                className="size-8 rounded-full"
              />
            ) : (
              <div className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full text-sm font-medium">
                {(member.user.name ?? member.user.email)?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">
                {member.user.name ?? member.user.email}
              </p>
              <p className="text-muted-foreground text-xs">{member.role}</p>
            </div>
          </div>
          {isOwner && member.user.id !== ownerId && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(member.user.id)}
              aria-label={`Remove ${member.user.name ?? member.user.email}`}
            >
              <X className="size-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
