import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

type Status = 'loading' | 'error'

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      return
    }

    login(token)
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => setStatus('error'))
  }, [searchParams, login, navigate])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Authentication failed</h1>
          <p className="mb-4 text-muted-foreground">
            Something went wrong during sign in.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Try again
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
