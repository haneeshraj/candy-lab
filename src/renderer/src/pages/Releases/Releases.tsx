import { useMemo, useState } from 'react'
import { Button, ConfirmDialog, TextField } from '@renderer/components/ui'
import { ReleaseCard } from './components/ReleaseCard'
import { ReleaseDetailModal } from './components/ReleaseDetailModal'
import { ReleaseFormModal } from './components/ReleaseFormModal'
import { useReleases } from './hooks/useReleases'
import type { Release } from './types'
import { errorMessage } from './utils'
import styles from './Releases.module.scss'

/** Releases dashboard: searchable catalog with create/edit/delete flows. */
export default function Releases(): React.JSX.Element {
  const { releases, loading, error, reload } = useReleases()
  const [query, setQuery] = useState('')

  const [viewing, setViewing] = useState<Release | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Release | null>(null)

  const [deleting, setDeleting] = useState<Release | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return releases
    return releases.filter(
      (release) =>
        release.projectName.toLowerCase().includes(term) ||
        release.artists.some((artist) => artist.name.toLowerCase().includes(term))
    )
  }, [releases, query])

  const openAdd = (): void => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (release: Release): void => {
    setEditing(release)
    setFormOpen(true)
  }

  const requestDelete = (release: Release): void => {
    setDeleteError(null)
    setDeleting(release)
  }

  const confirmDelete = async (): Promise<void> => {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await window.api.releases.remove(deleting.id)
      setDeleting(null)
      await reload()
    } catch (err) {
      setDeleteError(errorMessage(err, 'Failed to delete release.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <div className={styles.releases}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Releases</h1>
          <p className={styles.subtitle}>
            {releases.length} {releases.length === 1 ? 'release' : 'releases'} in your catalog
          </p>
        </div>
        <Button onClick={openAdd}>+ Add Release</Button>
      </header>

      <div className={styles.toolbar}>
        <TextField
          type="search"
          placeholder="Search by project or artist…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className={styles.search}
        />
      </div>

      {loading ? (
        <p className={styles.state}>Loading releases…</p>
      ) : error ? (
        <div className={styles.state}>
          <p className={styles.error}>{error}</p>
          <Button variant="secondary" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : releases.length === 0 ? (
        <div className={styles.state}>
          <p>No releases yet.</p>
          <Button onClick={openAdd}>Add your first release</Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className={styles.state}>No releases match “{query}”.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((release) => (
            <ReleaseCard key={release.id} release={release} onOpen={setViewing} />
          ))}
        </div>
      )}

      <ReleaseDetailModal
        release={viewing}
        onClose={() => setViewing(null)}
        onEdit={(release) => {
          setViewing(null)
          openEdit(release)
        }}
        onDelete={(release) => {
          setViewing(null)
          requestDelete(release)
        }}
      />

      <ReleaseFormModal
        isOpen={formOpen}
        release={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => void reload()}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title="Delete release"
        message={
          deleteError ??
          `Delete “${deleting?.projectName}”? This removes the release, its artist links, and its media. This can't be undone.`
        }
        confirmLabel="Delete"
        danger
        busy={deleteBusy}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  )
}
