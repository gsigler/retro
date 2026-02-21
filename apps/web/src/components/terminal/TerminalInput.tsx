import { type InputHTMLAttributes, forwardRef } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  function TerminalInput({ prefix = '$', style, ...props }, ref) {
    const { theme } = useTheme()

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: theme.bgSecondary,
          border: `1px solid ${theme.border}`,
          borderRadius: 4,
          padding: '6px 10px',
          ...style,
        }}
      >
        {prefix && (
          <span style={{ color: theme.green, fontWeight: 600, flexShrink: 0 }}>
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          {...props}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: theme.textPrimary,
            fontFamily: 'inherit',
            fontSize: 13,
            width: '100%',
          }}
        />
      </div>
    )
  },
)
