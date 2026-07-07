import { useRef, useState } from 'react'
import { useOnClickOutside } from '@renderer/hooks'
import type { Artist } from '../types'
import styles from './ArtistSelect.module.scss'

interface ArtistSelectProps {
  label?: string
  artists: Artist[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  /** Get-or-create an artist by name; returns the (existing or new) artist.
   * Required unless `allowCreate` is false (e.g. when filtering). */
  onCreate?: (name: string) => Promise<Artist>
  /** Whether typing a new name offers to create it. Defaults to true; set false
   * to use this purely as a searchable picker over existing artists. */
  allowCreate?: boolean
  /** Placeholder shown when nothing is selected. */
  placeholder?: string
}

/**
 * Relational multi-select for artists: search the cached list, add existing
 * artists, and (when `allowCreate`) inline-create a new one via `onCreate`.
 * Selected artists show as removable chips.
 */
export function ArtistSelect({
  label,
  artists,
  selectedIds,
  onChange,
  onCreate,
  allowCreate = true,
  placeholder = 'Search or add an artist…'
}: ArtistSelectProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useOnClickOutside(containerRef, () => setOpen(false))

  const selected = selectedIds
    .map((id) => artists.find((artist) => artist.id === id))
    .filter((artist): artist is Artist => Boolean(artist))

  const trimmed = query.trim()
  const suggestions = artists.filter(
    (artist) =>
      !selectedIds.includes(artist.id) && artist.name.toLowerCase().includes(trimmed.toLowerCase())
  )
  const exactExists = artists.some((artist) => artist.name.toLowerCase() === trimmed.toLowerCase())
  const canCreate = allowCreate && Boolean(onCreate) && trimmed.length > 0 && !exactExists

  const add = (id: string): void => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id])
    setQuery('')
  }

  const remove = (id: string): void => {
    onChange(selectedIds.filter((selectedId) => selectedId !== id))
  }

  const create = async (): Promise<void> => {
    if (!canCreate || busy || !onCreate) return
    setBusy(true)
    try {
      const artist = await onCreate(trimmed)
      add(artist.id)
    } catch {
      // Swallow here; the modal-level submit surfaces persistent failures.
    } finally {
      setBusy(false)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault()
      if (suggestions.length > 0) add(suggestions[0].id)
      else void create()
    } else if (event.key === 'Backspace' && query === '' && selected.length > 0) {
      remove(selected[selected.length - 1].id)
    }
  }

  return (
    <div className={styles.field} ref={containerRef}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.box} onFocus={() => setOpen(true)}>
        {selected.map((artist) => (
          <span key={artist.id} className={styles.chip}>
            {artist.name}
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove ${artist.name}`}
              onClick={() => remove(artist.id)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className={styles.input}
          value={query}
          placeholder={selected.length === 0 ? placeholder : undefined}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul className={styles.dropdown}>
          {suggestions.map((artist) => (
            <li key={artist.id}>
              <button type="button" className={styles.option} onClick={() => add(artist.id)}>
                {artist.name}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                className={`${styles.option} ${styles.create}`}
                onClick={() => void create()}
                disabled={busy}
              >
                {busy ? 'Adding…' : `Create “${trimmed}”`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
