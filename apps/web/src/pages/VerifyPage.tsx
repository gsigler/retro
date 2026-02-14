import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

type Status = 'verifying' | 'error'

export default function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState<Status>('verifying')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      return
    }

    api<{ accessToken: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async (data) => {
        await login(data.accessToken)
        navigate('/dashboard', { replace: true })
      })
      .catch(() => {
        setStatus('error')
      })
  }, [searchParams, login, navigate])

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold">Invalid or expired link</h1>
          <p className="mb-4 text-muted-foreground">
            This magic link is no longer valid.
          </p>
          <Link to="/login" className="text-primary hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-muted-foreground">Verifying your magic link...</p>
      </div>
    </div>
  )
}
