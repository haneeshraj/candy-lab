import { useMemo, useRef, useState } from 'react'
import { Button, ConfirmDialog, TextField } from '@renderer/components/ui'
import { useIntersectionObserver } from '@renderer/hooks'
import { ReleaseCard } from './components/ReleaseCard'
import { ReleaseDetailModal } from './components/ReleaseDetailModal'
import { ReleaseFilterModal } from './components/ReleaseFilterModal'
import { ReleaseFormModal } from './components/ReleaseFormModal'
import { activeFilterCount, DEFAULT_FILTERS, type ReleaseFilters } from './constants'
import { useReleases } from './hooks/useReleases'
import type { Release } from './types'
import { compareReleases, errorMessage, matchesFilters } from './utils'
import styles from './Releases.module.scss'

/** Releases dashboard: searchable catalog with create/edit/delete flows. */
export default function Releases(): React.JSX.Element {
  const { releases, total, loading, loadingMore, hasMore, error, loadMore, reload } = useReleases()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<ReleaseFilters>(DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const filterCount = activeFilterCount(filters)

  // Sentinel at the end of the grid: when it scrolls into view, pull the next
  // page. Kept mounted while `hasMore` (and no load-more error), so a short
  // filtered result keeps loading pages to search the full catalog.
  const sentinelRef = useRef<HTMLDivElement>(null)
  useIntersectionObserver(sentinelRef, () => void loadMore(), { rootMargin: '400px' })

  const [viewing, setViewing] = useState<Release | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Release | null>(null)

  const [deleting, setDeleting] = useState<Release | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Filter + sort over the pages loaded so far. Like the search, this works on
  // the client: the infinite-scroll sentinel keeps pulling pages so a narrow
  // filter still ends up searching the whole catalog. Sorting a copy leaves the
  // fetched order (and `releases`) untouched.
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const result = releases.filter((release) => {
      if (!matchesFilters(release, filters)) return false
      if (!term) return true
      return (
        release.projectName.toLowerCase().includes(term) ||
        release.artists.some((artist) => artist.name.toLowerCase().includes(term))
      )
    })
    return result.sort((a, b) => compareReleases(a, b, filters.sort))
  }, [releases, query, filters])

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
            {total} {total === 1 ? 'release' : 'releases'} in your catalog
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
        <Button variant="secondary" onClick={() => setFilterOpen(true)} className={styles.control}>
          Filter & Sort{filterCount > 0 && ` (${filterCount})`}
        </Button>
      </div>

      {loading ? (
        <p className={styles.state}>Loading releases…</p>
      ) : error && releases.length === 0 ? (
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
      ) : (
        <>
          {filtered.length > 0 ? (
            <div className={styles.grid}>
              {filtered.map((release) => (
                <ReleaseCard key={release.id} release={release} onOpen={setViewing} />
              ))}
            </div>
          ) : (
            // Nothing loaded so far matches; if more pages remain the sentinel
            // below keeps loading them, otherwise this is the final answer.
            !hasMore && (
              <p className={styles.state}>
                {query.trim()
                  ? `No releases match “${query}”.`
                  : 'No releases match the current filter.'}
              </p>
            )
          )}

          {hasMore &&
            (error ? (
              <div className={styles.state}>
                <p className={styles.error}>{error}</p>
                <Button variant="secondary" onClick={() => void loadMore()}>
                  Retry
                </Button>
              </div>
            ) : (
              <div ref={sentinelRef} className={styles.sentinel}>
                {loadingMore && <span>Loading more…</span>}
              </div>
            ))}
        </>
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
        // Drilling into an album's track swaps the detail view to that track,
        // reusing the same modal (and its open animation).
        onOpenTrack={setViewing}
      />

      <ReleaseFilterModal
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
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
