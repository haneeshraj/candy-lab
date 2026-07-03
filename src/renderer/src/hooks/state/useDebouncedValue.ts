import { useEffect, useState } from 'react'

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` of no
 * changes. Useful for search inputs, resize-driven state, etc.
 *
 *   const debouncedQuery = useDebouncedValue(query, 250)
 */
export function useDebouncedValue<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(id)
  }, [value, delayMs])

  return debounced
}
