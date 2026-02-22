# Web Source Files

All files under `apps/web/src/`. These are generic scaffolds — not domain-specific. The pages use shadcn/ui + Tailwind CSS classes.

---

## src/index.css

```css
@import 'tailwindcss';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 0 0% 9%;
    --primary-foreground: 0 0% 98%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 0 0% 3.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 98%;
    --card: 0 0% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 0 0% 9%;
    --secondary: 0 0% 14.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 14.9%;
    --muted-foreground: 0 0% 63.9%;
    --accent: 0 0% 14.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 14.9%;
    --input: 0 0% 14.9%;
    --ring: 0 0% 83.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## src/lib/utils.ts

shadcn/ui utility for merging Tailwind classes:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## src/lib/api.ts

Typed fetch wrapper:

```typescript
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers, ...rest } = options ?? {}
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

export function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}
```

---

## src/main.tsx

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
  })
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
```

---

## src/App.tsx

```typescript
import { Route, Routes } from 'react-router'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import AuthCallbackPage from '@/pages/AuthCallbackPage'
import DashboardPage from '@/pages/DashboardPage'
import ProtectedRoute from '@/components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
```

---

## src/contexts/AuthContext.tsx

```typescript
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
  token: string | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'auth_token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const [isLoading, setIsLoading] = useState(
    () => !!localStorage.getItem(TOKEN_KEY),
  )

  const fetchProfile = useCallback(async (jwt: string) => {
    const profile = await api<User>('/auth/profile', {
      headers: { Authorization: `Bearer ${jwt}` },
    })
    return profile
  }, [])

  const login = useCallback(
    async (newToken: string) => {
      localStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      const profile = await fetchProfile(newToken)
      setUser(profile)
    },
    [fetchProfile],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchProfile(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [fetchProfile, token])

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
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
```

---

## src/components/ProtectedRoute.tsx

```typescript
import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

---

## src/components/ui/button.tsx

shadcn/ui Button component (pre-installed so developers don't need to run `npx shadcn add button`):

```typescript
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

---

## src/pages/LandingPage.tsx

```typescript
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="max-w-lg text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Welcome
        </h1>
        <p className="mb-8 text-lg text-muted-foreground">
          Get started by signing in with your Google account.
        </p>
        <Button asChild size="lg">
          <Link to="/login">Get Started</Link>
        </Button>
      </div>
    </div>
  )
}
```

---

## src/pages/LoginPage.tsx

```typescript
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your Google account to continue
          </p>
        </div>

        <Button asChild className="w-full" size="lg">
          <a href={`${apiUrl}/auth/google`}>Sign in with Google</a>
        </Button>

        <p className="text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
```

---

## src/pages/AuthCallbackPage.tsx

```typescript
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-destructive">
            Authentication failed
          </h1>
          <p className="mb-4 text-sm text-muted-foreground">
            Something went wrong during sign in.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Try again
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing you in...</p>
    </div>
  )
}
```

---

## src/pages/DashboardPage.tsx

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-bold">
        Welcome{user?.name ? `, ${user.name}` : ''}
      </h1>
      <p className="text-muted-foreground">{user?.email}</p>
      <Button variant="outline" onClick={logout}>
        Sign out
      </Button>
    </div>
  )
}
```

---

## Test files

### src/App.test.tsx

```typescript
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'

function renderApp(route = '/') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('renders the landing page', () => {
    renderApp('/')
    expect(screen.getByText('Welcome')).toBeInTheDocument()
  })
})
```

Note: The `AuthProvider` is intentionally omitted from the test wrapper because the landing page does not require auth. For pages that need auth context, wrap them with `<AuthProvider>` in the test or mock the `useAuth` hook.
