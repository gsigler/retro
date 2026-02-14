import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from './LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'

vi.mock('@/lib/api', () => ({
  api: vi.fn(),
}))

import { api } from '@/lib/api'

const mockedApi = vi.mocked(api)

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
    localStorage.clear()
  })

  it('renders sign-in form', () => {
    renderLoginPage()
    expect(screen.getByText(/sign in to retro/i)).toBeDefined()
    expect(screen.getByPlaceholderText('you@example.com')).toBeDefined()
    expect(
      screen.getByRole('button', { name: /send magic link/i }),
    ).toBeDefined()
  })

  it('shows success message after submitting email', async () => {
    mockedApi.mockResolvedValueOnce({ message: 'Sent' })
    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByText('Check your email!')).toBeDefined()
    })
    expect(screen.getByText('test@example.com')).toBeDefined()
  })

  it('shows error message on API failure', async () => {
    mockedApi.mockRejectedValueOnce(new Error('Network error'))
    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(
        screen.getByText('Something went wrong. Please try again.'),
      ).toBeDefined()
    })
  })

  it('has a link back to home', () => {
    renderLoginPage()
    const link = screen.getByText('Back to home')
    expect(link.getAttribute('href')).toBe('/')
  })
})
