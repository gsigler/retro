export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteCode: string
  createdAt: string
  updatedAt: string
}

export interface TeamWithCounts {
  id: string
  name: string
  description: string | null
  ownerId: string
  memberCount: number
  retroCount: number
  createdAt: string
}

export interface TeamMember {
  id: string
  role: string
  joinedAt: string
  user: User
}

export interface TeamDetail {
  id: string
  name: string
  description: string | null
  ownerId: string
  inviteCode: string
  members: TeamMember[]
  retroCount: number
  createdAt: string
  updatedAt: string
}

export type RetroPhase =
  | 'ICEBREAKER'
  | 'RETROSPECT'
  | 'GROUP_VOTE'
  | 'DISCUSS_ACTION'

export interface Retro {
  id: string
  name: string
  status: string
  phase: RetroPhase
  date: string
  teamId: string
  createdAt: string
  createdBy: { id: string; email: string; name: string | null }
}

export interface RetroWithCounts extends Retro {
  actionItemCount: number
}

export interface ActionItemUserSummary {
  id: string
  name: string | null
  avatarUrl: string | null
}

export interface ActionItem {
  id: string
  title: string
  description: string | null
  status: string
  position: number
  dueDate: string | null
  retroId: string
  assignee: ActionItemUserSummary | null
  createdBy: ActionItemUserSummary
  createdAt: string
  updatedAt: string
}

// Board

export interface RetroTemplate {
  id: string
  name: string
  columns: {
    name: string
    description: string
    color: string
    position: number
  }[]
}

export interface CardAuthor {
  id: string
  name: string | null
}

export interface Card {
  id: string
  columnId: string
  retroId: string
  content: string
  position: number
  createdAt: string
  updatedAt: string
  author: CardAuthor
}

export interface Column {
  id: string
  retroId: string
  name: string
  description: string | null
  color: string
  position: number
  cards: Card[]
}

export interface Board {
  retroId: string
  columns: Column[]
}

export const ANONYMOUS_AUTHOR_ID = 'anonymous'

export interface DashboardSummary {
  memberCount: number
  retroCount: number
  openActionItemCount: number
  completedActionItemCount: number
  upcomingRetros: Retro[]
  recentActionItems: ActionItem[]
}
