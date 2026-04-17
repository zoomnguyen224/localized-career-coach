// src/lib/interview.ts
import type { Application } from '@/types/applications'
import type { InterviewSession, PracticeQuestion, StarStory, CompanyProcess } from '@/types/interview'
import { DEMO_APPLICATIONS } from '@/lib/applications'

// ─── Pure helpers ───────────────────────────────────────────────

export function getInterviewSessions(applications: Application[]): InterviewSession[] {
  return applications
    .filter(a => a.status === 'interview')
    .map(a => ({
      id: a.id,
      company: a.company,
      role: a.jobTitle,
      appliedAt: a.appliedAt,
      alertMessage: a.alertMessage,
    }))
}

// ─── Demo sessions ───────────────────────────────────────────────

export const DEMO_SESSIONS: InterviewSession[] = getInterviewSessions(DEMO_APPLICATIONS)

// ─── Demo questions ───────────────────────────────────────────────

export const DEMO_QUESTIONS: Record<string, PracticeQuestion[]> = {
  'Emirates NBD': [
    {
      id: 'q1',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'behavioral',
      text: 'Tell me about a time you had to align multiple stakeholders on an AI strategy that faced internal resistance.',
      evaluationCriteria: ['Stakeholder influence', 'Conflict resolution', 'Business outcome'],
      source: 'Glassdoor 2024',
    },
    {
      id: 'q2',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'technical',
      text: 'How would you design an LLM-powered fraud detection system for a large regional bank? Walk me through your architecture.',
      evaluationCriteria: ['System design depth', 'Security awareness', 'Regulatory compliance (CBUAE)'],
      source: 'Technical screening 2024',
    },
    {
      id: 'q3',
      company: 'Emirates NBD',
      role: 'Head of AI',
      questionType: 'system-design',
      text: 'Design a real-time Arabic NLP pipeline that processes customer service chats across UAE and Saudi dialects.',
      evaluationCriteria: ['Dialect awareness', 'Latency/scale thinking', 'Practical tradeoffs'],
      source: 'Engineering interview 2024',
    },
  ],
  'Anghami': [
    {
      id: 'q4',
      company: 'Anghami',
      role: 'AI Product Lead',
      questionType: 'behavioral',
      text: 'Describe how you would prioritize AI features for a consumer music app with 100M users across MENA.',
      evaluationCriteria: ['Product thinking', 'Data-driven prioritization', 'User empathy'],
      source: 'Product interview 2024',
    },
    {
      id: 'q5',
      company: 'Anghami',
      role: 'AI Product Lead',
      questionType: 'culture',
      text: "How do you stay current with AI developments while also shipping product? What's your learning system?",
      evaluationCriteria: ['Continuous learning', 'Practical application', 'Self-awareness'],
      source: 'Culture fit 2024',
    },
  ],
}

// ─── Demo STAR stories ───────────────────────────────────────────

export const DEMO_STAR_STORIES: StarStory[] = [
  {
    id: 's1',
    title: 'Led AI platform migration at scale',
    tags: ['Leadership', 'AI/ML', 'System Design'],
    situation: 'Inherited a legacy ML system with 40% prediction accuracy serving 2M users daily.',
    task: 'Needed to redesign the platform using modern LLM-based architecture without service downtime.',
    action: 'Led a 6-person cross-functional team, built a shadow system in parallel, ran A/B tests over 8 weeks with gradual traffic shifting.',
    result: 'Accuracy improved to 87%, inference latency reduced by 60%, zero-downtime migration completed under budget.',
  },
  {
    id: 's2',
    title: 'Aligned resistant executive stakeholder',
    tags: ['Communication', 'Influence', 'Change Management'],
    situation: 'VP of Operations was blocking an AI automation initiative citing employee displacement concerns.',
    task: 'Needed executive sign-off to automate a manual data pipeline that cost $2M/year to operate.',
    action: 'Arranged 1:1, presented a reskilling plan alongside ROI projections, co-designed the rollout plan with their team, invited them to the pilot launch.',
    result: 'Secured buy-in in 2 weeks. Initiative delivered $2M annual savings, affected team moved into higher-value QA and oversight roles.',
  },
  {
    id: 's3',
    title: 'Shipped multilingual NLP product in 6 weeks',
    tags: ['Execution', 'Arabic NLP', 'Cross-functional'],
    situation: 'Business unit needed an Arabic sentiment analysis tool for social media monitoring before Ramadan campaign.',
    task: 'Build and ship an end-to-end tool with a hard 6-week deadline and no existing Arabic NLP infrastructure.',
    action: 'Selected AraBERT fine-tuned on Egyptian/Gulf dialect corpus, built a lightweight Flask API, embedded directly into Tableau dashboards the marketing team already used.',
    result: 'Shipped day 40 of 42, accuracy 82% on dialect validation set. Used by 3 teams and expanded to 4 more countries the following quarter.',
  },
]

// ─── Per-company interview process ───────────────────────────────

export const DEMO_COMPANY_PROCESS: Record<string, CompanyProcess> = {
  'Emirates NBD': { rounds: 4, duration: '3–4 weeks', offerRate: '12%', language: 'English' },
  'Anghami': { rounds: 3, duration: '2–3 weeks', offerRate: '18%', language: 'English / Arabic' },
}
