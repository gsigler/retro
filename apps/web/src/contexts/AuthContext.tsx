import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { api, fetchAuthMode, devLogin as apiDevLogin } from '@/lib/api'

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
  authMode: string
  login: () => Promise<void>
  devLogin: (email: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState('google')

  const fetchProfile = useCallback(async () => {
    const profile = await api<User>('/auth/profile')
    return profile
  }, [])

  const login = useCallback(async () => {
    const profile = await fetchProfile()
    setUser(profile)
  }, [fetchProfile])

  const devLoginFn = useCallback(
    async (email: string, name: string) => {
      await apiDevLogin(email, name)
      const profile = await fetchProfile()
      setUser(profile)
    },
    [fetchProfile],
  )

  const logout = useCallback(async () => {
    try {
      await api<{ message: string }>('/auth/logout', { method: 'POST' })
    } catch {
      // Clear local state even if logout request fails
    }
    setUser(null)
  }, [])

  useEffect(() => {
    fetchAuthMode()
      .then((res) => setAuthMode(res.mode))
      .catch(() => setAuthMode('google'))
    fetchProfile()
      .then(setUser)
      .catch(() => {
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [fetchProfile])

  const value = useMemo(
    () => ({ user, isLoading, authMode, login, devLogin: devLoginFn, logout }),
    [user, isLoading, authMode, login, devLoginFn, logout],
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
