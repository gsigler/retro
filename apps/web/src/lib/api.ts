import type {
  Team,
  TeamWithCounts,
  TeamDetail,
  TeamMember,
  RetroPhase,
  RetroWithCounts,
  ActionItem,
  ActionItemUserSummary,
  DashboardSummary,
  Board,
  Card,
  RetroTemplate,
  UserVotes,
  VoteResult,
} from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options ?? {}
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

// Dashboard

export function fetchDashboardSummary() {
  return api<DashboardSummary>('/dashboard/summary')
}

// Teams

export function fetchTeams() {
  return api<TeamWithCounts[]>('/teams')
}

export function fetchTeam(id: string) {
  return api<TeamDetail>(`/teams/${id}`)
}

export function createTeam(data: { name: string; description?: string }) {
  return api<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateTeam(
  id: string,
  data: { name?: string; description?: string },
) {
  return api<Team>(`/teams/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function joinTeam(inviteCode: string) {
  return api<TeamMember>('/teams/join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  })
}

export function regenerateInviteCode(teamId: string) {
  return api<Team>(`/teams/${teamId}/invite/regenerate`, {
    method: 'POST',
  })
}

export function addTeamMember(teamId: string, email: string) {
  return api<TeamMember>(`/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function removeTeamMember(teamId: string, userId: string) {
  return api<void>(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
  })
}

// Retros

export function fetchRetros(teamId: string) {
  return api<RetroWithCounts[]>(`/teams/${teamId}/retros`)
}

export function fetchRetro(id: string) {
  return api<RetroWithCounts>(`/retros/${id}`)
}

export function createRetro(
  teamId: string,
  data: { name: string; date: string; status?: string; templateId?: string },
) {
  return api<RetroWithCounts>(`/teams/${teamId}/retros`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRetro(
  id: string,
  data: { name?: string; date?: string; status?: string },
) {
  return api<RetroWithCounts>(`/retros/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function updateRetroPhase(retroId: string, phase: RetroPhase) {
  return api<RetroWithCounts>(`/retros/${retroId}/phase`, {
    method: 'PATCH',
    body: JSON.stringify({ phase }),
  })
}

export function deleteRetro(id: string) {
  return api<void>(`/retros/${id}`, {
    method: 'DELETE',
  })
}

// Action Items

export function fetchActionItems(retroId: string) {
  return api<ActionItem[]>(`/retros/${retroId}/action-items`)
}

export function createActionItem(
  retroId: string,
  data: {
    title: string
    description?: string
    assigneeId?: string
    dueDate?: string
  },
) {
  return api<ActionItem>(`/retros/${retroId}/action-items`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateActionItem(
  id: string,
  data: {
    title?: string
    description?: string
    status?: string
    assigneeId?: string | null
    dueDate?: string | null
  },
) {
  return api<ActionItem>(`/action-items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function reorderActionItems(retroId: string, orderedIds: string[]) {
  return api<ActionItem[]>(`/retros/${retroId}/action-items/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ orderedIds }),
  })
}

export function fetchRetroMembers(retroId: string) {
  return api<ActionItemUserSummary[]>(`/retros/${retroId}/members`)
}

export function deleteActionItem(id: string) {
  return api<void>(`/action-items/${id}`, {
    method: 'DELETE',
  })
}

// Board

export function fetchTemplates() {
  return api<RetroTemplate[]>('/board/templates')
}

export function fetchBoard(retroId: string) {
  return api<Board>(`/retros/${retroId}/board`)
}

export function initBoard(retroId: string, templateId: string) {
  return api<Board>(`/retros/${retroId}/board/init`, {
    method: 'POST',
    body: JSON.stringify({ templateId }),
  })
}

export function createCard(
  retroId: string,
  data: { columnId: string; content: string },
) {
  return api<Card>(`/retros/${retroId}/board/cards`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function moveCard(
  retroId: string,
  cardId: string,
  data: { columnId: string; position: number },
) {
  return api<Card>(`/retros/${retroId}/board/cards/${cardId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteCard(retroId: string, cardId: string) {
  return api<void>(`/retros/${retroId}/board/cards/${cardId}`, {
    method: 'DELETE',
  })
}

export function voteCard(retroId: string, cardId: string) {
  return api<VoteResult>(`/retros/${retroId}/board/cards/${cardId}/vote`, {
    method: 'POST',
  })
}

export function unvoteCard(retroId: string, cardId: string) {
  return api<VoteResult>(`/retros/${retroId}/board/cards/${cardId}/vote`, {
    method: 'DELETE',
  })
}

export function fetchUserVotes(retroId: string) {
  return api<UserVotes>(`/retros/${retroId}/board/votes`)
}

export function mergeCards(
  retroId: string,
  parentCardId: string,
  childCardIds: string[],
) {
  return api<Card>(`/retros/${retroId}/board/cards/merge`, {
    method: 'POST',
    body: JSON.stringify({ parentCardId, childCardIds }),
  })
}

export function unmergeCard(retroId: string, cardId: string) {
  return api<Card>(`/retros/${retroId}/board/cards/${cardId}/unmerge`, {
    method: 'POST',
  })
}
