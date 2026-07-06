import { useEffect, type RefObject } from 'react'

export interface IntersectionOptions {
  /** Margin around the viewport, e.g. `'400px'` to fire before fully in view. */
  rootMargin?: string
  /** Intersection ratio (0–1) that fires the callback. */
  threshold?: number
}

/**
 * Call `onIntersect` whenever the referenced element enters the viewport.
 * Handy for infinite-scroll sentinels and lazy-loading triggers.
 *
 *   const ref = useRef<HTMLDivElement>(null)
 *   useIntersectionObserver(ref, loadMore, { rootMargin: '400px' })
 *
 * The observer re-binds when `onIntersect` changes, so memoize it (e.g.
 * `useCallback`) — this also lets a callback that depends on the loaded count
 * re-fire when the sentinel stays in view after a page appends.
 */
export function useIntersectionObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onIntersect: () => void,
  { rootMargin = '0px', threshold = 0 }: IntersectionOptions = {}
): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onIntersect()
      },
      { rootMargin, threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, onIntersect, rootMargin, threshold])
}
