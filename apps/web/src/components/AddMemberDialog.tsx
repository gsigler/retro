import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalInput } from '@/components/terminal/TerminalInput'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (email: string) => Promise<void>
}

export function AddMemberDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddMemberDialogProps) {
  const { theme } = useTheme()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setEmail('')
      setError(null)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(email.trim())
      setEmail('')
      onOpenChange(false)
    } catch {
      setError('Failed to add member. Check the email and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TerminalDialog
      open={open}
      onClose={() => onOpenChange(false)}
      title="Add Member"
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label
            htmlFor="member-email"
            style={{ fontSize: 13, color: theme.textTertiary }}
          >
            Email
          </label>
          <TerminalInput
            id="member-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
          />
        </div>
        {error && <p style={{ color: theme.red, fontSize: 13 }}>{error}</p>}
        <div className="flex justify-end gap-2">
          <TerminalButton
            type="submit"
            variant="submit"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </TerminalButton>
        </div>
      </form>
    </TerminalDialog>
  )
}
