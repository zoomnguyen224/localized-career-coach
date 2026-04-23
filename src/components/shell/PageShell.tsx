import styles from './PageShell.module.css'

export function PageShell({ children }: { children: React.ReactNode }) {
  return <main className={styles.page}>{children}</main>
}
