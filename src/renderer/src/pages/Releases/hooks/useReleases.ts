import { useCallback, useEffect, useState } from 'react'
import type { Release } from '../types'
import { errorMessage } from '../utils'

interface UseReleases {
  releases: Release[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/**
 * Fetches releases from the main process and tracks loading/error state. I/O
 * lives in this hook (not a store), per the state-management guide.
 *
 * The mount fetch runs inside the effect and only writes state *after* the
 * `await` (with a cancelled guard), matching the `useAppBootstrap` pattern so
 * nothing is set synchronously in the effect. `reload` is for event handlers
 * (retry / after-create), where a synchronous loading flag is fine.
 */
export function useReleases(): UseReleases {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const data = await window.api.releases.list()
        if (!cancelled) {
          setReleases(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Failed to load releases.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.releases.list()
      setReleases(data)
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load releases.'))
    } finally {
      setLoading(false)
    }
  }, [])

  return { releases, loading, error, reload }
}
