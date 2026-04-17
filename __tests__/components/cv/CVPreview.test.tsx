/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('retains jobTitle and company after successful submission', async () => {
    const mockGenerate = jest.fn().mockResolvedValue(undefined)
    render(
      <CVPreview
        masterCvMarkdown="# Test"
        activeCV={null}
        onGenerate={mockGenerate}
        isGenerating={false}
        initialJobTitle="AI Engineer"
        initialCompany="NEOM"
      />
    )

    // Fill in job description
    const textarea = screen.getByPlaceholderText('Paste job description here...')
    await userEvent.type(textarea, 'Some job description')

    // Submit
    const submitBtn = screen.getByRole('button', { name: /generate with agent/i })
    await userEvent.click(submitBtn)

    // Wait for generate to be called
    expect(mockGenerate).toHaveBeenCalledWith('AI Engineer', 'NEOM', 'Some job description')
  })
})
