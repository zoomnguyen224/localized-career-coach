export interface CVGenerationResult {
  html: string
  keywords: string[]
  keywordsInjected: number
  atsScore: number    // 0–100
}

export interface GeneratedCV {
  id: string
  company: string
  jobTitle: string
  generatedAt: string  // ISO string
  html: string
  keywords: string[]
  keywordsInjected: number
  atsScore: number    // 0–100
}
