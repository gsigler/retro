import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Users, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { StatsCard } from '@/components/StatsCard'
import { TeamSection } from '@/components/TeamSection'
import { RetrosSection } from '@/components/RetrosSection'
import { ActionItemsSection } from '@/components/ActionItemsSection'
import { fetchDashboardSummary } from '@/lib/api'
import type { DashboardSummary } from '@/types/api'

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRetroId, setSelectedRetroId] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    if (!token) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchDashboardSummary(token)
      setSummary(data)
    } catch {
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

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
            {error}
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
            onMutation={loadSummary}
          />
        )}

        {token && user && (
          <RetrosSection
            token={token}
            userId={user.id}
            selectedRetroId={selectedRetroId}
            onSelectRetro={setSelectedRetroId}
            onMutation={loadSummary}
          />
        )}

        {token && user && selectedRetroId && (
          <ActionItemsSection
            token={token}
            userId={user.id}
            retroId={selectedRetroId}
            onMutation={loadSummary}
          />
        )}
      </main>
    </div>
  )
}
