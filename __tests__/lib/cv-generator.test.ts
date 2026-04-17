// __tests__/lib/cv-generator.test.ts
import { buildCVPrompt, parseCVGenerationResponse } from '@/lib/agents/cv-generator'

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

  it('requests JSON output with required fields', () => {
    const prompt = buildCVPrompt({
      cvMarkdown: '# Test',
      jobTitle: 'Test Role',
      jobDescription: 'Test JD',
      company: 'Test Co',
    })
    expect(prompt).toContain('"html"')
    expect(prompt).toContain('"keywords"')
    expect(prompt).toContain('"atsScore"')
    expect(prompt).toContain('"keywordsInjected"')
  })
})

describe('parseCVGenerationResponse', () => {
  it('parses a well-formed JSON block', () => {
    const response = `
\`\`\`json
{
  "keywords": ["LLM", "RAG", "Python", "LangChain"],
  "keywordsInjected": 4,
  "atsScore": 87,
  "html": "<html><body><h1>Ahmed Nasser</h1></body></html>"
}
\`\`\`
`
    const result = parseCVGenerationResponse(response)
    expect(result.keywords).toEqual(['LLM', 'RAG', 'Python', 'LangChain'])
    expect(result.keywordsInjected).toBe(4)
    expect(result.atsScore).toBe(87)
    expect(result.html).toContain('Ahmed Nasser')
  })

  it('clamps atsScore to 0–100', () => {
    const response = '```json\n{"keywords":[],"keywordsInjected":0,"atsScore":150,"html":""}\n```'
    const result = parseCVGenerationResponse(response)
    expect(result.atsScore).toBe(100)
  })

  it('returns empty result on invalid JSON', () => {
    const result = parseCVGenerationResponse('not valid json at all')
    expect(result.keywords).toEqual([])
    expect(result.atsScore).toBe(0)
    expect(result.html).toBe('')
  })
})
