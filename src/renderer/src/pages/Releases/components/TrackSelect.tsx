import { useMemo, useRef, useState } from 'react'
import { useOnClickOutside } from '@renderer/hooks'
import { PROJECT_TYPE_LABELS } from '../constants'
import type { Release } from '../types'
import styles from './TrackSelect.module.scss'

interface TrackSelectProps {
  label?: string
  /** Pool of releases that can be linked as tracks. */
  options: Release[]
  /** Ordered IDs of the currently-selected tracks. */
  selectedIds: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}

/**
 * Relational multi-select for an Album/EP's tracklist: search the pool of
 * existing releases and add them as ordered, removable chips. Mirrors
 * `ArtistSelect`, but selections reference real release rows (no inline create)
 * and their order is preserved — that order is persisted as the tracklist.
 */
export function TrackSelect({
  label,
  options,
  selectedIds,
  onChange,
  loading = false
}: TrackSelectProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  useOnClickOutside(containerRef, () => setOpen(false))

  const byId = useMemo(() => new Map(options.map((release) => [release.id, release])), [options])

  // Selected releases, in tracklist order; drop ids no longer in the pool.
  const selected = selectedIds
    .map((id) => byId.get(id))
    .filter((release): release is Release => Boolean(release))

  const trimmed = query.trim().toLowerCase()
  const suggestions = options.filter(
    (release) =>
      !selectedIds.includes(release.id) &&
      (release.projectName.toLowerCase().includes(trimmed) ||
        release.artists.some((artist) => artist.name.toLowerCase().includes(trimmed)))
  )

  const add = (id: string): void => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id])
    setQuery('')
  }

  const remove = (id: string): void => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id))
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (suggestions.length > 0) add(suggestions[0].id)
    } else if (event.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    }
  }

  return (
    <div className={styles.field} ref={containerRef}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.box} onFocus={() => setOpen(true)}>
        {selected.map((release, index) => (
          <span key={release.id} className={styles.chip}>
            <span className={styles.chipIndex}>{index + 1}</span>
            {release.projectName}
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove ${release.projectName}`}
              onClick={() => remove(release.id)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className={styles.input}
          value={query}
          placeholder={selected.length === 0 ? 'Search releases to add as tracks…' : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && (
        <ul className={styles.dropdown}>
          {loading ? (
            <li className={styles.empty}>Loading releases…</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((release) => (
              <li key={release.id}>
                <button type="button" className={styles.option} onClick={() => add(release.id)}>
                  <span className={styles.optionName}>{release.projectName}</span>
                  <span className={styles.optionMeta}>
                    {PROJECT_TYPE_LABELS[release.projectType]}
                    {release.artists.length > 0 &&
                      ` · ${release.artists.map((artist) => artist.name).join(', ')}`}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className={styles.empty}>
              {options.length === 0 ? 'No releases available to add.' : 'No matches.'}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
