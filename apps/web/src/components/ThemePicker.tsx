import { useState, useRef, useEffect } from 'react'
import { useTheme, themes } from '@/contexts/ThemeContext'

export function ThemePicker({ dropUp = true }: { dropUp?: boolean } = {}) {
  const { theme, themeKey, setThemeKey } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change theme"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 11,
          color: theme.textTertiary,
          padding: 0,
        }}
      >
        [theme: {theme.name}]
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(dropUp
              ? { bottom: '100%', marginBottom: 4 }
              : { top: '100%', marginTop: 4 }),
            left: 0,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 4,
            padding: 4,
            zIndex: 50,
            minWidth: 180,
          }}
        >
          {Object.entries(themes).map(([key, t]) => (
            <button
              key={key}
              onClick={() => {
                setThemeKey(key)
                setIsOpen(false)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '4px 8px',
                background: key === themeKey ? theme.bgHover : 'transparent',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                color: theme.textPrimary,
              }}
            >
              <span>{t.name}</span>
              {key === themeKey && (
                <span style={{ marginLeft: 'auto', color: theme.green }}>
                  *
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
