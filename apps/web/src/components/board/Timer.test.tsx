import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Timer } from './Timer'

vi.mock('@/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      bg: '#000',
      bgSecondary: '#111',
      border: '#333',
      textPrimary: '#fff',
      textSecondary: '#aaa',
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

const mockUseBoardContext = vi.fn()

vi.mock('./BoardProvider', () => ({
  useBoardContext: (...args: unknown[]) => mockUseBoardContext(...args),
}))

function mockContext(
  timer: {
    duration: number
    remaining: number
    running: boolean
  } | null,
) {
  mockUseBoardContext.mockReturnValue({
    state: {
      columns: [],
      activeUsers: [],
      initialized: true,
      phase: 'WRITING',
      votedCardIds: [],
      maxVotes: 5,
      remainingVotes: 5,
      timer,
    },
    dispatch: vi.fn(),
    socketRef: { current: { emit: vi.fn() } },
    mergeSelection: { active: false, selectedCardIds: [] },
  })
}

describe('Timer', () => {
  it('should display --:-- when no timer state exists', () => {
    mockContext(null)
    render(<Timer retroId="retro-1" isFacilitator={false} />)

    expect(screen.getByText('--:--')).toBeDefined()
  })

  it('should display formatted time when timer has remaining seconds', () => {
    mockContext({ duration: 300, remaining: 300, running: true })
    render(<Timer retroId="retro-1" isFacilitator={false} />)

    expect(screen.getByText('05:00')).toBeDefined()
  })

  it('should show preset buttons (5m, 10m, 15m) for facilitator when no timer running', () => {
    mockContext(null)
    render(<Timer retroId="retro-1" isFacilitator={true} />)

    expect(screen.getByText('5m')).toBeDefined()
    expect(screen.getByText('10m')).toBeDefined()
    expect(screen.getByText('15m')).toBeDefined()
  })

  it('should not show controls for non-facilitator', () => {
    mockContext(null)
    render(<Timer retroId="retro-1" isFacilitator={false} />)

    expect(screen.queryByText('5m')).toBeNull()
    expect(screen.queryByText('10m')).toBeNull()
    expect(screen.queryByText('15m')).toBeNull()
    expect(screen.queryByText('pause')).toBeNull()
    expect(screen.queryByText('resume')).toBeNull()
    expect(screen.queryByText('reset')).toBeNull()
  })

  it('should show pause button when timer is running (facilitator)', () => {
    mockContext({ duration: 300, remaining: 250, running: true })
    render(<Timer retroId="retro-1" isFacilitator={true} />)

    expect(screen.getByText('pause')).toBeDefined()
    expect(screen.getByText('reset')).toBeDefined()
    expect(screen.queryByText('resume')).toBeNull()
  })

  it('should show resume and reset buttons when timer is paused (facilitator)', () => {
    mockContext({ duration: 300, remaining: 250, running: false })
    render(<Timer retroId="retro-1" isFacilitator={true} />)

    expect(screen.getByText('resume')).toBeDefined()
    expect(screen.getByText('reset')).toBeDefined()
    expect(screen.queryByText('pause')).toBeNull()
  })
})
