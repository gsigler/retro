import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { TerminalSkeleton } from './TerminalSkeleton'

describe('TerminalSkeleton', () => {
  it('renders 3 skeleton lines by default', () => {
    const { container } = render(<TerminalSkeleton />)
    const lines = container.querySelectorAll('[aria-hidden="true"] > div')
    expect(lines.length).toBe(3)
  })

  it('renders the specified number of lines', () => {
    const { container } = render(<TerminalSkeleton lines={5} />)
    const lines = container.querySelectorAll('[aria-hidden="true"] > div')
    expect(lines.length).toBe(5)
  })

  it('uses block characters for skeleton content', () => {
    const { container } = render(<TerminalSkeleton lines={1} />)
    const line = container.querySelector('[aria-hidden="true"] > div')
    expect(line?.textContent).toMatch(/░+/)
  })

  it('applies custom widths', () => {
    const { container } = render(
      <TerminalSkeleton lines={2} widths={[50, 30]} />,
    )
    const lines = container.querySelectorAll('[aria-hidden="true"] > div')
    expect((lines[0] as HTMLElement).style.width).toBe('50%')
    expect((lines[1] as HTMLElement).style.width).toBe('30%')
  })

  it('is hidden from screen readers', () => {
    const { container } = render(<TerminalSkeleton />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.getAttribute('aria-hidden')).toBe('true')
  })
})
