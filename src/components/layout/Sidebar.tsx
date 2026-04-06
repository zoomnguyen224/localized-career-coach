'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { UserProfile, SkillGapResult, CVAttachment } from '@/types'
import { ConversationMeta } from '@/lib/conversation-store'
import { SkillRadarChart } from '@/components/generative-ui/SkillRadarChart'
import { CVSidebarCard } from '@/components/chat/CVSidebarCard'

interface SidebarProps {
  profile: UserProfile
  conversations: ConversationMeta[]
  activeThreadId: string
  skillGapResult: SkillGapResult | null
  cvAttachment: CVAttachment | null
  onNew: () => void
  onSwitch: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-navy font-medium">{value ?? <span className="text-muted">—</span>}</p>
    </div>
  )
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const CHANNELS = [
  {
    id: 'telegram',
    label: 'Telegram',
    url: 'https://t.me/localized_career_bot',
    color: '#229ED9',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.03 9.57c-.144.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.278 13.5l-2.937-.918c-.638-.2-.65-.638.136-.943l11.47-4.423c.53-.193.994.13.615 1.031z" />
      </svg>
    ),
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    url: 'https://wa.me/966500000000?text=Hi%20Localized%20Career%20Coach',
    color: '#25D366',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
]

export default function Sidebar({
  profile,
  conversations,
  activeThreadId,
  skillGapResult,
  cvAttachment,
  onNew,
  onSwitch,
  onDelete,
  onRename,
}: SidebarProps) {
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'whatsapp'>('telegram')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const channel = CHANNELS.find(c => c.id === activeChannel)!

  const startRename = (conv: ConversationMeta) => {
    setRenamingId(conv.id)
    setRenameValue(conv.title)
  }

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim())
    }
    setRenamingId(null)
  }

  return (
    <aside className="w-72 bg-white border-r border-border hidden md:flex flex-col flex-shrink-0 overflow-y-auto">

      {/* Conversation list */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-[8px] border border-border text-xs font-semibold text-navy hover:bg-gray-50 transition-colors mb-3"
        >
          <span className="text-base leading-none">+</span> New Conversation
        </button>

        <div className="space-y-0.5">
          {conversations.map(conv => {
            const isActive = conv.id === activeThreadId
            return (
              <div
                key={conv.id}
                className={`group flex items-start justify-between rounded-[8px] px-2 py-2 cursor-pointer transition-colors ${
                  isActive ? 'bg-blue/5 border-l-2 border-blue' : 'hover:bg-gray-50'
                }`}
                onClick={() => !isActive && onSwitch(conv.id)}
              >
                <div className="flex-1 min-w-0">
                  {renamingId === conv.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitRename()
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="text-xs font-semibold text-navy w-full bg-transparent border-b border-blue outline-none"
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <p
                      className={`text-xs font-semibold truncate ${isActive ? 'text-navy' : 'text-navy/70'}`}
                      onDoubleClick={e => { e.stopPropagation(); startRename(conv) }}
                    >
                      {conv.title}
                    </p>
                  )}
                  <p className="text-[10px] text-muted mt-0.5">{formatTimestamp(conv.updatedAt)}</p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(conv.id) }}
                  className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 text-muted hover:text-red-500 transition-opacity flex-shrink-0"
                  aria-label="Delete conversation"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Profile */}
      <div className="p-4 flex-shrink-0">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Your Profile</h2>
        <ProfileField label="Name" value={profile.name} />
        <ProfileField label="Location" value={profile.location} />
        <ProfileField label="Background" value={profile.background} />
        <ProfileField label="Target Role" value={profile.targetRole} />
        <ProfileField label="Experience Level" value={profile.currentLevel} />
      </div>

      {/* Skill Radar — shown when available */}
      {skillGapResult && (
        <div className="px-3 pb-3 flex-shrink-0">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Skill Readiness</h2>
          <SkillRadarChart result={skillGapResult} compact />
        </div>
      )}

      {/* CV Card — shown when available */}
      {cvAttachment && (
        <div className="px-3 pb-3 flex-shrink-0">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">CV Uploaded</h2>
          <CVSidebarCard attachment={cvAttachment} />
        </div>
      )}

      {/* Continue on Mobile */}
      <div className="mx-4 mb-3 rounded-[10px] border border-border p-3 flex-shrink-0 mt-auto">
        <p className="text-xs font-semibold text-navy mb-1">Continue on Mobile</p>
        <p className="text-xs text-muted mb-3">Scan to chat with your coach on the go</p>

        <div className="flex gap-1 mb-3">
          {CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id as 'telegram' | 'whatsapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeChannel === c.id ? 'text-white' : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              style={activeChannel === c.id ? { backgroundColor: c.color } : undefined}
            >
              <span style={activeChannel === c.id ? { color: 'white' } : { color: c.color }}>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-white border border-border rounded-[8px]">
            <QRCodeSVG value={channel.url} size={100} fgColor={channel.color} bgColor="#FFFFFF" level="M" />
          </div>
          <p className="text-xs text-muted text-center">Scan to open {channel.label}</p>
        </div>
      </div>

      {/* Prototype footnote */}
      <p className="text-[10px] text-muted text-center pb-3 px-4">
        Prototype demo — some data is illustrative only.
      </p>
    </aside>
  )
}
