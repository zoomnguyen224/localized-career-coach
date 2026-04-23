import { render, screen } from '@testing-library/react'
import { SectionLabel } from '@/components/primitives/SectionLabel'

describe('SectionLabel', () => {
  it('renders number, title, and meta', () => {
    render(<SectionLabel number="01" title="Market Radar" meta="Updated 08:14" />)
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByText('Market Radar')).toBeInTheDocument()
    expect(screen.getByText('Updated 08:14')).toBeInTheDocument()
  })

  it('renders without meta', () => {
    render(<SectionLabel number="02" title="Career Map" />)
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('Career Map')).toBeInTheDocument()
  })
})
