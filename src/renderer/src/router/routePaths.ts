// Single source of truth for every route string. Components and route config
// reference these constants — never hardcode a path literal anywhere else.

export const ROUTE_PATHS = {
  ROOT: '/',
  RELEASES: '/releases'
} as const

/** Union of all valid route paths. */
export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS]

/**
 * Human-readable title per route, shown in the title bar. Typed so every route
 * must have a title (add one here when you add a route).
 */
export const ROUTE_TITLES: Record<RoutePath, string> = {
  [ROUTE_PATHS.ROOT]: 'Home',
  [ROUTE_PATHS.RELEASES]: 'Releases'
}
