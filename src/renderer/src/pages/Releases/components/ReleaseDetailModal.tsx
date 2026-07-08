import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'

import {
  modalBackdrop,
  modalContent,
  motionSafePreset,
  useReducedMotionSafe
} from '@renderer/animations'
import { IconCheck, IconClose, IconEdit, IconLink, IconTrash } from '../../../assets/icons'
import { isMultiTrack, PROJECT_TYPE_LABELS } from '../constants'
import { useCountdown, type Countdown } from '../hooks/useCountdown'
import { useReleaseTracks } from '../hooks/useReleaseTracks'
import type { Release } from '../types'
import { buildReleaseUrl, formatReleaseDate, releaseInstant } from '../utils'
import styles from './ReleaseDetailModal.module.scss'

interface ReleaseDetailModalProps {
  /** The release to show, or `null` when closed. */
  release: Release | null
  onClose: () => void
  onEdit: (release: Release) => void
  onDelete: (release: Release) => void
  /** Open another release's detail view (used to drill into an album's tracks). */
  onOpenTrack: (release: Release) => void
}

const openExternal = (url: string): void => {
  void window.api.system.openExternal(url)
}

const resetCopyDelayMs = 1500

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the legacy fallback below.
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  let copied = false
  try {
    copied = document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }

  return copied
}

/**
 * The pre-release state of the stage: a live countdown to the release instant
 * plus the pre-save link, shown in place of the streaming platform links. The
 * parent only renders this while `now` is before the release date, so it never
 * needs to know the date has passed — it simply disappears when the parent
 * re-evaluates (the countdown flips `isComplete`).
 */
function PreReleaseCountdown({
  countdown,
  preSaveLink
}: {
  countdown: Countdown
  preSaveLink: string | null
}): React.JSX.Element {
  const units: { label: string; value: number }[] = [
    { label: 'Days', value: countdown.days },
    { label: 'Hrs', value: countdown.hours },
    { label: 'Min', value: countdown.minutes },
    { label: 'Sec', value: countdown.seconds }
  ]

  return (
    <div className={styles.preSave}>
      <div className={styles.countdown} role="timer" aria-label="Time until release">
        {units.map((unit) => (
          <div key={unit.label} className={styles.countUnit}>
            <span className={styles.countValue}>{String(unit.value).padStart(2, '0')}</span>
            <span className={styles.countLabel}>{unit.label}</span>
          </div>
        ))}
      </div>

      {preSaveLink && (
        <button
          type="button"
          className={styles.preSaveButton}
          onClick={() => openExternal(preSaveLink)}
        >
          Pre-save
        </button>
      )}
    </div>
  )
}

/**
 * The visual "stage": the Spotify canvas video (or blurred cover art) with the
 * cover + track details pinned to the bottom. It fills its container, so it's
 * the whole dialog for a standalone release and the left column for an Album/EP.
 */
