import { lazy } from 'react'
import type { ReactNode } from 'react'
import { ROUTE_PATHS } from './routePaths'
import App from '../App'

/**
 * Declarative route definition. Kept independent of react-router's own types so
 * the config stays decoupled and easy to reason about.
 *
 * For code-splitting as the app grows, attach lazy elements here, e.g.:
 *
 *   const Dashboard = lazy(() => import('@renderer/pages/Dashboard'))
 *   { path: ROUTE_PATHS.DASHBOARD, element: <Dashboard /> }
 *
 * (wrap the router output in <Suspense> once you introduce lazy elements).
 */
export interface AppRoute {
  path: string
  element?: ReactNode
  children?: AppRoute[]
}

const Releases = lazy(() => import('@renderer/pages/Releases/Releases'))
const Access = lazy(() => import('@renderer/pages/Access/Access'))

/** The application's route table. */
export const routes: AppRoute[] = [
  {
    path: ROUTE_PATHS.ROOT,
    element: <App />
  },
  {
    path: ROUTE_PATHS.RELEASES,
    element: <Releases />
  },
  {
    path: ROUTE_PATHS.ACCESS,
    element: <Access />
  }
]
