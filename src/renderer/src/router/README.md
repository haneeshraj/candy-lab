# Routing

## Overview

Client-side routing for the renderer, built on `react-router-dom` with a
**HashRouter** (Electron/`file://`-safe). Everything lives in
`src/renderer/src/router` and is fully decoupled from UI:

- `routePaths.ts` — centralized route strings (`ROUTE_PATHS`) + titles (`ROUTE_TITLES`)
- `routes.tsx` — the declarative route table (`AppRoute[]`)
- `RouteGuard.tsx` — pass-through wrapper for future auth/permission logic
- `AppRouter.tsx` — renders the route table (`<Routes>`) inside a `<Suspense>` boundary
- `index.ts` — barrel

The `HashRouter` provider lives in `AppRoot` (`src/renderer/src/shell/`) and
wraps the whole app shell, so chrome outside the routes — like the title bar —
can read the current route via `useLocation`. `AppRouter` renders the routes
inside it.

---

## How to add a new route

1. **Add the path constant** — `routePaths.ts` (never hardcode a path elsewhere):

   ```ts
   export const ROUTE_PATHS = {
     ROOT: '/',
     SETTINGS: '/settings' // ← new
   } as const
   ```

2. **Add the route entry** — `routes.tsx`, referencing the constant. Prefer a
   lazy element for code-splitting:

   ```tsx
   import { lazy } from 'react'
   import { ROUTE_PATHS } from './routePaths'

   const Settings = lazy(() => import('@renderer/pages/Settings'))

   export const routes: AppRoute[] = [
     { path: ROUTE_PATHS.ROOT, element: <App /> },
     { path: ROUTE_PATHS.SETTINGS, element: <Settings /> } // ← new
   ]
   ```

3. **Nothing to change in `AppRouter.tsx`** — it renders every entry (and nested
   `children`) automatically. If you introduced a `lazy` element, wrap the
   `<Routes>` output in `<Suspense fallback={…}>` once (in `AppRouter.tsx`).

4. **Navigate** using the constant + react-router's `Link`/`useNavigate`:
   ```tsx
   import { Link } from 'react-router-dom'
   import { ROUTE_PATHS } from '@renderer/router'
   ;<Link to={ROUTE_PATHS.SETTINGS}>Settings</Link>
   ```

Nested routes: give the parent entry a `children: AppRoute[]` and render an
`<Outlet />` in the parent element.

---

## How to modify an existing route

- **Change a path:** edit the value in `ROUTE_PATHS` **only**. Every route
  entry and navigation call references the constant, so they update
  automatically — never search-and-replace path strings.
- **Swap a route's component:** change its `element` in `routes.tsx`.
- **Rename a constant key:** rename in `routePaths.ts`; TypeScript will flag
  every usage that needs updating.

---

## Example: minimal two-route table

```tsx
// routePaths.ts
export const ROUTE_PATHS = { ROOT: '/', ABOUT: '/about' } as const

// routes.tsx
export const routes: AppRoute[] = [
  { path: ROUTE_PATHS.ROOT, element: <Home /> },
  { path: ROUTE_PATHS.ABOUT, element: <About /> }
]
```

---

## Common mistakes

- ❌ Hardcoding path strings in components (`to="/settings"`) — use `ROUTE_PATHS`.
- ❌ Using `BrowserRouter` — it breaks over `file://` in packaged builds. Keep
  `HashRouter`.
- ❌ Editing `AppRouter.tsx` to add a route — add to `routes.tsx` instead.
- ❌ Importing pages eagerly for large screens — prefer `lazy` + `Suspense`.
- ❌ Adding a route entry without a matching `ROUTE_PATHS` constant.
