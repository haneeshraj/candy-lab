# candy-lab — Build-It-Yourself Guide

This is the doc to read if you had to work on this codebase **with no help**. It
explains the architecture, the rules that keep the code consistent, and gives
you copy-paste-shaped recipes for the things you'll actually do: adding a
backend feature, creating a page, fetching data, building a component, and
deciding where each piece of code belongs.

It's the **map**. Each area also has its own deep doc — read those when you're
working inside that area:

| Area                                  | Deep doc                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Main + preload (the backend + bridge) | [src/main/GUIDE.md](src/main/GUIDE.md) · [src/main/REFERENCE.md](src/main/REFERENCE.md) |
| State (Zustand stores)                | [src/renderer/src/store/GUIDE.md](src/renderer/src/store/GUIDE.md)                      |
| Routing                               | [src/renderer/src/router/README.md](src/renderer/src/router/README.md)                  |
| Custom hooks                          | [src/renderer/src/hooks/README.md](src/renderer/src/hooks/README.md)                    |
| Animations                            | [src/renderer/src/animations/README.md](src/renderer/src/animations/README.md)          |
| Styling / SCSS                        | [src/renderer/src/styles/GUIDE.md](src/renderer/src/styles/GUIDE.md)                    |

---

## Table of contents

1. [What the app is](#1-what-the-app-is)
2. [The mental model: three processes](#2-the-mental-model-three-processes)
3. [Repo map](#3-repo-map)
4. [The big decision: when IPC vs. renderer-only](#4-the-big-decision-when-ipc-vs-renderer-only)
5. [End-to-end: how one call travels](#5-end-to-end-how-one-call-travels)
6. [Recipe A: add a backend feature (the 5-touchpoint pattern)](#6-recipe-a-add-a-backend-feature-the-5-touchpoint-pattern)
7. [Recipe B: create a new page](#7-recipe-b-create-a-new-page)
8. [Recipe C: a data-fetching hook](#8-recipe-c-a-data-fetching-hook)
9. [Recipe D: a UI component](#9-recipe-d-a-ui-component)
10. [Where does state go?](#10-where-does-state-go)
11. [Styling in 60 seconds](#11-styling-in-60-seconds)
12. [Auth & access model](#12-auth--access-model)
13. [Naming & consistency conventions](#13-naming--consistency-conventions)
14. [Before you commit: checks & commands](#14-before-you-commit-checks--commands)
15. [Anti-patterns (the "don't" list)](#15-anti-patterns-the-dont-list)

---

## 1. What the app is

An **Electron desktop app** — a music-catalog CMS ("Releases") with Google
sign-in and admin-gated access. Stack:

- **Electron** (electron-vite build) — desktop shell, three JS processes.
- **React 19 + TypeScript** — the UI (the "renderer").
- **Zustand** — state management (one small store per domain).
- **React Router (HashRouter)** — client-side routing.
- **Supabase** — the backend database + auth + file storage, talked to **only**
  from the main process.
- **SCSS + CSS Modules** — a token-driven styling system.
- **motion** — the animation layer.

Everything lives under `src/`, split into `main/`, `preload/`, and `renderer/`.

---

## 2. The mental model: three processes

An Electron app is not one program — it's three, with a hard security wall
between the UI and the machine.

| Process      | Runs in            | Responsible for                                              | Can it touch the OS / DB? |
| ------------ | ------------------ | ------------------------------------------------------------ | ------------------------- |
| **main**     | Node.js            | Windows, lifecycle, filesystem, **Supabase**, IPC handlers   | ✅ Yes                    |
| **preload**  | Isolated bridge    | The typed, curated API surface — the ONLY main↔renderer link | ⚠️ Only via IPC wrappers  |
| **renderer** | Chromium (sandbox) | React UI                                                     | ❌ No — no Node, no DB    |

### The golden rules (memorize these)

1. **The renderer never touches Node, `ipcRenderer`, or Supabase directly.** It
   only ever calls `window.api.*`.
2. **All business logic and all data access live in `main/services/`.** The
   renderer knows nothing about database columns, tokens, or the filesystem.
3. **The preload is the only bridge.** Nothing reaches `window` except the
   curated `window.api` (and the legacy `window.electron` toolkit helper).
4. **IPC channel strings are declared once** in
   [src/main/ipc/channels.ts](src/main/ipc/channels.ts) and imported by both
   sides. Never type a raw channel string anywhere else.
5. **Untrusted input is validated twice** — once in the preload, again in the
   service. Never trust an argument just because the preload passed it.

If you internalize only one thing: **the renderer asks `window.api` for things;
the main process is the only code that actually does them.**

---

## 3. Repo map

```
src/
├── main/                    # BACKEND (Node) — see src/main/GUIDE.md
│   ├── index.ts             # entry → bootstrap()
│   ├── app/                 # config, security events, lifecycle wiring
│   ├── windows/             # window factories + windowManager registry
│   ├── ipc/
│   │   ├── channels.ts      # IPC_CHANNELS — single source of truth
│   │   ├── registerIpc.ts   # registers every handler group, once
│   │   └── handlers/        # THIN channel→service wiring (one file per domain)
│   ├── services/            # ALL business logic (Supabase, files, OS, auth)
│   └── utils/               # logger, paths, helpers
│
├── preload/                 # THE BRIDGE
│   ├── index.ts             # exposes window.api (+ window.electron)
│   ├── index.d.ts           # global window typings
│   ├── bridge/              # one file per domain, implements a slice of the API
│   ├── ipc/                 # invoke/send/on wrappers + types.ts (the CONTRACT)
│   └── utils/sanitize.ts    # input validation
│
└── renderer/src/            # THE UI (React) — no Node, no DB
    ├── main.tsx             # React entry (imports global styles, mounts AppRoot)
    ├── shell/               # AppRoot + app-wide startup hooks (bootstrap/theme/auth/updater sync)
    ├── router/              # route table, paths, guard — see router/README.md
    ├── pages/               # one folder per screen (Releases, Access)
    ├── components/          # shared components; components/ui = design-system primitives
    ├── hooks/               # generic reusable hooks — see hooks/README.md
    ├── store/               # Zustand domain stores — see store/GUIDE.md
    ├── animations/          # motion presets/variants — see animations/README.md
    ├── styles/              # global SCSS + tokens — see styles/GUIDE.md
    └── assets/              # svg/icons
```

### Two conventions you'll rely on constantly

- **Path alias:** `@renderer/*` → `src/renderer/src/*`. Always import via the
  alias, e.g. `import { Button } from '@renderer/components/ui'`.
- **Barrels:** most folders export through an `index.ts`. Import from the folder,
  not the deep file: `@renderer/hooks`, `@renderer/store`,
  `@renderer/components/ui`, `@renderer/animations`, `@renderer/router`.

---

## 4. The big decision: when IPC vs. renderer-only

This is the question you'll ask on almost every task. The test is simple:

> **Does the work need Node, the OS, the filesystem, secrets, or the database
> (Supabase)?**
>
> - **Yes →** it goes through **IPC**. Logic lives in a `main/services/` function,
>   exposed via a channel + handler + bridge, and the renderer calls
>   `window.api.<domain>.<method>()`.
> - **No →** keep it **in the renderer**. It's pure UI/derived state — do it in a
>   component, a hook, or a store.

| You want to…                                                 | Where                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Read/write the Supabase database                             | **IPC** → `release.service` (etc.)                                             |
| Upload a file / touch the filesystem                         | **IPC** → service                                                              |
| Open a URL in the system browser                             | **IPC** → `system.service`                                                     |
| Sign in / read auth state                                    | **IPC** → `auth.service`                                                       |
| Get app version / platform / OS info                         | **IPC** → `app`/`system` service                                               |
| Minimize/close the window                                    | **IPC** (fire-and-forget `send`)                                               |
| Filter / sort / search already-loaded data                   | **Renderer** (`useMemo` in the page)                                           |
| Open/close a modal, toggle a sidebar                         | **Renderer** (local state or `ui` store)                                       |
| Persist a UI preference like theme                           | **Renderer store** (`settings`, persisted) — synced to the DOM by a shell hook |
| Debounce an input, watch a media query, detect outside-click | **Renderer** (a hook)                                                          |

**Rule of thumb from the actual code:** notice that
[Releases.tsx](src/renderer/src/pages/Releases/Releases.tsx) fetches pages over
IPC (`window.api.releases.list`) but does all the **search/filter/sort on the
client** with `useMemo`. Fetching = IPC. Shaping what's already fetched =
renderer. Don't round-trip to the backend for work you can do on data you already
have.

### The three IPC directions (and when to use each)

| Direction                | Renderer side                | Main side          | Use for                                                     |
| ------------------------ | ---------------------------- | ------------------ | ----------------------------------------------------------- |
| **Request/response**     | `invoke` (returns a Promise) | `ipcMain.handle`   | Anything returning data or that can fail (the default)      |
| **Fire-and-forget**      | `send` (no return)           | `ipcMain.on`       | Window controls (minimize/close/maximize)                   |
| **Main → renderer push** | `on(...)` subscription       | `webContents.send` | Live updates (auth state, updater status, maximize changed) |

Almost everything you add will be **request/response (`invoke`)**. Reach for a
push channel only when the main process needs to tell the UI something changed on
its own (e.g. auth approval came through).

---

## 5. End-to-end: how one call travels

Trace `window.api.releases.list(0, 24)` from click to database and back. The five
files you touch to build a feature are exactly these five stops:

```
RENDERER                    PRELOAD                         MAIN
────────                    ───────                         ────
useReleases()               releasesBridge.list(0,24)       ipcMain.handle(
  window.api                  → invoke(RELEASES_LIST,          RELEASES_LIST,
    .releases.list(0,24) ──▶     0, 24)               ──▶      (_e,off,lim) =>
                                 (ipcRenderer.invoke)            listReleases(off,lim))
                                                                      │
                                                                      ▼
                                                              release.service.ts
                                                              listReleases() → Supabase
                                                                      │
   ReleasePage  ◀──────────  Promise<ReleasePage>  ◀───────────  maps rows → domain type
   (setReleases)                                                 returns ReleasePage
```

- **Channel** (`RELEASES_LIST`) is defined in
  [ipc/channels.ts](src/main/ipc/channels.ts) and imported by **both** the bridge
  and the handler — they can never drift.
- **Types** (`ReleasePage`, `Release`, `ReleaseInput`, …) live in
  [preload/ipc/types.ts](src/preload/ipc/types.ts) — the shared contract, imported
  by the bridge, the service, and (transitively) the renderer.
- **The handler is one line.** It maps the channel to a service call and nothing
  else. All the real work (Supabase queries, snake_case↔camelCase mapping,
  validation, rollback) is in
  [release.service.ts](src/main/services/release.service.ts).

---

## 6. Recipe A: add a backend feature (the 5-touchpoint pattern)

Any new renderer-callable capability that needs Node/DB/OS touches **five**
places, in this order. Example: "list the genres in use."

**1. Channel** — add a constant to
[src/main/ipc/channels.ts](src/main/ipc/channels.ts):

```ts
RELEASES_LIST_GENRES: 'releases:list-genres', // invoke → string[]
```

**2. Service** — put the actual logic in `main/services/` (validate untrusted
input here, log + rethrow errors as the code already does):

```ts
// src/main/services/release.service.ts
export async function listGenres(): Promise<string[]> {
  const { data, error } = await getSupabase().from('releases').select('genres')
  if (error) {
    logger.error('listGenres failed', error)
    throw new Error(error.message)
  }
  const all = (data as { genres: string[] | null }[]).flatMap((r) => r.genres ?? [])
  return [...new Set(all)].sort()
}
```

**3. Handler** — wire channel → service in the matching
`ipc/handlers/*.handler.ts` (thin, one line):

```ts
// src/main/ipc/handlers/release.handler.ts
ipcMain.handle(IPC_CHANNELS.RELEASES_LIST_GENRES, () => listGenres())
```

> New domain entirely? Create `xxx.handler.ts` exporting `registerXxxHandlers()`,
> export it from [ipc/handlers/index.ts](src/main/ipc/handlers/index.ts), and call
> it in [registerIpc.ts](src/main/ipc/registerIpc.ts).

**4. Type** — extend the contract in
[src/preload/ipc/types.ts](src/preload/ipc/types.ts):

```ts
export interface ReleasesApi {
  // …existing methods
  listGenres: () => Promise<string[]>
}
```

**5. Bridge** — implement it through the typed `invoke` wrapper in
[src/preload/bridge/releases.bridge.ts](src/preload/bridge/releases.bridge.ts):

```ts
listGenres: () => invoke<string[]>(IPC_CHANNELS.RELEASES_LIST_GENRES)
```

Now `await window.api.releases.listGenres()` works, fully typed, from anywhere in
the renderer. TypeScript enforces the contract end-to-end — if the service return
type and the `ReleasesApi` type disagree, the build fails.

---

## 7. Recipe B: create a new page

A "page" is a top-level screen behind a route (like `Releases` or `Access`).
Pages own a folder under `src/renderer/src/pages/`.

### 7.1 The page folder layout

Follow the `Releases` folder as the template:

```
pages/Settings/
├── Settings.tsx            # the page component (default export)
├── Settings.module.scss    # its styles
├── types.ts                # page-local domain types (optional)
├── constants.ts            # defaults, option lists (optional)
├── utils.ts                # pure helpers: formatters, comparators (optional)
├── hooks/                  # page-local data/logic hooks (e.g. useSettings.ts)
│   └── useSettings.ts
└── components/             # components used only by this page
    └── SettingRow.tsx
```

Split things out **when the page grows**, not preemptively. Small page? One
`.tsx` + one `.module.scss` is fine. The moment data-fetching or heavy logic
appears, move it into a `hooks/` file (see [Recipe C](#8-recipe-c-a-data-fetching-hook)).

### 7.2 The page component

Default-export it (the router lazy-imports the default). Keep it presentational

- orchestration; push I/O into hooks and business rules into `utils.ts`.

```tsx
// pages/Settings/Settings.tsx
import { Button } from '@renderer/components/ui'
import { useSettings } from './hooks/useSettings'
import styles from './Settings.module.scss'

/** Settings screen. */
export default function Settings(): React.JSX.Element {
  const { settings, loading, error, save } = useSettings()

  if (loading) return <p className={styles.state}>Loading…</p>
  if (error) return <p className={styles.error}>{error}</p>

  return (
    <div className={styles.settings}>
      <h1 className={styles.title}>Settings</h1>
      {/* … */}
      <Button onClick={() => void save()}>Save</Button>
    </div>
  )
}
```

### 7.3 Register the route (3 edits, all in `router/`)

See [router/README.md](src/renderer/src/router/README.md) for the full rules.

**a.** Add the path constant + title in
[routePaths.ts](src/renderer/src/router/routePaths.ts) (never hardcode a path
string anywhere else):

```ts
export const ROUTE_PATHS = {
  ROOT: '/',
  RELEASES: '/releases',
  ACCESS: '/access',
  SETTINGS: '/settings' // ← new
} as const

export const ROUTE_TITLES: Record<RoutePath, string> = {
  // …
  [ROUTE_PATHS.SETTINGS]: 'Settings' // ← new (typed: every route MUST have a title)
}
```

**b.** Add the entry (lazy) in
[routes.tsx](src/renderer/src/router/routes.tsx):

```tsx
const Settings = lazy(() => import('@renderer/pages/Settings/Settings'))

export const routes: AppRoute[] = [
  // …
  { path: ROUTE_PATHS.SETTINGS, element: <Settings /> } // ← new
]
```

**c.** Nothing in `AppRouter.tsx` changes — it renders every entry and already
wraps each in `RouteGuard` + `PageLayout` + a `<Suspense>` boundary.

### 7.4 Link to it

Navigate with the constant, never a literal:

```tsx
import { Link } from 'react-router-dom'
import { ROUTE_PATHS } from '@renderer/router'

;<Link to={ROUTE_PATHS.SETTINGS}>Settings</Link>
```

If it should appear in the sidebar, add an item in
[components/Sidebar](src/renderer/src/components/Sidebar/) referencing the same
constant.

---

## 8. Recipe C: a data-fetching hook

**The rule:** stores stay pure (no IPC/async inside them). All I/O lives in a
**hook or effect** that calls `window.api.*` and pushes results into `useState`
(page-local) or into a store via setters (app-wide). This is the exact pattern in
[useReleases.ts](src/renderer/src/pages/Releases/hooks/useReleases.ts) and
[useAppBootstrap.ts](src/renderer/src/shell/useAppBootstrap.ts).

Anatomy of a correct fetch hook:

```ts
// pages/Settings/hooks/useSettings.ts
import { useCallback, useEffect, useState } from 'react'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false // guard against setting state after unmount
    const load = async (): Promise<void> => {
      try {
        const data = await window.api.settings.getAll()
        if (!cancelled) {
          setSettings(data)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(String(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const save = useCallback(async (): Promise<void> => {
    // …call window.api, then re-read or update local state
  }, [])

  return { settings, loading, error, save }
}
```

Non-negotiables (all enforced by lint or convention):

- **`let cancelled = false` + cleanup** so an unmounted component never sets
  state. Only write state **after** the `await`.
- **`try/catch/finally`** — always surface an error string and always clear
  `loading`. The service `throw`s a real `Error`; catch it here.
- **Explicit return type** on the hook (or an interface like `UseReleases`).
- **Memoize** returned functions with `useCallback` so they're stable as effect
  deps.
- Provide a **`reload()`** if create/edit/delete happen elsewhere — call it after
  mutating (see how `Releases` calls `reload()` after delete/save).

Generic, reusable hooks (debounce, click-outside, media query, IPC listener) go
in `src/renderer/src/hooks/` instead — see
[hooks/README.md](src/renderer/src/hooks/README.md). Page-specific hooks stay in
the page's `hooks/` folder.

---

## 9. Recipe D: a UI component

Two homes, decided by reuse:

- **`components/ui/`** — design-system primitives reused across pages (`Button`,
  `TextField`, `Select`, `Modal`, `ConfirmDialog`, …). Exported from the
  [ui barrel](src/renderer/src/components/ui/index.ts).
- **`components/<Name>/`** — shared app components (`Sidebar`, `TitleBar`,
  `PageLayout`, `AuthGate`).
- **`pages/<Page>/components/`** — components used by only one page.

Each component is a folder with the component, its module, and an `index.ts`
barrel. Pattern (see [Button.tsx](src/renderer/src/components/ui/Button/Button.tsx)):

```tsx
// components/ui/Badge/Badge.tsx
import styles from './Badge.module.scss'

type Tone = 'neutral' | 'success' | 'danger'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

/** Small status pill. */
export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps): React.JSX.Element {
  const classes = [styles.badge, styles[tone], className].filter(Boolean).join(' ')
  return <span className={classes} {...rest} />
}
```

Conventions from the existing components:

- **Explicit `React.JSX.Element` return type**, props typed as an `interface`,
  extend the native element props (`React.ButtonHTMLAttributes`, etc.) and spread
  `...rest`.
- **Variant/size via a props union + a `styles[variant]` lookup**, then join class
  names with the `.filter(Boolean).join(' ')` idiom (accept an optional
  `className` to merge).
- **Co-located `*.module.scss`**, starting with `@use 'abstracts' as *;` and using
  only tokens/mixins — never raw hex/px (see [Recipe / §11](#11-styling-in-60-seconds)).
- **Add it to the barrel** (`components/ui/index.ts`) so it imports as
  `@renderer/components/ui`.
- **No animation objects inline** — spread a preset from `@renderer/animations`
  (see [animations/README.md](src/renderer/src/animations/README.md)).

---

## 10. Where does state go?

Decision order — pick the **narrowest** option that works:

1. **Local `useState`** — state used by one component (a modal's open flag, a
   form field, the current search query). Most state is this. `Releases` keeps
   `query`, `filters`, `viewing`, `editing`, `deleting` all local.
2. **A page hook** — state + I/O shared by a page and its children (the fetched
   list, loading/error). Returned from a `hooks/useX.ts`.
3. **A Zustand store** — genuinely app-wide state that outlives any one page:
   auth, theme/settings, electron/system info, updater status. See
   [store/GUIDE.md](src/renderer/src/store/GUIDE.md).

Store rules (short version — full rules in the store guide):

- **One store per domain** (`app`, `ui`, `settings`, `electron`, `auth`). Import
  from the `@renderer/store` barrel.
- **Select the narrowest slice**: `useUIStore((s) => s.sidebarOpen)`, never
  `useUIStore()` (which re-renders on every change).
- **No I/O, no API calls, no UI imports inside a store.** A hook/effect does the
  I/O and pushes results in via setters (e.g. `useAuthSync`, `useAppBootstrap`).
- Every store has a `reset()`; keep `initialState` and `reset()` in sync.
- Outside React, use the static API: `useAuthStore.getState().setAuth(...)`.

---

## 11. Styling in 60 seconds

Full rules in [styles/GUIDE.md](src/renderer/src/styles/GUIDE.md). The essentials:

- **Component styles are CSS Modules** (`Component.module.scss`), co-located,
  imported as `styles`, applied via `className={styles.thing}`.
- **Start every module with `@use 'abstracts' as *;`** — that gives you every
  token, function, and mixin with zero CSS output.
- **Tokens, never literals.** Use `$primary`, `$text-secondary`, `space(4)`,
  `$radius-lg`, `$shadow-md`, `z(modal)` — Stylelint blocks raw hex, and hardcoded
  px/shadows are a code-review reject.
- **Semantic colors only** in components (`$primary`, `$surface`, `$text-primary`,
  …) — never the raw `$palette-*`. Colors are CSS custom properties, so theming is
  runtime (dark is default; light via `[data-theme='light']`).
- **Mixins** for repeated patterns: `@include card;`, `@include flex(...)`,
  `@include hover { … }`, `@include media(lg) { … }`.
- **Utility classes** (`flex`, `gap-4`, `mt-6`, `truncate`, `drag`/`no-drag`) for
  one-off structural glue in JSX; promote to a module class once you're stacking
  ~4+ of them.
- **Keyframes are global** (`abstracts/_animations.scss`) — never define
  `@keyframes` in a module (CSS Modules would rename them). JS-driven motion comes
  from `@renderer/animations`.

---

## 12. Auth & access model

Auth is a main-process concern (Supabase + Google OAuth in the system browser),
mirrored into the renderer:

- **Main** owns it: [auth.service.ts](src/main/services/auth.service.ts) +
  `auth.handler` expose `AUTH_*` / `ACCESS_*` channels; the main process
  broadcasts `AUTH_STATE_CHANGED` when state changes on its own.
- **Renderer** mirrors it: [useAuthSync.ts](src/renderer/src/shell/useAuthSync.ts)
  reads the state once on mount and subscribes to the push channel, writing into
  the `auth` store. The store is pure; the hook does the I/O.
- **[AuthGate](src/renderer/src/components/AuthGate/AuthGate.tsx)** wraps the app
  shell and renders `children` only when the phase is `approved`; otherwise it
  shows loading / sign-in / pending / restricted screens. Access levels
  (pending/approved/restricted, roles) are admin-managed on the `Access` page.

When you add a screen or action that must be gated, you generally don't need to
do anything — it lives inside `AuthGate`. Route-level protection has a single
future home in [RouteGuard.tsx](src/renderer/src/router/RouteGuard.tsx) (currently
a pass-through).

---

## 13. Naming & consistency conventions

Match the surrounding code; these are the patterns already in the repo:

- **Files:** components/pages `PascalCase.tsx` with a co-located
  `PascalCase.module.scss`; hooks `useThing.ts`; services `thing.service.ts`;
  handlers `thing.handler.ts`; bridges `thing.bridge.ts`; barrels `index.ts`.
- **IPC channel constants:** `SCREAMING_SNAKE_CASE` keys →
  `'domain:kebab-action'` string values, grouped by domain with a direction
  comment.
- **Domain types are camelCase** (`projectName`, `coverArtUrl`); the DB is
  snake_case (`project_name`) and the **service maps between them** — the renderer
  only ever sees camelCase.
- **Explicit return types** on components (`React.JSX.Element`), hooks, and service
  functions (lint enforces this).
- **Barrels/aliases:** import from `@renderer/<area>`, not deep paths, so internal
  layout can change freely.
- **Route strings** live only in `ROUTE_PATHS`; **channel strings** live only in
  `IPC_CHANNELS`; **colors/spacing** live only as tokens. One source of truth per
  concept.
- **Errors:** services `logger.error(...)` then `throw new Error(msg)`; renderer
  hooks catch and turn them into a user-facing `error` string (see the
  `errorMessage` helper in `pages/Releases/utils.ts`).

---

## 14. Before you commit: checks & commands

```bash
npm run dev            # run the app (electron-vite dev)
npm run typecheck      # tsc for both node (main/preload) and web (renderer)
npm run lint           # eslint
npm run lint:styles    # stylelint for SCSS
npm run lint:all       # eslint + stylelint
npm run lint:fix       # autofix eslint + stylelint
npm run format         # prettier
npm run test           # vitest (tests live in src/tests/)
npm run build          # typecheck + electron-vite build
```

A **husky + lint-staged** pre-commit hook auto-runs eslint/stylelint/prettier and
related vitest tests on staged files, and `prebuild` runs `lint:all`. So: keep the
lints green, add/adjust tests under `src/tests/` when you change behavior, and run
`npm run typecheck` — the 5-touchpoint IPC flow is fully typed, so a mismatch
between service, contract, and bridge will fail the build.

> Note (from project memory): **do not add Claude/Anthropic attribution to git
> commits.**

---

## 15. Anti-patterns (the "don't" list)

- ❌ Calling `ipcRenderer`, Node modules, or Supabase from the renderer. Go
  through `window.api`.
- ❌ Business logic or Supabase queries in an IPC **handler** — handlers are one
  line; logic belongs in a **service**.
- ❌ A raw channel string outside `channels.ts`, a raw route path outside
  `routePaths.ts`, or a raw hex/px outside the token system.
- ❌ API/IPC calls or async inside a Zustand store — do I/O in a hook and push
  results in via setters.
- ❌ Reading the whole store (`useUIStore()`) — select the slice you need.
- ❌ Fetching from the backend to filter/sort data you already loaded — do it in a
  `useMemo`.
- ❌ Setting state in an async effect without a `cancelled` guard + cleanup.
- ❌ Hardcoding a route path in JSX (`to="/settings"`) — use `ROUTE_PATHS`.
- ❌ Editing `AppRouter.tsx` to add a route — add to `routes.tsx`.
- ❌ Inline animation objects / durations in a `.tsx` — use `@renderer/animations`.
- ❌ `@keyframes` inside a `*.module.scss`, or `@import` in SCSS (use
  `@use`/`@forward`).
- ❌ A second `contextBridge.exposeInMainWorld` call — extend the existing `api`.
- ❌ Trusting renderer input in the service without re-validating.

---

**Start here for a real task:** figure out whether it needs the backend
([§4](#4-the-big-decision-when-ipc-vs-renderer-only)). If yes, follow
[Recipe A](#6-recipe-a-add-a-backend-feature-the-5-touchpoint-pattern). If it's a
new screen, [Recipe B](#7-recipe-b-create-a-new-page). Then read the deep doc for
whichever area you're editing.
