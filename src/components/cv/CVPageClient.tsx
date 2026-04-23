// src/components/cv/CVPageClient.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { GeneratedCV } from '@/types/cv'
import type { CurrentSkill, UserProfile } from '@/types'
import { ProfileColumn } from './ProfileColumn'
import { CVPreview } from './CVPreview'
import { GeneratedCVList } from './GeneratedCVList'
import { TargetRolePicker } from '@/components/career-map/TargetRolePicker'
import {
  getActiveThreadId,
  setActiveThreadId,
  createConversation,
} from '@/lib/conversation-store'

const DEMO_PROFILE = {
  name: 'Ahmed Nasser',
  role: 'Senior AI Engineer',
  location: 'Dubai, UAE',
  email: 'ahmed.nasser@example.com',
  completeness: 87,
  skills: [
    { name: 'LLM / RAG', level: 9 },
    { name: 'Python', level: 9 },
    { name: 'LangChain', level: 8 },
    { name: 'MLOps', level: 7 },
    { name: 'Arabic NLP', level: 6 },
  ],
  suggestions: [
    'Add quantified metrics to Careem achievements (e.g. "reduced latency by 40%")',
    'Include Arabic NLP projects — highly valued in MENA tech roles',
    'Add a "Key Projects" section featuring your RAG systems work',
  ],
}

const DEMO_CV_MARKDOWN = `# Ahmed Nasser
Senior AI Engineer | Dubai, UAE | ahmed.nasser@example.com

## Summary
Senior AI Engineer with 6+ years building LLM pipelines, RAG systems, and production Generative AI applications. Led AI platform development at Careem serving 50M+ users.

## Experience
### AI Platform Lead — Careem (2022–Present)
- Built multi-modal RAG system handling 2M daily queries with 95% accuracy
- Led team of 8 engineers building LLM infrastructure
- Reduced model inference latency by 40% through quantization and caching
- Implemented Arabic NLP pipeline supporting multiple MENA dialects

### ML Engineer — Souq/Amazon (2019–2022)
- Trained recommendation models serving 20M product listings across MENA
- Built real-time fraud detection reducing fraudulent transactions by 60%
- Deployed MLOps pipeline on AWS SageMaker for 100+ model versions

## Education
MSc Computer Science (AI) — American University of Beirut (2019)
BSc Computer Engineering — Cairo University (2017)

## Skills
Python, LangChain, LlamaIndex, FastAPI, Docker, Kubernetes, AWS, Arabic NLP, RAG, LLM fine-tuning, Pinecone, Weaviate, PyTorch, Transformers`

// DEMO_PROFILE mapped into the shared UserProfile / CurrentSkill shapes that
// `seedFromProfile` consumes. In a real parse flow these come from
// /api/parse-cv; here we treat DEMO_PROFILE as the "already-parsed" record.
const DEMO_USER_PROFILE: UserProfile = {
  name: DEMO_PROFILE.name,
  location: DEMO_PROFILE.location,
  background: 'Senior AI Engineer (demo CV)',
  currentLevel: 'senior',
}
const DEMO_CURRENT_SKILLS: CurrentSkill[] = DEMO_PROFILE.skills.map(s => ({
  name: s.name,
  currentLevel: s.level,
}))

export function CVPageClient() {
  const searchParams = useSearchParams()
  const initialJobTitle = searchParams.get('jobTitle') || undefined
  const initialCompany = searchParams.get('company') || undefined
  const [generatedCVs, setGeneratedCVs] = useState<GeneratedCV[]>([])
  const [activeCV, setActiveCV] = useState<GeneratedCV | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [learnerId, setLearnerId] = useState<string | null>(null)

  // Resolve (or mint) the active thread id on the client — used as the
  // learnerId that keys the CareerGraph in localStorage. Minting re-uses
  // the existing conversation-store helper instead of inventing a new id
  // scheme.
  useEffect(() => {
    const existing = getActiveThreadId()
    if (existing) {
      setLearnerId(existing)
      return
    }
    const conv = createConversation()
    setActiveThreadId(conv.id)
    setLearnerId(conv.id)
  }, [])

  async function handleGenerate(jobTitle: string, company: string, jobDescription: string) {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvMarkdown: DEMO_CV_MARKDOWN, jobTitle, jobDescription, company }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const result = await res.json()
      const newCV: GeneratedCV = {
        id: uuidv4(),
        company,
        jobTitle,
        generatedAt: new Date().toISOString(),
        html: result.html,
        keywords: result.keywords ?? [],
        keywordsInjected: result.keywordsInjected ?? 0,
        atsScore: result.atsScore ?? 0,
      }
      setGeneratedCVs(prev => [newCV, ...prev])
      setActiveCV(newCV)
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload(cv: GeneratedCV) {
    try {
      const res = await fetch('/api/cv/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: cv.html }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cv-${cv.company.toLowerCase().replace(/\s+/g, '-')}-${cv.jobTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore download errors in demo
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0">
        <h1 className="text-xl font-extrabold text-[var(--brand-ink-0)]">My CV</h1>
        <p className="text-[12px] text-[var(--brand-ink-2)] mt-0.5">
          Master CV · {generatedCVs.length} tailored {generatedCVs.length === 1 ? 'version' : 'versions'} generated
        </p>
      </div>

      {/* Post-parse career-map picker (mount once learnerId is resolved to
          avoid hydration mismatch on localStorage reads). */}
      {learnerId ? (
        <div className="px-7 flex-shrink-0">
          <TargetRolePicker
            learnerId={learnerId}
            profile={DEMO_USER_PROFILE}
            currentSkills={DEMO_CURRENT_SKILLS}
          />
        </div>
      ) : null}

      {/* 3-column body */}
      <div className="flex flex-1 gap-5 px-7 pb-6 overflow-hidden">
        <ProfileColumn profile={DEMO_PROFILE} />
        <CVPreview
          masterCvMarkdown={DEMO_CV_MARKDOWN}
          activeCV={activeCV}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          initialJobTitle={initialJobTitle}
          initialCompany={initialCompany}
        />
        <GeneratedCVList
          cvs={generatedCVs}
          activeId={activeCV?.id ?? null}
          onSelect={setActiveCV}
          onDownload={handleDownload}
          onStartNew={() => setActiveCV(null)}
        />
      </div>
    </div>
  )
}
