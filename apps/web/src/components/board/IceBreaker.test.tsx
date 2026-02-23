import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IceBreaker } from './IceBreaker'
import { ICEBREAKER_QUESTIONS } from '@/lib/icebreakers'

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      bg: '#000',
      bgSecondary: '#111',
      border: '#333',
      textPrimary: '#fff',
      textTertiary: '#888',
      green: '#0f0',
      cyan: '#0ff',
      red: '#f00',
      blue: '#00f',
      purple: '#a0f',
      yellow: '#ff0',
    },
  }),
}))

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
}

vi.mock('./BoardProvider', () => ({
  useBoardContext: () => ({
    socketRef: { current: mockSocket },
    state: {
      columns: [],
      activeUsers: [],
      initialized: false,
      phase: 'ICEBREAKER',
      votedCardIds: [],
      maxVotes: 5,
      remainingVotes: 5,
      timer: null,
    },
    dispatch: vi.fn(),
    mergeSelection: {
      selectedIds: [],
      toggleSelect: vi.fn(),
      doMerge: vi.fn(),
      clearSelection: vi.fn(),
    },
  }),
}))

describe('IceBreaker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays a question from the list', () => {
    render(<IceBreaker retroId="retro-1" isFacilitator={false} />)

    const questionText = screen.getByText((content) =>
      ICEBREAKER_QUESTIONS.some((q) => content.includes(q)),
    )
    expect(questionText).toBeDefined()
  })

  it('shows same question for same retroId', () => {
    const { unmount } = render(
      <IceBreaker retroId="retro-abc" isFacilitator={false} />,
    )
    const firstQuestion = screen.getByText((content) =>
      ICEBREAKER_QUESTIONS.some((q) => content.includes(q)),
    ).textContent

    unmount()

    render(<IceBreaker retroId="retro-abc" isFacilitator={false} />)
    const secondQuestion = screen.getByText((content) =>
      ICEBREAKER_QUESTIONS.some((q) => content.includes(q)),
    ).textContent

    expect(firstQuestion).toBe(secondQuestion)
  })

  it('shows shuffle button only for facilitator', () => {
    const { rerender } = render(
      <IceBreaker retroId="retro-1" isFacilitator={false} />,
    )
    expect(screen.queryByRole('button', { name: /shuffle/i })).toBeNull()

    rerender(<IceBreaker retroId="retro-1" isFacilitator={true} />)
    expect(screen.getByRole('button', { name: /shuffle/i })).toBeDefined()
  })

  it('changes question when shuffle is clicked', () => {
    render(<IceBreaker retroId="retro-1" isFacilitator={true} />)

    const getQuestion = () =>
      screen.getByText((content) =>
        ICEBREAKER_QUESTIONS.some((q) => content.includes(q)),
      ).textContent

    const first = getQuestion()
    fireEvent.click(screen.getByRole('button', { name: /shuffle/i }))
    const second = getQuestion()

    expect(first).not.toBe(second)
  })

  it('emits shuffle event to socket when facilitator shuffles', () => {
    render(<IceBreaker retroId="retro-1" isFacilitator={true} />)

    fireEvent.click(screen.getByRole('button', { name: /shuffle/i }))

    expect(mockSocket.emit).toHaveBeenCalledWith('icebreaker:shuffle', {
      retroId: 'retro-1',
      shuffleCount: 1,
    })
  })

  it('listens for icebreaker:shuffled socket event', () => {
    render(<IceBreaker retroId="retro-1" isFacilitator={false} />)

    expect(mockSocket.on).toHaveBeenCalledWith(
      'icebreaker:shuffled',
      expect.any(Function),
    )
  })
})
