import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react'
import type { Socket } from 'socket.io-client'
import type { Board, Card, Column, RetroPhase } from '@/types/api'
import { createBoardSocket } from '@/lib/socket'
import { mergeCards as mergeCardsApi } from '@/lib/api'

interface ActiveUser {
  userId: string
  userName?: string
}

interface TimerState {
  duration: number
  remaining: number
  running: boolean
}

interface BoardState {
  columns: Column[]
  activeUsers: ActiveUser[]
  initialized: boolean
  phase: RetroPhase
  votedCardIds: string[]
  maxVotes: number
  remainingVotes: number
  timer: TimerState | null
}

type BoardAction =
  | { type: 'SET_BOARD'; columns: Column[] }
  | { type: 'BOARD_INITIALIZED'; columns: Column[] }
  | { type: 'CARD_CREATED'; card: Card }
  | { type: 'CARD_MOVED'; card: Card }
  | { type: 'CARD_DELETED'; id: string }
  | { type: 'USER_JOINED'; user: ActiveUser }
  | { type: 'USER_LEFT'; userId: string }
  | { type: 'PHASE_CHANGED'; phase: RetroPhase }
  | { type: 'BOARD_REVEALED'; columns: Column[] }
  | { type: 'VOTE_COUNT_UPDATED'; cardId: string; voteCount: number }
  | {
      type: 'SET_VOTES'
      votedCardIds: string[]
      maxVotes: number
      remainingVotes: number
    }
  | { type: 'LOCAL_VOTE'; cardId: string }
  | { type: 'LOCAL_UNVOTE'; cardId: string }
  | { type: 'CARDS_MERGED'; parentCard: Card; childCardIds: string[] }
  | { type: 'CARDS_UNMERGED'; parentCard: Card }
  | {
      type: 'TIMER_SYNC'
      timer: { duration: number; remaining: number; running: boolean }
    }
  | { type: 'TIMER_TICK'; remaining: number }
  | { type: 'ROSTER_SYNC'; users: ActiveUser[] }

function findCardVoteCount(columns: Column[], cardId: string): number {
  for (const col of columns) {
    for (const c of col.cards) {
      if (c.id === cardId) return c.voteCount ?? 0
      if (c.children) {
        for (const child of c.children) {
          if (child.id === cardId) return child.voteCount ?? 0
        }
      }
    }
  }
  return 0
}

