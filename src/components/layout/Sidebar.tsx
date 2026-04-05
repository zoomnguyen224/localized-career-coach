'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { UserProfile } from '@/types'

interface SidebarProps {
  profile: UserProfile
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-navy font-medium">{value ?? <span className="text-muted">—</span>}</p>
    </div>
  )
}

const CHANNELS = [
  {
    id: 'telegram',
    label: 'Telegram',
    url: 'https://t.me/localized_career_bot',
    color: '#229ED9',
    icon: (
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.247l-2.03 9.57c-.144.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L6.278 13.5l-2.937-.918c-.638-.2-.65-.638.136-.943l11.47-4.423c.53-.193.994.13.615 1.031z"/>
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
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
]

export default function Sidebar({ profile }: SidebarProps) {
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'whatsapp'>('telegram')
  const channel = CHANNELS.find(c => c.id === activeChannel)!

  return (
    <aside className="w-72 bg-white border-r border-border flex flex-col flex-shrink-0 hidden md:flex">
      {/* Profile */}
      <div className="p-4 flex-1">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
          Your Profile
        </h2>
        <ProfileField label="Name" value={profile.name} />
        <ProfileField label="Location" value={profile.location} />
        <ProfileField label="Background" value={profile.background} />
        <ProfileField label="Target Role" value={profile.targetRole} />
        <ProfileField label="Experience Level" value={profile.currentLevel} />
      </div>

      {/* Continue on Mobile */}
      <div className="mx-4 mb-3 rounded-[10px] border border-border p-3">
        <p className="text-xs font-semibold text-navy mb-1">Continue on Mobile</p>
        <p className="text-xs text-muted mb-3">Scan to chat with your coach on the go</p>

        {/* Channel tabs */}
        <div className="flex gap-1 mb-3">
          {CHANNELS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChannel(c.id as 'telegram' | 'whatsapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                activeChannel === c.id
                  ? 'text-white'
                  : 'bg-gray-100 text-muted hover:bg-gray-200'
              }`}
              style={activeChannel === c.id ? { backgroundColor: c.color } : undefined}
            >
              <span style={activeChannel === c.id ? { color: 'white' } : { color: c.color }}>
                {c.icon}
              </span>
              {c.label}
            </button>
          ))}
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-2 bg-white border border-border rounded-[8px]">
            <QRCodeSVG
              value={channel.url}
              size={100}
              fgColor={channel.color}
              bgColor="#FFFFFF"
              level="M"
            />
          </div>
          <p className="text-xs text-muted text-center">
            Scan to open {channel.label}
          </p>
        </div>
      </div>

      {/* Memory notice */}
      <div className="bg-blue/5 border border-blue/20 rounded-[10px] p-3 mx-4 mb-4">
        <p className="text-xs font-semibold text-navy mb-1">
          ⚡ Session memory active
        </p>
        <p className="text-xs text-muted">
          Coach remembers your conversation. Resets on page refresh.
        </p>
      </div>
    </aside>
  )
}
