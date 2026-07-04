import { useElectronStore, type UpdateStatus } from '@renderer/store'
import styles from './UpdaterContent.module.scss'

function describe(status: UpdateStatus, version: string | null, percent: number | null): string {
  switch (status) {
    case 'checking':
      return 'Checking for updates…'
    case 'available':
      return `Update ${version ? `v${version} ` : ''}found — downloading…`
    case 'downloading':
      return `Downloading update${typeof percent === 'number' ? ` (${percent}%)` : ''}…`
    case 'ready':
      return `Update ${version ? `v${version} ` : ''}downloaded. Restart to install.`
    case 'error':
      return 'Update check failed. Please try again.'
    default:
      return "You're up to date."
  }
}

/**
 * Contents of the "Check for updates" modal. Reflects the live auto-updater
 * state from the store and offers manual check / restart-to-install actions.
 */
export function UpdaterContent(): React.JSX.Element {
  const status = useElectronStore((state) => state.updateStatus)
  const version = useElectronStore((state) => state.updateVersion)
  const percent = useElectronStore((state) => state.downloadProgress)

  const busy = status === 'checking' || status === 'downloading'

  return (
    <div className={styles.root}>
      <p className={styles.status}>{describe(status, version, percent)}</p>

      {status === 'downloading' && typeof percent === 'number' && (
        <div className={styles.bar}>
          <div className={styles.fill} style={{ width: `${percent}%` }} />
        </div>
      )}

      <div className={styles.actions}>
        {status === 'ready' ? (
          <button
            type="button"
            className={`${styles.button} ${styles.primary}`}
            onClick={() => window.api.updater.install()}
          >
            Restart &amp; Install
          </button>
        ) : (
          <button
            type="button"
            className={styles.button}
            disabled={busy}
            onClick={() => void window.api.updater.check()}
          >
            {status === 'checking' ? 'Checking…' : 'Check for updates'}
          </button>
        )}
      </div>
    </div>
  )
}
