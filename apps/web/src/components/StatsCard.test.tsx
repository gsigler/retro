import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Users } from 'lucide-react'
import { StatsCard } from './StatsCard'

describe('StatsCard', () => {
  it('renders icon, label, and count', () => {
    render(<StatsCard icon={Users} label="Team Members" value={42} />)
    expect(screen.getByText('Team Members')).toBeDefined()
    expect(screen.getByText('42')).toBeDefined()
  })

  it('renders zero value', () => {
    render(<StatsCard icon={Users} label="Empty" value={0} />)
    expect(screen.getByText('0')).toBeDefined()
  })
})
