import { render, screen } from '@testing-library/react'
import { DataRow } from '@/components/primitives/DataRow'

describe('DataRow', () => {
  it('renders title, sub, and tail text', () => {
    render(
      <DataRow
        logo="NB"
        title="Jr. Data Engineer · Northbay"
        sub="Dhahran / Remote · 2d ago"
        tail={{ text: '68%', tone: 'down' }}
      />,
    )
    expect(screen.getByText('Jr. Data Engineer · Northbay')).toBeInTheDocument()
    expect(screen.getByText('Dhahran / Remote · 2d ago')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
    expect(screen.getByText('NB')).toBeInTheDocument()
  })

  it('renders as a link when href is provided', () => {
    render(
      <DataRow
        href="/jobs/123"
        logo="NB"
        title="Jr. Data Engineer"
        sub="Remote"
        tail={{ text: '68%', tone: 'down' }}
      />,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/jobs/123')
  })
})