function updateCardVoteCount(
  columns: Column[],
  cardId: string,
  voteCount: number,
): Column[] {
  return columns.map((col) => ({
    ...col,
    cards: col.cards.map((c) => {
      if (c.id === cardId) return { ...c, voteCount }
      if (c.children?.length) {
        return {
          ...c,
          children: c.children.map((child) =>
            child.id === cardId ? { ...child, voteCount } : child,
          ),
        }
      }
      return c
    }),
  }))
}

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_BOARD':
      return {
        ...state,
        columns: action.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => !c.parentCardId),
        })),
        initialized: action.columns.length > 0,
      }

    case 'BOARD_INITIALIZED':
      return {
        ...state,
        columns: action.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => !c.parentCardId),
        })),
        initialized: true,
      }

    case 'CARD_CREATED': {
      const card = action.card
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.id === card.columnId
            ? {
                ...col,
                cards: [...col.cards.filter((c) => c.id !== card.id), card],
              }
            : col,
        ),
      }
    }

    case 'CARD_MOVED': {
      const card = action.card
      return {
        ...state,
        columns: state.columns.map((col) => {
          const withoutCard = col.cards.filter((c) => c.id !== card.id)
          if (col.id === card.columnId) {
            const cards = [...withoutCard, card].sort(
              (a, b) => a.position - b.position,
            )
            return { ...col, cards }
          }
          return { ...col, cards: withoutCard }
        }),
      }
    }

    case 'CARD_DELETED':
      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => c.id !== action.id),
        })),
      }

    case 'ROSTER_SYNC': {
      const known = new Set(state.activeUsers.map((u) => u.userId))
      const newUsers = action.users.filter((u) => !known.has(u.userId))
      if (newUsers.length === 0) return state
      return {
        ...state,
        activeUsers: [...state.activeUsers, ...newUsers],
      }
    }

    case 'USER_JOINED':
      if (state.activeUsers.some((u) => u.userId === action.user.userId)) {
        return state
      }
      return {
        ...state,
        activeUsers: [...state.activeUsers, action.user],
      }

    case 'USER_LEFT':
      return {
        ...state,
        activeUsers: state.activeUsers.filter(
          (u) => u.userId !== action.userId,
        ),
      }

    case 'PHASE_CHANGED':
      return { ...state, phase: action.phase }

    case 'BOARD_REVEALED':
      return {
        ...state,
        columns: action.columns.map((col) => ({
          ...col,
          cards: col.cards.filter((c) => !c.parentCardId),
        })),
      }

    case 'VOTE_COUNT_UPDATED':
      return {
        ...state,
        columns: updateCardVoteCount(
          state.columns,
          action.cardId,
          action.voteCount,
        ),
      }

    case 'SET_VOTES':
      return {
        ...state,
        votedCardIds: action.votedCardIds,
        maxVotes: action.maxVotes,
        remainingVotes: action.remainingVotes,
      }

    case 'LOCAL_VOTE':
      return {
        ...state,
        columns: updateCardVoteCount(
          state.columns,
          action.cardId,
          findCardVoteCount(state.columns, action.cardId) + 1,
        ),
        votedCardIds: [...state.votedCardIds, action.cardId],
        remainingVotes: state.remainingVotes - 1,
      }

    case 'LOCAL_UNVOTE': {
      const idx = state.votedCardIds.indexOf(action.cardId)
      if (idx === -1) return state
      return {
        ...state,
        columns: updateCardVoteCount(
          state.columns,
          action.cardId,
          Math.max(0, findCardVoteCount(state.columns, action.cardId) - 1),
        ),
        votedCardIds: [
          ...state.votedCardIds.slice(0, idx),
          ...state.votedCardIds.slice(idx + 1),
        ],
        remainingVotes: state.remainingVotes + 1,
      }
    }

    case 'CARDS_MERGED': {
      const { parentCard, childCardIds } = action
      return {
        ...state,
        columns: state.columns.map((col) => ({
          ...col,
          cards: col.cards
            .filter((c) => !childCardIds.includes(c.id))
            .map((c) => (c.id === parentCard.id ? parentCard : c)),
        })),
      }
    }

    case 'CARDS_UNMERGED': {
      const { parentCard } = action
      let formerChildren: Card[] = []
      for (const col of state.columns) {
        const existing = col.cards.find((c) => c.id === parentCard.id)
        if (existing?.children?.length) {
          formerChildren = existing.children
          break
        }
      }
      return {
        ...state,
        columns: state.columns.map((col) => {
          const hasParent = col.cards.some((c) => c.id === parentCard.id)
          if (!hasParent) return col
          return {
            ...col,
            cards: [
              ...col.cards.map((c) =>
                c.id === parentCard.id ? { ...parentCard, children: [] } : c,
              ),
              ...formerChildren.map((child) => ({
                ...child,
                parentCardId: null,
                children: [],
              })),
            ],
          }
        }),
      }
    }

    case 'TIMER_SYNC':
      return { ...state, timer: action.timer }

    case 'TIMER_TICK':
      return state.timer
        ? {
            ...state,
            timer: { ...state.timer, remaining: action.remaining },
          }
        : state

    default:
      return state
  }
}

interface MergeSelection {
  selectedIds: string[]
  toggleSelect: (cardId: string) => void
  doMerge: () => void
  clearSelection: () => void
}

interface BoardContextValue {
  state: BoardState
  dispatch: React.Dispatch<BoardAction>
  socketRef: React.RefObject<Socket | null>
  mergeSelection: MergeSelection
}

const BoardContext = createContext<BoardContextValue | null>(null)

export function useBoardContext() {
  const ctx = useContext(BoardContext)
  if (!ctx) throw new Error('useBoardContext must be used within BoardProvider')
  return ctx
}

interface BoardProviderProps {
  token: string
  retroId: string
  userId: string
  userName?: string
  initialBoard: Board | null
  initialPhase?: RetroPhase
  children: ReactNode
}

