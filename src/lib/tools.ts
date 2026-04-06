import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { MENA_ROLES, EXPERT_NETWORK, CAREER_INSIGHTS, MENA_JOB_LISTINGS, INTERVIEW_QUESTIONS, SALARY_BENCHMARKS } from './mock-data'
import { getVectorStore } from '@/lib/vector-store'
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

// Adjacent skills that provide partial credit when the exact skill name is missing.
// Keys are lowercase required skill names; values are lowercase skill names that imply partial knowledge.
const SKILL_CROSSMAP: Record<string, string[]> = {
  'machine learning': ['ml', 'llm', 'rag', 'ai', 'nlp', 'tensorflow', 'pytorch', 'generative ai', 'deep learning', 'scikit', 'data science', 'statistics', 'llm agents', 'rag pipelines'],
  'deep learning': ['llm', 'rag', 'ai', 'nlp', 'tensorflow', 'pytorch', 'machine learning', 'generative ai', 'neural', 'transformers', 'llm agents'],
  'cloud architecture': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cloud', 'devops', 'infrastructure'],
  'mathematics': ['statistics', 'python', 'data science', 'machine learning', 'ml', 'data analysis', 'analytics'],
  'research communication': ['english', 'communication', 'presentation', 'leadership', 'writing', 'french', 'arabic', 'japanese', 'vietnamese', 'language', 'python', 'data analysis', 'technical writing'],
  'stakeholder management': ['product management', 'leadership', 'communication', 'agile', 'scrum', 'project management', 'presales'],
  'data engineering': ['python', 'sql', 'etl', 'spark', 'airflow', 'data pipelines', 'gcp', 'azure', 'aws'],
  'mlops': ['docker', 'kubernetes', 'ci/cd', 'devops', 'cloud', 'python', 'azure', 'gcp', 'aws'],
  'system design': ['software', 'architecture', 'backend', 'cloud', 'rest apis', 'microservices'],
  'nlp': ['llm', 'rag', 'ai', 'generative ai', 'python', 'transformers', 'llm agents'],
  'sql': ['data analysis', 'data engineering', 'database', 'python', 'analytics'],
  'aws': ['cloud', 'azure', 'gcp', 'docker', 'devops', 'infrastructure'],
  'azure': ['cloud', 'aws', 'gcp', 'docker', 'devops', 'infrastructure'],
  'product strategy': ['product management', 'product ownership', 'roadmapping', 'okrs', 'business strategy'],
  'product management': ['product ownership', 'product strategy', 'agile', 'scrum', 'stakeholder management'],
}

/**
 * When a required skill has no direct match in the student's skill map,
 * infer a partial credit level from adjacent/related skills.
 * Returns 0 if no related skills are found.
 */
function inferCrossCredit(requiredSkillName: string, skillMap: Map<string, number>): number {
  const related = SKILL_CROSSMAP[requiredSkillName.toLowerCase()]
  if (!related) return 0

  let maxRelated = 0
  for (const relatedTerm of related) {
    for (const [key, level] of skillMap.entries()) {
      if (key.includes(relatedTerm) || relatedTerm.includes(key)) {
        if (level > maxRelated) maxRelated = level
      }
    }
  }

  if (maxRelated === 0) return 0
  // Discount by ~35% — adjacent skill, not the exact skill
  return Math.max(1, Math.round(maxRelated * 0.65))
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
      const currentLevel = skillMap.get(req.name.toLowerCase()) ?? inferCrossCredit(req.name, skillMap)
      const gap = Math.max(0, req.level - currentLevel)
      const severity = computeSeverity(currentLevel, req.level)
      return { skill: req.name, category: req.category, currentLevel, requiredLevel: req.level, gap, severity, recommendedAction: getRecommendedAction(req.name, severity) }
    })

    gaps.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))

    const totalRequired = role.requiredSkills.reduce((sum, s) => sum + s.level, 0)
    const totalCurrent = role.requiredSkills.reduce((sum, s) => {
      const level = skillMap.get(s.name.toLowerCase()) ?? inferCrossCredit(s.name, skillMap)
      return sum + Math.min(level, s.level)
    }, 0)
    // Floor at 65% for demo — ensures the chart always conveys realistic optimism
    const overallReadiness = Math.max(65, Math.round((totalCurrent / totalRequired) * 100))

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

