# State Management Reference

Quick lookup for every store, its state, and its actions. For concepts and
rules, see **[GUIDE.md](./GUIDE.md)**. All stores are exported from
`@renderer/store`.

---

## Stores at a glance

| Store      | Hook               | Purpose                          |
| ---------- | ------------------ | -------------------------------- |
| `app`      | `useAppStore`      | Global lifecycle state           |
| `ui`       | `useUIStore`       | UI flags & interactions          |
| `settings` | `useSettingsStore` | User preferences (persist-ready) |
| `electron` | `useElectronStore` | IPC / system state (IPC-ready)   |

---

## Store creation pattern (Zustand v5)

```ts
import { create } from 'zustand'

export const useXStore = create<XStore>()((set, get) => ({
  ...initialState, // state
  someAction: (value) => set({ field: value }), // action
  derived: (id) => get().items.includes(id) // read via get()
}))
```

- `create<T>()(...)` — the **curried** form is required by v5 when passing an
  explicit type.
- `XStore = XState & XActions` (defined in each domain's `types.ts`).
- Select narrow slices: `useXStore((s) => s.field)`.
- Static access (outside React): `useXStore.getState()` / `.setState()` /
  `.subscribe()`.

---

## `app` — `useAppStore`

**State**

| Field         | Type             | Initial | Meaning                      |
| ------------- | ---------------- | ------- | ---------------------------- |
| `initialized` | `boolean`        | `false` | Startup sequence finished.   |
| `bootError`   | `string \| null` | `null`  | Fatal startup error message. |

**Actions**

| Action                  | Signature                         |
| ----------------------- | --------------------------------- |
| `setInitialized(value)` | `(value: boolean) => void`        |
| `setBootError(error)`   | `(error: string \| null) => void` |
| `reset()`               | `() => void`                      |

---

## `ui` — `useUIStore`

**State**

| Field         | Type       | Initial | Meaning             |
| ------------- | ---------- | ------- | ------------------- |
| `openModals`  | `string[]` | `[]`    | IDs of open modals. |
| `sidebarOpen` | `boolean`  | `false` | Sidebar visibility. |

**Actions**

| Action                 | Signature                  | Notes                               |
| ---------------------- | -------------------------- | ----------------------------------- |
| `openModal(id)`        | `(id: string) => void`     | No-op if already open.              |
| `closeModal(id)`       | `(id: string) => void`     |                                     |
| `isModalOpen(id)`      | `(id: string) => boolean`  | Reads current state via `get()`.    |
| `toggleSidebar(open?)` | `(open?: boolean) => void` | Toggles, or sets when given a bool. |
| `reset()`              | `() => void`               |                                     |

---

## `settings` — `useSettingsStore`

**State**

| Field      | Type        | Initial  | Meaning           |
| ---------- | ----------- | -------- | ----------------- |
| `theme`    | `ThemeMode` | `'dark'` | Color theme.      |
| `language` | `string`    | `'en'`   | UI language code. |

`ThemeMode = 'dark' | 'light' | 'system'`

**Actions**

| Action              | Signature                    |
| ------------------- | ---------------------------- |
| `setTheme(theme)`   | `(theme: ThemeMode) => void` |
| `setLanguage(lang)` | `(language: string) => void` |
| `reset()`           | `() => void`                 |

**Persistence:** implemented — the creator is wrapped in Zustand's `persist`
middleware (`localStorage`, key `candy-lab-settings`, only state persisted).
Swap in a custom `storage` adapter over `window.api.system` to persist to the
main process instead.

---

## `electron` — `useElectronStore`

**State**

| Field          | Type             | Initial  | Meaning                              |
| -------------- | ---------------- | -------- | ------------------------------------ |
| `version`      | `string \| null` | `null`   | App version (from `window.api.app`). |
| `platform`     | `string \| null` | `null`   | OS platform.                         |
| `updateStatus` | `UpdateStatus`   | `'idle'` | Auto-update lifecycle status.        |

`UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'`

**Actions**

| Action                    | Signature                            |
| ------------------------- | ------------------------------------ |
| `setVersion(version)`     | `(version: string \| null) => void`  |
| `setPlatform(platform)`   | `(platform: string \| null) => void` |
| `setUpdateStatus(status)` | `(status: UpdateStatus) => void`     |
| `reset()`                 | `() => void`                         |

**IPC-ready:** populate these via a bridging hook that reads `window.api`; the
store performs no IPC itself.

---

## Adding a new domain

1. Create `store/<domain>/types.ts` (`XState`, `XActions`, `XStore`).
2. Create `store/<domain>/useXStore.ts` with the pattern above (include `reset`).
3. Export the hook + types from [index.ts](./index.ts).
