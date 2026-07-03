import { useCallback, useEffect, useState } from 'react'

/**
 * State persisted to `localStorage` and kept in sync across windows. The API
 * mirrors `useState`, including functional updates.
 *
 *   const [theme, setTheme] = useLocalStorage<'dark' | 'light'>('theme', 'dark')
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  }, [key, initialValue])

  const [stored, setStored] = useState<T>(readValue)

  const setValue = useCallback(
    (value: T | ((prev: T) => T)): void => {
      setStored((prev) => {
        const next = value instanceof Function ? value(prev) : value
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // Storage may be unavailable/full — keep the in-memory value.
        }
        return next
      })
    },
    [key]
  )

  // Reflect changes made in other windows/tabs.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key === key) setStored(readValue())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key, readValue])

  return [stored, setValue]
}
