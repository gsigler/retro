import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface SelectOption {
  value: string
  label: string
}

interface TerminalSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}

export function TerminalSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
}: TerminalSelectProps) {
  const { theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '6px 10px',
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          color: selected ? theme.textPrimary : theme.textTertiary,
          fontFamily: 'inherit',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <span style={{ color: theme.textTertiary, fontSize: 10 }}>
          {isOpen ? '\u25b2' : '\u25bc'}
        </span>
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            zIndex: 50,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value)
                setIsOpen(false)
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 10px',
                background:
                  option.value === value ? theme.bgHover : 'transparent',
                border: 'none',
                color: theme.textPrimary,
                fontFamily: 'inherit',
                fontSize: 13,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
