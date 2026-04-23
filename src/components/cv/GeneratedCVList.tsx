// src/components/cv/GeneratedCVList.tsx
'use client'

import { GeneratedCV } from '@/types/cv'

interface GeneratedCVListProps {
  cvs: GeneratedCV[]
  activeId: string | null
  onSelect: (cv: GeneratedCV) => void
  onDownload: (cv: GeneratedCV) => void
  onStartNew: () => void
}

export function GeneratedCVList({ cvs, activeId, onSelect, onDownload, onStartNew }: GeneratedCVListProps) {
  return (
    <div className="w-[240px] flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
      <div className="text-[10px] font-bold text-[var(--brand-ink-3)] uppercase tracking-[0.08em] flex-shrink-0">Generated CVs</div>

      {cvs.length === 0 && (
        <div className="bg-white border border-[var(--brand-line)] rounded-[10px] p-4 text-[11px] text-[var(--brand-ink-2)] text-center leading-relaxed">
          No tailored CVs yet.<br />Use the center panel to generate one.
        </div>
      )}

      {cvs.map(cv => (
        <div
          key={cv.id}
          onClick={() => onSelect(cv)}
          className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
            activeId === cv.id
              ? 'border-[var(--brand-accent)] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
              : 'border-[var(--brand-line)] hover:border-[var(--brand-accent)]'
          }`}
        >
          <div className="text-[12px] font-bold text-[var(--brand-ink-0)] truncate">{cv.company}</div>
          <div className="text-[11px] text-[var(--brand-ink-2)] truncate mt-0.5">{cv.jobTitle}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-[var(--brand-severity-ok-soft)] text-[#009C6C] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cv.atsScore}% ATS
            </span>
            <span className="text-[10px] text-[var(--brand-ink-3)]">{cv.keywordsInjected} kw</span>
          </div>
          <div className="text-[10px] text-[var(--brand-ink-3)] mt-1">
            {new Date(cv.generatedAt).toLocaleDateString()}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDownload(cv) }}
            className="w-full mt-3 bg-[var(--brand-severity-info-soft)] text-[var(--brand-accent)] text-[11px] font-bold py-1.5 rounded-lg hover:bg-[#d0e4ff] transition-colors"
          >
            Download PDF
          </button>
        </div>
      ))}

      <button
        onClick={onStartNew}
        className="flex-shrink-0 w-full border-2 border-dashed border-[var(--brand-line)] rounded-[10px] py-4 text-[11px] text-[var(--brand-ink-3)] font-semibold hover:border-[var(--brand-accent)] hover:text-[var(--brand-accent)] transition-colors"
      >
        + Generate for a new job
      </button>
    </div>
  )
}
