import styles from './Hero.module.css'

interface BylineEntry {
  label?: string
  value: React.ReactNode
  dotColor?: string
}

interface HeroProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  byline?: BylineEntry[]
}

export function Hero({ title, subtitle, byline }: HeroProps) {
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        {title}
        {subtitle && (
          <>
            <br />
            <span className={styles.sub}>{subtitle}</span>
          </>
        )}
      </h1>
      {byline && byline.length > 0 && (
        <div className={styles.byline}>
          {byline.map((entry, i) => (
            <div key={i}>
              {entry.dotColor && (
                <span className={styles.dot} style={{ color: entry.dotColor }}>●</span>
              )}
              {entry.label && <span>{entry.label} · </span>}
              <strong>{entry.value}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
