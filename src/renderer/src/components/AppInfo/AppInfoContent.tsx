import { useElectronStore } from '@renderer/store'
import { Logo } from '../../assets/Logo'
import styles from './AppInfoContent.module.scss'

/** ISO timestamp → locale date, falling back to the raw string if unparseable. */
function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString()
}

/**
 * Contents of the "App Info" modal. Reads static metadata from the electron
 * store (populated at bootstrap via `window.api.app.getInfo()`) and runtime
 * versions from the preload's `window.electron.process`.
 */
export function AppInfoContent(): React.JSX.Element {
  const appInfo = useElectronStore((state) => state.appInfo)
  const platform = useElectronStore((state) => state.platform)

  if (!appInfo) return <p className={styles.empty}>Loading…</p>

  const versions = window.electron.process.versions
  const rows: Array<[string, string]> = [
    ['Version', appInfo.version],
    ['Platform', platform ?? '—'],
    ['License', appInfo.license],
    ['Author', appInfo.author],
    ['Commit', appInfo.commit],
    ['Built', formatDate(appInfo.buildDate)]
  ]

  const openHomepage = (): void => {
    if (appInfo.homepage) void window.api.system.openExternal(appInfo.homepage)
  }

  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <span className={styles.logo}>
          <Logo width={40} height={40} />
        </span>
        <div>
          <p className={styles.name}>{appInfo.name}</p>
          {appInfo.description && <p className={styles.description}>{appInfo.description}</p>}
        </div>
      </div>

      <dl className={styles.meta}>
        {rows.map(([label, value]) => (
          <div key={label} className={styles.row}>
            <dt className={styles.label}>{label}</dt>
            <dd className={styles.value}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className={styles.runtime}>
        <span>Electron {versions.electron}</span>
        <span>Chromium {versions.chrome}</span>
        <span>Node {versions.node}</span>
      </div>

      {appInfo.homepage && (
        <button type="button" className={styles.link} onClick={openHomepage}>
          Website
        </button>
      )}
    </div>
  )
}
