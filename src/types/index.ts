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

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolResults: ToolResult[]
}

export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; id: string }
  | { type: 'tool_result'; name: string; id: string; result: unknown }
  | { type: 'error'; message: string }
