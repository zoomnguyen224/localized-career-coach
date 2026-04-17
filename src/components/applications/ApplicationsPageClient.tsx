// src/components/applications/ApplicationsPageClient.tsx
'use client'

import { useState } from 'react'
import { Application, ApplicationStatus } from '@/types/applications'
import { moveApplication, DEMO_APPLICATIONS, COLUMNS } from '@/lib/applications'
import { KanbanColumn } from './KanbanColumn'
import { AddApplicationModal } from './AddApplicationModal'
import { v4 as uuidv4 } from 'uuid'

export function ApplicationsPageClient() {
  const [applications, setApplications] = useState<Application[]>(DEMO_APPLICATIONS)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  function handleDragStart(id: string) {
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(status: ApplicationStatus) {
    if (!draggingId) return
    setApplications(prev => moveApplication(prev, draggingId, status))
    setDraggingId(null)
  }

  function handleAddApplication(app: Omit<Application, 'id' | 'lastActivity'>) {
    const newApp: Application = {
      ...app,
      id: uuidv4(),
      lastActivity: new Date().toISOString(),
    }
    setApplications(prev => [newApp, ...prev])
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-7 pt-6 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-[#06123C]">Applications</h1>
          <p className="text-[12px] text-[#727998] mt-0.5">
            {applications.length} applications · drag cards to update status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="border border-[#DCDFE8] text-[#727998] text-[12px] font-semibold px-4 py-2 rounded-[14px] hover:border-[#4584FF] hover:text-[#4584FF] transition-colors"
          >
            Pattern analysis
            <span className="ml-1.5 text-[9px] bg-[#F2F3F6] text-[#8D96B4] px-1.5 py-0.5 rounded-full font-bold">SOON</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#4584FF] text-white text-[12px] font-bold px-4 py-2 rounded-[14px]"
          >
            + Add application
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 px-7 pb-6 flex-1 overflow-x-auto">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            color={col.color}
            headerBg={col.headerBg}
            applications={applications.filter(a => a.status === col.status)}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {showAddModal && (
        <AddApplicationModal
          onAdd={handleAddApplication}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
