'use client'

import { CVAttachment } from '@/types'

interface CVSidebarCardProps {
  attachment: CVAttachment
}

export function CVSidebarCard({ attachment }: CVSidebarCardProps) {
  return (
    <div className="p-2 bg-blue/5 border border-blue/20 rounded-[8px]">
      <p className="text-xs font-semibold text-navy mb-1">{attachment.fileName}</p>
      <p className="text-[10px] text-muted mb-2">
        {attachment.pageCount && `${attachment.pageCount} pages`}
      </p>
      {attachment.pageImages && attachment.pageImages.length > 0 && (
        <div className="mt-2 flex gap-1">
          {attachment.pageImages.slice(0, 3).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Page ${idx + 1}`}
              className="w-12 h-16 object-cover rounded border border-blue/20"
            />
          ))}
        </div>
      )}
    </div>
  )
}
