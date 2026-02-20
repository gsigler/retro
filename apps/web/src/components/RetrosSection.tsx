import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RetroCard } from '@/components/RetroCard'
import { RetroFormDialog } from '@/components/RetroFormDialog'
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
  selectedRetroId: string | null
  onSelectRetro: (retroId: string | null) => void
  onMutation: () => void
}

export function RetrosSection({
  token,
  userId,
  selectedRetroId,
  onSelectRetro,
  onMutation,
}: RetrosSectionProps) {
  const [retros, setRetros] = useState<RetroWithCounts[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamOwnerId, setTeamOwnerId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingRetro, setEditingRetro] = useState<RetroWithCounts | null>(null)

  const loadRetros = useCallback(async () => {
    setIsLoading(true)
    try {
      const teams = await fetchTeams(token)
      if (teams.length === 0) {
        setRetros([])
        setTeamId(null)
        setIsLoading(false)
        return
      }
      const team = teams.find((t) => t.ownerId === userId) ?? teams[0]
      setTeamId(team.id)
      setTeamOwnerId(team.ownerId)
      const data = await fetchRetros(token, team.id)
      setRetros(data)
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [token, userId])

  useEffect(() => {
    loadRetros()
  }, [loadRetros])

  const refresh = useCallback(async () => {
    await loadRetros()
    onMutation()
  }, [loadRetros, onMutation])

  async function handleCreateRetro(data: { name: string; date: string }) {
    if (!teamId) return
    await createRetro(token, teamId, data)
    await refresh()
  }

  async function handleEditRetro(data: { name: string; date: string }) {
    if (!editingRetro) return
    await updateRetro(token, editingRetro.id, data)
    setEditingRetro(null)
    await refresh()
  }

  async function handleDeleteRetro(retroId: string) {
    await deleteRetro(token, retroId)
    if (selectedRetroId === retroId) onSelectRetro(null)
    await refresh()
  }

  async function handleStatusTransition(retroId: string, status: string) {
    await updateRetro(token, retroId, { status })
    await refresh()
  }

  function canManageRetro(retro: RetroWithCounts) {
    return retro.createdBy.id === userId || teamOwnerId === userId
  }

  if (isLoading) {
    return <div className="bg-muted/50 mt-6 h-48 animate-pulse rounded-xl" />
  }

  if (!teamId) return null

  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Retros</CardTitle>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="size-4" />
              New Retro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {retros.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No retros yet. Create one to get started.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {retros.map((retro) => (
                <RetroCard
                  key={retro.id}
                  retro={retro}
                  canManage={canManageRetro(retro)}
                  isSelected={selectedRetroId === retro.id}
                  onSelect={() =>
                    onSelectRetro(
                      selectedRetroId === retro.id ? null : retro.id,
                    )
                  }
                  onEdit={() => setEditingRetro(retro)}
                  onDelete={() => handleDeleteRetro(retro.id)}
                  onStatusTransition={(status) =>
                    handleStatusTransition(retro.id, status)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  )
}
