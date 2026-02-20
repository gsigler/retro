import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from './DashboardPage'

const mockLogout = vi.fn()
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
    token: 'test-token',
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

function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeletons initially', () => {
    mockFetchDashboardSummary.mockReturnValue(new Promise(() => {})) // never resolves
    renderDashboard()
    // Should show 4 skeleton divs
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThanOrEqual(4)
  })

  it('shows stats cards with summary data', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('5')).toBeDefined()
    })
    expect(screen.getByText('Team Members')).toBeDefined()
    expect(screen.getByText('10')).toBeDefined()
    expect(screen.getByText('Retros')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('Open Items')).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()
    expect(screen.getByText('Completed')).toBeDefined()
  })

  it('shows error state on fetch failure', async () => {
    mockFetchDashboardSummary.mockRejectedValue(new Error('fail'))
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined()
    })
    expect(screen.getByText('Failed to load dashboard data')).toBeDefined()
  })

  it('calls logout and navigates home on logout click', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('Team Members')).toBeDefined()
    })
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('shows user email in header', async () => {
    mockFetchDashboardSummary.mockResolvedValue(mockSummary)
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeDefined()
    })
  })
})
