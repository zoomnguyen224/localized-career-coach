import styles from './SectionLabel.module.css'

interface SectionLabelProps {
  number: string
  title: string
  meta?: React.ReactNode
}

export function SectionLabel({ number, title, meta }: SectionLabelProps) {
  return (
    <div className={styles.root}>
      <span className={styles.num}>{number}</span>
      <span>{title}</span>
      <span className={styles.line} />
      {meta && <span className={styles.meta}>{meta}</span>}
    </div>
  )
}
