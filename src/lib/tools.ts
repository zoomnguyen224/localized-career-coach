import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { MENA_ROLES, EXPERT_NETWORK, CAREER_INSIGHTS, MENA_JOB_LISTINGS, INTERVIEW_QUESTIONS, SALARY_BENCHMARKS } from './mock-data'
import type { SkillGap, SkillGapResult, LearningPathResult, ExpertMatchResult, LearningPhase, ParsedResumeResult, CurrentSkill, JobMarketScanResult, JobMatch, InterviewQuestion, InterviewEvaluation, SalaryBenchmarkResult, SalaryRange, CertificationPremium, UserProfile } from '@/types'

function findBestRole(targetRole: string) {
  const lower = targetRole.toLowerCase()
  const scored = MENA_ROLES.map(role => {
    const titleMatch = role.title.toLowerCase().includes(lower) ||
      lower.includes(role.title.toLowerCase().split(' ')[0])
    const companyMatch = role.company.toLowerCase().includes(lower)
    const keywordScore = ['ai', 'ml', 'machine learning', 'data', 'cloud', 'product', 'security', 'ux', 'fintech', 'software']
      .filter(kw => lower.includes(kw) && role.title.toLowerCase().includes(kw)).length
    return { role, score: (titleMatch ? 10 : 0) + (companyMatch ? 5 : 0) + keywordScore * 3 }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].role
}

function computeSeverity(currentLevel: number, requiredLevel: number): SkillGap['severity'] {
  const gap = requiredLevel - currentLevel
  if (gap >= 4) return 'high'
  if (gap >= 2) return 'medium'
  return 'low'
}

function getRecommendedAction(skill: string, severity: SkillGap['severity']): string {
  const actions: Record<string, string> = {
    'Python': 'Complete Python for Data Science course on Localized',
    'SQL': 'Practice with real datasets using Mode Analytics free tier',
    'AWS': 'Pursue AWS Cloud Practitioner certification (40 hours)',
    'Machine Learning': "Take Andrew Ng's ML Specialization on Coursera",
    'Deep Learning': 'Complete fast.ai Practical Deep Learning course',
    'Agile/Scrum': 'Get Scrum Master certification via Scrum.org',
    'Stakeholder Management': 'Practice with real projects, join PM communities in GCC',
    'Business Strategy': 'Complete HBX CORe program (business fundamentals)',
    'Figma': 'Complete Figma Design Fundamentals course (free)',
    'Arabic Business Communication': 'Practice business Arabic writing with native speakers',
  }
  return actions[skill] ?? `Study ${skill} via Localized learning modules (${severity === 'high' ? '60+' : severity === 'medium' ? '30-60' : '10-30'} hours)`
}

export const skillGapAnalysisTool = tool(
  async ({ studentSkills, targetRole }): Promise<SkillGapResult> => {
    const role = findBestRole(targetRole)
    const skillMap = new Map(studentSkills.map((s: { name: string; currentLevel: number }) => [s.name.toLowerCase(), s.currentLevel]))

    const gaps: SkillGap[] = role.requiredSkills.map(req => {
      const currentLevel = skillMap.get(req.name.toLowerCase()) ?? 0
      const gap = Math.max(0, req.level - currentLevel)
      const severity = computeSeverity(currentLevel, req.level)
      return { skill: req.name, category: req.category, currentLevel, requiredLevel: req.level, gap, severity, recommendedAction: getRecommendedAction(req.name, severity) }
    })

    gaps.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))

    const totalRequired = role.requiredSkills.reduce((sum, s) => sum + s.level, 0)
    const totalCurrent = role.requiredSkills.reduce((sum, s) => sum + Math.min(skillMap.get(s.name.toLowerCase()) ?? 0, s.level), 0)
    const overallReadiness = Math.round((totalCurrent / totalRequired) * 100)

    return { role, gaps, overallReadiness }
  },
  {
    name: 'skill_gap_analysis',
    description: "Analyze a student's current skills against a target MENA role.",
    schema: z.object({
      studentSkills: z.array(z.object({ name: z.string(), currentLevel: z.number().min(0).max(10) })),
      targetRole: z.string(),
    }),
  }
)

const LEARNING_RESOURCES: Record<string, Array<{ name: string; type: 'localized' | 'external'; provider: string; estimatedHours: number }>> = {
  'Python': [
    { name: 'Python for Data Professionals', type: 'localized', provider: 'Localized', estimatedHours: 20 },
    { name: 'Python for Everybody', type: 'external', provider: 'Coursera / University of Michigan', estimatedHours: 30 },
  ],
  'Machine Learning': [
    { name: 'ML Foundations for MENA Professionals', type: 'localized', provider: 'Localized', estimatedHours: 25 },
    { name: 'Machine Learning Specialization', type: 'external', provider: 'Coursera / Andrew Ng', estimatedHours: 60 },
  ],
  'AWS': [
    { name: 'Cloud Fundamentals for GCC', type: 'localized', provider: 'Localized', estimatedHours: 15 },
    { name: 'AWS Cloud Practitioner', type: 'external', provider: 'AWS Training', estimatedHours: 40 },
  ],
  'SQL': [
    { name: 'SQL for Data Analysis', type: 'localized', provider: 'Localized', estimatedHours: 12 },
    { name: 'SQL for Data Science', type: 'external', provider: 'Coursera / UC Davis', estimatedHours: 20 },
  ],
  'Deep Learning': [
    { name: 'Deep Learning for AI Applications', type: 'localized', provider: 'Localized', estimatedHours: 30 },
    { name: 'Deep Learning Specialization', type: 'external', provider: 'Coursera / deeplearning.ai', estimatedHours: 80 },
  ],
  'Agile/Scrum': [
    { name: 'Agile Project Management', type: 'localized', provider: 'Localized', estimatedHours: 10 },
    { name: 'Professional Scrum Master', type: 'external', provider: 'Scrum.org', estimatedHours: 16 },
  ],
  'default': [
    { name: 'Professional Skills Bootcamp', type: 'localized', provider: 'Localized', estimatedHours: 20 },
    { name: 'LinkedIn Learning Path', type: 'external', provider: 'LinkedIn Learning', estimatedHours: 15 },
  ],
}

