import { useEffect, useState } from 'react'
import { isMultiTrack } from '../constants'
import type { Release } from '../types'

/** Upper bound on candidate tracks fetched for the picker — comfortably above
 * this app's catalog scale, so a single request covers every pickable release. */
const MAX_OPTIONS = 1000

interface UseTrackOptions {
  /** Releases that can be added as tracks (standalone types only). */
  options: Release[]
  loading: boolean
}

/**
 * Loads the pool of releases that can be linked as tracks on an Album/EP:
 * standalone types only (singles, remixes, bootlegs, compilations — never other
 * albums/EPs) and never the release being edited. Fetched once when `enabled`
 * flips true, mirroring the cancelled-guarded mount-fetch pattern used across
 * the Releases hooks. Skips the request entirely until the section is shown.
 */
export function useTrackOptions(enabled: boolean, excludeId?: string): UseTrackOptions {
  const [options, setOptions] = useState<Release[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false
    const load = async (): Promise<void> => {
      setLoading(true)
      try {
        const page = await window.api.releases.list(0, MAX_OPTIONS)
        if (cancelled) return
        setOptions(
          page.releases.filter(
            (release) => !isMultiTrack(release.projectType) && release.id !== excludeId
          )
        )
      } catch {
        // Non-fatal: the picker just shows no options; the modal-level submit
        // surfaces any persistent failure.
        if (!cancelled) setOptions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [enabled, excludeId])

  return { options, loading }
}
