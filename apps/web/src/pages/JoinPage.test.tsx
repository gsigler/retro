import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  joinTeam: vi.fn(),
}))

const { useAuth } = await import('@/contexts/AuthContext')
const { joinTeam } = await import('@/lib/api')
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>
const mockJoinTeam = joinTeam as ReturnType<typeof vi.fn>

// Lazy import so mocks are in place
const { default: JoinPage } = await import('./JoinPage')

const mockNavigate = vi.fn()
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRoute(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/teams/join" element={<JoinPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('JoinPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows error when no invite code is provided', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRoute('/teams/join')

    await waitFor(() => {
      expect(screen.getByText(/Could not join team/)).toBeDefined()
    })
  })

  it('redirects unauthenticated users to login and stores pending invite', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })

    renderWithRoute('/teams/join?code=abc123')

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true })
    })
    expect(localStorage.getItem('retro_pending_invite')).toBe('abc123')
  })

  it('auto-joins team and redirects to dashboard when authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockJoinTeam.mockResolvedValue({})

    renderWithRoute('/teams/join?code=abc123')

    await waitFor(() => {
      expect(mockJoinTeam).toHaveBeenCalledWith('abc123')
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      })
    })
  })

  it('shows error when join fails', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    mockJoinTeam.mockRejectedValue(new Error('fail'))

    renderWithRoute('/teams/join?code=badcode')

    await waitFor(() => {
      expect(screen.getByText(/Could not join team/)).toBeDefined()
    })
    expect(screen.getByText(/Go to dashboard/)).toBeDefined()
  })
})
