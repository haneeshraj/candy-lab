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

## How to add / modify

### Add a new hook

1. **Pick the category folder** by concern: `state/`, `dom/`, `lifecycle/`, or
   `electron/`. If none fit, create a new category folder with its own
   `index.ts` and export it from the root `index.ts`.
2. **Create `useX.ts`** — one hook per file, filename matches the export, with an
   explicit return type. Memoize returned functions and clean up any listeners.

   ```ts
   // hooks/dom/useWindowSize.ts
   import { useEffect, useState } from 'react'

   export interface WindowSize {
     width: number
     height: number
   }

   export function useWindowSize(): WindowSize {
     const [size, setSize] = useState<WindowSize>({
       width: window.innerWidth,
       height: window.innerHeight
     })
     useEffect(() => {
       const onResize = (): void =>
         setSize({ width: window.innerWidth, height: window.innerHeight })
       window.addEventListener('resize', onResize)
       return () => window.removeEventListener('resize', onResize)
     }, [])
     return size
   }
   ```

3. **Export from the category barrel** (`hooks/dom/index.ts`):
   ```ts
   export * from './useWindowSize'
   ```
   The root `hooks/index.ts` re-exports each category, so it's available as
   `import { useWindowSize } from '@renderer/hooks'`.

### Modify an existing hook safely

- **Additive changes are safe:** append optional params (with defaults) or add
  fields to a returned object — existing callers keep working.
- **Breaking changes** (renaming, reordering params, changing return shape):
  update all call sites in the same change; TypeScript will flag them.
- Keep the returned function/object references **stable** (`useCallback`/
  `useMemo`) so consumers relying on them as effect deps don't loop.
- Preserve cleanup — never drop a listener/timer teardown when editing.

### Common mistakes

- ❌ Naming a hook without the `use` prefix (breaks Rules of Hooks + lint).
- ❌ Returning new function identities every render without `useCallback`.
- ❌ Reading `ref.current` during render (use the state pattern — see `usePrevious`).
- ❌ Putting feature/business logic in a generic hook.
- ❌ Importing from a category subpath in app code — always import from `@renderer/hooks`.
