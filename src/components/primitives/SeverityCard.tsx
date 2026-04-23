import styles from './SeverityCard.module.css'

type Tone = 'high' | 'med' | 'info'

interface SeverityCardProps {
  tone: Tone
  label: string
  when: string
  title: React.ReactNode
  forYou: { label: string; body: React.ReactNode }
  eventsHeader?: string
  children?: React.ReactNode
}

export function SeverityCard({
  tone,
  label,
  when,
  title,
  forYou,
  eventsHeader,
  children,
}: SeverityCardProps) {
  return (
    <article className={`${styles.root} ${styles[tone]}`}>
      <span className={styles.tick} />
      <div className={styles.sev}>
        <span className={styles.dot} />
        {label}
        <span className={styles.sep}>·</span>
        <span className={styles.when}>{when}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.forYou}>
        <div className={styles.forYouLbl}>{forYou.label}</div>
        <div className={styles.forYouBody}>{forYou.body}</div>
      </div>
      {children && (
        <div className={styles.evList}>
          {eventsHeader && <div className={styles.evCtx}>{eventsHeader}</div>}
          {children}
        </div>
      )}
    </article>
  )
}
