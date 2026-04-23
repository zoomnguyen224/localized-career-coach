'use client'

import Link from 'next/link'
import styles from './TopBar.module.css'

type NavKey = 'home' | 'jobs' | 'careermap' | 'events'

interface TopBarProps {
  activeNav: NavKey
  onOpenChat: () => void
}

const NAV: { key: NavKey; href: string; label: string; iconPath: string }[] = [
  { key: 'home', href: '/home', label: 'Home',
    iconPath: 'M3 12l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z' },
  { key: 'events', href: '/events', label: 'Events',
    iconPath: 'M3 5h18v16H3zM8 3v4M16 3v4M3 9h18' },
  { key: 'jobs', href: '/jobs', label: 'Jobs',
    iconPath: 'M3 7h18v14H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' },
  { key: 'careermap', href: '/career-map', label: 'Career Map',
    iconPath: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zM12 3v3M12 18v3M3 12h3M18 12h3' },
]

export function TopBar({ activeNav, onOpenChat }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <span className={styles.brandMark} />
        <span>Localiz<em>ed</em></span>
      </div>

      <nav className={styles.nav}>
        {NAV.map(item => (
          <Link
            key={item.key}
            href={item.href}
            className={activeNav === item.key ? styles.on : ''}
          >
            <svg className={styles.ic} viewBox="0 0 24 24">
              <path d={item.iconPath} />
            </svg>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.topRight}>
        <button type="button" className={styles.iconBtn} aria-label="Search">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Career agent chat"
          onClick={onOpenChat}
        >
          <svg className={styles.ic} viewBox="0 0 24 24">
            <path d="M21 12a8 8 0 0 1-11.3 7.3L4 21l1.7-5.7A8 8 0 1 1 21 12z" />
          </svg>
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Notifications">
          <svg className={styles.ic} viewBox="0 0 24 24">
            <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 0 0 4 0" />
          </svg>
        </button>
        <div className={styles.avatar}>AH</div>
      </div>
    </header>
  )
}
