import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { RetroCard } from '@/components/RetroCard'
import { RetroFormDialog } from '@/components/RetroFormDialog'
import { TerminalSkeleton } from '@/components/terminal/TerminalSkeleton'
import {
  fetchTeams,
  fetchRetros,
  createRetro,
  updateRetro,
  deleteRetro,
} from '@/lib/api'
import type { RetroWithCounts } from '@/types/api'

interface RetrosSectionProps {
  token: string
  userId: string
  onMutation: () => void
}

export function RetrosSection({
  token,
  userId,
  onMutation,
}: RetrosSectionProps) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRetro, setEditingRetro] = useState<RetroWithCounts | null>(null)

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(token),
  })

  const team = teams?.find((t) => t.ownerId === userId) ?? teams?.[0]

  const { data: retros, isLoading } = useQuery({
    queryKey: ['retros', team?.id],
    queryFn: () => fetchRetros(token, team!.id),
    enabled: !!team,
  })

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['retros'] })
    onMutation()
  }

  async function handleCreateRetro(data: {
    name: string
    date: string
    templateId?: string
  }) {
    if (!team) return
    const retro = await createRetro(token, team.id, data)
    navigate(`/retros/${retro.id}/board`)
  }

  async function handleEditRetro(data: { name: string; date: string }) {
    if (!editingRetro) return
    await updateRetro(token, editingRetro.id, data)
    setEditingRetro(null)
    await refresh()
  }

  async function handleDeleteRetro(retroId: string) {
    await deleteRetro(token, retroId)
    await refresh()
  }

  function canManageRetro(retro: RetroWithCounts) {
    return retro.createdBy.id === userId || team?.ownerId === userId
  }

  if (isLoading) {
    return (
      <TerminalFrame title="$ retro list --all">
        <TerminalSkeleton lines={3} widths={[90, 75, 60]} />
      </TerminalFrame>
    )
  }

  if (!team) return null

  return (
    <TerminalFrame
      title="$ retro list --all"
      right={
        <TerminalButton size="sm" onClick={() => setShowCreateDialog(true)}>
          + new retro
        </TerminalButton>
      }
    >
      {!retros || retros.length === 0 ? (
        <p style={{ fontSize: 12, color: theme.textTertiary }}>
          <span style={{ color: theme.yellow }}>0</span> retros found. Create
          one to get started.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {retros.map((retro) => (
            <RetroCard
              key={retro.id}
              retro={retro}
              canManage={canManageRetro(retro)}
              onEdit={() => setEditingRetro(retro)}
              onDelete={() => handleDeleteRetro(retro.id)}
            />
          ))}
        </div>
      )}

      <RetroFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreateRetro}
        mode="create"
      />

      {editingRetro && (
        <RetroFormDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingRetro(null)
          }}
          onSubmit={handleEditRetro}
          initialValues={{
            name: editingRetro.name,
            date: editingRetro.date.split('T')[0],
          }}
          mode="edit"
        />
      )}
    </TerminalFrame>
  )
}
