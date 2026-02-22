import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { deleteCard, voteCard, unvoteCard } from '@/lib/api'
import { useBoardContext } from './BoardProvider'
import type { Card } from '@/types/api'
import { ANONYMOUS_AUTHOR_ID } from '@/types/api'

interface BoardCardProps {
  card: Card
  token: string
  retroId: string
  columnColor?: string
}

export function BoardCard({
  card,
  token,
  retroId,
  columnColor,
}: BoardCardProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { state, dispatch } = useBoardContext()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const isAnonymousPhase =
    state.phase === 'GROUP_VOTE' || state.phase === 'DISCUSS_ACTION'
  const isOwnCard = user?.id === card.author.id
  const showAnonymous =
    isAnonymousPhase && !isOwnCard && card.author.id === ANONYMOUS_AUTHOR_ID

  const authorDisplay = showAnonymous
    ? 'Anonymous'
    : isOwnCard
      ? `${card.author.name ?? 'Anonymous'} (you)`
      : (card.author.name ?? 'Anonymous')

  const canVote = state.phase === 'GROUP_VOTE'
  const myVoteCount = state.votedCardIds.filter((id) => id === card.id).length
  const hasVoted = myVoteCount > 0

  const voteMutation = useMutation({
    mutationFn: () => voteCard(token, retroId, card.id),
    onMutate: () => {
      dispatch({ type: 'LOCAL_VOTE', cardId: card.id })
    },
    onError: () => {
      dispatch({ type: 'LOCAL_UNVOTE', cardId: card.id })
    },
  })

  const unvoteMutation = useMutation({
    mutationFn: () => unvoteCard(token, retroId, card.id),
    onMutate: () => {
      dispatch({ type: 'LOCAL_UNVOTE', cardId: card.id })
    },
    onError: () => {
      dispatch({ type: 'LOCAL_VOTE', cardId: card.id })
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: `2px solid ${columnColor ?? theme.border}`,
    borderRadius: 0,
    padding: '6px 10px',
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    position: 'relative' as const,
    borderBottom: `1px solid ${theme.border}22`,
  }

  async function handleDelete() {
    try {
      dispatch({ type: 'CARD_DELETED', id: card.id })
      await deleteCard(token, retroId, card.id)
    } catch {
      // Socket broadcast will reconcile
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Delete button — top right corner */}
      <button
        onClick={handleDelete}
        aria-label="Delete card"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'transparent',
          border: 'none',
          color: theme.textTertiary,
          cursor: 'pointer',
          fontSize: 10,
          padding: '0 2px',
          fontFamily: 'inherit',
          opacity: 0,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.color = theme.red
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0'
          e.currentTarget.style.color = theme.textTertiary
        }}
      >
        [rm]
      </button>

      <p
        style={{
          whiteSpace: 'pre-wrap',
          fontSize: 12,
          color: theme.textPrimary,
          paddingRight: 24,
        }}
      >
        {card.content}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <span style={{ fontSize: 11, color: theme.textTertiary, opacity: 0.6 }}>
          {authorDisplay}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {canVote && (
            <>
              <button
                onClick={() => unvoteMutation.mutate()}
                disabled={!hasVoted}
                aria-label="Remove vote"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: hasVoted ? theme.yellow : theme.textTertiary,
                  cursor: hasVoted ? 'pointer' : 'default',
                  fontSize: 12,
                  padding: '0 3px',
                  fontFamily: 'inherit',
                  opacity: hasVoted ? 1 : 0.3,
                  fontWeight: 600,
                }}
              >
                -
              </button>
              <span
                style={{
                  color: hasVoted ? theme.yellow : theme.textTertiary,
                  fontWeight: hasVoted ? 600 : 400,
                  fontSize: 11,
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {card.voteCount ?? 0}
              </span>
              <button
                onClick={() => voteMutation.mutate()}
                disabled={state.remainingVotes <= 0}
                aria-label="Vote"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color:
                    state.remainingVotes > 0
                      ? theme.yellow
                      : theme.textTertiary,
                  cursor: state.remainingVotes > 0 ? 'pointer' : 'default',
                  fontSize: 12,
                  padding: '0 3px',
                  fontFamily: 'inherit',
                  opacity: state.remainingVotes > 0 ? 1 : 0.3,
                  fontWeight: 600,
                }}
              >
                +
              </button>
            </>
          )}
          {!canVote && (card.voteCount ?? 0) > 0 && (
            <span
              style={{
                fontSize: 11,
                color: theme.yellow,
                opacity: 0.7,
              }}
            >
              {card.voteCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
