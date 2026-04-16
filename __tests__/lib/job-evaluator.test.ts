import { buildEvaluationPrompt, parseEvaluationResponse } from '@/lib/agents/job-evaluator'

describe('buildEvaluationPrompt', () => {
  it('includes CV content in the prompt', () => {
    const prompt = buildEvaluationPrompt({
      jobTitle: 'AI Engineer',
      jobDescription: 'Build LLM pipelines...',
      company: 'STC',
      cvMarkdown: '# Ahmed Nasser\nSenior AI Engineer with LLM experience',
    })
    expect(prompt).toContain('Ahmed Nasser')
    expect(prompt).toContain('STC')
    expect(prompt).toContain('LLM pipelines')
  })

  it('includes MENA market context', () => {
    const prompt = buildEvaluationPrompt({
      jobTitle: 'AI Engineer',
      jobDescription: 'Build LLM pipelines...',
      company: 'STC',
      cvMarkdown: '# Test CV',
    })
    expect(prompt).toContain('MENA')
  })
})

describe('parseEvaluationResponse', () => {
  it('parses a well-formed JSON block from Claude response', () => {
    const response = `
Some analysis text here.

\`\`\`json
{
  "overall": 4.5,
  "cvMatch": 4.8,
  "roleAlignment": 4.6,
  "compensation": 4.2,
  "culturalSignals": 4.0,
  "redFlags": null,
  "recommendation": "Strong match — recommend applying immediately",
  "archetype": "LLMOps",
  "skillsMatch": [
    { "skill": "LLM / RAG", "status": "strong", "note": "3 projects in CV" },
    { "skill": "MLOps", "status": "partial", "note": "Adjacent experience" }
  ]
}
\`\`\`
`
    const result = parseEvaluationResponse(response)
    expect(result.overall).toBe(4.5)
    expect(result.cvMatch).toBe(4.8)
    expect(result.redFlags).toBeNull()
    expect(result.skillsMatch).toHaveLength(2)
    expect(result.skillsMatch[0].status).toBe('strong')
  })

  it('returns fallback score on unparseable response', () => {
    const result = parseEvaluationResponse('This is not valid JSON at all')
    expect(result.overall).toBe(3.0)
    expect(result.recommendation).toContain('manually review')
  })
})
