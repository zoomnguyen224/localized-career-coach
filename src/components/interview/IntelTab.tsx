interface IntelSection {
  title: string
  content: string
  icon: string
}

interface IntelTabProps {
  company: string
}

const COMPANY_INTEL: Record<string, IntelSection[]> = {
  'Emirates NBD': [
    { icon: '🤖', title: 'AI Strategy', content: 'Building a comprehensive AI platform to transform retail banking. Key focus: Arabic NLP for customer service, fraud detection ML, and generative AI for wealth management advisors. Partnered with Google Cloud and Microsoft Azure.' },
    { icon: '🏗️', title: 'Tech Stack', content: 'Predominantly Java/Spring backend, Python ML pipelines, Azure ML platform. Moving to microservices. Engineering teams in Dubai, Cairo, and Bengaluru.' },
    { icon: '🎯', title: 'Hiring Bar', content: 'Strong preference for candidates with banking/fintech experience. Arabic language skills valued but not required. Expect deep system design questions and regulatory compliance awareness (CBUAE, DFSA).' },
    { icon: '📈', title: 'Growth Signals', content: 'AED 2.5B tech transformation budget 2024–2026. Expanding AI Center of Excellence from 30 to 120 engineers. Preparing for ADGM regulatory sandbox participation.' },
    { icon: '⚠️', title: 'Likely Challenges', content: 'Legacy core banking system (Temenos T24) creates integration friction. Strong risk/compliance culture can slow AI deployment cycles. Expect approvals process to be a regular topic in interviews.' },
    { icon: '🌍', title: 'Culture', content: 'Conservative-professional culture. Business Arabic used internally in senior meetings, English at team level. Long tenures common (5+ years). Formal titles and hierarchy respected.' },
  ],
  'Anghami': [
    { icon: '🤖', title: 'AI Strategy', content: 'Personalization at the core — recommendation systems, playlist generation, content discovery. Exploring Arabic lyric generation and regional artist discovery via ML. Small but fast-moving AI team.' },
    { icon: '🏗️', title: 'Tech Stack', content: 'React Native mobile, Node.js/Python backend, AWS infrastructure. Recommendation engine uses collaborative filtering + content embeddings. PostgreSQL + Redis + Kafka.' },
    { icon: '🎯', title: 'Hiring Bar', content: 'Strong product sense expected for PM/product roles. Engineers: Python proficiency, ML systems experience, comfort with ambiguity. Move fast culture — expect questions about how you handle rapid context switching.' },
    { icon: '📈', title: 'Growth Signals', content: "Post-merger integration with Rotana Music creates MENA's largest music catalog. Expanding into podcasts and live audio. Ramadan content campaigns have 2-3x traffic spikes — platform scale matters." },
    { icon: '⚠️', title: 'Likely Challenges', content: 'Smaller team means high ownership per person. Arabic content rights landscape is complex. Compete with Spotify/Apple Music with limited brand budget — scrappy execution is the culture.' },
    { icon: '🌍', title: 'Culture', content: 'Startup energy inside a scaled company. Flat-ish hierarchy, direct communication. Mix of Beirut, Dubai, Cairo offices. Arabic-English bilingual team. Young team, fast promotions for high performers.' },
  ],
}

const DEFAULT_INTEL: IntelSection[] = [
  { icon: '🤖', title: 'AI Strategy', content: 'Research in progress. Ask your agent to run a deep company research for the latest AI initiatives.' },
  { icon: '🏗️', title: 'Tech Stack', content: 'Details not yet available. Check the company engineering blog or LinkedIn for recent posts.' },
  { icon: '🎯', title: 'Hiring Bar', content: 'No specific intel available. Prepare standard system design and behavioral questions.' },
]

export function IntelTab({ company }: IntelTabProps) {
  const sections = COMPANY_INTEL[company] ?? DEFAULT_INTEL

  return (
    <div className="flex flex-col gap-3">
      {sections.map(section => (
        <div
          key={section.title}
          className="bg-white border border-[#d8dbe4] rounded-[10px] p-4 shadow-[0_2px_12px_rgba(151,155,192,0.08)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px]">{section.icon}</span>
            <span className="text-[11px] font-bold text-[#0a0b0d]">{section.title}</span>
          </div>
          <p className="text-[11px] text-[#727998] leading-relaxed">{section.content}</p>
        </div>
      ))}
    </div>
  )
}