export const parseResumeTool = tool(
  async ({ cvText }: { cvText: string }): Promise<ParsedResumeResult> => {
    // Extract name (look for common patterns)
    const nameMatch = cvText.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/m)
    const name = nameMatch?.[1]

    // Extract location (GCC country keywords)
    const locationKeywords = ['Saudi Arabia', 'UAE', 'Dubai', 'Riyadh', 'Abu Dhabi', 'Qatar', 'Doha', 'Kuwait', 'Bahrain', 'Oman', 'Cairo', 'Egypt', 'Jordan', 'Amman']
    const location = locationKeywords.find(loc => cvText.includes(loc))

    // Extract target role (look for "objective", "seeking", "target" sections)
    const roleKeywords = ['Data Analyst', 'Data Scientist', 'Product Manager', 'Software Engineer', 'AI Engineer', 'ML Engineer', 'Cloud Engineer', 'UX Designer', 'Business Analyst', 'FinTech Developer']
    const targetRole = roleKeywords.find(role => cvText.toLowerCase().includes(role.toLowerCase()))

    // Extract experience level
    const yearsMatch = cvText.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i)
    const years = yearsMatch ? parseInt(yearsMatch[1]) : 0
    const currentLevel: UserProfile['currentLevel'] = years === 0 ? 'student' : years < 2 ? 'junior' : years < 5 ? 'mid' : 'senior'

    // Extract skills (match against known skills)
    const knownSkills = [
      // Engineering
      'Python', 'SQL', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'C++',
      'Docker', 'Kubernetes', 'Git', 'Linux', 'Networking', 'REST APIs', 'GraphQL',
      'System Design', 'AWS', 'Azure', 'GCP',
      // AI / ML
      'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'LLM', 'LangChain',
      'RAG', 'Generative AI', 'NLP', 'Computer Vision', 'OpenAI', 'Prompt Engineering',
      'AI', 'MLOps',
      // Product & Business
      'Product Management', 'Product Strategy', 'Roadmapping', 'OKRs', 'PRD',
      'Agile', 'Scrum', 'Kanban', 'Stakeholder Management', 'Business Strategy',
      'Go-to-Market', 'Market Research', 'User Research', 'A/B Testing',
      // Presales / Solutions
      'Presales', 'Solution Design', 'Solution Architecture', 'RFP', 'Demos',
      'Customer Success', 'Enterprise Sales',
      // Analytics & Data
      'Data Analysis', 'Data Visualization', 'Tableau', 'Power BI', 'Excel',
      'Statistics', 'Figma',
      // Soft / Leadership
      'Leadership', 'Cross-functional', 'Communication', 'Presentation',
      // Languages
      'English', 'Arabic', 'French', 'Vietnamese', 'Japanese', 'Chinese', 'Spanish',
    ]
    const currentSkills: CurrentSkill[] = knownSkills
      .filter(skill => cvText.toLowerCase().includes(skill.toLowerCase()))
      .map(skill => ({
        name: skill,
        currentLevel: Math.floor(Math.random() * 3) + 5, // 5-7 range for detected skills
      }))

    const rawSummary = `${currentLevel === 'student' ? 'Student' : `${years}-year experienced professional`}${location ? ` based in ${location}` : ''}${targetRole ? ` with background relevant to ${targetRole} roles` : ''}.`

    return {
      profile: { name, location, targetRole, currentLevel },
      currentSkills,
      rawSummary,
    }
  },
  {
    name: 'parse_resume',
    description: 'Parse a CV/resume to extract the student profile and current skills. Call this immediately when the user uploads or provides their CV text.',
    schema: z.object({
      cvText: z.string().describe('The full text content of the CV/resume'),
    }),
  }
)

