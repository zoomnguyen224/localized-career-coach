// src/components/applications/KanbanColumn.tsx
import { Application, ApplicationStatus } from '@/types/applications'
import { ApplicationCard } from './ApplicationCard'

interface KanbanColumnProps {
  status: ApplicationStatus
  label: string
  color: string
  headerBg: string
  applications: Application[]
  onDrop: (status: ApplicationStatus) => void
  onDragOver: (e: React.DragEvent) => void
  onDragStart: (id: string) => void
}

export function KanbanColumn({
  status, label, color, headerBg, applications,
  onDrop, onDragOver, onDragStart,
}: KanbanColumnProps) {
  return (
    <div
      className="flex flex-col w-[240px] flex-shrink-0 h-full"
      onDragOver={onDragOver}
      onDrop={() => onDrop(status)}
    >
      {/* Column header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-[10px] mb-3 flex-shrink-0"
        style={{ backgroundColor: headerBg }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] font-bold" style={{ color }}>{label}</span>
        </div>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
          style={{ backgroundColor: color }}
        >
          {applications.length}
        </span>
      </div>

      {/* Cards */}
      <div
        className={`flex flex-col gap-2.5 flex-1 overflow-y-auto min-h-[80px] rounded-[10px] p-1
          ${status === 'rejected' ? 'opacity-65' : ''}`}
      >
        {applications.map(app => (
          <ApplicationCard key={app.id} application={app} onDragStart={onDragStart} />
        ))}

        {applications.length === 0 && (
          <div className="flex-1 border-2 border-dashed border-[#DCDFE8] rounded-[10px] flex items-center justify-center">
            <span className="text-[10px] text-[#8D96B4]">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}
