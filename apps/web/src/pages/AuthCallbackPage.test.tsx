import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AuthCallbackPage from './AuthCallbackPage'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))

import { api } from '@/lib/api'

const mockedApi = vi.mocked(api)

function renderCallbackPage(token?: string) {
  const entry = token ? `/auth/callback?token=${token}` : '/auth/callback'
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <AuthCallbackPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading spinner while processing', () => {
    mockedApi.mockReturnValueOnce(new Promise(() => {}))
    renderCallbackPage('valid-token')
    expect(screen.getByText('Signing you in...')).toBeDefined()
  })

  it('shows error when no token in URL', async () => {
    renderCallbackPage()
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /authentication failed/i }),
      ).toBeDefined()
    })
  })

  it('shows error when login fails', async () => {
    mockedApi.mockRejectedValueOnce(new Error('Invalid token'))
    renderCallbackPage('bad-token')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /authentication failed/i }),
      ).toBeDefined()
    })
  })

  it('has a link to try again', async () => {
    renderCallbackPage()
    await waitFor(() => {
      const link = screen.getByText('Try again')
      expect(link.getAttribute('href')).toBe('/login')
    })
  })
})
