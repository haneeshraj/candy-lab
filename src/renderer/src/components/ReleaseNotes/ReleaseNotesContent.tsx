import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import styles from './ReleaseNotesContent.module.scss'

interface ReleaseInfo {
  version: string
  name: string
  notes: string
  url: string
  publishedAt: string
}

type State =
  { status: 'loading' } | { status: 'error' } | { status: 'ready'; release: ReleaseInfo | null }

/** ISO timestamp → readable date, or empty string if missing/invalid. */
function formatDate(iso: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
}

/**
 * Contents of the "Release Notes" modal. Fetches the GitHub release for the
 * currently installed version on open and renders its version, date, and
 * Markdown notes.
 */
export function ReleaseNotesContent(): React.JSX.Element {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    window.api.updater
      .getCurrentRelease()
      .then((release) => {
        if (!cancelled) setState({ status: 'ready', release })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className={styles.muted}>Loading release notes…</p>
  }

  if (state.status === 'error' || !state.release) {
    return (
      <p className={styles.muted}>
        Couldn’t load release notes. Check your connection and try again.
      </p>
    )
  }

  const { version, name, notes, url, publishedAt } = state.release
  const date = formatDate(publishedAt)

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className={styles.version}>{version || name}</span>
        {date && <span className={styles.date}>{date}</span>}
      </header>

      {notes ? (
        <div className={styles.notes}>
          <Markdown>{notes}</Markdown>
        </div>
      ) : (
        <p className={styles.muted}>No notes for this release.</p>
      )}

      {url && (
        <a
          className={styles.link}
          href={url}
          onClick={(event) => {
            event.preventDefault()
            void window.api.system.openExternal(url)
          }}
        >
          View on GitHub
        </a>
      )}
    </div>
  )
}
