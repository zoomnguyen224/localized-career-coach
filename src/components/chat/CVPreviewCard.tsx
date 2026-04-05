'use client'

import { CVAttachment } from '@/types'

interface CVPreviewCardProps {
  attachment: CVAttachment
}

export function CVPreviewCard({ attachment }: CVPreviewCardProps) {
  const { fileName, pageCount, pageImages } = attachment

  return (
    <div className="mt-3 max-w-xs">
      {/* Filename label */}
      <div className="flex items-center gap-1.5 mb-2 text-white/80 text-xs font-medium">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <span className="truncate max-w-[160px]">{fileName}</span>
        <span className="text-white/40 shrink-0">· {pageCount}p</span>
      </div>

      {/* Page thumbnails — stacked with slight offset for depth */}
      <div className="relative flex gap-2">
        {pageImages.map((img, i) => (
          <div
            key={i}
            className="relative flex-shrink-0 rounded-[8px] overflow-hidden border border-white/25 shadow-md bg-white"
            style={{ width: pageImages.length === 1 ? 160 : 110 }}
          >
            <img
              src={img}
              alt={`CV page ${i + 1}`}
              className="w-full object-top object-cover"
              style={{ maxHeight: pageImages.length === 1 ? 210 : 145 }}
            />
            {pageImages.length > 1 && (
              <div className="absolute bottom-1 right-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {i + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
