import { useEffect, useRef } from 'react'

/**
 * Attach a `window` event listener with automatic cleanup. The latest callback
 * is always used without re-binding the listener on every render.
 *
 *   useEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
 */
export function useEventListener<K extends keyof WindowEventMap>(
  type: K,
  listener: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  const saved = useRef(listener)

  useEffect(() => {
    saved.current = listener
  }, [listener])

  useEffect(() => {
    const handler = (event: WindowEventMap[K]): void => saved.current(event)
    window.addEventListener(type, handler as EventListener, options)
    return () => window.removeEventListener(type, handler as EventListener, options)
  }, [type, options])
}
