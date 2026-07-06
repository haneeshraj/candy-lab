import { useEffect, useState } from 'react'
import { isMultiTrack } from '../constants'
import { errorMessage } from '../utils'
import type { Release } from '../types'

interface UseReleaseTracks {
  tracks: Release[]
  loading: boolean
  error: string | null
}

// State is tagged with the album it belongs to, so switching between releases
// (or to a non-album) reports empties immediately — derived on return rather
// than reset synchronously in the effect.
interface State {
  albumId: string | null
  tracks: Release[]
  loading: boolean
  error: string | null
}

const EMPTY: State = { albumId: null, tracks: [], loading: false, error: null }

/**
 * Resolves the child track releases for an Album/EP detail view. Re-fetches
 * whenever the shown release changes (so navigating between albums refreshes the
 * list) and is a no-op for non-album/EP releases. State is written only after
 * the `await` (cancelled-guarded), matching the other Releases hooks.
 */
export function useReleaseTracks(release: Release | null): UseReleaseTracks {
  const albumId = release && isMultiTrack(release.projectType) ? release.id : null

  const [state, setState] = useState<State>(EMPTY)

  useEffect(() => {
    if (!albumId) return undefined
    let cancelled = false
    const load = async (): Promise<void> => {
      setState({ albumId, tracks: [], loading: true, error: null })
      try {
        const result = await window.api.releases.tracks(albumId)
        if (!cancelled) setState({ albumId, tracks: result, loading: false, error: null })
      } catch (err) {
        if (!cancelled) {
          setState({
            albumId,
            tracks: [],
            loading: false,
            error: errorMessage(err, 'Failed to load tracks.')
          })
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [albumId])

  // Non-album release, or this album's fetch hasn't landed yet: report empties
  // (loading while a fetch for the current album is pending).
  if (!albumId) return EMPTY
  if (state.albumId !== albumId) return { tracks: [], loading: true, error: null }
  return { tracks: state.tracks, loading: state.loading, error: state.error }
}
