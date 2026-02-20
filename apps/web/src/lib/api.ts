import type {
  Team,
  TeamWithCounts,
  TeamDetail,
  TeamMember,
  RetroWithCounts,
  ActionItem,
  DashboardSummary,
} from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

// Dashboard

export function fetchDashboardSummary(token: string) {
  return api<DashboardSummary>('/dashboard/summary', {
    headers: authHeaders(token),
  })
}

// Teams

export function fetchTeams(token: string) {
  return api<TeamWithCounts[]>('/teams', {
    headers: authHeaders(token),
  })
}

export function fetchTeam(token: string, id: string) {
  return api<TeamDetail>(`/teams/${id}`, {
    headers: authHeaders(token),
  })
}

export function createTeam(
  token: string,
  data: { name: string; description?: string },
) {
  return api<Team>('/teams', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function updateTeam(
  token: string,
  id: string,
  data: { name?: string; description?: string },
) {
  return api<Team>(`/teams/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function joinTeam(token: string, inviteCode: string) {
  return api<TeamMember>('/teams/join', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ inviteCode }),
  })
}

export function addTeamMember(token: string, teamId: string, email: string) {
  return api<TeamMember>(`/teams/${teamId}/members`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ email }),
  })
}

export function removeTeamMember(
  token: string,
  teamId: string,
  userId: string,
) {
  return api<void>(`/teams/${teamId}/members/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

// Retros

export function fetchRetros(token: string, teamId: string) {
  return api<RetroWithCounts[]>(`/teams/${teamId}/retros`, {
    headers: authHeaders(token),
  })
}

export function createRetro(
  token: string,
  teamId: string,
  data: { name: string; date: string; status?: string },
) {
  return api<RetroWithCounts>(`/teams/${teamId}/retros`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function updateRetro(
  token: string,
  id: string,
  data: { name?: string; date?: string; status?: string },
) {
  return api<RetroWithCounts>(`/retros/${id}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function deleteRetro(token: string, id: string) {
  return api<void>(`/retros/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}

// Action Items

export function fetchActionItems(token: string, retroId: string) {
  return api<ActionItem[]>(`/retros/${retroId}/action-items`, {
    headers: authHeaders(token),
  })
}

export function createActionItem(
  token: string,
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
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function updateActionItem(
  token: string,
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
    headers: authHeaders(token),
    body: JSON.stringify(data),
  })
}

export function deleteActionItem(token: string, id: string) {
  return api<void>(`/action-items/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
}
