import { useCallback, useEffect, useState } from 'react'
import type { Artist } from '../types'

interface UseArtists {
  artists: Artist[]
  reload: () => Promise<void>
  /** Get-or-create an artist by name and merge it into the cached list. */
  addArtist: (name: string) => Promise<Artist>
}

/**
 * Caches the artist list for the multi-select dropdown and exposes an
 * inline-create action that keeps the cache in sync. The mount fetch writes
 * state only after `await` (cancelled-guarded), like `useAppBootstrap`.
 */
export function useArtists(): UseArtists {
  const [artists, setArtists] = useState<Artist[]>([])

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const list = await window.api.releases.listArtists()
        if (!cancelled) setArtists(list)
      } catch {
        // Non-fatal: the dropdown just stays empty; creation still works.
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async (): Promise<void> => {
    try {
      setArtists(await window.api.releases.listArtists())
    } catch {
      setArtists([])
    }
  }, [])

  const addArtist = useCallback(async (name: string): Promise<Artist> => {
    const artist = await window.api.releases.createArtist(name)
    setArtists((prev) =>
      prev.some((existing) => existing.id === artist.id)
        ? prev
        : [...prev, artist].sort((a, b) => a.name.localeCompare(b.name))
    )
    return artist
  }, [])

  return { artists, reload, addArtist }
}
