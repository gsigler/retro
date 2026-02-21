import { useTheme } from '@/contexts/ThemeContext'
import type { RetroPhase } from '@/types/api'

const PHASES: { key: RetroPhase; label: string; blurb: string }[] = [
  {
    key: 'ICEBREAKER',
    label: 'ice breaker',
    blurb: 'Warm up the team with a quick prompt or question.',
  },
  {
    key: 'RETROSPECT',
    label: 'retrospect',
    blurb: 'Add cards to each column — what went well, what could improve.',
  },
  {
    key: 'GROUP_VOTE',
    label: 'group & vote',
    blurb: 'Drag related cards together and vote on the most important topics.',
  },
  {
    key: 'DISCUSS_ACTION',
    label: 'discuss & action items',
    blurb: 'Talk through top items and create action items for next sprint.',
  },
]

interface RetroStepperProps {
  phase: RetroPhase
  isFacilitator: boolean
  onPhaseChange: (phase: RetroPhase) => void
}

export function RetroStepper({
  phase,
  isFacilitator,
  onPhaseChange,
}: RetroStepperProps) {
  const { theme } = useTheme()

  const currentIndex = PHASES.findIndex((p) => p.key === phase)

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

  const currentPhase = PHASES[currentIndex]

  return (
    <div
      style={{
        padding: '6px 16px',
        borderBottom: `1px solid ${theme.border}40`,
        fontSize: 12,
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isFacilitator && (
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous phase"
            style={{
              background: 'none',
              border: 'none',
              color: currentIndex === 0 ? theme.textTertiary : theme.cyan,
              cursor: currentIndex === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              padding: 0,
              opacity: currentIndex === 0 ? 0.5 : 1,
            }}
          >
            [&larr; prev]
          </button>
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
                }}
              >
                {i + 1} {p.label}
              </span>
            </li>
          ))}
        </ol>

        {isFacilitator && (
          <button
            onClick={handleNext}
            disabled={currentIndex === PHASES.length - 1}
            aria-label="Next phase"
            style={{
              background: 'none',
              border: 'none',
              color:
                currentIndex === PHASES.length - 1
                  ? theme.textTertiary
                  : theme.cyan,
              cursor:
                currentIndex === PHASES.length - 1 ? 'default' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              padding: 0,
              opacity: currentIndex === PHASES.length - 1 ? 0.5 : 1,
            }}
          >
            [next &rarr;]
          </button>
        )}
      </div>
      {currentPhase && (
        <div
          style={{
            color: theme.textTertiary,
            fontSize: 11,
            padding: '4px 0 2px',
          }}
        >
          <span style={{ color: theme.green }}>$</span> {currentPhase.blurb}
        </div>
      )}
    </div>
  )
}
