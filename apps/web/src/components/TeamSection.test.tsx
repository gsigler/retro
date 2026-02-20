import { render, screen, waitFor } from '@testing-library/react'
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
}))

 
const api = await import('@/lib/api')
const mockFetchTeams = api.fetchTeams as ReturnType<typeof vi.fn>
const mockFetchTeam = api.fetchTeam as ReturnType<typeof vi.fn>

describe('TeamSection', () => {
  const onMutation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows onboarding card when user has no teams', async () => {
    mockFetchTeams.mockResolvedValue([])

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Get Started')).toBeDefined()
    })
    expect(screen.getByText('Create Team')).toBeDefined()
    expect(screen.getByPlaceholderText('Paste invite code')).toBeDefined()
  })

  it('shows team info when user has a team', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeDefined()
    })
    expect(screen.getByText('3 members')).toBeDefined()
    expect(screen.getByText('5 retros')).toBeDefined()
  })

  it('shows invite code and edit button for owner', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('abc1234567')).toBeDefined()
    })
    expect(screen.getByLabelText('Edit team')).toBeDefined()
    expect(screen.getByLabelText('Copy invite code')).toBeDefined()
  })

  it('shows add member button and remove buttons for owner', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Add Member')).toBeDefined()
    })
    // Remove button on the non-owner member only
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

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Test Team')).toBeDefined()
    })
    expect(screen.queryByLabelText('Edit team')).toBeNull()
    expect(screen.queryByText('Add Member')).toBeNull()
    expect(screen.queryByText('abc1234567')).toBeNull()
  })

  it('shows member list with names', async () => {
    mockFetchTeams.mockResolvedValue([mockTeamWithCounts])
    mockFetchTeam.mockResolvedValue(mockTeamDetail)

    render(<TeamSection token="tok" userId="user-1" onMutation={onMutation} />)

    await waitFor(() => {
      expect(screen.getByText('Owner')).toBeDefined()
    })
    expect(screen.getByText('Member')).toBeDefined()
  })
})
