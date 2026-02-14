import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders landing page at /', () => {
    renderApp('/')
    expect(
      screen.getByRole('heading', {
        name: /run better retros with ai-powered insights/i,
      }),
    ).toBeDefined()
  })

  it('renders login page at /login', () => {
    renderApp('/login')
    expect(screen.getByText(/sign in to retro/i)).toBeDefined()
  })

  it('redirects /dashboard to /login when not authenticated', () => {
    renderApp('/dashboard')
    expect(screen.getByText(/sign in to retro/i)).toBeDefined()
  })
})
