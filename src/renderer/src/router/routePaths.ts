// Single source of truth for every route string. Components and route config
// reference these constants — never hardcode a path literal anywhere else.

export const ROUTE_PATHS = {
  ROOT: '/'
} as const

/** Union of all valid route paths. */
export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS]
