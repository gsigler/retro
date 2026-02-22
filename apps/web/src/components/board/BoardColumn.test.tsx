import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi } from 'vitest'
import { BoardColumn } from './BoardColumn'
import { BoardProvider } from './BoardProvider'
import type { Column } from '@/types/api'

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

vi.mock('@/lib/api', () => ({}))

const column: Column = {
  id: 'col-1',
  retroId: 'retro-1',
  name: 'Start',
  description: 'Things to start doing',
  color: '#22c55e',
  position: 0,
  cards: [
    {
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
    },
  ],
}

function renderWithProviders(col: Column) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BoardProvider
        token="tok"
        retroId="retro-1"
        initialBoard={{ retroId: 'retro-1', columns: [col] }}
        initialPhase="RETROSPECT"
      >
        <DndContext>
          <BoardColumn column={col} token="tok" retroId="retro-1" />
        </DndContext>
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('BoardColumn', () => {
  it('renders column name and card count', () => {
    renderWithProviders(column)

    expect(screen.getByText(/Start/)).toBeDefined()
    expect(screen.getByText(/\(1\)/)).toBeDefined()
  })

  it('renders column description', () => {
    renderWithProviders(column)

    expect(screen.getByText(/Things to start doing/)).toBeDefined()
  })

  it('renders cards within the column', () => {
    renderWithProviders(column)

    expect(screen.getByText('Write more tests')).toBeDefined()
  })

  it('shows add item prompt', () => {
    renderWithProviders(column)

    expect(screen.getByText(/add item/i)).toBeDefined()
  })
})
