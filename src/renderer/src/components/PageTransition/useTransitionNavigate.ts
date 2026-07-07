import { useTransition } from './TransitionContext'

/**
 * Imperative navigation that plays the page transition. Use in place of
 * react-router's `useNavigate` wherever a navigation should run the overlay:
 *
 *   const go = useTransitionNavigate()
 *   go(ROUTE_PATHS.RELEASES)
 */
export function useTransitionNavigate(): (to: string) => void {
  return useTransition().transitionTo
}
