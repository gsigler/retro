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
        name: /retros your engineering team will actually enjoy/i,
      }),
    ).toBeDefined()
  })

  it('has a CTA button linking to /login', () => {
    renderLanding()
    const cta = screen.getByRole('link', { name: /get started/i })
    expect(cta).toBeDefined()
    expect(cta.getAttribute('href')).toBe('/login')
  })

  it('renders all four feature cards', () => {
    renderLanding()
    expect(screen.getByText('Real-Time Collaboration')).toBeDefined()
    expect(screen.getByText('Team-Based Access')).toBeDefined()
    expect(screen.getByText('Track Action Items')).toBeDefined()
    expect(screen.getByText('Built for Dev Teams')).toBeDefined()
  })

  it('has a login link in the header', () => {
    renderLanding()
    const loginLink = screen.getByRole('link', { name: /login/i })
    expect(loginLink).toBeDefined()
    expect(loginLink.getAttribute('href')).toBe('/login')
  })
})
