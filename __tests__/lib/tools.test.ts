/**
 * @jest-environment node
 */
jest.mock('@/lib/vector-store')

import { skillGapAnalysisTool, learningPathTool, expertMatchTool, careerInsightTool, updateProfileTool, createSearchResumeTool } from '@/lib/tools'
import * as vectorStore from '@/lib/vector-store'

describe('skillGapAnalysisTool', () => {
  it('matches AI/ML Engineer at NEOM for ML target role', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [{ name: 'Python', currentLevel: 4 }],
      targetRole: 'AI/ML Engineer',
    })
    expect(result.role.company).toBe('NEOM')
    expect(result.gaps).toBeInstanceOf(Array)
    expect(result.gaps.length).toBeGreaterThan(0)
    expect(result.overallReadiness).toBeGreaterThanOrEqual(0)
    expect(result.overallReadiness).toBeLessThanOrEqual(100)
  })

  it('computes severity: high if gap >= 4', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [{ name: 'Python', currentLevel: 2 }],
      targetRole: 'AI ML',
    })
    const python = result.gaps.find((g: { skill: string }) => g.skill === 'Python')
    expect(python?.severity).toBe('high')
  })

  it('handles unknown role by matching closest role', async () => {
    const result = await skillGapAnalysisTool.invoke({
      studentSkills: [],
      targetRole: 'data science',
    })
    expect(result.role).toBeDefined()
    expect(result.gaps.length).toBeGreaterThan(0)
  })
})

describe('learningPathTool', () => {
  it('returns 3 phases with skills and resources', async () => {
    const result = await learningPathTool.invoke({
      targetRole: 'Cloud Engineer',
      topGaps: ['AWS', 'Terraform', 'Linux'],
    })
    expect(result.phases).toHaveLength(3)
    result.phases.forEach((phase: { skills: string[]; resources: unknown[] }) => {
      expect(phase.skills.length).toBeGreaterThan(0)
      expect(phase.resources.length).toBeGreaterThan(0)
    })
    expect(result.totalDuration).toBeTruthy()
  })

  it('includes mix of localized and external resources', async () => {
    const result = await learningPathTool.invoke({
      targetRole: 'Cloud Engineer',
      topGaps: ['AWS'],
    })
    const allResources = result.phases.flatMap((p: { resources: Array<{ type: string }> }) => p.resources)
    const types = allResources.map((r: { type: string }) => r.type)
    expect(types).toContain('localized')
    expect(types).toContain('external')
  })
})

describe('expertMatchTool', () => {
  it('returns up to 3 experts with matchScore and matchReason', async () => {
    const result = await expertMatchTool.invoke({
      targetRole: 'Data Analyst',
      careerGoal: 'Work in data analytics at an oil company in Saudi Arabia',
    })
    expect(result.experts.length).toBeGreaterThanOrEqual(1)
    expect(result.experts.length).toBeLessThanOrEqual(3)
    result.experts.forEach((e: { matchScore: number; matchReason: string }) => {
      expect(e.matchScore).toBeGreaterThanOrEqual(0)
      expect(e.matchScore).toBeLessThanOrEqual(100)
      expect(e.matchReason).toBeTruthy()
    })
  })

  it('ranks Fatima Al-Rashidi highly for data/aramco goal', async () => {
    const result = await expertMatchTool.invoke({
      targetRole: 'Data Analyst',
      careerGoal: 'Data science at Saudi Aramco',
    })
    expect(result.experts[0].name).toBe('Fatima Al-Rashidi')
  })
})

describe('careerInsightTool', () => {
  it('returns an insight for python topic', async () => {
    const result = await careerInsightTool.invoke({ topic: 'python' })
    expect(result.stat).toBeTruthy()
    expect(result.source).toBeTruthy()
  })

  it('returns fallback for unknown topic', async () => {
    const result = await careerInsightTool.invoke({ topic: 'completely unknown xyz' })
    expect(result.stat).toBeTruthy()
  })
})

describe('updateProfileTool', () => {
  it('returns the same fields passed in', async () => {
    const result = await updateProfileTool.invoke({ name: 'Ahmed', location: 'Riyadh', targetRole: 'AI/ML Engineer' })
    expect(result.name).toBe('Ahmed')
    expect(result.location).toBe('Riyadh')
    expect(result.targetRole).toBe('AI/ML Engineer')
  })
})

describe('createSearchResumeTool', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns no-context message when no store exists', async () => {
    jest.spyOn(vectorStore, 'getVectorStore').mockReturnValue(undefined)
    const searchTool = createSearchResumeTool('thread-1')
    const result = await searchTool.invoke({ query: 'certifications' })
    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    expect(parsed.message).toBe('No CV context loaded')
  })

  it('returns chunks from vector store', async () => {
    const mockStore = {
      similaritySearch: jest.fn().mockResolvedValue([
        { pageContent: 'AWS Certified Solutions Architect' },
        { pageContent: 'GCP Professional Data Engineer' },
      ]),
    }
    jest.spyOn(vectorStore, 'getVectorStore').mockReturnValue(mockStore as any)
    const searchTool = createSearchResumeTool('thread-2')
    const result = await searchTool.invoke({ query: 'cloud certifications' })
    const parsed = typeof result === 'string' ? JSON.parse(result) : result
    expect(parsed.source).toBe('cv')
    expect(parsed.chunks).toContain('AWS Certified Solutions Architect')
  })
})
