import type { ReactNode } from 'react'

export interface RouteGuardProps {
  children: ReactNode
}

/**
 * Scaffold for future route protection — authentication checks, permission
 * gating, and redirects. Currently a pass-through: every route element is
 * wrapped in it, so guard logic can later be added here in ONE place without
 * touching any page.
 *
 * NOTE: intentionally no auth logic yet.
 */
export function RouteGuard({ children }: RouteGuardProps): React.JSX.Element {
  return <>{children}</>
}
