import { useState } from 'react'

/**
 * Returns the value from the previous render (`undefined` on first render).
 * Handy for comparing prop/state changes.
 *
 * Uses the "adjust state during render" pattern (React tracks the prior value
 * as state) so it never reads a ref during render.
 */
export function usePrevious<T>(value: T): T | undefined {
  const [state, setState] = useState<{ current: T; previous: T | undefined }>({
    current: value,
    previous: undefined
  })

  if (state.current !== value) {
    setState({ current: value, previous: state.current })
  }

  return state.previous
}
