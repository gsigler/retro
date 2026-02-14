import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, beforeEach } from 'vitest'
import LoginPage from './LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders sign-in page with Google button', () => {
    renderLoginPage()
    expect(screen.getByText(/sign in to retro/i)).toBeDefined()
    expect(
      screen.getByRole('button', { name: /sign in with google/i }),
    ).toBeDefined()
  })

  it('links to the Google OAuth endpoint', () => {
    renderLoginPage()
    const link = screen.getByRole('link', { name: /sign in with google/i })
    expect(link.getAttribute('href')).toBe('http://localhost:3000/auth/google')
  })

  it('has a link back to home', () => {
    renderLoginPage()
    const link = screen.getByText('Back to home')
    expect(link.getAttribute('href')).toBe('/')
  })
})
