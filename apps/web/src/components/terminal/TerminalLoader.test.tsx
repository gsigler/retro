import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TerminalLoader } from './TerminalLoader'

describe('TerminalLoader', () => {
  it('renders the default loading message', () => {
    render(<TerminalLoader inline />)
    expect(screen.getByText('Loading')).toBeDefined()
  })

  it('renders a custom command prompt', () => {
    render(<TerminalLoader command="retro dashboard --fetch" inline />)
    expect(screen.getByText(/retro dashboard --fetch/)).toBeDefined()
  })

  it('renders a custom message', () => {
    render(<TerminalLoader message="Signing you in" inline />)
    expect(screen.getByText('Signing you in')).toBeDefined()
  })

  it('renders the $ prompt symbol', () => {
    render(<TerminalLoader command="test" inline />)
    expect(screen.getByText('$')).toBeDefined()
  })

  it('renders three animated dots', () => {
    const { container } = render(<TerminalLoader inline />)
    const dots = container.querySelectorAll('span')
    const dotSpans = Array.from(dots).filter((s) => s.textContent === '.')
    expect(dotSpans.length).toBe(3)
  })

  it('renders full-screen centered layout by default', () => {
    const { container } = render(<TerminalLoader />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('100vh')
  })

  it('renders inline without full-screen wrapper', () => {
    const { container } = render(<TerminalLoader inline />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.style.minHeight).toBe('')
  })
})
