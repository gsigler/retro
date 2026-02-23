import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthCallbackPage from './AuthCallbackPage'

const mockLogin = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))

function renderCallbackPage() {
  return render(
    <MemoryRouter initialEntries={['/auth/callback']}>
      <AuthCallbackPage />
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading spinner while processing', () => {
    mockLogin.mockReturnValueOnce(new Promise(() => {}))
    renderCallbackPage()
    expect(screen.getByText('Signing you in')).toBeDefined()
  })

  it('shows error when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Login failed'))
    renderCallbackPage()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /authentication failed/i }),
      ).toBeDefined()
    })
  })

  it('has a link to try again', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Login failed'))
    renderCallbackPage()
    await waitFor(() => {
      const link = screen.getByText('Try again')
      expect(link.getAttribute('href')).toBe('/login')
    })
  })
})
