import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalInput } from '@/components/terminal/TerminalInput'
import { MemberList } from '@/components/MemberList'
import { TeamFormDialog } from '@/components/TeamFormDialog'
import { AddMemberDialog } from '@/components/AddMemberDialog'
import { BlinkingCursor } from '@/components/board/TypingEffect'
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
  const { theme } = useTheme()
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
    return (
      <div>
        <p style={{ color: theme.green, fontSize: 12 }}>
          Loading...
          <BlinkingCursor />
        </p>
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div>
        <p
          style={{
            color: theme.textTertiary,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          No teams found. Create a new team or join with an invite code.
        </p>

        <TerminalButton onClick={() => setShowCreateDialog(true)}>
          + create team
        </TerminalButton>

        <div
          style={{
            borderTop: `1px solid ${theme.border}40`,
            marginTop: 12,
            paddingTop: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: theme.textTertiary,
              marginBottom: 8,
            }}
          >
            <span style={{ color: theme.yellow }}>?</span> Have an invite code?
          </p>
          <form
            onSubmit={handleJoinTeam}
            style={{ display: 'flex', gap: 8, alignItems: 'center' }}
          >
            <TerminalInput
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="paste invite code"
              style={{ maxWidth: 280, flex: 1 }}
            />
            <TerminalButton
              type="submit"
              variant="submit"
              size="sm"
              disabled={isJoining || !inviteCode.trim()}
            >
              {isJoining ? 'joining...' : 'join'}
            </TerminalButton>
          </form>
          {joinError && (
            <p style={{ color: theme.red, fontSize: 11, marginTop: 4 }}>
              ERR! {joinError}
            </p>
          )}
        </div>

        <TeamFormDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSubmit={handleCreateTeam}
          mode="create"
        />
      </div>
    )
  }

  const team = teams[0]

  return (
    <>
      {/* Team info row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: theme.textTertiary,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontWeight: 700, color: theme.textPrimary }}>
          {teamDetail?.name ?? team.name}
        </span>
        <span style={{ color: theme.border }}>│</span>
        <span>
          {teamDetail?.description ?? team.description ?? 'No description'}
        </span>
        <span style={{ color: theme.border }}>│</span>
        <span>
          <span style={{ color: theme.purple }}>{team.memberCount}</span>{' '}
          members
        </span>
        <span>
          <span style={{ color: theme.purple }}>{team.retroCount}</span> retros
        </span>
        {isOwner && (
          <>
            <span style={{ color: theme.border }}>│</span>
            <span
              onClick={() => setShowEditDialog(true)}
              style={{ color: theme.cyan, cursor: 'pointer' }}
            >
              [edit]
            </span>
          </>
        )}
      </div>

      {/* Invite code */}
      {isOwner && teamDetail && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            fontSize: 11,
            color: theme.textTertiary,
          }}
        >
          invite:
          <code
            style={{
              background: theme.bgSecondary,
              border: `1px solid ${theme.border}`,
              borderRadius: 3,
              padding: '1px 6px',
              fontSize: 11,
              color: theme.yellow,
              letterSpacing: '0.05em',
            }}
          >
            {teamDetail.inviteCode}
          </code>
          <span
            onClick={handleCopyInviteCode}
            style={{ color: theme.cyan, cursor: 'pointer' }}
          >
            {copied ? 'copied!' : '[copy]'}
          </span>
        </div>
      )}

      {/* Members */}
      {teamDetail && (
        <div
          style={{
            marginTop: 12,
            borderTop: `1px solid ${theme.border}40`,
            paddingTop: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: theme.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              members ({teamDetail.members.length})
            </span>
            {isOwner && (
              <span
                onClick={() => setShowAddMemberDialog(true)}
                style={{
                  fontSize: 11,
                  color: theme.green,
                  cursor: 'pointer',
                }}
              >
                [+ add]
              </span>
            )}
          </div>
          <MemberList
            members={teamDetail.members}
            ownerId={teamDetail.ownerId}
            isOwner={isOwner}
            onRemove={handleRemoveMember}
          />
        </div>
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
    </>
  )
}
