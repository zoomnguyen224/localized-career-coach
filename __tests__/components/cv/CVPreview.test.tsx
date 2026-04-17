/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { CVPreview } from '@/components/cv/CVPreview'

const noop = async () => {}

describe('CVPreview URL pre-fill', () => {
  it('shows form when initialJobTitle is provided', () => {
    render(
      <CVPreview
        masterCvMarkdown="# Test"
        activeCV={null}
        onGenerate={noop}
        isGenerating={false}
        initialJobTitle="AI Engineer"
        initialCompany="NEOM"
      />
    )
    // The form is shown (showForm = true because initialJobTitle is set)
    expect(screen.getByPlaceholderText('Job title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Company')).toBeInTheDocument()
  })

  it('pre-fills jobTitle and company inputs', () => {
    render(
      <CVPreview
        masterCvMarkdown="# Test"
        activeCV={null}
        onGenerate={noop}
        isGenerating={false}
        initialJobTitle="AI Engineer"
        initialCompany="NEOM"
      />
    )
    expect(screen.getByDisplayValue('AI Engineer')).toBeInTheDocument()
    expect(screen.getByDisplayValue('NEOM')).toBeInTheDocument()
  })

  it('does not show form when no initialJobTitle', () => {
    render(
      <CVPreview
        masterCvMarkdown="# Test"
        activeCV={null}
        onGenerate={noop}
        isGenerating={false}
      />
    )
    expect(screen.queryByPlaceholderText('Job title')).not.toBeInTheDocument()
  })
})
