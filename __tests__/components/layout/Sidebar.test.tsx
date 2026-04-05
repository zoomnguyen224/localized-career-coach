import { render, screen } from '@testing-library/react'
import Sidebar from '@/components/layout/Sidebar'
import { UserProfile } from '@/types'

describe('Sidebar', () => {
  it('shows em dash for empty profile fields', () => {
    const emptyProfile: UserProfile = {}
    render(<Sidebar profile={emptyProfile} />)
    const emDashes = screen.getAllByText('—')
    expect(emDashes.length).toBeGreaterThanOrEqual(5)
  })

  it('shows profile data when populated', () => {
    const profile: UserProfile = {
      name: 'Sara Al-Rashidi',
      location: 'Dubai, UAE',
      background: 'Software Engineering',
      targetRole: 'Product Manager',
      currentLevel: 'mid',
    }
    render(<Sidebar profile={profile} />)
    expect(screen.getByText('Sara Al-Rashidi')).toBeInTheDocument()
    expect(screen.getByText('Dubai, UAE')).toBeInTheDocument()
    expect(screen.getByText('Software Engineering')).toBeInTheDocument()
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText('mid')).toBeInTheDocument()
  })

  it('shows "Session memory active" notice', () => {
    render(<Sidebar profile={{}} />)
    expect(screen.getByText(/Session memory active/i)).toBeInTheDocument()
  })

  it('shows "Resets on page refresh" text', () => {
    render(<Sidebar profile={{}} />)
    expect(screen.getByText(/Resets on page refresh/i)).toBeInTheDocument()
  })
})
