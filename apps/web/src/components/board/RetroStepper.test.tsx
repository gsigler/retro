import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RetroStepper } from './RetroStepper'

describe('RetroStepper', () => {
  it('renders all 4 phase labels', () => {
    render(
      <RetroStepper
        phase="ICEBREAKER"
        isFacilitator={false}
        onPhaseChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/ice breaker/)).toBeDefined()
    expect(screen.getByText(/retrospect/)).toBeDefined()
    expect(screen.getByText(/group & vote/)).toBeDefined()
    expect(screen.getByText(/discuss & action items/)).toBeDefined()
  })

  it('renders a blurb for the current phase', () => {
    render(
      <RetroStepper
        phase="RETROSPECT"
        isFacilitator={false}
        onPhaseChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/add cards to each column/i)).toBeDefined()
  })

  it('sets aria-current="step" on the active phase', () => {
    render(
      <RetroStepper
        phase="GROUP_VOTE"
        isFacilitator={false}
        onPhaseChange={vi.fn()}
      />,
    )

    const groupVoteItem = screen.getByLabelText('Phase 3 of 4: group & vote')
    expect(groupVoteItem.getAttribute('aria-current')).toBe('step')

    const icebreakerItem = screen.getByLabelText('Phase 1 of 4: ice breaker')
    expect(icebreakerItem.getAttribute('aria-current')).toBeNull()
  })

  it('renders completed phases differently from future phases', () => {
    render(
      <RetroStepper
        phase="GROUP_VOTE"
        isFacilitator={false}
        onPhaseChange={vi.fn()}
      />,
    )

    const icebreakerItem = screen.getByLabelText('Phase 1 of 4: ice breaker')
    expect(icebreakerItem.getAttribute('aria-current')).toBeNull()

    const retrospectItem = screen.getByLabelText('Phase 2 of 4: retrospect')
    expect(retrospectItem.getAttribute('aria-current')).toBeNull()

    const discussItem = screen.getByLabelText(
      'Phase 4 of 4: discuss & action items',
    )
    expect(discussItem.getAttribute('aria-current')).toBeNull()

    const groupVoteItem = screen.getByLabelText('Phase 3 of 4: group & vote')
    expect(groupVoteItem.getAttribute('aria-current')).toBe('step')
  })

  it('shows prev/next buttons for facilitator', () => {
    render(
      <RetroStepper
        phase="RETROSPECT"
        isFacilitator={true}
        onPhaseChange={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Previous phase')).toBeDefined()
    expect(screen.getByLabelText('Next phase')).toBeDefined()
  })

  it('hides prev/next buttons for non-facilitator', () => {
    render(
      <RetroStepper
        phase="RETROSPECT"
        isFacilitator={false}
        onPhaseChange={vi.fn()}
      />,
    )

    expect(screen.queryByLabelText('Previous phase')).toBeNull()
    expect(screen.queryByLabelText('Next phase')).toBeNull()
  })

  it('calls onPhaseChange with next phase when clicking next', () => {
    const onPhaseChange = vi.fn()
    render(
      <RetroStepper
        phase="RETROSPECT"
        isFacilitator={true}
        onPhaseChange={onPhaseChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Next phase'))
    expect(onPhaseChange).toHaveBeenCalledWith('GROUP_VOTE')
  })

  it('calls onPhaseChange with previous phase when clicking prev', () => {
    const onPhaseChange = vi.fn()
    render(
      <RetroStepper
        phase="RETROSPECT"
        isFacilitator={true}
        onPhaseChange={onPhaseChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Previous phase'))
    expect(onPhaseChange).toHaveBeenCalledWith('ICEBREAKER')
  })

  it('disables prev button on ICEBREAKER phase', () => {
    render(
      <RetroStepper
        phase="ICEBREAKER"
        isFacilitator={true}
        onPhaseChange={vi.fn()}
      />,
    )

    const prevBtn = screen.getByLabelText('Previous phase')
    expect(prevBtn).toHaveProperty('disabled', true)
  })

  it('disables next button on DISCUSS_ACTION phase', () => {
    render(
      <RetroStepper
        phase="DISCUSS_ACTION"
        isFacilitator={true}
        onPhaseChange={vi.fn()}
      />,
    )

    const nextBtn = screen.getByLabelText('Next phase')
    expect(nextBtn).toHaveProperty('disabled', true)
  })

  it('does not call onPhaseChange when clicking disabled prev', () => {
    const onPhaseChange = vi.fn()
    render(
      <RetroStepper
        phase="ICEBREAKER"
        isFacilitator={true}
        onPhaseChange={onPhaseChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Previous phase'))
    expect(onPhaseChange).not.toHaveBeenCalled()
  })

  it('does not call onPhaseChange when clicking disabled next', () => {
    const onPhaseChange = vi.fn()
    render(
      <RetroStepper
        phase="DISCUSS_ACTION"
        isFacilitator={true}
        onPhaseChange={onPhaseChange}
      />,
    )

    fireEvent.click(screen.getByLabelText('Next phase'))
    expect(onPhaseChange).not.toHaveBeenCalled()
  })
})