function ReleaseStage({ release }: { release: Release }): React.JSX.Element {
  const artistNames = release.artists.map((artist) => artist.name).join(', ')
  const date = formatReleaseDate(release.releaseDate)

  // Pre-release: while the release date is still in the future, show a live
  // countdown + pre-save link and hide every streaming platform link (even ones
  // already added). The countdown flips `isComplete` the moment the date arrives,
  // switching this view over to the platform links with no data change or edit.
  const countdown = useCountdown(releaseInstant(release))
  const preRelease = !countdown.isComplete

  return (
    <div className={styles.stage}>
      {/* Background: canvas video, else blurred cover art, else gradient. */}
      {release.canvasUrl ? (
        <video className={styles.media} src={release.canvasUrl} autoPlay loop muted playsInline />
      ) : release.coverArtUrl ? (
        <img className={`${styles.media} ${styles.blur}`} src={release.coverArtUrl} alt="" />
      ) : null}
      <div className={styles.overlay} />

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

          {preRelease ? (
            <PreReleaseCountdown countdown={countdown} preSaveLink={release.preSaveLink} />
          ) : (
            Object.keys(release.platformLinks).length > 0 && (
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
            )
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
    </div>
  )
}

/**
 * The right-hand tracklist for an Album/EP: a row-wise list of the linked track
 * releases. Clicking a row opens that track's own detail view via `onOpenTrack`.
 */
function TrackList({
  album,
  onOpenTrack
}: {
  album: Release
  onOpenTrack: (release: Release) => void
}): React.JSX.Element {
  const { tracks, loading, error } = useReleaseTracks(album)

  return (
    <div className={styles.tracks}>
      <div className={styles.tracksHead}>
        <h3 className={styles.tracksTitle}>Tracks</h3>
        {tracks.length > 0 && <span className={styles.tracksCount}>{tracks.length}</span>}
      </div>

      <div className={styles.trackScroll}>
        {loading ? (
          <p className={styles.tracksState}>Loading tracks…</p>
        ) : error ? (
          <p className={`${styles.tracksState} ${styles.tracksError}`}>{error}</p>
        ) : tracks.length === 0 ? (
          <p className={styles.tracksState}>No tracks linked yet.</p>
        ) : (
          <ul className={styles.trackRows}>
            {tracks.map((track, index) => (
              <li key={track.id}>
                <button
                  type="button"
                  className={styles.trackRow}
                  onClick={() => onOpenTrack(track)}
                >
                  <span className={styles.trackIndex}>{index + 1}</span>
                  <span className={styles.trackThumb}>
                    {track.coverArtUrl ? (
                      <img src={track.coverArtUrl} alt="" />
                    ) : (
                      <span aria-hidden>♪</span>
                    )}
                  </span>
                  <span className={styles.trackMeta}>
                    <span className={styles.trackName}>{track.projectName}</span>
                    {track.artists.length > 0 && (
                      <span className={styles.trackArtists}>
                        {track.artists.map((artist) => artist.name).join(', ')}
                      </span>
                    )}
                  </span>
                  <span className={styles.trackType}>{PROJECT_TYPE_LABELS[track.projectType]}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/**
 * Full-bleed detail view for a release. Standalone releases show the stage alone;
 * Albums and EPs use a two-column layout — the stage on the left, a scrollable
 * tracklist on the right whose rows drill into each track's own detail view.
 */
export function ReleaseDetailModal({
  release,
  onClose,
  onEdit,
  onDelete,
  onOpenTrack
}: ReleaseDetailModalProps): React.JSX.Element {
  const reduced = useReducedMotionSafe()
  const [copied, setCopied] = useState(false)
  const isAlbum = release ? isMultiTrack(release.projectType) : false

  useEffect(() => {
    if (!copied) return undefined

    const timeout = window.setTimeout(() => setCopied(false), resetCopyDelayMs)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleCopyLink = async (): Promise<void> => {
    if (!release) return

    const didCopy = await copyText(buildReleaseUrl(release))
    if (didCopy) setCopied(true)
  }

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
            className={`${styles.dialog} ${isAlbum ? styles.album : ''}`}
            onClick={(event) => event.stopPropagation()}
            {...motionSafePreset(modalContent, reduced)}
          >
            <div className={styles.topbar}>
              <button
                type="button"
                className={`${styles.iconButton} ${copied ? styles.copied : ''}`}
                aria-label={copied ? 'Release link copied' : 'Copy release link'}
                title={copied ? 'Copied' : 'Copy release link'}
                onClick={() => void handleCopyLink()}
              >
                {copied ? (
                  <IconCheck width={18} height={18} />
                ) : (
                  <IconLink width={18} height={18} />
                )}
              </button>
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

            {isAlbum ? (
              <div className={styles.columns}>
                <ReleaseStage release={release} />
                <TrackList album={release} onOpenTrack={onOpenTrack} />
              </div>
            ) : (
              <ReleaseStage release={release} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
