import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ActionItemsPanel } from './ActionItemsPanel'
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
const mockCreateActionItem = api.createActionItem as ReturnType<typeof vi.fn>

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BoardProvider
        retroId="retro-1"
        userId="user-1"
        userName="Test User"
        initialBoard={{
          retroId: 'retro-1',
          columns: [],
        }}
      >
        <ActionItemsPanel retroId="retro-1" />
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('ActionItemsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchActionItems.mockResolvedValue([])
    mockFetchRetroMembers.mockResolvedValue([])
  })

  it('shows empty state when no items', async () => {
    renderPanel()

    expect(await screen.findByText('No action items yet')).toBeDefined()
  })

  it('renders action items from query', async () => {
    mockFetchActionItems.mockResolvedValue([
      {
        id: 'ai-1',
        title: 'Fix the bug',
        description: null,
        status: 'OPEN',
        position: 0,
        dueDate: null,
        retroId: 'retro-1',
        assignee: null,
        createdBy: { id: 'u-1', name: 'Alice', avatarUrl: null },
        createdAt: '2026-02-20',
        updatedAt: '2026-02-20',
      },
    ])

    renderPanel()

    expect(await screen.findByText('Fix the bug')).toBeDefined()
  })

  it('shows inline form when [+ new] is clicked', async () => {
    renderPanel()

    await screen.findByText('No action items yet')
    await userEvent.click(screen.getByText('[+ new]'))

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeDefined()
  })

  it('submits new action item via Enter', async () => {
    mockCreateActionItem.mockResolvedValue({
      id: 'ai-new',
      title: 'New task',
      description: null,
      status: 'OPEN',
      position: 0,
      dueDate: null,
      retroId: 'retro-1',
      assignee: null,
      createdBy: { id: 'u-1', name: 'Alice', avatarUrl: null },
      createdAt: '2026-02-20',
      updatedAt: '2026-02-20',
    })

    renderPanel()

    await screen.findByText('No action items yet')
    await userEvent.click(screen.getByText('[+ new]'))
    await userEvent.type(
      screen.getByPlaceholderText('What needs to be done?'),
      'New task{Enter}',
    )

    await waitFor(() => {
      expect(mockCreateActionItem).toHaveBeenCalledWith('retro-1', {
        title: 'New task',
        assigneeId: undefined,
        dueDate: undefined,
      })
    })
  })

  it('hides form on Escape', async () => {
    renderPanel()

    await screen.findByText('No action items yet')
    await userEvent.click(screen.getByText('[+ new]'))

    expect(screen.getByPlaceholderText('What needs to be done?')).toBeDefined()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByPlaceholderText('What needs to be done?')).toBeNull()
  })

  it('shows item count in header', async () => {
    mockFetchActionItems.mockResolvedValue([
      {
        id: 'ai-1',
        title: 'Item one',
        description: null,
        status: 'OPEN',
        position: 0,
        dueDate: null,
        retroId: 'retro-1',
        assignee: null,
        createdBy: { id: 'u-1', name: 'Alice', avatarUrl: null },
        createdAt: '2026-02-20',
        updatedAt: '2026-02-20',
      },
      {
        id: 'ai-2',
        title: 'Item two',
        description: null,
        status: 'DONE',
        position: 1,
        dueDate: null,
        retroId: 'retro-1',
        assignee: null,
        createdBy: { id: 'u-1', name: 'Alice', avatarUrl: null },
        createdAt: '2026-02-20',
        updatedAt: '2026-02-20',
      },
    ])

    renderPanel()

    expect(await screen.findByText(/action items \(2\)/)).toBeDefined()
  })
})
