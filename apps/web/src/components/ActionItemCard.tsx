import { useState, useRef, useEffect, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { ActionItem, TeamMember } from '@/types/api'

interface ActionItemCardProps {
  item: ActionItem
  members?: TeamMember[]
  onMarkDone: () => void
  onMarkOpen: () => void
  onUpdate?: (data: {
    title?: string
    assigneeId?: string | null
    dueDate?: string | null
  }) => Promise<void>
  onDelete?: () => void
}

export function ActionItemCard({
  item,
  members,
  onMarkDone,
  onMarkOpen,
  onUpdate,
  onDelete,
}: ActionItemCardProps) {
  const { theme } = useTheme()
  const isDone = item.status === 'DONE'
  const isOverdue =
    item.dueDate && !isDone && new Date(item.dueDate) < new Date()
  const editable = !!onUpdate

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [isExiting, setIsExiting] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const checkRef = useRef<HTMLButtonElement>(null)

  const triggerCheckPop = useCallback(() => {
    const el = checkRef.current
    if (el) {
      el.style.animation = 'none'
      void el.offsetHeight
      el.style.animation = 'check-pop 200ms ease-out'
    }
  }, [])

  useEffect(() => {
    setTitle(item.title)
  }, [item.title])

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  async function commitTitle() {
    const trimmed = title.trim()
    if (trimmed && trimmed !== item.title) {
      await onUpdate!({ title: trimmed })
    } else {
      setTitle(item.title)
    }
    setEditing(false)
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitTitle()
    }
    if (e.key === 'Escape') {
      setTitle(item.title)
      setEditing(false)
    }
  }

  function handleDelete() {
    if (!onDelete) return
    setIsExiting(true)
    setTimeout(() => {
      onDelete()
    }, 200)
  }

  const dueDateValue = item.dueDate
    ? new Date(item.dueDate).toISOString().slice(0, 10)
    : ''

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '4px 8px',
        fontSize: 12,
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(-8px)' : 'translateX(0)',
        transition:
          'opacity 200ms ease-out, transform 200ms ease-out, background 150ms ease',
        borderBottom: `1px solid ${theme.border}22`,
        background: isHovered ? `${theme.bgHover}` : 'transparent',
        animation: 'slide-in 0.2s ease-out',
      }}
    >
      <button
        ref={checkRef}
        onClick={() => {
          triggerCheckPop()
          if (isDone) {
            onMarkOpen()
          } else {
            onMarkDone()
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: isDone ? theme.green : theme.textTertiary,
          cursor: 'pointer',
          padding: '4px 2px',
          margin: '-4px -2px',
          flexShrink: 0,
          fontFamily: 'inherit',
          fontSize: 13,
          lineHeight: 1,
          transition: 'color 150ms ease',
        }}
        aria-label={isDone ? 'Mark as open' : 'Mark as done'}
      >
        {isDone ? '[x]' : '[ ]'}
      </button>

      {editable && editing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={handleTitleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.textPrimary,
            fontFamily: 'inherit',
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
            margin: 0,
          }}
        />
      ) : (
        <span
          onClick={editable ? () => setEditing(true) : undefined}
          style={{
            flex: 1,
            fontWeight: 600,
            textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? theme.textTertiary : theme.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: editable ? 'text' : 'default',
            transition: 'color 150ms ease',
          }}
        >
          {item.title}
        </span>
      )}

      {editable ? (
        <select
          value={item.assignee?.id ?? ''}
          onChange={(e) => onUpdate!({ assigneeId: e.target.value || null })}
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.cyan,
            fontFamily: 'inherit',
            fontSize: 11,
            padding: 0,
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <option value="">@unassigned</option>
          {(members ?? []).map((m) => (
            <option key={m.user.id} value={m.user.id}>
              @{m.user.name ?? m.user.email}
            </option>
          ))}
        </select>
      ) : (
        <span style={{ color: theme.cyan, flexShrink: 0, fontSize: 11 }}>
          @{item.assignee ? (item.assignee.name ?? 'unnamed') : 'unassigned'}
        </span>
      )}

      {editable ? (
        <input
          type="date"
          value={dueDateValue}
          onChange={(e) => onUpdate!({ dueDate: e.target.value || null })}
          style={{
            background: 'transparent',
            border: 'none',
            color: isOverdue ? theme.red : theme.textTertiary,
            fontWeight: isOverdue ? 600 : 400,
            fontFamily: 'inherit',
            fontSize: 11,
            padding: 0,
            outline: 'none',
            flexShrink: 0,
            colorScheme: 'dark',
          }}
        />
      ) : (
        item.dueDate && (
          <span
            style={{
              color: isOverdue ? theme.red : theme.textTertiary,
              fontWeight: isOverdue ? 600 : 400,
              flexShrink: 0,
              fontSize: 11,
            }}
          >
            due:{new Date(item.dueDate).toLocaleDateString()}
          </span>
        )
      )}

      {isDone && (
        <span style={{ color: theme.green, flexShrink: 0 }}>&#10003;</span>
      )}

      {onDelete && (
        <button
          onClick={handleDelete}
          aria-label="Delete action item"
          style={{
            background: 'transparent',
            border: 'none',
            color: theme.textTertiary,
            cursor: 'pointer',
            fontSize: 11,
            padding: 0,
            fontFamily: 'inherit',
            opacity: isHovered ? 0.6 : 0,
            flexShrink: 0,
            transition: 'opacity 150ms ease, color 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.color = theme.red
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = isHovered ? '0.6' : '0'
            e.currentTarget.style.color = theme.textTertiary
          }}
        >
          [rm]
        </button>
      )}
    </div>
  )
}
