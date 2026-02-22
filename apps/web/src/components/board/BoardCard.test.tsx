import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BoardCard } from './BoardCard'
import { BoardProvider } from './BoardProvider'
import type { Card } from '@/types/api'

vi.mock('@/lib/socket', () => ({
  createBoardSocket: () => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'alice@test.com', name: 'Alice' },
    token: 'tok',
  }),
}))

vi.mock('@/lib/api', () => ({
  deleteCard: vi.fn(),
  voteCard: vi.fn(),
  unvoteCard: vi.fn(),
  unmergeCard: vi.fn(),
}))

const api = await import('@/lib/api')
const mockDeleteCard = api.deleteCard as ReturnType<typeof vi.fn>

const card: Card = {
  id: 'card-1',
  columnId: 'col-1',
  retroId: 'retro-1',
  content: 'Write more tests',
  position: 0,
  createdAt: '2026-02-20',
  updatedAt: '2026-02-20',
  author: { id: 'user-1', name: 'Alice' },
  voteCount: 0,
  parentCardId: null,
  children: [],
}

function renderWithProviders(c: Card) {
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
              cards: [c],
            },
          ],
        }}
      >
        <DndContext>
          <SortableContext items={[c.id]}>
            <BoardCard card={c} token="tok" retroId="retro-1" />
          </SortableContext>
        </DndContext>
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('BoardCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders card content and author', () => {
    renderWithProviders(card)

    expect(screen.getByText('Write more tests')).toBeDefined()
    expect(screen.getByText('Alice (you)')).toBeDefined()
  })

  it('calls deleteCard API when delete button is clicked', async () => {
    mockDeleteCard.mockResolvedValue(undefined)

    renderWithProviders(card)

    const deleteBtn = screen.getByLabelText('Delete card')
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(mockDeleteCard).toHaveBeenCalledWith('tok', 'retro-1', 'card-1')
    })
  })
})
