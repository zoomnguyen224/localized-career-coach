export interface UserProfile {
  name?: string
  location?: string
  background?: string
  targetRole?: string
  currentLevel?: 'student' | 'junior' | 'mid' | 'senior'
}

export interface SkillRequirement {
  name: string
  level: number       // 1-10
  category: 'technical' | 'business' | 'soft'
}

export interface MENARole {
  id: string
  title: string
  company: string
  location: string
  requiredSkills: SkillRequirement[]
}

export interface Expert {
  id: string
  name: string
  initials: string
  title: string
  company: string
  location: string
  specialization: string
  industries: string[]
  bio: string
}

export interface CareerInsight {
  stat: string
  description: string
  source: string
  relevantRoles: string[]
  location: string
  topics: string[]
}

export interface SkillGap {
  skill: string
  category: 'technical' | 'business' | 'soft'
  currentLevel: number
  requiredLevel: number
  gap: number
  severity: 'high' | 'medium' | 'low'
  recommendedAction: string
}

export interface SkillGapResult {
  role: MENARole
  gaps: SkillGap[]
  overallReadiness: number  // 0-100
}

export interface LearningResource {
  name: string
  type: 'localized' | 'external'
  provider: string
  estimatedHours: number
}

export interface LearningPhase {
  phase: number
  title: string
  duration: string
  skills: string[]
  resources: LearningResource[]
}

export interface LearningPathResult {
  targetRole: string
  phases: LearningPhase[]
  totalDuration: string
}

export interface ExpertMatch extends Expert {
  matchScore: number
  matchReason: string
}

export interface ExpertMatchResult {
  experts: ExpertMatch[]
}

export interface ToolResult {
  id: string
  toolName: string
  result: unknown
  status: 'loading' | 'done'
}

export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'tool'; toolResultId: string }

export interface CVAttachment {
  fileName: string
  pageCount: number
  pageImages: string[]  // base64 data URLs, max 3 pages
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults: ToolResult[]
  segments: MessageSegment[]  // ordered render sequence for assistant messages
  cvAttachment?: CVAttachment  // for user messages with CV upload
  isScanning?: boolean         // true while vision parse is in progress
}

export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; id: string }
  | { type: 'tool_result'; name: string; id: string; result: unknown }
  | { type: 'error'; message: string }

// CV / Resume parsing
export interface CurrentSkill {
  name: string
  currentLevel: number  // 1-10 estimated from CV
}

export interface ParsedResumeResult {
  profile: Partial<UserProfile>
  currentSkills: CurrentSkill[]
  rawSummary: string  // 1-2 sentence summary of candidate
  markdownContent?: string  // raw vision model output for embedding
}

// Job market scan
export interface JobMatch {
  title: string
  company: string
  location: string
  salaryRange: string      // e.g. "SAR 12,000 – 18,000/mo"
  matchScore: number       // 0-100
  keyGaps: string[]        // skills they're missing
  applyNow: boolean        // true = ready now, false = after learning path
}

export interface JobMarketScanResult {
  immediateMatches: JobMatch[]   // matchScore >= 60 with current skills
  futureMatches: JobMatch[]      // matchScore >= 60 after learning path
  totalOpportunities: number
  marketInsight: string
}

// Interview readiness
export interface InterviewQuestion {
  question: string
  type: 'behavioral' | 'technical'
  role: string
  evaluationCriteria: string[]
}

export interface InterviewEvaluation {
  question: string
  score: number           // 0-100
  verdict: 'strong' | 'good' | 'needs_work'
  strengths: string[]
  improvements: string[]
  modelAnswer: string
}

// Salary benchmark
export interface SalaryRange {
  level: 'entry' | 'mid' | 'senior'
  min: number
  max: number
  currency: string
  country: string
}

export interface CertificationPremium {
  certification: string
  premiumPercent: number
  description: string
}

export interface SalaryBenchmarkResult {
  role: string
  location: string
  ranges: SalaryRange[]
  certificationPremiums: CertificationPremium[]
  insight: string
  source: string
}

export * from './jobs'
export * from './cv'
export * from './applications'
export * from './interview'
