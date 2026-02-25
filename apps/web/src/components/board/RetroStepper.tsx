import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { Timer } from '@/components/board/Timer'
import type { RetroPhase } from '@/types/api'

const PHASES: { key: RetroPhase; label: string }[] = [
  { key: 'ICEBREAKER', label: 'ice breaker' },
  { key: 'RETROSPECT', label: 'retrospect' },
  { key: 'GROUP_VOTE', label: 'group & vote' },
  { key: 'DISCUSS_ACTION', label: 'discuss & action items' },
]

interface RetroStepperProps {
  phase: RetroPhase
  isFacilitator: boolean
  retroId: string
  teamName?: string
  retroName?: string
  onPhaseChange: (phase: RetroPhase) => void
}

export function RetroStepper({
  phase,
  isFacilitator,
  retroId,
  teamName,
  retroName,
  onPhaseChange,
}: RetroStepperProps) {
  const { logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()

  const currentIndex = PHASES.findIndex((p) => p.key === phase)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handlePrev() {
    if (currentIndex > 0) {
      onPhaseChange(PHASES[currentIndex - 1].key)
    }
  }

  function handleNext() {
    if (currentIndex < PHASES.length - 1) {
      onPhaseChange(PHASES[currentIndex + 1].key)
    }
  }

  function phaseColor(index: number) {
    if (index === currentIndex) return theme.green
    if (index < currentIndex) return theme.cyan
    return theme.textTertiary
  }

  return (
    <>
      {/* Navigation bar */}
      <div
        style={{
          padding: '6px 24px',
          borderBottom: `1px solid ${theme.border}`,
          fontSize: 12,
          fontFamily: 'inherit',
          color: theme.textTertiary,
          display: 'flex',
          alignItems: 'center',
          background: theme.bgSecondary,
          position: 'relative',
        }}
      >
        <Link
          to="/dashboard"
          style={{
            color: theme.cyan,
            textDecoration: 'none',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          [&larr; back]
        </Link>
        <span
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 12,
            fontWeight: 600,
            color: theme.textTertiary,
          }}
        >
          Retroation
        </span>
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {teamName && <span style={{ color: theme.cyan }}>{teamName}</span>}
          {teamName && retroName && (
            <span style={{ color: theme.border }}>|</span>
          )}
          {retroName && <span>{retroName}</span>}
          <span style={{ color: theme.border }}>|</span>
          <TerminalButton size="sm" onClick={handleLogout}>
            logout
          </TerminalButton>
        </span>
      </div>

      {/* Phase stepper */}
      <div
        style={{
          padding: '6px 16px',
          borderBottom: `1px solid ${theme.border}40`,
          fontSize: 12,
          fontFamily: 'inherit',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
        }}
      >
        {isFacilitator && (
          <TerminalButton
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous phase"
          >
            &larr; prev
          </TerminalButton>
        )}

        <ol
          role="list"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 0,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {PHASES.map((p, i) => (
            <li
              key={p.key}
              aria-current={i === currentIndex ? 'step' : undefined}
              aria-label={`Phase ${i + 1} of ${PHASES.length}: ${p.label}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
              }}
            >
              {i > 0 && (
                <span
                  style={{
                    color: theme.border,
                    margin: '0 6px',
                    userSelect: 'none',
                  }}
                  aria-hidden="true"
                >
                  &mdash;
                </span>
              )}
              <span
                style={{
                  color: phaseColor(i),
                  fontWeight: i === currentIndex ? 600 : 400,
                  whiteSpace: 'nowrap',
                  transition: 'color 300ms ease, font-weight 300ms ease',
                  animation:
                    i === currentIndex
                      ? 'glow-pulse 2s ease-in-out infinite'
                      : undefined,
                }}
              >
                {i + 1} {p.label}
              </span>
            </li>
          ))}
        </ol>

        {isFacilitator && (
          <TerminalButton
            onClick={handleNext}
            disabled={currentIndex === PHASES.length - 1}
            aria-label="Next phase"
          >
            next &rarr;
          </TerminalButton>
        )}

        {phase === 'RETROSPECT' && (
          <div style={{ position: 'absolute', right: 16 }}>
            <Timer retroId={retroId} isFacilitator={isFacilitator} />
          </div>
        )}
      </div>
    </>
  )
}
