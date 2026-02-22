import { useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useBoardContext } from './BoardProvider'

interface TimerProps {
  retroId: string
  isFacilitator: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PRESETS = [
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
  { label: '15m', seconds: 900 },
]

export function Timer({ retroId, isFacilitator }: TimerProps) {
  const { theme } = useTheme()
  const { state, socketRef } = useBoardContext()
  const timer = state.timer

  const isRunning = timer?.running ?? false
  const isExpired = timer != null && timer.remaining <= 0 && !timer.running
  const remaining = timer?.remaining ?? 0

  const timerColor = isExpired
    ? theme.red
    : isRunning
      ? theme.green
      : timer
        ? theme.yellow
        : theme.textTertiary

  const btnBase = useMemo(
    () =>
      ({
        background: 'transparent',
        borderRadius: 2,
        cursor: 'pointer',
        fontSize: 10,
        padding: '1px 6px',
        fontFamily: 'inherit',
      }) as const,
    [],
  )

  function emitTimer(event: string, payload?: Record<string, unknown>) {
    socketRef.current?.emit(event, payload)
  }

  function timerBtn(color: string) {
    return { ...btnBase, border: `1px solid ${color}60`, color }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
      }}
    >
      <span
        style={{
          color: timerColor,
          fontWeight: 600,
          fontSize: 13,
          fontFamily: 'inherit',
          animation: isExpired ? 'terminal-blink 1s infinite' : undefined,
        }}
      >
        {timer ? formatTime(remaining) : '--:--'}
      </span>

      {isFacilitator && (
        <>
          {!timer || (!isRunning && remaining === timer.duration) ? (
            PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  emitTimer('timer:start', {
                    retroId,
                    duration: preset.seconds,
                  })
                }
                style={timerBtn(theme.textSecondary)}
              >
                {preset.label}
              </button>
            ))
          ) : (
            <>
              {isRunning ? (
                <button
                  onClick={() => emitTimer('timer:pause', { retroId })}
                  style={timerBtn(theme.yellow)}
                >
                  pause
                </button>
              ) : (
                <button
                  onClick={() => emitTimer('timer:start', { retroId })}
                  style={timerBtn(theme.green)}
                >
                  resume
                </button>
              )}
              <button
                onClick={() => emitTimer('timer:reset', { retroId })}
                style={timerBtn(theme.textTertiary)}
              >
                reset
              </button>
            </>
          )}
        </>
      )}
    </div>
  )
}
