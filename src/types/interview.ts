// src/types/interview.ts

export type QuestionType = 'behavioral' | 'technical' | 'system-design' | 'culture'

export interface InterviewSession {
  id: string
  company: string
  role: string
  appliedAt?: string       // ISO string
  alertMessage?: string
}

export interface PracticeQuestion {
  id: string
  company: string
  role: string
  questionType: QuestionType
  text: string
  evaluationCriteria: string[]
  source?: string
}

export interface AnswerResult {
  score: number            // 0–10
  verdict: string          // "Excellent Answer" | "Strong Answer" | "Good Start" | "Needs Work"
  strengths: string[]
  improvements: string[]
  modelAnswer: string
}

export interface StarStory {
  id: string
  title: string
  tags: string[]
  situation: string
  task: string
  action: string
  result: string
}

export interface CompanyProcess {
  rounds: number
  duration: string         // e.g. "3–4 weeks"
  offerRate: string        // e.g. "12%"
  language: string         // e.g. "English" | "English / Arabic"
}
