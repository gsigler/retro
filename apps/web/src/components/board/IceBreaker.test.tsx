import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
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

describe('IceBreaker', () => {
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

    // Very unlikely to be the same after shuffle (40 questions)
    expect(first).not.toBe(second)
  })
})
