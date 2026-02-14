import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import LandingPage from './LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('renders the hero heading', () => {
    renderLanding()
    expect(
      screen.getByRole('heading', {
        name: /run better retros with ai-powered insights/i,
      }),
    ).toBeDefined()
  })

  it('has a CTA button linking to /login', () => {
    renderLanding()
    const cta = screen.getByRole('link', { name: /get started/i })
    expect(cta).toBeDefined()
    expect(cta.getAttribute('href')).toBe('/login')
  })

  it('renders all three feature cards', () => {
    renderLanding()
    expect(screen.getByText('AI-Powered Insights')).toBeDefined()
    expect(screen.getByText('Zero-Friction Joining')).toBeDefined()
    expect(screen.getByText('Real-Time Collaboration')).toBeDefined()
  })
})
