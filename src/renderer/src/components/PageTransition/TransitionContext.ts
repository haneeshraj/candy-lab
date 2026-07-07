import { createContext, useContext } from 'react'

/**
 * The overlay's lifecycle. A navigation runs strictly through:
 *
 *   idle → covering → revealing → idle
 *
 * - `idle`      nothing on screen; ready to accept a navigation.
 * - `covering`  the overlay is animating IN, growing to fully cover the viewport.
 *               When it lands, the route is swapped underneath it (invisible to
 *               the user — the overlay is opaque and on top).
 * - `revealing` the route has already changed; the overlay is animating OUT,
 *               uncovering the new page.
 */
export type TransitionPhase = 'idle' | 'covering' | 'revealing'

export interface TransitionContextValue {
  /** Where the overlay currently is in its lifecycle. */
  phase: TransitionPhase
  /**
   * Navigate to `to`, playing the cover → swap → reveal sequence. Ignored while
   * a transition is already in flight (no overlapping navigations).
   */
  transitionTo: (to: string) => void
}

export const TransitionContext = createContext<TransitionContextValue | null>(null)

/** Access the page-transition controller. Must be under `<TransitionProvider>`. */
export function useTransition(): TransitionContextValue {
  const ctx = useContext(TransitionContext)
  if (!ctx) {
    throw new Error('useTransition must be used within <TransitionProvider>')
  }
  return ctx
}
