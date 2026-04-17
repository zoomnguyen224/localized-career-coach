'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, ClipboardList, FileText, Target, Settings } from 'lucide-react'

interface AppSidebarProps {
  onOpenChat: () => void
}

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs', badge: '12' },
  { href: '/applications', icon: ClipboardList, label: 'Applications' },
  { href: '/cv', icon: FileText, label: 'My CV' },
  { href: '/interview', icon: Target, label: 'Interview Prep' },
]

export function AppSidebar({ onOpenChat }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-[228px] bg-white border-r border-[#DCDFE8] flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DCDFE8] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-sm">
          🌍
        </div>
        <span className="text-base font-extrabold text-[#06123C]">
          Local<span className="text-[#4584FF]">ized</span>
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#ECF3FF] text-[#4584FF]'
                  : 'text-[#727998] hover:bg-[#F2F3F6] hover:text-[#06123C]'
              }`}
            >
              <item.icon size={17} />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-[#4584FF] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        <div className="h-px bg-[#DCDFE8] my-2" />

        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-sm font-semibold text-[#727998] hover:bg-[#F2F3F6] hover:text-[#06123C] transition-colors"
        >
          <Settings size={17} />
          Settings
        </Link>
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-[#DCDFE8] flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          AN
        </div>
        <div>
          <div className="text-[13px] font-bold text-[#06123C]">Ahmed N.</div>
          <div className="text-[11px] text-[#727998]">AI Engineer · Dubai</div>
        </div>
      </div>

      {/* Chat FAB */}
      <button
        onClick={onOpenChat}
        className="absolute bottom-7 right-7 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-[#4584FF] to-[#03BA82] flex items-center justify-center text-xl shadow-lg shadow-blue-400/30 z-50"
        title="Ask your career agent"
      >
        💬
      </button>
    </aside>
  )
}
