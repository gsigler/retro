import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalInput } from '@/components/terminal/TerminalInput'

interface RetroFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: { name: string; date: string }) => Promise<void>
  initialValues?: { name: string; date: string }
  mode: 'create' | 'edit'
}

export function RetroFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  mode,
}: RetroFormDialogProps) {
  const { theme } = useTheme()
  const [name, setName] = useState(initialValues?.name ?? '')
  const [date, setDate] = useState(initialValues?.date ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? '')
      setDate(initialValues?.date ?? '')
      setError(null)
    }
  }, [open, initialValues?.name, initialValues?.date])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !date) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), date })
      onOpenChange(false)
    } catch {
      setError(
        mode === 'create' ? 'Failed to create retro' : 'Failed to update retro',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TerminalDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={mode === 'create' ? 'New Retro' : 'Edit Retro'}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="retro-name"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Name
          </label>
          <TerminalInput
            id="retro-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sprint 1 Retro"
            required
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="retro-date"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Date
          </label>
          <TerminalInput
            id="retro-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            prefix=""
            required
          />
        </div>
        {error && <p style={{ color: theme.red, fontSize: 13 }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <TerminalButton
            type="submit"
            variant="submit"
            disabled={isSubmitting || !name.trim() || !date}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </TerminalButton>
        </div>
      </form>
    </TerminalDialog>
  )
}
