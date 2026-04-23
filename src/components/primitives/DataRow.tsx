import Link from 'next/link'
import styles from './DataRow.module.css'

type Tone = 'up' | 'down' | 'neutral' | 'high'

interface DataRowProps {
  logo: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  tail?: { text: React.ReactNode; tone?: Tone }
  href?: string
}

export function DataRow({ logo, title, sub, tail, href }: DataRowProps) {
  const inner = (
    <>
      <span className={styles.logo}>{logo}</span>
      <span className={styles.body}>
        <span className={styles.title}>{title}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </span>
      {tail && (
        <span className={`${styles.tail} ${tail.tone ? styles[tail.tone] : ''}`}>
          {tail.text}
        </span>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={styles.row}>
        {inner}
      </Link>
    )
  }
  return <div className={styles.row}>{inner}</div>
}
