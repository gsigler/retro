import { useState, useRef, useEffect } from 'react'
import { useTheme, themes } from '@/contexts/ThemeContext'

export function ThemePicker() {
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
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          padding: '4px 8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 12,
          color: theme.textSecondary,
        }}
      >
        <span
          style={{
            display: 'flex',
            gap: 3,
          }}
        >
          {theme.swatches.slice(0, 3).map((color, i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </span>
        {theme.name}
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
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
                padding: '6px 8px',
                background: key === themeKey ? theme.bgHover : 'transparent',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                color: theme.textPrimary,
              }}
            >
              <span style={{ display: 'flex', gap: 3 }}>
                {t.swatches.slice(0, 3).map((color, i) => (
                  <span
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                    }}
                  />
                ))}
              </span>
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
