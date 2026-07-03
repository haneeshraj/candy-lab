import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a stable getter reporting whether the component is still mounted.
 * Guard async work to avoid state updates after unmount:
 *
 *   const isMounted = useIsMounted()
 *   const data = await fetchThing()
 *   if (isMounted()) setData(data)
 */
export function useIsMounted(): () => boolean {
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return useCallback(() => mounted.current, [])
}