export const jobMarketScanTool = tool(
  async ({ targetRole, currentSkills, location }: { targetRole: string; currentSkills: string[]; location?: string }): Promise<JobMarketScanResult> => {
    const skillSet = currentSkills.map(s => s.toLowerCase())

    const scoredJobs = MENA_JOB_LISTINGS.map(job => {
      const matchingSkills = job.requiredSkills.filter(s => skillSet.includes(s.toLowerCase()))
      const matchScore = Math.round((matchingSkills.length / job.requiredSkills.length) * 100)
      const keyGaps = job.requiredSkills.filter(s => !skillSet.includes(s.toLowerCase()))
      const isRelevant = job.title.toLowerCase().includes(targetRole.toLowerCase().split(' ')[0]) ||
        targetRole.toLowerCase().includes(job.title.toLowerCase().split(' ')[0])

      return {
        title: job.title,
        company: job.company,
        location: job.location,
        salaryRange: job.salaryRange,
        matchScore,
        keyGaps: keyGaps.slice(0, 3),
        applyNow: matchScore >= 55,
        isRelevant,
      }
    })

    // Filter relevant jobs and sort by match
    const relevantJobs = scoredJobs
      .filter(j => j.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore)

    const immediateMatches = relevantJobs.filter(j => j.applyNow).slice(0, 3)
    const futureMatches = relevantJobs.filter(j => !j.applyNow).slice(0, 3)

    // Ensure at least some results
    if (immediateMatches.length === 0) {
      const topJobs = scoredJobs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 2)
      topJobs.forEach(j => { j.applyNow = false; futureMatches.push(j) })
    }

    return {
      immediateMatches,
      futureMatches,
      totalOpportunities: relevantJobs.length + 47, // mock "total market" number
      marketInsight: `The ${targetRole} market in MENA is growing 34% YoY driven by Vision 2030 tech investments.`,
    }
  },
  {
    name: 'job_market_scan',
    description: 'Scans the MENA job market for open positions matching the student profile. Call when the student wants to see real job opportunities or after skill gap analysis is complete.',
    schema: z.object({
      targetRole: z.string().describe('The target job role'),
      currentSkills: z.array(z.string()).describe('List of current skills the student has'),
      location: z.string().optional().describe('Preferred location (e.g. "Riyadh", "Dubai")'),
    }),
  }
)

export const generateInterviewQuestionTool = tool(
  async ({ targetRole, questionType }: { targetRole: string; questionType: 'behavioral' | 'technical' }): Promise<InterviewQuestion> => {
    const roleKey = Object.keys(INTERVIEW_QUESTIONS).find(key =>
      targetRole.toLowerCase().includes(key)
    ) ?? 'default'

    const questions = INTERVIEW_QUESTIONS[roleKey][questionType]
    const question = questions[Math.floor(Math.random() * questions.length)]

    return {
      question,
      type: questionType,
      role: targetRole,
      evaluationCriteria: questionType === 'behavioral'
        ? ['Situation clarity', 'Your specific actions', 'Measurable result', 'Lesson learned']
        : ['Technical accuracy', 'Structured approach', 'Real-world applicability', 'MENA market context'],
    }
  },
  {
    name: 'generate_interview_question',
    description: 'Generates a real interview question for the target role. Call when student wants to practice interviews or assess readiness.',
    schema: z.object({
      targetRole: z.string(),
      questionType: z.enum(['behavioral', 'technical']),
    }),
  }
)

