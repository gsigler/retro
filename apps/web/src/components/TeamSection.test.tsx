import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TeamSection } from './TeamSection'

const mockTeamWithCounts = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team',
  ownerId: 'user-1',
  memberCount: 3,
  retroCount: 5,
  createdAt: '2026-01-01',
}

const mockTeamDetail = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team',
  ownerId: 'user-1',
  inviteCode: 'abc1234567',
  members: [
    {
      id: 'member-1',
      role: 'OWNER',
      joinedAt: '2026-01-01',
      user: {
        id: 'user-1',
        email: 'owner@test.com',
        name: 'Owner',
        avatarUrl: null,
      },
    },
    {
      id: 'member-2',
      role: 'MEMBER',
      joinedAt: '2026-01-02',
      user: {
        id: 'user-2',
        email: 'member@test.com',
        name: 'Member',
        avatarUrl: null,
      },
    },
  ],
  retroCount: 5,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

vi.mock('@/lib/api', () => ({
  fetchTeams: vi.fn(),
  fetchTeam: vi.fn(),
  createTeam: vi.fn(),
  updateTeam: vi.fn(),
  joinTeam: vi.fn(),
  addTeamMember: vi.fn(),
  removeTeamMember: vi.fn(),
  regenerateInviteCode: vi.fn(),
}))

const api = await import('@/lib/api')
const mockFetchTeams = api.fetchTeams as ReturnType<typeof vi.fn>
const mockFetchTeam = api.fetchTeam as ReturnType<typeof vi.fn>

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('TeamSection', () => {
  const onMutation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows onboarding card when user has no teams', async () => {
    mockFetchTeams.mockResolvedValue([])

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText(/No teams found/)).toBeDefined()
    })
    expect(screen.getByText(/create team/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/paste invite code/i)).toBeDefined()
  })

  it('shows team info when user has a team', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeDefined()
    })
    expect(screen.getByText(/members/i)).toBeDefined()
    expect(screen.getByText(/retros/i)).toBeDefined()
  })

  it('shows invite URL, copy, regenerate, and edit button for owner', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes('abc1234567')),
      ).toBeDefined()
    })
    expect(screen.getByText('[edit]')).toBeDefined()
    expect(screen.getByText(/copy/i)).toBeDefined()
    expect(screen.getByText('[regenerate]')).toBeDefined()
  })

  it('shows add member button and remove buttons for owner', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText(/add/i)).toBeDefined()
    })
    expect(screen.getByLabelText('Remove Member')).toBeDefined()
  })

  it('hides owner controls when user is not the owner', async () => {
    mockFetchTeams.mockResolvedValue([
      { ...mockTeamWithCounts, ownerId: 'user-99' },
    ])
    mockFetchTeam.mockResolvedValue({
      ...mockTeamDetail,
      ownerId: 'user-99',
    })

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeDefined()
    })
    expect(screen.queryByText('[edit]')).toBeNull()
    expect(screen.queryByText('[regenerate]')).toBeNull()
  })

  it('shows member list with names', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    renderWithQuery(<TeamSection userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeDefined()
    })
    expect(screen.getByText('Member')).toBeDefined()
  })
})
