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
      <div className="text-[10px] font-bold text-[#8D96B4] uppercase tracking-[0.08em] flex-shrink-0">Generated CVs</div>

      {cvs.length === 0 && (
        <div className="bg-white border border-[#d8dbe4] rounded-[10px] p-4 text-[11px] text-[#727998] text-center leading-relaxed">
          No tailored CVs yet.<br />Use the center panel to generate one.
        </div>
      )}

      {cvs.map(cv => (
        <div
          key={cv.id}
          onClick={() => onSelect(cv)}
          className={`bg-white border rounded-[10px] p-4 cursor-pointer transition-all ${
            activeId === cv.id
              ? 'border-[#0052ff] shadow-[0_2px_20px_rgba(69,132,255,0.15)]'
              : 'border-[#d8dbe4] hover:border-[#0052ff]'
          }`}
        >
          <div className="text-[12px] font-bold text-[#0a0b0d] truncate">{cv.company}</div>
          <div className="text-[11px] text-[#727998] truncate mt-0.5">{cv.jobTitle}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="bg-[#E6FAF4] text-[#009C6C] text-[10px] font-bold px-2 py-0.5 rounded-full">
              {cv.atsScore}% ATS
            </span>
            <span className="text-[10px] text-[#8D96B4]">{cv.keywordsInjected} kw</span>
          </div>
          <div className="text-[10px] text-[#8D96B4] mt-1">
            {new Date(cv.generatedAt).toLocaleDateString()}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDownload(cv) }}
            className="w-full mt-3 bg-[#e8f0fe] text-[#0052ff] text-[11px] font-bold py-1.5 rounded-lg hover:bg-[#d0e4ff] transition-colors"
          >
            Download PDF
          </button>
        </div>
      ))}

      <button
        onClick={onStartNew}
        className="flex-shrink-0 w-full border-2 border-dashed border-[#d8dbe4] rounded-[10px] py-4 text-[11px] text-[#8D96B4] font-semibold hover:border-[#0052ff] hover:text-[#0052ff] transition-colors"
      >
        + Generate for a new job
      </button>
    </div>
  )
}
