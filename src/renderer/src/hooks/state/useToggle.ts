import { useCallback, useState } from 'react'

/**
 * Boolean state with a single setter that toggles by default, or sets an
 * explicit value when passed one.
 *
 *   const [on, toggle] = useToggle()
 *   toggle()       // flips
 *   toggle(true)   // forces on
 */
export function useToggle(initial = false): [boolean, (value?: boolean) => void] {
  const [state, setState] = useState(initial)

  const toggle = useCallback((value?: boolean): void => {
    setState((prev) => (typeof value === 'boolean' ? value : !prev))
  }, [])

  return [state, toggle]
}
