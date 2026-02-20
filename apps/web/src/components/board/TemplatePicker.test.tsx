import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TemplatePicker } from './TemplatePicker'
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
  fetchTemplates: vi.fn(),
  initBoard: vi.fn(),
}))

const api = await import('@/lib/api')
const mockFetchTemplates = api.fetchTemplates as ReturnType<typeof vi.fn>
const mockInitBoard = api.initBoard as ReturnType<typeof vi.fn>

const templates = [
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
      {
        name: 'Stop',
        description: 'Stop doing',
        color: '#ef4444',
        position: 1,
      },
      {
        name: 'Continue',
        description: 'Keep doing',
        color: '#3b82f6',
        position: 2,
      },
    ],
  },
  {
    id: 'mad-sad-glad',
    name: 'Mad / Sad / Glad',
    columns: [
      {
        name: 'Mad',
        description: 'Frustrations',
        color: '#ef4444',
        position: 0,
      },
      {
        name: 'Sad',
        description: 'Disappointments',
        color: '#8b5cf6',
        position: 1,
      },
      { name: 'Glad', description: 'Wins', color: '#22c55e', position: 2 },
    ],
  },
]

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BoardProvider token="tok" retroId="retro-1" initialBoard={null}>
        <TemplatePicker token="tok" retroId="retro-1" />
      </BoardProvider>
    </QueryClientProvider>,
  )
}

describe('TemplatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders available templates', async () => {
    mockFetchTemplates.mockResolvedValue(templates)

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Start / Stop / Continue')).toBeDefined()
    })
    expect(screen.getByText('Mad / Sad / Glad')).toBeDefined()
  })

  it('calls initBoard when a template is selected', async () => {
    mockFetchTemplates.mockResolvedValue(templates)
    mockInitBoard.mockResolvedValue({
      retroId: 'retro-1',
      columns: [],
    })

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Start / Stop / Continue')).toBeDefined()
    })

    const buttons = screen.getAllByText('Use Template')
    await userEvent.click(buttons[0])

    expect(mockInitBoard).toHaveBeenCalledWith(
      'tok',
      'retro-1',
      'start-stop-continue',
    )
  })
})
