'use client'

import Link from 'next/link'
import styles from './WorkStrip.module.css'

export type WorkNavKey = 'dashboard' | 'applications' | 'cv' | 'interview' | null

const ITEMS: { key: Exclude<WorkNavKey, null>; href: string; label: string }[] = [
  { key: 'dashboard', href: '/dashboard', label: 'Dashboard' },
  { key: 'applications', href: '/applications', label: 'Applications' },
  { key: 'cv', href: '/cv', label: 'My CV' },
  { key: 'interview', href: '/interview', label: 'Interview Prep' },
]

export function WorkStrip({ activeNav }: { activeNav: WorkNavKey }) {
  return (
    <div className={styles.strip}>
      <span className={styles.label}>MY WORK</span>
      <span className={styles.sep} />
      {ITEMS.map(item => (
        <Link
          key={item.key}
          href={item.href}
          className={activeNav === item.key ? `${styles.link} ${styles.on}` : styles.link}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
