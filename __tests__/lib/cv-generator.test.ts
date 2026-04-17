// __tests__/lib/cv-generator.test.ts
import { buildCVPrompt, parseCVGenerationResponse, applyTemplatePlaceholders } from '@/lib/agents/cv-generator'

describe('buildCVPrompt', () => {
  it('includes CV markdown, job details, and company in the prompt', () => {
    const prompt = buildCVPrompt({
      cvMarkdown: '# Ahmed Nasser\nSenior AI Engineer',
      jobTitle: 'LLM Engineer',
      jobDescription: 'Build RAG pipelines and LLM systems',
      company: 'STC',
    })
    expect(prompt).toContain('Ahmed Nasser')
    expect(prompt).toContain('STC')
    expect(prompt).toContain('RAG pipelines')
    expect(prompt).toContain('LLM Engineer')
  })

  it('requests JSON output with placeholders, keywords, atsScore, keywordsInjected', () => {
    const prompt = buildCVPrompt({
      cvMarkdown: '# Test',
      jobTitle: 'Test Role',
      jobDescription: 'Test JD',
      company: 'Test Co',
    })
    expect(prompt).toContain('"placeholders"')
    expect(prompt).toContain('"keywords"')
    expect(prompt).toContain('"atsScore"')
    expect(prompt).toContain('"keywordsInjected"')
  })
})

describe('parseCVGenerationResponse', () => {
  it('parses a well-formed JSON block with placeholders', () => {
    const response = `
\`\`\`json
{
  "placeholders": {
    "NAME": "Ahmed Nasser",
    "TAGLINE": "Senior AI Engineer | Dubai, UAE",
    "SUMMARY_TEXT": "Experienced AI Engineer with RAG expertise"
  },
  "keywords": ["LLM", "RAG", "Python", "LangChain"],
  "keywordsInjected": 4,
  "atsScore": 87
}
\`\`\`
`
    const result = parseCVGenerationResponse(response)
    expect(result.placeholders['NAME']).toBe('Ahmed Nasser')
    expect(result.placeholders['TAGLINE']).toBe('Senior AI Engineer | Dubai, UAE')
    expect(result.keywords).toEqual(['LLM', 'RAG', 'Python', 'LangChain'])
    expect(result.keywordsInjected).toBe(4)
    expect(result.atsScore).toBe(87)
  })

  it('clamps atsScore to 0–100', () => {
    const response = '```json\n{"placeholders":{},"keywords":[],"keywordsInjected":0,"atsScore":150}\n```'
    const result = parseCVGenerationResponse(response)
    expect(result.atsScore).toBe(100)
  })

  it('returns empty result on invalid JSON', () => {
    const result = parseCVGenerationResponse('not valid json at all')
    expect(result.placeholders).toEqual({})
    expect(result.keywords).toEqual([])
    expect(result.atsScore).toBe(0)
  })
})

describe('applyTemplatePlaceholders', () => {
  it('replaces all {{PLACEHOLDER}} tokens with provided values', () => {
    const template = '<h1>{{NAME}}</h1><p>{{TAGLINE}}</p>'
    const result = applyTemplatePlaceholders(template, {
      NAME: 'Ahmed Nasser',
      TAGLINE: 'Senior AI Engineer',
    })
    expect(result).toBe('<h1>Ahmed Nasser</h1><p>Senior AI Engineer</p>')
  })

  it('replaces multiple occurrences of the same placeholder', () => {
    const template = '{{NAME}} — {{NAME}}'
    const result = applyTemplatePlaceholders(template, { NAME: 'Ahmed' })
    expect(result).toBe('Ahmed — Ahmed')
  })

  it('leaves unreplaced placeholders unchanged when key is missing', () => {
    const template = '<h1>{{NAME}}</h1><p>{{MISSING}}</p>'
    const result = applyTemplatePlaceholders(template, { NAME: 'Ahmed' })
    expect(result).toContain('Ahmed')
    expect(result).toContain('{{MISSING}}')
  })
})
