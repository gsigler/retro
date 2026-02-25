import { useState, useEffect } from 'react'
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
  const { socketRef } = useBoardContext()
  const [shuffleCount, setShuffleCount] = useState(0)

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const handleShuffled = (data: { shuffleCount: number }) => {
      setShuffleCount(data.shuffleCount)
    }

    socket.on('icebreaker:shuffled', handleShuffled)
    return () => {
      socket.off('icebreaker:shuffled', handleShuffled)
    }
  }, [socketRef])

  function handleShuffle() {
    const next = shuffleCount + 1
    setShuffleCount(next)
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
        key={shuffleCount}
        style={{
          fontSize: 14,
          color: theme.textPrimary,
          lineHeight: 1.5,
          animation: 'fade-in 0.3s ease-out',
        }}
      >
        <span style={{ color: theme.purple, marginRight: 8 }}>?</span>
        {question}
      </p>
    </TerminalFrame>
  )
}
