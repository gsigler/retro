import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders landing page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', {
        name: /run better retros with ai-powered insights/i,
      }),
    ).toBeDefined()
  })

  it('renders login page at /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('Login')).toBeDefined()
  })

  it('renders dashboard page at /dashboard', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByText('Dashboard')).toBeDefined()
  })
})