export function BoardProvider({
  token,
  retroId,
  userId,
  userName,
  initialBoard,
  initialPhase,
  children,
}: BoardProviderProps) {
  const [state, dispatch] = useReducer(boardReducer, {
    columns: initialBoard?.columns ?? [],
    activeUsers: [{ userId, userName }],
    initialized: (initialBoard?.columns.length ?? 0) > 0,
    phase: initialPhase ?? 'ICEBREAKER',
    votedCardIds: [],
    maxVotes: 5,
    remainingVotes: 5,
    timer: null,
  })

  const socketRef = useRef<Socket | null>(null)
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([])

  // Clear merge selection when phase changes away from GROUP_VOTE
  useEffect(() => {
    if (state.phase !== 'GROUP_VOTE') {
      setSelectedForMerge([])
    }
  }, [state.phase])

  const toggleSelect = useCallback((cardId: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    )
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedForMerge([])
  }, [])

  const doMerge = useCallback(async () => {
    if (selectedForMerge.length < 2) return
    const [parentId, ...childIds] = selectedForMerge
    try {
      await mergeCardsApi(token, retroId, parentId, childIds)
      // Let the WebSocket broadcast handle the state update
      setSelectedForMerge([])
    } catch (err) {
      console.error('Merge failed:', err)
    }
  }, [selectedForMerge, token, retroId])

  const mergeSelection = useMemo<MergeSelection>(
    () => ({
      selectedIds: selectedForMerge,
      toggleSelect,
      doMerge,
      clearSelection,
    }),
    [selectedForMerge, toggleSelect, doMerge, clearSelection],
  )

  useEffect(() => {
    if (initialBoard) {
      dispatch({ type: 'SET_BOARD', columns: initialBoard.columns })
    }
  }, [initialBoard])

  useEffect(() => {
    const socket = createBoardSocket(token)
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('board:join', { retroId })
    })

    socket.on('board:initialized', (data: { columns: Column[] }) => {
      dispatch({ type: 'BOARD_INITIALIZED', columns: data.columns })
    })

    socket.on('card:created', (card: Card) => {
      dispatch({ type: 'CARD_CREATED', card })
    })

    socket.on('card:moved', (card: Card) => {
      dispatch({ type: 'CARD_MOVED', card })
    })

    socket.on('card:deleted', (data: { id: string }) => {
      dispatch({ type: 'CARD_DELETED', id: data.id })
    })

    socket.on(
      'board:roster',
      (users: { userId: string; userName?: string }[]) => {
        dispatch({ type: 'ROSTER_SYNC', users })
      },
    )

    socket.on(
      'board:user-joined',
      (user: { userId: string; userName?: string }) => {
        dispatch({ type: 'USER_JOINED', user })
      },
    )

    socket.on('board:user-left', (data: { userId: string }) => {
      dispatch({ type: 'USER_LEFT', userId: data.userId })
    })

    socket.on('retro:phase-changed', (data: { phase: RetroPhase }) => {
      dispatch({ type: 'PHASE_CHANGED', phase: data.phase })
    })

    socket.on('board:revealed', (data: { columns: Column[] }) => {
      dispatch({ type: 'BOARD_REVEALED', columns: data.columns })
    })

    socket.on('card:voted', (data: { cardId: string; voteCount: number }) => {
      dispatch({
        type: 'VOTE_COUNT_UPDATED',
        cardId: data.cardId,
        voteCount: data.voteCount,
      })
    })

    socket.on('card:unvoted', (data: { cardId: string; voteCount: number }) => {
      dispatch({
        type: 'VOTE_COUNT_UPDATED',
        cardId: data.cardId,
        voteCount: data.voteCount,
      })
    })

    socket.on(
      'cards:merged',
      (data: { parentCard: Card; childCardIds: string[] }) => {
        dispatch({
          type: 'CARDS_MERGED',
          parentCard: data.parentCard,
          childCardIds: data.childCardIds,
        })
      },
    )

    socket.on('cards:unmerged', (data: { parentCard: Card }) => {
      dispatch({ type: 'CARDS_UNMERGED', parentCard: data.parentCard })
    })

    socket.on(
      'timer:sync',
      (data: { duration: number; remaining: number; running: boolean }) => {
        dispatch({ type: 'TIMER_SYNC', timer: data })
      },
    )

    socket.on('timer:tick', (data: { remaining: number }) => {
      dispatch({ type: 'TIMER_TICK', remaining: data.remaining })
    })

    socket.connect()

    return () => {
      socket.emit('board:leave', { retroId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, retroId])

  const value = useMemo(
    () => ({ state, dispatch, socketRef, mergeSelection }),
    [state, mergeSelection],
  )

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
}
