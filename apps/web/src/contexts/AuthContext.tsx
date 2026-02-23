import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    const profile = await api<User>('/auth/profile')
    return profile
  }, [])

  const login = useCallback(async () => {
    const profile = await fetchProfile()
    setUser(profile)
  }, [fetchProfile])

  const logout = useCallback(async () => {
    try {
      await api<{ message: string }>('/auth/logout', { method: 'POST' })
    } catch {
      // Clear local state even if logout request fails
    }
    setUser(null)
  }, [])

  useEffect(() => {
    fetchProfile()
      .then(setUser)
      .catch(() => {
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [fetchProfile])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
