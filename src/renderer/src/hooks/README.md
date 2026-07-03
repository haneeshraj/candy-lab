# Custom Hooks

Reusable React hooks for the renderer, grouped by concern. Everything is
re-exported from the root barrel and consumed via `@renderer/hooks`.

```ts
import { useDisclosure, useOnClickOutside, useDebouncedValue, usePlatform } from '@renderer/hooks'
```

## Structure

```
hooks/
├── state/       Local component state helpers
│   ├── useToggle          boolean with a toggle/set setter
│   ├── useDisclosure      open/close/toggle for overlays
│   ├── useLocalStorage    useState persisted to localStorage (cross-window sync)
│   └── useDebouncedValue  debounce a changing value
│
├── dom/         Browser / DOM integration
│   ├── useEventListener   window event listener with cleanup
│   ├── useOnClickOutside  fire when a press lands outside a ref
│   └── useMediaQuery      track a CSS media query (pairs with SCSS breakpoints)
│
├── lifecycle/   Render & mount lifecycle
│   ├── useIsMounted       stable "still mounted?" getter for async guards
│   ├── usePrevious        value from the previous render
│   └── useUpdateEffect    useEffect that skips the initial mount
│
├── electron/    Electron-specific (uses the preload bridge)
│   ├── useIpcListener     subscribe to a main→renderer IPC channel
│   └── usePlatform        current OS platform ('darwin' | 'win32' | 'linux')
│
└── index.ts     barrel (import from here)
```

## Conventions

- **One hook per file**, named `useX.ts`, matching the export.
- **Grouped by concern**; add a new hook to the closest category (or create a
  new category folder with its own `index.ts` and add it to the root barrel).
- **Always import from `@renderer/hooks`**, not from a category subpath, so the
  internal layout can change freely.
- **Stable references:** setters/handlers returned by these hooks are memoized
  (`useCallback`/`useMemo`) so they're safe as effect dependencies.
- **Explicit return types** on every hook (matches the project's TS/lint rules).
- **Cleanup everything:** listeners, timers, and subscriptions are removed on
  unmount.

## Usage examples

**Disclosure (overlay open/close):**

```tsx
const menu = useDisclosure()
// menu.isOpen, menu.open(), menu.close(), menu.toggle()
```

**Close on outside click:**

```tsx
const ref = useRef<HTMLDivElement>(null)
useOnClickOutside(ref, menu.close)
```

**Debounced search:**

```tsx
const debounced = useDebouncedValue(query, 250)
useEffect(() => search(debounced), [debounced])
```

**Listen to an IPC event from main:**

```tsx
useIpcListener('update:progress', (percent) => setProgress(percent as number))
```

## Rules

- ❌ Don't duplicate a hook that already exists — extend or compose instead.
- ❌ Don't put app/business logic in here — these stay generic and reusable.
- ✔ Keep hooks pure of UI; they return state/handlers, never JSX.
- ✔ Respect the Rules of Hooks (top-level calls only) — ESLint enforces this.
