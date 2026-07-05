import { PROJECT_TYPE_LABELS } from '../constants'
import type { Release } from '../types'
import { formatReleaseDate } from '../utils'
import styles from './ReleaseCard.module.scss'

interface ReleaseCardProps {
  release: Release
  /** Open the detail view for this release. */
  onOpen: (release: Release) => void
}

/** Summary card for a single release. Clicking (or Enter/Space) opens the detail
 * view; edit/delete live there. */
export function ReleaseCard({ release, onOpen }: ReleaseCardProps): React.JSX.Element {
  const artistNames = release.artists.map((artist) => artist.name).join(', ')
  const date = formatReleaseDate(release.releaseDate)
  const platforms = Object.keys(release.platformLinks)

  const open = (): void => onOpen(release)
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }

  return (
    <article
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <div className={styles.cover}>
        {release.coverArtUrl ? (
          <img className={styles.art} src={release.coverArtUrl} alt="" />
        ) : (
          <span className={styles.placeholder} aria-hidden>
            ♪
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.head}>
          <h3 className={styles.name}>{release.projectName}</h3>
          <span className={styles.type}>{PROJECT_TYPE_LABELS[release.projectType]}</span>
        </div>

        {artistNames && <p className={styles.artists}>{artistNames}</p>}

        <div className={styles.meta}>
          {date && <span className={styles.date}>{date}</span>}
          {release.previewEnabled && <span className={styles.live}>● Live</span>}
        </div>

        {platforms.length > 0 && (
          <ul className={styles.platforms}>
            {platforms.map((platform) => (
              <li key={platform} className={styles.platform}>
                {platform}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
