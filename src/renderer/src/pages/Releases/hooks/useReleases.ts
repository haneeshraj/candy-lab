import { useCallback, useEffect, useRef, useState } from 'react'
import type { Release } from '../types'
import { errorMessage } from '../utils'

/** How many releases to fetch per page (mirrors the service-side default). */
const PAGE_SIZE = 24

interface UseReleases {
  releases: Release[]
  /** Total releases in the catalog, across all pages. */
  total: number
  /** True during the initial page load. */
  loading: boolean
  /** True while a subsequent page is being appended. */
  loadingMore: boolean
  /** Whether more releases remain to load. */
  hasMore: boolean
  error: string | null
  /** Append the next page (no-op while a fetch is in flight or at the end). */
  loadMore: () => Promise<void>
  /** Reset to the first page — used after create/edit/delete and on retry. */
  reload: () => Promise<void>
}

/**
 * Fetches releases page-by-page for infinite scroll and tracks loading/error
 * state. I/O lives in this hook (not a store), per the state-management guide.
 *
 * The mount fetch runs inside the effect and only writes state *after* the
 * `await` (with a cancelled guard), matching the `useAppBootstrap` pattern so
 * nothing is set synchronously in the effect. `loadMore` appends the next page
 * (offset = the count already loaded); `reload` starts over from the first page
 * so a newly created release surfaces at the top. A `fetching` ref serializes
 * requests, since the scroll observer can fire `loadMore` in bursts.
 */
export function useReleases(): UseReleases {
  const [releases, setReleases] = useState<Release[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetching = useRef(false)

  useEffect(() => {
    let cancelled = false
    const load = async (): Promise<void> => {
      fetching.current = true
      try {
        const page = await window.api.releases.list(0, PAGE_SIZE)
        if (!cancelled) {
          setReleases(page.releases)
          setTotal(page.total)
          setHasMore(page.hasMore)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err, 'Failed to load releases.'))
      } finally {
        if (!cancelled) setLoading(false)
        fetching.current = false
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = useCallback(async (): Promise<void> => {
    if (fetching.current || !hasMore) return
    fetching.current = true
    setLoadingMore(true)
    try {
      const page = await window.api.releases.list(releases.length, PAGE_SIZE)
      setReleases((prev) => [...prev, ...page.releases])
      setTotal(page.total)
      setHasMore(page.hasMore)
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load more releases.'))
    } finally {
      setLoadingMore(false)
      fetching.current = false
    }
  }, [hasMore, releases.length])

  const reload = useCallback(async (): Promise<void> => {
    fetching.current = true
    setLoading(true)
    try {
      const page = await window.api.releases.list(0, PAGE_SIZE)
      setReleases(page.releases)
      setTotal(page.total)
      setHasMore(page.hasMore)
      setError(null)
    } catch (err) {
      setError(errorMessage(err, 'Failed to load releases.'))
    } finally {
      setLoading(false)
      fetching.current = false
    }
  }, [])

  return { releases, total, loading, loadingMore, hasMore, error, loadMore, reload }
}
