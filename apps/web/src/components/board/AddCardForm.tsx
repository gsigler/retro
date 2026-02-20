import { useState } from 'react'
import { createCard } from '@/lib/api'
import { useBoardContext } from './BoardProvider'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface AddCardFormProps {
  token: string
  retroId: string
  columnId: string
}

export function AddCardForm({ token, retroId, columnId }: AddCardFormProps) {
  const { dispatch } = useBoardContext()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

    setSubmitting(true)
    try {
      const card = await createCard(token, retroId, {
        columnId,
        content: trimmed,
      })
      dispatch({ type: 'CARD_CREATED', card })
      setContent('')
      setIsOpen(false)
    } catch {
      // Socket broadcast will also update
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-sm transition-colors"
      >
        <Plus className="size-4" />
        Add card
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your thought..."
        autoFocus
        rows={2}
        className="placeholder:text-muted-foreground w-full resize-none rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
          }
          if (e.key === 'Escape') {
            setIsOpen(false)
            setContent('')
          }
        }}
      />
      <div className="flex gap-1">
        <Button
          type="submit"
          size="xs"
          disabled={submitting || !content.trim()}
        >
          {submitting ? 'Adding...' : 'Add'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => {
            setIsOpen(false)
            setContent('')
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
