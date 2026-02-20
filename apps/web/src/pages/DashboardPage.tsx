import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/StatsCard'
import { TeamSection } from '@/components/TeamSection'
import { RetrosSection } from '@/components/RetrosSection'
import { ActionItemsSection } from '@/components/ActionItemsSection'
import { fetchDashboardSummary } from '@/lib/api'

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: summary,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => fetchDashboardSummary(token!),
    enabled: !!token,
  })

  function handleMutation() {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] })
    queryClient.invalidateQueries({ queryKey: ['teams'] })
    queryClient.invalidateQueries({ queryKey: ['retros'] })
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">Retro</h1>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-muted/50 h-24 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg p-4"
          >
            Failed to load dashboard data
          </div>
        )}

        {summary && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              icon={Users}
              label="Team Members"
              value={summary.memberCount}
            />
            <StatsCard
              icon={Calendar}
              label="Retros"
              value={summary.retroCount}
            />
            <StatsCard
              icon={AlertCircle}
              label="Open Items"
              value={summary.openActionItemCount}
            />
            <StatsCard
              icon={CheckCircle2}
              label="Completed"
              value={summary.completedActionItemCount}
            />
          </div>
        )}

        {token && user && (
          <TeamSection
            token={token}
            userId={user.id}
            onMutation={handleMutation}
          />
        )}

        {token && user && (
          <RetrosSection
            token={token}
            userId={user.id}
            onMutation={handleMutation}
          />
        )}

        {token && summary && (
          <ActionItemsSection
            token={token}
            items={summary.recentActionItems}
            onMutation={handleMutation}
          />
        )}
      </main>
    </div>
  )
}
