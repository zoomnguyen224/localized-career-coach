'use client'

import { CVAttachment } from '@/types'

interface CVSidebarCardProps {
  attachment: CVAttachment
}

export function CVSidebarCard({ attachment }: CVSidebarCardProps) {
  const { fileName, pageCount, pageImages } = attachment

  return (
    <div className="rounded-[10px] border border-border bg-white p-3">
      <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-navy">
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span className="truncate max-w-[160px]">{fileName}</span>
        <span className="text-muted shrink-0">· {pageCount}p</span>
      </div>
      {pageImages[0] && (
        <div className="rounded-[6px] overflow-hidden border border-border">
          <img
            src={pageImages[0]}
            alt="CV preview"
            className="w-full object-top object-cover"
            style={{ maxHeight: 120 }}
          />
        </div>
      )}
    </div>
  )
}