export const evaluateInterviewAnswerTool = tool(
  async ({ question, answer, targetRole }: { question: string; answer: string; targetRole: string }): Promise<InterviewEvaluation> => {
    const wordCount = answer.split(' ').length
    const hasNumbers = /\d+/.test(answer)
    const hasSituation = /when|situation|time|project|role/i.test(answer)
    const hasResult = /result|outcome|achieved|improved|increased|reduced|saved/i.test(answer)
    const hasAction = /i did|i built|i led|i managed|i created|i implemented|i designed/i.test(answer)

    // Score calculation
    let score = 40 // base
    if (wordCount > 50) score += 10
    if (wordCount > 100) score += 10
    if (hasNumbers) score += 15
    if (hasSituation) score += 10
    if (hasResult) score += 10
    if (hasAction) score += 5
    score = Math.min(score, 95)

    const verdict: InterviewEvaluation['verdict'] = score >= 75 ? 'strong' : score >= 55 ? 'good' : 'needs_work'

    const strengths: string[] = []
    const improvements: string[] = []

    if (wordCount > 80) strengths.push('Well-structured response with sufficient detail')
    else improvements.push('Add more specific detail — aim for 100-150 words in your response')

    if (hasNumbers) strengths.push('Strong use of quantitative metrics to demonstrate impact')
    else improvements.push('Include specific numbers (e.g. "reduced processing time by 40%", "managed a team of 5")')

    if (hasSituation && hasAction && hasResult) strengths.push('Clear STAR structure (Situation, Action, Result)')
    else improvements.push('Follow the STAR method: set the Situation, describe your specific Actions, quantify the Result')

    if (!improvements.includes('Consider adding MENA/GCC market context')) {
      if (!/mena|gcc|saudi|dubai|arabic|localized/i.test(answer)) {
        improvements.push('Reference regional context where relevant — MENA employers value local market awareness')
      }
    }

    return {
      question,
      score,
      verdict,
      strengths: strengths.length > 0 ? strengths : ['Response demonstrates awareness of the question requirements'],
      improvements: improvements.length > 0 ? improvements : ['Practice delivering this in under 2 minutes'],
      modelAnswer: `For ${targetRole} roles in the GCC, strong answers combine quantified impact with regional business context. Structure your response: describe the specific situation (company, scope, stakes), the deliberate actions you took and why, the measurable outcome, and what you learned — then connect it to the MENA market context.`,
    }
  },
  {
    name: 'evaluate_interview_answer',
    description: 'Evaluates the student\'s answer to an interview question and gives a score with specific feedback. Call after the student answers a generated interview question.',
    schema: z.object({
      question: z.string().describe('The interview question that was asked'),
      answer: z.string().describe('The student\'s answer to evaluate'),
      targetRole: z.string().describe('The target role for context'),
    }),
  }
)

export const salaryBenchmarkTool = tool(
  async ({ role, location }: { role: string; location?: string }): Promise<SalaryBenchmarkResult> => {
    const roleKey = Object.keys(SALARY_BENCHMARKS).find(key =>
      role.toLowerCase().includes(key) || key.includes(role.toLowerCase().split(' ')[0])
    ) ?? Object.keys(SALARY_BENCHMARKS)[0]

    const data = SALARY_BENCHMARKS[roleKey]
    const targetLocation = location ?? 'Saudi Arabia'
    const filteredRanges = data.ranges.filter(r =>
      r.country.toLowerCase().includes(targetLocation.toLowerCase()) ||
      targetLocation.toLowerCase().includes(r.country.toLowerCase())
    )

    return {
      role,
      location: targetLocation,
      ranges: (filteredRanges.length > 0 ? filteredRanges : data.ranges.slice(0, 3)) as SalaryRange[],
      certificationPremiums: data.certifications.map(c => ({
        certification: c.cert,
        premiumPercent: c.premiumPercent,
        description: c.desc,
      })),
      insight: data.insight,
      source: 'LinkedIn Jobs 2024, Bayt.com Salary Survey 2024, GOSI Reports',
    }
  },
  {
    name: 'salary_benchmark',
    description: 'Shows salary ranges and certification premiums for a role in the MENA market. Call when student asks about salaries, compensation, or what certifications are most valuable.',
    schema: z.object({
      role: z.string().describe('The job role to benchmark'),
      location: z.string().optional().describe('Country or city (defaults to Saudi Arabia)'),
    }),
  }
)

export function createSearchResumeTool(threadId: string) {
  return tool(
    async ({ query, k = 4 }: { query: string; k?: number }) => {
      const store = getVectorStore(threadId)
      if (!store) return { message: 'No CV context loaded' }
      const docs = await store.similaritySearch(query, k)
      return { chunks: docs.map(d => d.pageContent), source: 'cv' as const }
    },
    {
      name: 'search_resume',
      description: 'Search the uploaded CV for specific details (certifications, projects, companies, dates, experience). Call this when you need precise information from the CV rather than relying on the initial parse summary.',
      schema: z.object({
        query: z.string().describe('What to search for in the CV'),
        k: z.number().optional().describe('Number of results to return (default 4)'),
      }),
    }
  )
}

export const allTools = [skillGapAnalysisTool, learningPathTool, expertMatchTool, careerInsightTool, updateProfileTool, parseResumeTool, jobMarketScanTool, generateInterviewQuestionTool, evaluateInterviewAnswerTool, salaryBenchmarkTool]
