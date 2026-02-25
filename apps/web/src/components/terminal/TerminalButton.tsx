import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

type Variant = 'bracket' | 'submit'
type Size = 'sm' | 'default' | 'lg'

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  asChild?: boolean
  href?: string
}

const sizeStyles: Record<Size, CSSProperties> = {
  sm: { fontSize: 12 },
  default: { fontSize: 13 },
  lg: { fontSize: 14 },
}

export function TerminalButton({
  variant = 'bracket',
  size = 'default',
  children,
  asChild,
  href,
  style,
  disabled,
  ...props
}: TerminalButtonProps) {
  const { theme } = useTheme()

  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    fontFamily: 'inherit',
    fontWeight: 400,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'opacity 150ms ease, color 150ms ease, transform 100ms ease',
    whiteSpace: 'nowrap',
    background: 'transparent',
    border: 'none',
    padding: 0,
    color: theme.cyan,
    ...sizeStyles[size],
  }

  if (variant === 'submit') {
    base.padding = '6px 16px'
    base.border = `1px solid ${theme.border}`
    base.borderRadius = 3
    base.color = theme.textPrimary
    base.fontWeight = 600
  }

  const merged = { ...base, ...style }

  function handleMouseDown(e: React.MouseEvent<HTMLElement>) {
    if (!disabled) {
      e.currentTarget.style.transform = 'scale(0.96)'
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.transform = ''
  }

  function handleMouseEnter(e: React.MouseEvent<HTMLElement>) {
    if (!disabled) {
      e.currentTarget.style.opacity = '0.8'
    }
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLElement>) {
    e.currentTarget.style.transform = ''
    e.currentTarget.style.opacity = disabled ? '0.4' : '1'
  }

  const interactionProps = {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  }

  if (asChild && href) {
    return (
      <a href={href} style={merged} {...interactionProps}>
        {variant === 'bracket' ? <>&#91;{children}&#93;</> : children}
      </a>
    )
  }

  return (
    <button style={merged} disabled={disabled} {...interactionProps} {...props}>
      {variant === 'bracket' ? <>&#91;{children}&#93;</> : children}
    </button>
  )
}
