import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMutation } from '@tanstack/react-query'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { deleteCard, voteCard, unvoteCard, unmergeCard } from '@/lib/api'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { useBoardContext } from './BoardProvider'
import type { Card } from '@/types/api'
import { ANONYMOUS_AUTHOR_ID } from '@/types/api'

interface BoardCardProps {
  card: Card
  token: string
  retroId: string
}

export function BoardCard({ card, token, retroId }: BoardCardProps) {
  const { theme } = useTheme()
  const { user } = useAuth()
  const { state, dispatch, mergeSelection } = useBoardContext()
  const [expanded, setExpanded] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const isOwnCard = user?.id === card.author.id
  const showAnonymous = !isOwnCard && card.author.id === ANONYMOUS_AUTHOR_ID

  const authorDisplay = showAnonymous
    ? 'Anonymous'
    : isOwnCard
      ? `${card.author.name ?? 'Anonymous'} (you)`
      : (card.author.name ?? 'Anonymous')

  const canVote = state.phase === 'GROUP_VOTE'
  const myVoteCount = state.votedCardIds.filter((id) => id === card.id).length
  const hasVoted = myVoteCount > 0

  const isSelectedForMerge = mergeSelection.selectedIds.includes(card.id)
  const canSelectForMerge = state.phase === 'GROUP_VOTE' && !card.parentCardId

  const hasChildren = (card.children?.length ?? 0) > 0
  const childCount = card.children?.length ?? 0

  const totalVoteCount =
    (card.voteCount ?? 0) +
    (card.children ?? []).reduce((sum, c) => sum + (c.voteCount ?? 0), 0)

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

  const unmergeMutation = useMutation({
    mutationFn: () => unmergeCard(token, retroId, card.id),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeft: isSelectedForMerge ? `2px solid ${theme.cyan}` : 'none',
    borderRadius: 2,
    padding: canSelectForMerge ? '8px 10px 8px 36px' : '8px 10px',
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    position: 'relative' as const,
    background: isSelectedForMerge ? `${theme.cyan}10` : theme.bgSecondary,
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
      {/* Merge select checkbox */}
      {canSelectForMerge && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            mergeSelection.toggleSelect(card.id)
          }}
          aria-label={
            isSelectedForMerge ? 'Deselect for merge' : 'Select for merge'
          }
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: 6,
            background: 'transparent',
            border: 'none',
            color: isSelectedForMerge ? theme.cyan : theme.textTertiary,
            cursor: 'pointer',
            fontSize: 11,
            padding: 0,
            fontFamily: 'inherit',
            lineHeight: 1,
            opacity: isSelectedForMerge ? 1 : 0.4,
          }}
        >
          {isSelectedForMerge ? '[x]' : '[ ]'}
        </button>
      )}

      {/* Delete button — visible on hover and focus */}
      <TerminalButton
        onClick={handleDelete}
        aria-label="Delete card"
        className="card-delete-btn"
        size="sm"
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          color: theme.textTertiary,
          fontSize: 10,
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
        onFocus={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.color = theme.red
        }}
        onBlur={(e) => {
          e.currentTarget.style.opacity = '0'
          e.currentTarget.style.color = theme.textTertiary
        }}
      >
        rm
      </TerminalButton>

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

      {/* Group badge */}
      {hasChildren && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: `${theme.cyan}18`,
            border: `1px solid ${theme.cyan}40`,
            borderRadius: 2,
            color: theme.cyan,
            cursor: 'pointer',
            fontSize: 10,
            padding: '1px 6px',
            fontFamily: 'inherit',
            marginTop: 4,
          }}
        >
          {expanded ? '[-]' : '[+]'} {childCount} merged card
          {childCount > 1 ? 's' : ''}
        </button>
      )}

      {/* Expanded children */}
      {hasChildren && expanded && (
        <div
          style={{
            marginTop: 6,
            paddingLeft: 8,
            borderLeft: `1px solid ${theme.border}40`,
          }}
        >
          {card.children.map((child) => (
            <div
              key={child.id}
              style={{
                padding: '4px 0',
                borderBottom: `1px solid ${theme.border}18`,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: theme.textSecondary,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {child.content}
              </p>
              <span
                style={{
                  fontSize: 10,
                  color: theme.textTertiary,
                  opacity: 0.5,
                }}
              >
                {child.author.id === ANONYMOUS_AUTHOR_ID
                  ? 'Anonymous'
                  : (child.author.name ?? 'Anonymous')}
                {(child.voteCount ?? 0) > 0 && ` | ${child.voteCount} votes`}
              </span>
            </div>
          ))}
          {state.phase === 'GROUP_VOTE' && (
            <TerminalButton
              onClick={() => unmergeMutation.mutate()}
              disabled={unmergeMutation.isPending}
              size="sm"
              style={{
                color: theme.yellow,
                fontSize: 10,
                padding: '4px 0',
                opacity: 0.8,
              }}
            >
              unmerge
            </TerminalButton>
          )}
        </div>
      )}

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
                disabled={!hasVoted || unvoteMutation.isPending}
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
                {hasChildren ? totalVoteCount : (card.voteCount ?? 0)}
              </span>
              <button
                onClick={() => voteMutation.mutate()}
                disabled={state.remainingVotes <= 0 || voteMutation.isPending}
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
          {!canVote && totalVoteCount > 0 && (
            <span
              style={{
                fontSize: 11,
                color: theme.yellow,
                opacity: 0.7,
              }}
            >
              {hasChildren ? totalVoteCount : card.voteCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
