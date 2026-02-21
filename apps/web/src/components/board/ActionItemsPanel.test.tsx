import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActionItemsPanel } from './ActionItemsPanel'
import { BoardProvider } from './BoardProvider'
import type { ActionItem } from '@/types/api'

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
  fetchActionItems: vi.fn(),
  fetchRetroMembers: vi.fn(),
  createActionItem: vi.fn(),
  updateActionItem: vi.fn(),
  deleteActionItem: vi.fn(),
  reorderActionItems: vi.fn(),
}))

const api = await import('@/lib/api')
const mockFetchActionItems = api.fetchActionItems as ReturnType<typeof vi.fn>
const mockFetchRetroMembers = api.fetchRetroMembers as ReturnType<typeof vi.fn>

const sampleItems: ActionItem[] = [
  {
    id: 'ai-1',
    title: 'Fix the login bug',
    description: null,
    status: 'OPEN',
    position: 0,
    dueDate: null,
    retroId: 'retro-1',
    assignee: { id: 'user-1', name: 'Alice', avatarUrl: null },
    createdBy: { id: 'user-2', name: 'Bob', avatarUrl: null },
    createdAt: '2026-02-20',
    updatedAt: '2026-02-20',
  },
  {
    id: 'ai-2',
    title: 'Add unit tests',
    description: 'Cover edge cases',
    status: 'OPEN',
    position: 1,
    dueDate: '2026-03-01',
    retroId: 'retro-1',
    assignee: null,
    createdBy: { id: 'user-2', name: 'Bob', avatarUrl: null },
    createdAt: '2026-02-20',
    updatedAt: '2026-02-20',
  },
]

function renderPanel(items: ActionItem[] = []) {
  mockFetchActionItems.mockResolvedValue(items)
  mockFetchRetroMembers.mockResolvedValue([])

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
          columns: [],
        }}
      >
        <ActionItemsPanel token="tok" retroId="retro-1" />
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('ActionItemsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders empty state with New Action Item button', async () => {
    renderPanel()

    expect(screen.getByText('New Action Item')).toBeDefined()
    expect(await screen.findByText('No action items yet')).toBeDefined()
  })

  it('renders a list of action items', async () => {
    renderPanel(sampleItems)

    expect(await screen.findByText('Fix the login bug')).toBeDefined()
    expect(screen.getByText('Add unit tests')).toBeDefined()
    expect(screen.getByText('Alice')).toBeDefined()
    expect(screen.getByText('Unassigned')).toBeDefined()
  })

  it('opens create dialog when New Action Item button is clicked', async () => {
    renderPanel()

    await screen.findByText('No action items yet')
    fireEvent.click(screen.getByText('New Action Item'))

    expect(
      screen.getByText('New Action Item', {
        selector: '[data-slot="dialog-title"]',
      }),
    ).toBeDefined()
    expect(screen.getByLabelText('Title')).toBeDefined()
    expect(screen.getByText('Create')).toBeDefined()
  })
})
