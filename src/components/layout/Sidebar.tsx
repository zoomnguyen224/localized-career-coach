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

export default function Sidebar({ profile }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-border flex flex-col flex-shrink-0 hidden md:flex">
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

      <div className="bg-blue/5 border border-blue/20 rounded-[10px] p-3 m-4">
        <p className="text-xs font-semibold text-navy mb-1">
          ⚡ Session memory active
        </p>
        <p className="text-xs text-muted">
          Coach remembers your conversation.
        </p>
        <p className="text-xs text-muted">
          Resets on page refresh.
        </p>
      </div>
    </aside>
  )
}
