import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalInput } from '@/components/terminal/TerminalInput'
import { TerminalSelect } from '@/components/terminal/TerminalSelect'
import type { TeamMember } from '@/types/api'

interface ActionItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    title: string
    description?: string
    assigneeId?: string
    dueDate?: string
  }) => Promise<void>
  initialValues?: {
    title: string
    description?: string
    assigneeId?: string
    dueDate?: string
  }
  members: TeamMember[]
  mode: 'create' | 'edit'
}

export function ActionItemFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  members,
  mode,
}: ActionItemFormDialogProps) {
  const { theme } = useTheme()
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [assigneeId, setAssigneeId] = useState(initialValues?.assigneeId ?? '')
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(initialValues?.title ?? '')
      setDescription(initialValues?.description ?? '')
      setAssigneeId(initialValues?.assigneeId ?? '')
      setDueDate(initialValues?.dueDate ?? '')
      setError(null)
    }
  }, [
    open,
    initialValues?.title,
    initialValues?.description,
    initialValues?.assigneeId,
    initialValues?.dueDate,
  ])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined,
      })
      onOpenChange(false)
    } catch {
      setError(
        mode === 'create'
          ? 'Failed to create action item'
          : 'Failed to update action item',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TerminalDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title={mode === 'create' ? 'New Action Item' : 'Edit Action Item'}
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="item-title"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Title
          </label>
          <TerminalInput
            id="item-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            required
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="item-description"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Description
          </label>
          <TerminalInput
            id="item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional details"
          />
        </div>
        <div className="grid gap-2">
          <label style={{ fontSize: 13, color: theme.textTertiary }}>
            Assignee
          </label>
          <TerminalSelect
            value={assigneeId}
            onValueChange={setAssigneeId}
            options={members.map((m) => ({
              value: m.user.id,
              label: m.user.name ?? m.user.email,
            }))}
            placeholder="Select assignee"
          />
        </div>
        <div className="grid gap-2">
          <label
            htmlFor="item-due-date"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Due Date
          </label>
          <TerminalInput
            id="item-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            prefix=""
          />
        </div>
        {error && <p style={{ color: theme.red, fontSize: 13 }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <TerminalButton
            type="submit"
            disabled={isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
          </TerminalButton>
        </div>
      </form>
    </TerminalDialog>
  )
}
