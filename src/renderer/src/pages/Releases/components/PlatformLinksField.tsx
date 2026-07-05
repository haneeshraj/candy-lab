import { TextField } from '@renderer/components/ui'
import styles from './PlatformLinksField.module.scss'

interface PlatformLinksFieldProps {
  label?: string
  /** The full set of selectable platforms. */
  platforms: readonly string[]
  /** Map of platform name → URL. A platform is "included" when its URL is set. */
  value: Record<string, string>
  onChange: (next: Record<string, string>) => void
}

/** One URL input per platform. Fill a platform's link to include it on the
 * release; leave it blank to omit it. */
export function PlatformLinksField({
  label,
  platforms,
  value,
  onChange
}: PlatformLinksFieldProps): React.JSX.Element {
  const set = (platform: string, url: string): void => onChange({ ...value, [platform]: url })

  return (
    <div className={styles.field}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.rows}>
        {platforms.map((platform) => (
          <TextField
            key={platform}
            label={platform}
            type="url"
            placeholder="https://…"
            value={value[platform] ?? ''}
            onChange={(event) => set(platform, event.target.value)}
          />
        ))}
      </div>
    </div>
  )
}
