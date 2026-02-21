import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import BoardPage from './BoardPage'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ token: 'test-token', user: { id: 'user-1' } }),
}))

vi.mock('@/lib/socket', () => ({
  createBoardSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

vi.mock('@/lib/api', () => ({
  fetchBoard: vi.fn(),
  fetchTemplates: vi.fn(),
  fetchActionItems: vi.fn(),
  fetchRetroMembers: vi.fn(),
}))

const api = await import('@/lib/api')
const mockFetchBoard = api.fetchBoard as ReturnType<typeof vi.fn>
const mockFetchTemplates = api.fetchTemplates as ReturnType<typeof vi.fn>

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/retros/retro-1/board']}>
        <Routes>
          <Route path="/retros/:retroId/board" element={<BoardPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('BoardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner while fetching board', () => {
    mockFetchBoard.mockReturnValue(new Promise(() => {}))
    renderWithProviders()

    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows template picker when board has no columns', async () => {
    mockFetchBoard.mockResolvedValue({ retroId: 'retro-1', columns: [] })
    mockFetchTemplates.mockResolvedValue([
      {
        id: 'start-stop-continue',
        name: 'Start / Stop / Continue',
        columns: [
          {
            name: 'Start',
            description: 'Start doing',
            color: '#22c55e',
            position: 0,
          },
        ],
      },
    ])

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Choose a Template')).toBeDefined()
    })
  })

  it('shows board columns when board is initialized', async () => {
    mockFetchBoard.mockResolvedValue({
      retroId: 'retro-1',
      columns: [
        {
          id: 'col-1',
          retroId: 'retro-1',
          name: 'Start',
          description: 'Things to start',
          color: '#22c55e',
          position: 0,
          cards: [],
        },
        {
          id: 'col-2',
          retroId: 'retro-1',
          name: 'Stop',
          description: 'Things to stop',
          color: '#ef4444',
          position: 1,
          cards: [],
        },
      ],
    })

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeDefined()
    })
    expect(screen.getByText('Stop')).toBeDefined()
  })

  it('shows error state on fetch failure', async () => {
    mockFetchBoard.mockRejectedValue(new Error('Network error'))

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeDefined()
    })
    expect(screen.getByText('Failed to load board')).toBeDefined()
  })
})
