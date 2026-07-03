import { useEffect, useState } from 'react'

/**
 * Track a CSS media query and re-render when it changes. Pairs naturally with
 * the SCSS breakpoints (e.g. `useMediaQuery('(min-width: 1024px)')`).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (): void => setMatches(mql.matches)

    onChange() // sync in case the query changed between renders
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