export const learningPathTool = tool(
  async ({ targetRole, topGaps }): Promise<LearningPathResult> => {
    const phases: LearningPhase[] = [
      {
        phase: 1, title: 'Foundations', duration: 'Months 1-2',
        skills: topGaps.slice(0, 2).length > 0 ? topGaps.slice(0, 2) : ['Core Fundamentals'],
        resources: topGaps.slice(0, 2).flatMap(s => (LEARNING_RESOURCES[s] ?? LEARNING_RESOURCES['default']).slice(0, 1)),
      },
      {
        phase: 2, title: 'Applied Skills', duration: 'Months 3-4',
        skills: topGaps.slice(2, 4).length > 0 ? topGaps.slice(2, 4) : ['Applied Practice'],
        resources: topGaps.slice(2, 4).flatMap(s => (LEARNING_RESOURCES[s] ?? LEARNING_RESOURCES['default']).slice(0, 1)),
      },
      {
        phase: 3, title: 'Specialization & Certification', duration: 'Months 5-6',
        skills: topGaps.slice(0, 3).length > 0 ? topGaps.slice(0, 3) : ['Certification'],
        resources: topGaps.slice(0, 2).flatMap(s => (LEARNING_RESOURCES[s] ?? LEARNING_RESOURCES['default']).slice(1, 2)),
      },
    ]
    phases.forEach(phase => { if (phase.resources.length === 0) phase.resources = LEARNING_RESOURCES['default'] })
    return { targetRole, phases, totalDuration: '6 months' }
  },
  {
    name: 'learning_path',
    description: 'Generate a personalized 3-phase learning roadmap for a MENA career goal.',
    schema: z.object({ targetRole: z.string(), topGaps: z.array(z.string()) }),
  }
)

function scoreExpert(expert: typeof EXPERT_NETWORK[0], targetRole: string, context: string): number {
  let score = 0
  const lower = context.toLowerCase()
  expert.industries.forEach(ind => { if (lower.includes(ind.toLowerCase())) score += 20 })
  if (lower.includes(expert.specialization.toLowerCase().split(' ')[0])) score += 15
  if (lower.includes(expert.company.toLowerCase())) score += 30
  if (lower.includes(expert.location.toLowerCase())) score += 10
  expert.title.toLowerCase().split(' ').forEach(w => { if (w.length > 3 && lower.includes(w)) score += 10 })
  return Math.min(score, 100)
}

export const expertMatchTool = tool(
  async ({ targetRole, careerGoal, location }): Promise<ExpertMatchResult> => {
    const context = [targetRole, careerGoal, location ?? ''].join(' ')
    const scored = EXPERT_NETWORK.map(expert => ({
      ...expert,
      matchScore: scoreExpert(expert, targetRole, context),
      matchReason: `Specializes in ${expert.specialization}, directly relevant to your goal of becoming a ${targetRole} in the ${expert.industries[0]} sector.`,
    })).sort((a, b) => b.matchScore - a.matchScore)
    if (scored[0].matchScore < 70) scored[0].matchScore = 75
    return { experts: scored.slice(0, 3) }
  },
  {
    name: 'expert_match',
    description: 'Find matching mentors from the Localized expert network.',
    schema: z.object({ targetRole: z.string(), careerGoal: z.string(), location: z.string().optional() }),
  }
)

export const careerInsightTool = tool(
  async ({ topic, location }): Promise<typeof CAREER_INSIGHTS[0]> => {
    const lower = `${topic} ${location ?? ''}`.toLowerCase()
    return CAREER_INSIGHTS.find(i => i.topics.some(t => lower.includes(t)) || (location && i.location.toLowerCase().includes(location.toLowerCase()))) ?? CAREER_INSIGHTS[0]
  },
  {
    name: 'career_insight',
    description: 'Surface a relevant MENA career market statistic.',
    schema: z.object({ topic: z.string(), location: z.string().optional() }),
  }
)

export const updateProfileTool = tool(
  async (profile) => profile,
  {
    name: 'update_profile',
    description: "Update the student's profile with newly learned information.",
    schema: z.object({
      name: z.string().optional(),
      location: z.string().optional(),
      background: z.string().optional(),
      targetRole: z.string().optional(),
      currentLevel: z.enum(['student', 'junior', 'mid', 'senior']).optional(),
    }),
  }
)

export const allTools = [skillGapAnalysisTool, learningPathTool, expertMatchTool, careerInsightTool, updateProfileTool]
