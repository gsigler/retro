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

  it('shows add card button initially', () => {
    renderWithProviders()

    expect(screen.getByText('Add card')).toBeDefined()
  })

  it('shows textarea after clicking add card', async () => {
    renderWithProviders()

    await userEvent.click(screen.getByText('Add card'))

    expect(screen.getByPlaceholderText('Type your thought...')).toBeDefined()
  })

  it('submits form and calls createCard', async () => {
    mockCreateCard.mockResolvedValue({
      id: 'card-new',
      columnId: 'col-1',
      retroId: 'retro-1',
      content: 'My new card',
      position: 0,
      createdAt: '2026-02-20',
      updatedAt: '2026-02-20',
      author: { id: 'user-1', name: 'Alice' },
    })

    renderWithProviders()

    await userEvent.click(screen.getByText('Add card'))
    await userEvent.type(
      screen.getByPlaceholderText('Type your thought...'),
      'My new card',
    )
    await userEvent.click(screen.getByText('Add'))

    expect(mockCreateCard).toHaveBeenCalledWith('tok', 'retro-1', {
      columnId: 'col-1',
      content: 'My new card',
    })
  })

  it('cancels and hides textarea', async () => {
    renderWithProviders()

    await userEvent.click(screen.getByText('Add card'))
    expect(screen.getByPlaceholderText('Type your thought...')).toBeDefined()

    await userEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByPlaceholderText('Type your thought...')).toBeNull()
  })
})
