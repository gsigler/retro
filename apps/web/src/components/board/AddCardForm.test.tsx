import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AddCardForm } from './AddCardForm'
import { BoardProvider } from './BoardProvider'

vi.mock('@/lib/socket', () => ({
  createBoardSocket: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

vi.mock('@/lib/api', () => ({
  createCard: vi.fn(),
}))

const api = await import('@/lib/api')
const mockCreateCard = api.createCard as ReturnType<typeof vi.fn>

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BoardProvider
        token="tok"
        retroId="retro-1"
        initialPhase="RETROSPECT"
        initialBoard={{
          retroId: 'retro-1',
          columns: [
            {
              id: 'col-1',
              retroId: 'retro-1',
              name: 'Start',
              description: null,
              color: '#22c55e',
              position: 0,
              cards: [],
            },
          ],
        }}
      >
        <AddCardForm token="tok" retroId="retro-1" columnId="col-1" />
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('AddCardForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows add item prompt initially', () => {
    renderWithProviders()

    expect(screen.getByText(/add item/i)).toBeDefined()
  })

  it('shows textarea after clicking add item', async () => {
    renderWithProviders()

    await userEvent.click(screen.getByText(/add item/i))

    expect(screen.getByPlaceholderText('Type your thought...')).toBeDefined()
  })

  it('submits form via Enter and calls createCard', async () => {
    mockCreateCard.mockResolvedValue({
      id: 'card-new',
      columnId: 'col-1',
      retroId: 'retro-1',
      content: 'My new card',
      position: 0,
      createdAt: '2026-02-20',
      updatedAt: '2026-02-20',
      author: { id: 'user-1', name: 'Alice' },
      voteCount: 0,
    })

    renderWithProviders()

    await userEvent.click(screen.getByText(/add item/i))
    await userEvent.type(
      screen.getByPlaceholderText('Type your thought...'),
      'My new card{Enter}',
    )

    expect(mockCreateCard).toHaveBeenCalledWith('tok', 'retro-1', {
      columnId: 'col-1',
      content: 'My new card',
    })
  })

  it('hides textarea on Escape', async () => {
    renderWithProviders()

    await userEvent.click(screen.getByText(/add item/i))
    expect(screen.getByPlaceholderText('Type your thought...')).toBeDefined()

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByPlaceholderText('Type your thought...')).toBeNull()
  })
})
