# Testing Guide

How testing works in this project: **[Vitest](https://vitest.dev)** for the
runner + **[React Testing Library](https://testing-library.com/react)** for
hooks/components, in a `jsdom` environment. For exact config, scripts, and API,
see **[REFERENCE.md](./REFERENCE.md)**.

---

## What this is

A lightweight, Vite-native test setup wired into the same quality gates as the
rest of the repo:

- **Runner:** Vitest (shares Vite's transform — fast, TS/ESM native).
- **DOM:** `jsdom` (so React hooks/components run headless).
- **Assertions:** Vitest's `expect` + jest-dom matchers (`toBeInTheDocument`, …).
- **Enforced by:** CI (a failing test fails the pipeline) and pre-commit
  (related tests run on staged files).

Tests are also **type-checked** — `src/tests` is part of `tsconfig.web`, so
`npm run typecheck` (and `npm run build`) validates them like app code.

---

## Structure

```
src/tests/
├── setup/
│   └── vitest.setup.ts     jest-dom matchers + jsdom polyfills (matchMedia)
├── store/                  Zustand store tests
├── hooks/                  hook tests (via renderHook)
├── utils/                  pure-function tests
└── *.md                    these docs
```

Mirror the app's structure: a test for `@renderer/store/...` goes in
`src/tests/store/`, a hook test in `src/tests/hooks/`, etc. Name files
`*.test.ts` (or `.tsx` when JSX is involved).

---

## Running

| Command              | Use                             |
| -------------------- | ------------------------------- |
| `npm test`           | Watch mode while developing.    |
| `npm run test:run`   | One-shot run (what CI uses).    |
| `npm run test:ui`    | Browser UI for exploring tests. |
| `npm run test:watch` | Explicit watch mode.            |

---

## Writing tests

Import test functions explicitly from `vitest` (no reliance on ambient
globals — keeps everything typed). Import app code via the `@renderer` alias,
exactly like the app does.

**A store** — drive it through the static `getState()` API; no rendering needed.
Reset in `beforeEach` for isolation:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@renderer/store'

describe('useAppStore', () => {
  beforeEach(() => useAppStore.getState().reset())

  it('updates initialized', () => {
    useAppStore.getState().setInitialized(true)
    expect(useAppStore.getState().initialized).toBe(true)
  })
})
```

**A hook** — use `renderHook` and assert on `result.current`:

```ts
import { renderHook } from '@testing-library/react'
import { useToggle } from '@renderer/hooks'

const { result } = renderHook(() => useToggle())
```

**A pure util** — just call it:

```ts
import { staggerDelay } from '@renderer/animations/utils/delay'
expect(staggerDelay(3, 0.1)).toBeCloseTo(0.3)
```

---

## Conventions & rules

- ✔ **Deterministic & isolated** — reset shared state (`store.reset()`) in
  `beforeEach`; never let one test depend on another's order.
- ✔ **Explicit imports** from `vitest` — don't depend on globals for typing.
- ✔ **Test logic, not design** — assert behavior/state, not markup or styles.
- ✔ **Avoid over-mocking** — only stub what jsdom lacks (see the setup file).
- ❌ **No E2E here** — Playwright/WDIO is out of scope.
- ❌ **No snapshot-of-everything** — prefer explicit assertions.

---

## How it's integrated

- **Typecheck:** `src/tests/**` is in `tsconfig.web`, so tests are type-checked
  by `npm run typecheck` / `build`.
- **CI:** the workflow runs `npm run test:run` after lint + typecheck; a failing
  test fails the build.
- **Pre-commit:** `lint-staged` runs `vitest related --run --passWithNoTests` on
  staged `.ts/.tsx`, so only tests affected by your changes run (fast).
- **ESLint:** test files are linted normally, except `react-hooks/rules-of-hooks`
  is disabled for `src/tests/**` (hooks are legitimately called inside
  `renderHook` callbacks).

---

## Adding component tests later

The stack is ready: import `render`/`screen` from `@testing-library/react` and
`userEvent` from `@testing-library/user-event`. jest-dom matchers are already
set up. Keep them behavior-focused — this foundation is for logic and
interaction, not visual/design testing.
