import { useTheme } from '@/contexts/ThemeContext'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { ICEBREAKER_QUESTIONS, seededQuestionIndex } from '@/lib/icebreakers'
import { useBoardContext } from './BoardProvider'

interface IceBreakerProps {
  retroId: string
  isFacilitator: boolean
}

export function IceBreaker({ retroId, isFacilitator }: IceBreakerProps) {
  const { theme } = useTheme()
  const { state, dispatch, socketRef } = useBoardContext()
  const shuffleCount = state.icebreakerShuffleCount

  function handleShuffle() {
    const next = shuffleCount + 1
    dispatch({ type: 'ICEBREAKER_SHUFFLED', shuffleCount: next })
    socketRef.current?.emit('icebreaker:shuffle', {
      retroId,
      shuffleCount: next,
    })
  }

  const questionIndex = seededQuestionIndex(retroId, shuffleCount)
  const question = ICEBREAKER_QUESTIONS[questionIndex]

  return (
    <TerminalFrame
      title="icebreaker"
      color={theme.purple}
      right={
        isFacilitator ? (
          <TerminalButton size="sm" onClick={handleShuffle}>
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
    </TerminalFrame>
  )
}
