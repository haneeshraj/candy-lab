import type { ReactNode } from 'react'
import styles from './PageLayout.module.scss'

interface PageLayoutProps {
  children: ReactNode
}

/**
 * Common layout applied to every routed page (wired in the router). Provides a
 * consistent gap from the sidebar and a minimum height of the remaining space
 * below the title bar, so pages don't each re-implement the frame.
 */
export function PageLayout({ children }: PageLayoutProps): React.JSX.Element {
  return <div className={styles.page}>{children}</div>
}
