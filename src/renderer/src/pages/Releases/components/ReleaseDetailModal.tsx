import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

import {
  modalBackdrop,
  modalContent,
  motionSafePreset,
  useReducedMotionSafe
} from '@renderer/animations'
import { IconClose, IconEdit, IconTrash } from '../../../assets/icons'
import { PROJECT_TYPE_LABELS } from '../constants'
import type { Release } from '../types'
import { formatReleaseDate } from '../utils'
import styles from './ReleaseDetailModal.module.scss'

interface ReleaseDetailModalProps {
  /** The release to show, or `null` when closed. */
  release: Release | null
  onClose: () => void
  onEdit: (release: Release) => void
  onDelete: (release: Release) => void
}

const openExternal = (url: string): void => {
  void window.api.system.openExternal(url)
}

/**
 * Full-bleed detail view for a release: the Spotify canvas video plays behind a
 * dark overlay (falls back to blurred cover art), with the cover + track details
 * pinned to the bottom and edit/delete actions in the top bar.
 */
export function ReleaseDetailModal({
  release,
  onClose,
  onEdit,
  onDelete
}: ReleaseDetailModalProps): React.JSX.Element {
  const reduced = useReducedMotionSafe()

  const artistNames = release?.artists.map((artist) => artist.name).join(', ') ?? ''
  const date = release ? formatReleaseDate(release.releaseDate) : ''

  return createPortal(
    <AnimatePresence>
      {release && (
        <motion.div
          className={styles.backdrop}
          onClick={onClose}
          {...motionSafePreset(modalBackdrop, reduced)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={release.projectName}
            className={styles.dialog}
            onClick={(event) => event.stopPropagation()}
            {...motionSafePreset(modalContent, reduced)}
          >
            {/* Background: canvas video, else blurred cover art, else gradient. */}
            {release.canvasUrl ? (
              <video
                className={styles.media}
                src={release.canvasUrl}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : release.coverArtUrl ? (
              <img className={`${styles.media} ${styles.blur}`} src={release.coverArtUrl} alt="" />
            ) : null}
            <div className={styles.overlay} />

            <div className={styles.topbar}>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Edit release"
                onClick={() => onEdit(release)}
              >
                <IconEdit width={18} height={18} />
              </button>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.danger}`}
                aria-label="Delete release"
                onClick={() => onDelete(release)}
              >
                <IconTrash width={18} height={18} />
              </button>
              <button
                type="button"
                className={styles.iconButton}
                aria-label="Close"
                onClick={onClose}
              >
                <IconClose width={18} height={18} />
              </button>
            </div>

            <div className={styles.bottom}>
              <div className={styles.cover}>
                {release.coverArtUrl ? (
                  <img className={styles.coverArt} src={release.coverArtUrl} alt="" />
                ) : (
                  <span className={styles.coverPlaceholder} aria-hidden>
                    ♪
                  </span>
                )}
              </div>

              <div className={styles.info}>
                <div className={styles.titleRow}>
                  <h2 className={styles.name}>{release.projectName}</h2>
                  <span className={styles.type}>{PROJECT_TYPE_LABELS[release.projectType]}</span>
                  {release.previewEnabled && <span className={styles.live}>● Live</span>}
                </div>

                {artistNames && <p className={styles.artists}>{artistNames}</p>}
                {date && <p className={styles.date}>{date}</p>}

                {release.genres.length > 0 && (
                  <div className={styles.tags}>
                    {release.genres.map((genre) => (
                      <span key={genre} className={styles.tag}>
                        {genre}
                      </span>
                    ))}
                  </div>
                )}

                {Object.keys(release.platformLinks).length > 0 && (
                  <div className={styles.links}>
                    {Object.entries(release.platformLinks).map(([platform, url]) => (
                      <button
                        key={platform}
                        type="button"
                        className={styles.link}
                        onClick={() => openExternal(url)}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                )}

                {(release.visualLink || release.masterLink) && (
                  <div className={styles.links}>
                    {release.visualLink && (
                      <button
                        type="button"
                        className={styles.link}
                        onClick={() => openExternal(release.visualLink as string)}
                      >
                        Visual
                      </button>
                    )}
                    {release.masterLink && (
                      <button
                        type="button"
                        className={styles.link}
                        onClick={() => openExternal(release.masterLink as string)}
                      >
                        Master
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
