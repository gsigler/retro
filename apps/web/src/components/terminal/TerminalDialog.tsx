import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTheme } from '@/contexts/ThemeContext'

interface TerminalDialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  dismissable?: boolean
}

export function TerminalDialog({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: TerminalDialogProps) {
  const { theme } = useTheme()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open || !dismissable) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose, dismissable])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (dismissable && e.target === overlayRef.current) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
    >
      <div
        style={{
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 8,
          width: '100%',
          maxWidth: 480,
          margin: '0 16px',
          overflow: 'visible',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <TerminalDialogTitle>{title}</TerminalDialogTitle>
          {dismissable && (
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.textTertiary,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 16,
                padding: 4,
              }}
            >
              &times;
            </button>
          )}
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

export function TerminalDialogTitle({ children }: { children: ReactNode }) {
  const { theme } = useTheme()
  return (
    <h2
      style={{
        color: theme.textPrimary,
        fontSize: 14,
        fontWeight: 700,
        margin: 0,
      }}
    >
      {children}
    </h2>
  )
}
