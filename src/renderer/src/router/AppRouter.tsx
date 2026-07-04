import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageLayout } from '../components/PageLayout'
import { routes, type AppRoute } from './routes'
import { RouteGuard } from './RouteGuard'

// Map the declarative route table to react-router elements. Every element is
// wrapped in RouteGuard (protection logic's single future home) and PageLayout
// (the shared page frame), so pages get both without opting in. Recurses into
// `children` so nested routes work without restructuring.
function renderRoutes(list: AppRoute[]): React.ReactNode {
  return list.map((route) => (
    <Route
      key={route.path}
      path={route.path}
      element={
        <RouteGuard>
          <PageLayout>{route.element}</PageLayout>
        </RouteGuard>
      }
    >
      {route.children ? renderRoutes(route.children) : null}
    </Route>
  ))
}

/**
 * Renders the route table. The `HashRouter` provider is set up in `AppRoot`
 * (`shell/`) so it wraps the whole app shell (title bar included) — this
 * component just declares the routes inside it. No UI/navigation logic here.
 */
export function AppRouter(): React.JSX.Element {
  return (
    // Boundary for lazy-loaded route elements; swap `null` for a loader later.
    <Suspense fallback={null}>
      <Routes>{renderRoutes(routes)}</Routes>
    </Suspense>
  )
}
