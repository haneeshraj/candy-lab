# Testing Reference

Quick lookup for the test setup — config, scripts, APIs, and integration points.
For concepts and how-to, see **[GUIDE.md](./GUIDE.md)**.

---

## Scripts

| Script               | Command        | Notes                      |
| -------------------- | -------------- | -------------------------- |
| `npm test`           | `vitest`       | Watch mode (interactive).  |
| `npm run test:watch` | `vitest watch` | Explicit watch mode.       |
| `npm run test:run`   | `vitest run`   | Single run — used by CI.   |
| `npm run test:ui`    | `vitest ui`    | Browser UI (`@vitest/ui`). |

---

## Config — [vitest.config.ts](../../vitest.config.ts)

| Option             | Value                                 | Why                                     |
| ------------------ | ------------------------------------- | --------------------------------------- |
| `plugins`          | `@vitejs/plugin-react`                | JSX/React transform.                    |
| `resolve.alias`    | `@renderer` → `src/renderer/src`      | Import app code like the app does.      |
| `test.environment` | `jsdom`                               | Headless DOM for hooks/components.      |
| `test.globals`     | `true`                                | Global test API + RTL auto-cleanup.     |
| `test.setupFiles`  | `./src/tests/setup/vitest.setup.ts`   | Matchers + polyfills.                   |
| `test.include`     | `src/tests/**/*.{test,spec}.{ts,tsx}` | Which files are tests.                  |
| `test.css`         | `false`                               | Skip CSS processing (logic-only tests). |

> Standalone from `electron.vite.config.ts` (that's for the app build). Vitest
> only reads `vitest.config.ts`.

---

## Setup file — [setup/vitest.setup.ts](./setup/vitest.setup.ts)

Runs before every test file. Responsibilities:

- `import '@testing-library/jest-dom/vitest'` — adds jest-dom matchers to
  `expect` **and** their TypeScript types.
- Stubs `window.matchMedia` (jsdom doesn't implement it) so hooks that read it
  (e.g. `prefers-reduced-motion`) are deterministic (`matches: false`).

Add further global polyfills/mocks here only when jsdom genuinely lacks an API.

---

## Dependencies

| Package                       | Role                                   |
| ----------------------------- | -------------------------------------- |
| `vitest`                      | Test runner + `expect`.                |
| `jsdom`                       | DOM environment.                       |
| `@testing-library/react`      | `render`, `renderHook`, `screen`.      |
| `@testing-library/jest-dom`   | DOM matchers (`toBeInTheDocument`, …). |
| `@testing-library/user-event` | Realistic user interactions.           |
| `@vitest/ui`                  | Backs `test:ui`.                       |

---

## Common APIs

**From `vitest`:** `describe`, `it` / `test`, `expect`, `beforeEach`,
`afterEach`, `beforeAll`, `afterAll`, `vi` (mocks/spies/timers).

**From `@testing-library/react`:** `render`, `screen`, `renderHook`, `waitFor`,
`cleanup` (auto-run between tests via globals).

**From `@testing-library/user-event`:** `userEvent.setup()` → `.click()`,
`.type()`, etc.

**Zustand in tests:** `useStore.getState()`, `.setState(...)`, `.subscribe(...)`.
Call the store's `reset()` in `beforeEach`.

---

## File conventions

| Rule          | Value                                              |
| ------------- | -------------------------------------------------- |
| Location      | `src/tests/<domain>/`                              |
| Naming        | `*.test.ts` / `*.test.tsx` (`.spec` also matches)  |
| Imports       | Explicit from `vitest`; app code via `@renderer/*` |
| Type-checked? | Yes — `src/tests/**` is in `tsconfig.web`          |

---

## Integration points

| Where          | What happens                                                                      |
| -------------- | --------------------------------------------------------------------------------- |
| **CI**         | `.github/workflows/ci.yml` runs `npm run test:run` after lint/typecheck.          |
| **Pre-commit** | `lint-staged` runs `vitest related --run --passWithNoTests` on staged `.ts/.tsx`. |
| **Typecheck**  | `npm run typecheck` (and `build`) includes `src/tests/**`.                        |
| **ESLint**     | Tests linted normally; `react-hooks/rules-of-hooks` off for `src/tests/**`.       |

---

## Sample tests (in repo)

| File                                 | Validates                              |
| ------------------------------------ | -------------------------------------- |
| `store/appStore.test.ts`             | Zustand default state, actions, reset. |
| `hooks/useReducedMotionSafe.test.ts` | Hook returns a deterministic boolean.  |
| `utils/helpers.test.ts`              | Pure delay helpers.                    |
