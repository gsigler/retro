import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn().mockRejectedValue(new Error('Unauthorized')),
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in page with Google button', async () => {
    renderLoginPage()
    await waitFor(() => {
      expect(screen.getByText(/sign in to retro/i)).toBeDefined()
    })
    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeDefined()
  })

  it('links to the Google OAuth endpoint', async () => {
    renderLoginPage()
    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /sign in with google/i }),
      ).toBeDefined()
    })
    const link = screen.getByRole('link', { name: /sign in with google/i })
    expect(link.getAttribute('href')).toBe('/api/auth/google')
  })

  it('has a link back to home', async () => {
    renderLoginPage()
    await waitFor(() => {
      expect(screen.getByText('Back to home')).toBeDefined()
    })
    const link = screen.getByText('Back to home')
    expect(link.getAttribute('href')).toBe('/')
  })
})
