import { useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

export function useTypingEffect(
  text: string,
  enabled: boolean = true,
  speed: number = 30,
) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text)
  const [done, setDone] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text)
      setDone(true)
      return
    }

    setDisplayed('')
    setDone(false)
    let i = 0

    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setDone(true)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, enabled, speed])

  return { displayed, done }
}

export function BlinkingCursor() {
  const { theme } = useTheme()

  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 16,
        background: theme.cursor,
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'terminal-blink 1s step-end infinite',
      }}
      aria-hidden="true"
    />
  )
}
