import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New Retro' : 'Edit Retro'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Schedule a new retrospective'
              : 'Update retro details'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="retro-name">Name</Label>
            <Input
              id="retro-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1 Retro"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="retro-date">Date</Label>
            <Input
              id="retro-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || !date}
            >
              {isSubmitting
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create'
                  : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
