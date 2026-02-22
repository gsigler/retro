import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { TerminalButton } from '@/components/terminal/TerminalButton'
import { TerminalDialog } from '@/components/terminal/TerminalDialog'
import { TeamSection } from '@/components/TeamSection'
import { RetrosSection } from '@/components/RetrosSection'
import { ActionItemsSection } from '@/components/ActionItemsSection'
import { TerminalLoader } from '@/components/terminal/TerminalLoader'
import { TerminalFrame } from '@/components/terminal/TerminalFrame'
import { TerminalSkeleton } from '@/components/terminal/TerminalSkeleton'
import { fetchDashboardSummary, fetchTeams } from '@/lib/api'

export default function DashboardPage() {
  const { user, token, logout } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showTeamPanel, setShowTeamPanel] = useState(false)

  const { data: teams, isLoading: isLoadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchTeams(token!),
    enabled: !!token,
  })

  const hasNoTeams = !isLoadingTeams && !!teams && teams.length === 0

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
    <div>
      {/* Subheader bar */}
      <div
        style={{
          padding: '6px 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: theme.textTertiary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: theme.green }}>~</span>
          <span>{user?.email}</span>
          {teams && teams.length > 0 && (
            <>
              <span style={{ color: theme.border }}>|</span>
              <span style={{ color: theme.cyan }}>{teams[0].name}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TerminalButton size="sm" onClick={() => setShowTeamPanel(true)}>
            team
          </TerminalButton>
          <TerminalButton size="sm" onClick={handleLogout}>
            logout
          </TerminalButton>
        </div>
      </div>

      <div
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '24px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {isLoading && (
          <>
            <TerminalLoader command="retro dashboard --fetch" inline />
            <TerminalFrame title="$ retro list --all">
              <TerminalSkeleton lines={3} widths={[90, 75, 60]} />
            </TerminalFrame>
            <TerminalFrame title="$ retro actions --all">
              <TerminalSkeleton lines={2} widths={[80, 55]} />
            </TerminalFrame>
          </>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              border: `1px solid ${theme.red}`,
              borderRadius: 4,
              borderLeft: `3px solid ${theme.red}`,
            }}
          >
            <p style={{ color: theme.red, fontSize: 12 }}>
              ERR! Failed to load dashboard data
            </p>
          </div>
        )}

        {!isLoading && token && user && (
          <div className="fade-in">
            <RetrosSection
              token={token}
              userId={user.id}
              onMutation={handleMutation}
            />
          </div>
        )}

        {!isLoading && token && summary && (
          <div className="fade-in">
            <ActionItemsSection
              token={token}
              items={summary.recentActionItems}
              onMutation={handleMutation}
            />
          </div>
        )}
      </div>

      {token && user && (
        <TerminalDialog
          open={showTeamPanel || hasNoTeams}
          onClose={() => setShowTeamPanel(false)}
          title={
            hasNoTeams ? 'Welcome — Join or Create a Team' : 'Team Settings'
          }
          dismissable={!hasNoTeams}
        >
          <TeamSection
            token={token}
            userId={user.id}
            onMutation={handleMutation}
          />
        </TerminalDialog>
      )}

      {summary && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: theme.bgSecondary,
            borderTop: `1px solid ${theme.border}`,
            padding: '4px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 11,
            color: theme.textTertiary,
            zIndex: 40,
          }}
        >
          <span>
            members:{' '}
            <span style={{ color: theme.blue, fontWeight: 600 }}>
              {summary.memberCount}
            </span>
          </span>
          <span style={{ color: theme.border }}>│</span>
          <span>
            retros:{' '}
            <span style={{ color: theme.purple, fontWeight: 600 }}>
              {summary.retroCount}
            </span>
          </span>
          <span style={{ color: theme.border }}>│</span>
          <span>
            open:{' '}
            <span style={{ color: theme.yellow, fontWeight: 600 }}>
              {summary.openActionItemCount}
            </span>
          </span>
          <span style={{ color: theme.border }}>│</span>
          <span>
            completed:{' '}
            <span style={{ color: theme.green, fontWeight: 600 }}>
              {summary.completedActionItemCount}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
