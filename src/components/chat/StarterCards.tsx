'use client'

interface StarterCardsProps {
  onSend: (message: string) => void
  onCVUpload: () => void
}

export function StarterCards({ onSend, onCVUpload }: StarterCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
      {/* Card 1 — Upload CV (primary) */}
      <div
        className="bg-blue rounded-[10px] text-white hover:bg-blue/90 transition-all cursor-pointer p-4 flex items-start gap-3"
        onClick={onCVUpload}
      >
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-white/20">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.414 6.586a6 6 0 008.485 8.485L20.5 13" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm">Upload my CV</div>
          <div className="text-xs mt-0.5 text-white/70">Get instant skill analysis</div>
        </div>
      </div>

      {/* Card 2 — Student intro */}
      <div
        className="bg-white rounded-[10px] border border-border shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] hover:border-blue hover:shadow-md transition-all cursor-pointer p-4 flex items-start gap-3"
        onClick={() =>
          onSend(
            "I'm a CS student in Riyadh, Saudi Arabia. I want to work in AI/ML engineering. My background is in computer science with some Python and math skills."
          )
        }
      >
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-blue/10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm text-navy">I&apos;m a CS student in Riyadh</div>
          <div className="text-xs mt-0.5 text-muted">Targeting AI/ML roles in Saudi Arabia</div>
        </div>
      </div>

      {/* Card 3 — Role exploration */}
      <div
        className="bg-white rounded-[10px] border border-border shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] hover:border-blue hover:shadow-md transition-all cursor-pointer p-4 flex items-start gap-3"
        onClick={() =>
          onSend(
            "What skills does a Product Manager need to succeed in the GCC market? I want to understand the full picture."
          )
        }
      >
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-blue/10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm text-navy">Explore a career path</div>
          <div className="text-xs mt-0.5 text-muted">What skills do PMs need in GCC?</div>
        </div>
      </div>

      {/* Card 4 — Market insight */}
      <div
        className="bg-white rounded-[10px] border border-border shadow-[0px_5px_60px_0px_rgba(151,155,192,0.2)] hover:border-blue hover:shadow-md transition-all cursor-pointer p-4 flex items-start gap-3"
        onClick={() =>
          onSend(
            "What are the highest-demand tech roles created by Saudi Arabia's Vision 2030? I want to understand the opportunities."
          )
        }
      >
        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0 bg-blue/10">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-sm text-navy">Market intelligence</div>
          <div className="text-xs mt-0.5 text-muted">Hottest tech roles in Vision 2030</div>
        </div>
      </div>
    </div>
  )
}
