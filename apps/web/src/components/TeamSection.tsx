import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Pencil, Plus, UserPlus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MemberList } from '@/components/MemberList'
import { TeamFormDialog } from '@/components/TeamFormDialog'
import { AddMemberDialog } from '@/components/AddMemberDialog'
import {
  fetchTeams,
  fetchTeam,
  createTeam,
  updateTeam,
  joinTeam,
  addTeamMember,
  removeTeamMember,
} from '@/lib/api'

interface TeamSectionProps {
  token: string
  userId: string
  onMutation: () => void
}

export function TeamSection({ token, userId, onMutation }: TeamSectionProps) {
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)

  const [inviteCode, setInviteCode] = useState('')
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isJoining, setIsJoining] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(token),
  })

  const primaryTeam = teams?.[0]

  const { data: teamDetail } = useQuery({
    queryKey: ['team-detail', primaryTeam?.id],
    queryFn: () => fetchTeam(token, primaryTeam!.id),
    enabled: !!primaryTeam,
  })

  const isOwner = teamDetail?.ownerId === userId

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['teams'] })
    await queryClient.invalidateQueries({ queryKey: ['team-detail'] })
    onMutation()
  }

  async function handleCreateTeam(data: {
    name: string
    description?: string
  }) {
    await createTeam(token, data)
    await refresh()
  }

  async function handleEditTeam(data: { name: string; description?: string }) {
    if (!teamDetail) return
    await updateTeam(token, teamDetail.id, data)
    await refresh()
  }

  async function handleJoinTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return
    setIsJoining(true)
    setJoinError(null)
    try {
      await joinTeam(token, inviteCode.trim())
      setInviteCode('')
      await refresh()
    } catch {
      setJoinError('Invalid invite code')
    } finally {
      setIsJoining(false)
    }
  }

  async function handleAddMember(email: string) {
    if (!teamDetail) return
    await addTeamMember(token, teamDetail.id, email)
    await refresh()
  }

  async function handleRemoveMember(memberUserId: string) {
    if (!teamDetail) return
    await removeTeamMember(token, teamDetail.id, memberUserId)
    await refresh()
  }

  function handleCopyInviteCode() {
    if (!teamDetail) return
    navigator.clipboard.writeText(teamDetail.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoadingTeams) {
    return <div className="bg-muted/50 mt-6 h-48 animate-pulse rounded-xl" />
  }

  // No team — onboarding
  if (!teams || teams.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Get Started</CardTitle>
          <CardDescription>
            Create a new team or join an existing one
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="size-4" />
              Create Team
            </Button>
          </div>
          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-2 text-sm">
              Have an invite code? Join a team:
            </p>
            <form onSubmit={handleJoinTeam} className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Paste invite code"
                className="max-w-xs"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={isJoining || !inviteCode.trim()}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </Button>
            </form>
            {joinError && (
              <p className="text-destructive mt-1 text-sm">{joinError}</p>
            )}
          </div>
        </CardContent>

        <TeamFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateTeam}
          mode="create"
        />
      </Card>
    )
  }

  // Has a team
  const team = teams[0]

  return (
    <div className="mt-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{teamDetail?.name ?? team.name}</CardTitle>
              <CardDescription>
                {teamDetail?.description ??
                  team.description ??
                  'No description'}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowEditDialog(true)}
                aria-label="Edit team"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-muted-foreground flex gap-4 text-sm">
            <span>{team.memberCount} members</span>
            <span>{team.retroCount} retros</span>
          </div>

          {isOwner && teamDetail && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                Invite code:
              </span>
              <code className="bg-muted rounded px-2 py-1 text-sm">
                {teamDetail.inviteCode}
              </code>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleCopyInviteCode}
                aria-label="Copy invite code"
              >
                <Copy className="size-3" />
              </Button>
              {copied && (
                <span className="text-muted-foreground text-xs">Copied!</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {teamDetail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Members</CardTitle>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMemberDialog(true)}
                >
                  <UserPlus className="size-4" />
                  Add Member
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <MemberList
              members={teamDetail.members}
              ownerId={teamDetail.ownerId}
              isOwner={isOwner}
              onRemove={handleRemoveMember}
            />
          </CardContent>
        </Card>
      )}

      {isOwner && teamDetail && (
        <>
          <TeamFormDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSubmit={handleEditTeam}
            initialValues={{
              name: teamDetail.name,
              description: teamDetail.description ?? undefined,
            }}
            mode="edit"
          />
          <AddMemberDialog
            open={showAddMemberDialog}
            onOpenChange={setShowAddMemberDialog}
            onSubmit={handleAddMember}
          />
        </>
      )}
    </div>
  )
}
