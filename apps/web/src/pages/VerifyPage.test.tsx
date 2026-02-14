import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import VerifyPage from './VerifyPage'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))

import { api } from '@/lib/api'

const mockedApi = vi.mocked(api)

function renderVerifyPage(token?: string) {
  const entry = token ? `/auth/verify?token=${token}` : '/auth/verify'
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthProvider>
        <VerifyPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('VerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows loading spinner while verifying', () => {
    mockedApi.mockReturnValueOnce(new Promise(() => {}))
    renderVerifyPage('valid-token')
    expect(screen.getByText('Verifying your magic link...')).toBeDefined()
  })

  it('shows error when no token in URL', async () => {
    renderVerifyPage()
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /invalid or expired link/i }),
      ).toBeDefined()
    })
  })

  it('shows error when verification fails', async () => {
    mockedApi.mockRejectedValueOnce(new Error('Invalid token'))
    renderVerifyPage('bad-token')

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /invalid or expired link/i }),
      ).toBeDefined()
    })
  })

  it('has a link to request a new magic link', async () => {
    renderVerifyPage()
    await waitFor(() => {
      const link = screen.getByText('Request a new link')
      expect(link.getAttribute('href')).toBe('/login')
    })
  })
})
