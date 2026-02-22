import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { TerminalLoader } from '@/components/terminal/TerminalLoader'

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return <TerminalLoader command="retro session --verify" />
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
