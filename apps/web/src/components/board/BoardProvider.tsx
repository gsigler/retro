import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import type { Socket } from 'socket.io-client'
import type { Board, Card, Column, RetroPhase } from '@/types/api'
import { createBoardSocket } from '@/lib/socket'

interface ActiveUser {
  userId: string
  userName?: string
}

interface BoardState {
  columns: Column[]
  activeUsers: ActiveUser[]
  initialized: boolean
  phase: RetroPhase
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

function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'SET_BOARD':
      return {
        ...state,
        columns: action.columns,
        initialized: action.columns.length > 0,
      }

    case 'BOARD_INITIALIZED':
      return { ...state, columns: action.columns, initialized: true }

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
      return { ...state, columns: action.columns }

    default:
      return state
  }
}

interface BoardContextValue {
  state: BoardState
  dispatch: React.Dispatch<BoardAction>
  socketRef: React.RefObject<Socket | null>
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
  initialBoard: Board | null
  initialPhase?: RetroPhase
  children: ReactNode
}

export function BoardProvider({
  token,
  retroId,
  initialBoard,
  initialPhase,
  children,
}: BoardProviderProps) {
  const [state, dispatch] = useReducer(boardReducer, {
    columns: initialBoard?.columns ?? [],
    activeUsers: [],
    initialized: (initialBoard?.columns.length ?? 0) > 0,
    phase: initialPhase ?? 'ICEBREAKER',
  })

  const socketRef = useRef<Socket | null>(null)

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

    socket.connect()

    return () => {
      socket.emit('board:leave', { retroId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, retroId])

  return (
    <BoardContext.Provider value={{ state, dispatch, socketRef }}>
      {children}
    </BoardContext.Provider>
  )
}
