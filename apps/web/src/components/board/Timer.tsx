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

  function emitTimer(event: string, payload?: Record<string, unknown>) {
    socketRef.current?.emit(event, payload)
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
      {/* Timer display */}
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

      {/* Facilitator controls */}
      {isFacilitator && (
        <>
          {!timer || (!isRunning && remaining === timer.duration) ? (
            // Show presets when no timer or timer is reset
            PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  emitTimer('timer:start', {
                    retroId,
                    duration: preset.seconds,
                  })
                }
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}60`,
                  borderRadius: 2,
                  color: theme.textSecondary,
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '1px 6px',
                  fontFamily: 'inherit',
                }}
              >
                {preset.label}
              </button>
            ))
          ) : (
            <>
              {isRunning ? (
                <button
                  onClick={() =>
                    emitTimer('timer:pause', {
                      retroId,
                    })
                  }
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.yellow}60`,
                    borderRadius: 2,
                    color: theme.yellow,
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '1px 6px',
                    fontFamily: 'inherit',
                  }}
                >
                  pause
                </button>
              ) : (
                <button
                  onClick={() =>
                    emitTimer('timer:start', {
                      retroId,
                    })
                  }
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.green}60`,
                    borderRadius: 2,
                    color: theme.green,
                    cursor: 'pointer',
                    fontSize: 10,
                    padding: '1px 6px',
                    fontFamily: 'inherit',
                  }}
                >
                  resume
                </button>
              )}
              <button
                onClick={() =>
                  emitTimer('timer:reset', {
                    retroId,
                  })
                }
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.border}60`,
                  borderRadius: 2,
                  color: theme.textTertiary,
                  cursor: 'pointer',
                  fontSize: 10,
                  padding: '1px 6px',
                  fontFamily: 'inherit',
                }}
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
