import { useEffect, useRef, type DependencyList, type EffectCallback } from 'react'

/**
 * Like `useEffect`, but skips the initial mount and only runs on subsequent
 * dependency changes.
 */
export function useUpdateEffect(effect: EffectCallback, deps?: DependencyList): void {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    return effect()
    // Deps are forwarded verbatim; this wrapper intentionally mirrors useEffect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
