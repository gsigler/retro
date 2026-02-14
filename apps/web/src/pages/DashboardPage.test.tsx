import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import DashboardPage from './DashboardPage'

const mockLogout = vi.fn()
const mockNavigate = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: null, createdAt: '' },
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

  it('shows welcome message with user email', () => {
    renderDashboard()
    expect(
      screen.getByRole('heading', { name: /welcome, test@example\.com/i }),
    ).toBeDefined()
  })

  it('shows placeholder text for boards', () => {
    renderDashboard()
    expect(
      screen.getByText('Your retro boards will appear here.'),
    ).toBeDefined()
  })

  it('calls logout and navigates home on logout click', () => {
    renderDashboard()
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
