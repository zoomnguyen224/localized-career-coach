'use client'

interface QuickActionsProps {
  onInsert: (message: string) => void
  onCVUpload: () => void
  isLoading: boolean
}

const ACTIONS = [
  {
    id: 'cv',
    label: 'Upload CV',
    description: 'Instant analysis',
    isCVUpload: true,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.414 6.586a6 6 0 008.485 8.485L20.5 13" />
      </svg>
    ),
    message: '',
  },
  {
    id: 'skill-gap',
    label: 'Skill Gap',
    description: 'vs target role',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    message: "Run a skill gap analysis for my target role and show me where I stand.",
  },
  {
    id: 'learning-path',
    label: 'Learning Path',
    description: '3-phase roadmap',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    message: "Build me a personalized learning path to reach my target role.",
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    description: 'Practice & score',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    message: "I want to practice interview questions for my target role. Give me a question to start.",
  },
  {
    id: 'job-scan',
    label: 'Job Scan',
    description: 'MENA openings',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    message: "Scan the MENA job market for open positions that match my current skills and target role.",
  },
  {
    id: 'mentors',
    label: 'Find Mentors',
    description: 'Expert network',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    message: "Find expert mentors from the Localized network that match my career goals and industry.",
  },
  {
    id: 'salary',
    label: 'Salary Data',
    description: 'GCC benchmarks',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    message: "Show me salary benchmarks and certification premiums for my target role in the GCC.",
  },
  {
    id: 'market',
    label: 'Market Insights',
    description: 'MENA trends',
    isCVUpload: false,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    message: "What are the key MENA market insights and trends I should know about for my target field?",
  },
]

export function QuickActions({ onInsert, onCVUpload, isLoading }: QuickActionsProps) {
  return (
    <div className="bg-white border-t border-border px-4 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        <span className="text-xs text-muted font-medium flex-shrink-0 mr-1">Try:</span>
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            disabled={isLoading}
            onClick={() => action.isCVUpload ? onCVUpload() : onInsert(action.message)}
            className="flex items-center gap-1.5 flex-shrink-0 px-3 py-1.5 rounded-full border border-border bg-white hover:border-blue hover:text-blue hover:bg-blue/5 transition-colors text-navy disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <span className="text-muted group-hover:text-blue transition-colors">{action.icon}</span>
            <span className="text-xs font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
