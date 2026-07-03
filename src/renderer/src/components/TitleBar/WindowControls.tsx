import { useEffect, useState } from 'react'
import styles from './WindowControls.module.scss'

/** Minimize / maximize-restore / close buttons, wired to the window bridge. */
export function WindowControls(): React.JSX.Element {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    void window.api.window.isMaximized().then(setMaximized)
    return window.api.window.onMaximizeChange(setMaximized)
  }, [])

  return (
    <div className={styles.controls}>
      <button className={styles.button} aria-label="Minimize" onClick={window.api.window.minimize}>
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 5h10" />
        </svg>
      </button>

      <button
        className={styles.button}
        aria-label={maximized ? 'Restore' : 'Maximize'}
        onClick={window.api.window.maximize}
      >
        {maximized ? (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="0.5" y="2.5" width="7" height="7" />
            <path d="M2.5 2.5V0.5h7v7h-2" />
          </svg>
        ) : (
          <svg viewBox="0 0 10 10" aria-hidden="true">
            <rect x="0.5" y="0.5" width="9" height="9" />
          </svg>
        )}
      </button>

      <button
        className={`${styles.button} ${styles.close}`}
        aria-label="Close"
        onClick={window.api.window.close}
      >
        <svg viewBox="0 0 10 10" aria-hidden="true">
          <path d="M0 0l10 10M10 0L0 10" />
        </svg>
      </button>
    </div>
  )
}
