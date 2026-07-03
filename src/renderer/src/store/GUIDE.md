# State Management Guide

A **domain-based [Zustand](https://zustand.docs.pmnd.rs) state system** for this
Electron + React app. State is split into small, independent domains rather than
one global store. For every store's exact shape and API, see
**[REFERENCE.md](./REFERENCE.md)**.

---

## What this is (and why Zustand)

Zustand is a tiny, hook-based state library — no Provider, minimal boilerplate,
and it works cleanly in Electron. Each store is just a hook (`useXStore`) you
call from components. We use **one store per domain** so state stays focused and
scaling never requires a refactor.

Import everything from the barrel:

```ts
import { useUIStore, useSettingsStore } from '@renderer/store'
```

---

## Structure

```
store/
├── app/        global app lifecycle (startup, fatal errors)
├── ui/         UI behavior (modals, sidebar, toggles) — transient
├── settings/   user preferences (theme, language) — persistence-ready
├── electron/   system / IPC state mirrored from main — IPC-ready
└── index.ts    barrel (import from here)
```

Each domain folder has two files:

- `useXStore.ts` — the store (state + actions)
- `types.ts` — `XState`, `XActions`, and the combined `XStore` type

---

## How to think about it

> Each store represents **one** area of responsibility.

Where does a piece of state go?

| It's about…                          | Store      |
| ------------------------------------ | ---------- |
| Startup / app-wide lifecycle         | `app`      |
| Modals, toggles, layout flags        | `ui`       |
| User preferences the user can change | `settings` |
| OS / Electron / IPC-sourced values   | `electron` |

If a new feature needs state, it either fits an existing domain or gets a **new
domain folder** (same two-file pattern) exported from `index.ts`.

---

## Using a store

Read state and call actions directly:

```ts
const sidebarOpen = useUIStore((s) => s.sidebarOpen)
const toggleSidebar = useUIStore((s) => s.toggleSidebar)
```

**Always select the narrowest slice you need** (pass a selector) so components
only re-render when that slice changes. Reading the whole store
(`useUIStore()`) re-renders on any change — avoid it.

Outside React (utilities, effects, even the future IPC bridge) use the static
API:

```ts
useElectronStore.getState().setVersion('1.0.0')
```

---

## Rules

- ❌ **No UI inside stores** — never import components; stores return state +
  actions only.
- ❌ **No routing dependency** — stores are framework-agnostic.
- ❌ **No monolithic store** — keep domains separate.
- ❌ **No cross-store imports** unless genuinely necessary (prefer composing in
  the component/hook layer).
- ❌ **No API/IPC calls inside stores** (this phase) — stores stay pure; a
  hook/effect does the I/O and pushes results in via setters.
- ✔ Keep each store small and focused; every store exposes a `reset()`.

---

## Future integration (prepared, not implemented)

- **Persistence** — `settings` is the domain to persist. Wrap its creator in
  Zustand's `persist` middleware (localStorage, or a custom adapter over
  `window.api.system.getSetting/setSetting` for main-process storage).
- **IPC bridging** — `electron` mirrors main-process values. A small hook will
  read `window.api` and call the store's setters; the store never talks to IPC
  itself.
