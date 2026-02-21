import { useState } from 'react'
import { createCard } from '@/lib/api'
import { useTheme } from '@/contexts/ThemeContext'
import { useBoardContext } from './BoardProvider'

interface AddCardFormProps {
  token: string
  retroId: string
  columnId: string
}

export function AddCardForm({ token, retroId, columnId }: AddCardFormProps) {
  const { theme } = useTheme()
  const { dispatch } = useBoardContext()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return

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
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '6px 10px',
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          color: theme.textTertiary,
          fontFamily: 'inherit',
          fontSize: 12,
          cursor: 'pointer',
          textAlign: 'left',
          opacity: 0.5,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.5'
        }}
      >
        <span style={{ color: theme.green }}>$</span> add item...
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          borderLeft: `2px solid ${theme.green}`,
          padding: '6px 10px',
        }}
      >
        <span
          style={{
            color: theme.green,
            fontWeight: 600,
            marginTop: 2,
            flexShrink: 0,
          }}
        >
          $
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type your thought..."
          autoFocus
          rows={2}
          style={{
            width: '100%',
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.textPrimary,
            fontFamily: 'inherit',
            fontSize: 12,
          }}
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
      </div>
      <div style={{ marginTop: 4, paddingLeft: 20, fontSize: 11 }}>
        <span style={{ color: theme.textTertiary }}>
          Enter to submit &middot; Esc to cancel
        </span>
      </div>
    </form>
  )
}
