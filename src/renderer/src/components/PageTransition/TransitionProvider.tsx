import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { useReducedMotionSafe } from '@renderer/animations'
import { ROUTE_TITLES, type RoutePath } from '@renderer/router/routePaths'
import { TransitionContext, type TransitionPhase } from './TransitionContext'
import { TransitionOverlay } from './TransitionOverlay'

interface TransitionProviderProps {
  children: ReactNode
}

/**
 * Owns the transition state machine and mounts the overlay. Drop this inside the
 * router (it calls `useNavigate`) so every routed page sits underneath it.
 *
 * The overlay drives the machine forward by reporting when each half of its
 * animation finishes:
 *   - `handleCovered`  — the cover animation landed → swap route, start reveal.
 *   - `handleRevealed` — the reveal animation finished → back to idle.
 *
 * `phaseRef` mirrors `phase` synchronously so the guards below stay correct even
 * under React StrictMode's double-invoked renders/effects.
 */
export function TransitionProvider({ children }: TransitionProviderProps): React.JSX.Element {
  const navigate = useNavigate()
  const reduced = useReducedMotionSafe()

  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const phaseRef = useRef<TransitionPhase>(phase)
  const pendingPath = useRef<string | null>(null)

  // The destination's title, shown in the middle of the overlay while it wipes.
  const [label, setLabel] = useState('')

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const setPhaseNow = useCallback((next: TransitionPhase) => {
    phaseRef.current = next
    setPhase(next)
  }, [])

  const transitionTo = useCallback(
    (to: string) => {
      // No overlapping transitions.
      if (phaseRef.current !== 'idle') return

      // Respect reduced-motion: skip the overlay entirely, navigate straight.
      if (reduced) {
        navigate(to)
        return
      }

      pendingPath.current = to
      setLabel(ROUTE_TITLES[to as RoutePath] ?? '')
      setPhaseNow('covering')
    },
    [navigate, reduced, setPhaseNow]
  )

  // The overlay finished covering — swap the route behind it, then reveal.
  const handleCovered = useCallback(() => {
    if (phaseRef.current !== 'covering') return
    if (pendingPath.current) {
      navigate(pendingPath.current)
      pendingPath.current = null
    }
    setPhaseNow('revealing')
  }, [navigate, setPhaseNow])

  // The overlay finished revealing — the transition is complete.
  const handleRevealed = useCallback(() => {
    if (phaseRef.current !== 'revealing') return
    setPhaseNow('idle')
  }, [setPhaseNow])

  return (
    <TransitionContext.Provider value={{ phase, transitionTo }}>
      {children}
      <TransitionOverlay
        phase={phase}
        label={label}
        onCovered={handleCovered}
        onRevealed={handleRevealed}
      />
    </TransitionContext.Provider>
  )
}
