import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { ICEBREAKER_QUESTIONS, seededQuestionIndex } from '@/lib/icebreakers'

interface IceBreakerProps {
  retroId: string
  isFacilitator: boolean
}

export function IceBreaker({ retroId, isFacilitator }: IceBreakerProps) {
  const { theme } = useTheme()
  const [shuffleCount, setShuffleCount] = useState(0)

  const questionIndex = seededQuestionIndex(retroId, shuffleCount)
  const question = ICEBREAKER_QUESTIONS[questionIndex]

  return (
    <TerminalFrame
      title="$ icebreaker --random"
      color={theme.purple}
      right={
        isFacilitator ? (
          <TerminalButton
            size="sm"
            onClick={() => setShuffleCount((c) => c + 1)}
          >
            shuffle
          </TerminalButton>
        ) : undefined
      }
    >
      <p
        style={{
          fontSize: 14,
          color: theme.textPrimary,
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: theme.purple, marginRight: 8 }}>?</span>
        {question}
      </p>
      <p
        style={{
          fontSize: 11,
          color: theme.textTertiary,
          marginTop: 8,
        }}
      >
        Discuss this with your team before moving to the next phase.
      </p>
    </TerminalFrame>
  )
}
