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

export interface Retro {
  id: string
  name: string
  status: string
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
  dueDate: string | null
  retroId: string
  assignee: ActionItemUserSummary | null
  createdBy: ActionItemUserSummary
  createdAt: string
  updatedAt: string
}

export interface DashboardSummary {
  memberCount: number
  retroCount: number
  openActionItemCount: number
  completedActionItemCount: number
  upcomingRetros: Retro[]
  recentActionItems: ActionItem[]
}
