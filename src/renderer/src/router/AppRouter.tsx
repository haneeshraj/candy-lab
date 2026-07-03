import { HashRouter, Route, Routes } from 'react-router-dom'
import { routes, type AppRoute } from './routes'
import { RouteGuard } from './RouteGuard'

// Map the declarative route table to react-router elements. Every element is
// wrapped in RouteGuard so protection logic has a single future home. Recurses
// into `children` so nested routes work without restructuring.
function renderRoutes(list: AppRoute[]): React.ReactNode {
  return list.map((route) => (
    <Route key={route.path} path={route.path} element={<RouteGuard>{route.element}</RouteGuard>}>
      {route.children ? renderRoutes(route.children) : null}
    </Route>
  ))
}

/**
 * Central router entry. Uses HashRouter for Electron: it works over the
 * `file://` protocol, needs no server, and survives production reloads without
 * full-page navigation issues. No UI or navigation logic lives here.
 */
export function AppRouter(): React.JSX.Element {
  return (
    <HashRouter>
      <Routes>{renderRoutes(routes)}</Routes>
    </HashRouter>
  )
}
