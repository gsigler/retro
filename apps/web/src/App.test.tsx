import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from './App'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))

function renderApp(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
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
        name: /retros your engineering team will actually enjoy/i,
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
