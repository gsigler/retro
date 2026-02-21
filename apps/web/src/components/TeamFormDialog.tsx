import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalInput } from '@/components/terminal/TerminalInput'

interface TeamFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; description?: string }) => Promise<void>
  initialValues?: { name: string; description?: string }
  mode: 'create' | 'edit'
}

export function TeamFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode,
}: TeamFormDialogProps) {
  const { theme } = useTheme()
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setDescription(initialValues?.description ?? '')
      setError(null)
    }
  }, [open, initialValues?.name, initialValues?.description])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
      })
      onOpenChange(false)
    } catch {
      setError(
        mode === 'create' ? 'Failed to create team' : 'Failed to update team',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TerminalDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={mode === 'create' ? 'Create Team' : 'Edit Team'}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="team-name"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Name
          </label>
          <TerminalInput
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Team"
            required
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="team-description"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Description
          </label>
          <TerminalInput
            id="team-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
        </div>
        {error && <p style={{ color: theme.red, fontSize: 13 }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <TerminalButton
            type="submit"
            variant="submit"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </TerminalButton>
        </div>
      </form>
    </TerminalDialog>
  )
}
