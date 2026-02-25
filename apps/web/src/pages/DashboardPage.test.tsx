import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from './DashboardPage'

const mockLogout = vi.fn().mockResolvedValue(undefined)
const mockNavigate = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: null,
      avatarUrl: null,
      createdAt: '',
    },
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
  }),
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockSummary = {
  memberCount: 5,
  retroCount: 10,
  openActionItemCount: 3,
  completedActionItemCount: 7,
  upcomingRetros: [],
  recentActionItems: [],
}

vi.mock('@/lib/useDashboardSync', () => ({
  useDashboardSync: vi.fn(),
}))

vi.mock('@/lib/api', () => ({
  fetchDashboardSummary: vi.fn(),
  fetchTeams: vi.fn().mockResolvedValue([]),
  fetchTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  joinTeam: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  fetchRetros: vi.fn().mockResolvedValue([]),
  createRetro: vi.fn(),
  updateRetro: vi.fn(),
  deleteRetro: vi.fn(),
  fetchActionItems: vi.fn().mockResolvedValue([]),
  createActionItem: vi.fn(),
  updateActionItem: vi.fn(),
  deleteActionItem: vi.fn(),
}))

const api = await import('@/lib/api')
const mockFetchDashboardSummary = api.fetchDashboardSummary as ReturnType<
  typeof vi.fn
>
const mockFetchTeams = api.fetchTeams as ReturnType<typeof vi.fn>

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    mockFetchDashboardSummary.mockReturnValue(new Promise(() => {})) // never resolves
    renderDashboard()
    expect(screen.getByText(/retro dashboard --fetch/i)).toBeDefined()
  })

  it('shows stats table with summary data', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/members:/)).toBeDefined()
    })
    expect(screen.getByText(/retros:/)).toBeDefined()
  })

  it('shows error state on fetch failure', async () => {
    mockFetchDashboardSummary.mockRejectedValue(new Error('fail'))
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined()
    })
    expect(screen.getByText(/failed to load dashboard data/i)).toBeDefined()
  })

  it('calls logout and navigates home on logout click', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/members:/)).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(mockLogout).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('shows user email in header', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeDefined()
    })
  })

  it('opens team dialog when team button is clicked', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    mockFetchTeams.mockResolvedValue([
      {
        id: 't1',
        name: 'Test Team',
        ownerId: 'user-1',
        memberCount: 1,
        retroCount: 0,
      },
    ])
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/members:/)).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /\[team\]/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
  })

  it('forces team dialog open when user has no teams', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    mockFetchTeams.mockResolvedValue([])
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })
    expect(screen.getByText(/welcome/i)).toBeDefined()
  })
})
