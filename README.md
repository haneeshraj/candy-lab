# candy-lab

An Electron + React + TypeScript application.

> This README covers the **development workflow** — setup, scripts, tooling, and
> conventions. Product/feature documentation will be added later.

---

## Tech stack

| Area          | Choice                                        |
| ------------- | --------------------------------------------- |
| Desktop shell | Electron                                      |
| UI            | React 19 + TypeScript                         |
| Bundler       | electron-vite (Vite 7)                        |
| Styling       | SCSS (modern `@use`/`@forward`) + CSS Modules |
| Animation     | motion                                        |
| Packaging     | electron-builder                              |
| Linting       | ESLint 9 (flat config) · Stylelint · Prettier |
| Hooks / CI    | Husky + lint-staged · GitHub Actions          |

---

## Prerequisites

- **Node.js 20+** and npm
- Git (required for the pre-commit hook to run)

---

## Getting started

```bash
npm install     # installs deps; `prepare` wires Husky if this is a git repo
npm run dev      # launch the app with HMR
```

---

## Project structure

```
src/
├── main/        Electron main process (window, app lifecycle, IPC)
├── preload/     Preload bridge (contextIsolation-safe APIs)
└── renderer/    React app
    └── src/
        ├── components/   React components (+ co-located *.module.scss)
        ├── styles/       Global SCSS architecture (see styles/GUIDE.md)
        ├── App.tsx
        └── main.tsx      Renderer entry — imports styles/main.scss (global)
```

Config lives at the root: `electron.vite.config.ts`, `electron-builder.yml`,
`eslint.config.mjs`, `.stylelintrc.json`, `.prettierrc.yaml`, the `tsconfig.*`
files, and `.github/workflows/ci.yml`.

---

## npm scripts

| Script                 | What it does                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Start the app in development with hot reload                          |
| `npm start`            | Preview a production build locally                                    |
| `npm run build`        | **Gated build:** lint + stylelint → typecheck → `electron-vite build` |
| `npm run build:win`    | Build + package for Windows                                           |
| `npm run build:mac`    | Build + package for macOS                                             |
| `npm run build:linux`  | Build + package for Linux                                             |
| `npm run build:unpack` | Build an unpacked dir (quick local sanity check)                      |
| `npm run typecheck`    | Type-check both the node (main/preload) and web (renderer) projects   |
| `npm run lint`         | ESLint over the codebase                                              |
| `npm run lint:styles`  | Stylelint over `src/**/*.scss`                                        |
| `npm run lint:all`     | ESLint + Stylelint                                                    |
| `npm run lint:fix`     | Auto-fix ESLint + Stylelint issues                                    |
| `npm run format`       | Prettier write across the repo                                        |

---

## Code quality & enforcement

Quality is enforced at three stages so problems are caught early:

1. **Editor** — install the recommended VSCode extensions (ESLint, Prettier,
   and the [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
   extension) for inline feedback and format-on-save.
2. **Pre-commit** — Husky runs `lint-staged` on staged files: `eslint --fix` +
   `prettier` for JS/TS, `stylelint --fix` + `prettier` for SCSS. Bad commits are
   blocked before they land.
3. **Pre-build & CI** — `npm run build` refuses to build unless lint, stylelint,
   and typecheck pass; GitHub Actions runs the same checks on every push/PR.

### Tooling

- **ESLint** (`eslint.config.mjs`) — TypeScript + React rules, plus an
  architecture rule: components may only import `*.module.scss` (global SCSS is
  imported once, in the renderer entry).
- **Stylelint** (`.stylelintrc.json`) — enforces the SCSS architecture: no raw
  hex (use design tokens), max nesting depth 3, no `!important`, consistent
  class-name patterns.
- **Prettier** (`.prettierrc.yaml`) — formatting; single quotes, no semicolons,
  100-col width. Stylelint/ESLint defer formatting to Prettier (no conflicts).

### Activating the pre-commit hook

The hook is wired automatically by `npm install` **if the folder is a git
repository**. For a fresh clone that's already the case. If you started without
git:

```bash
git init
npm run prepare   # wires Husky into .git hooks
```

---

## Before pushing / opening a PR

Run these checks locally so CI passes on the first try. Work on a feature
branch, never commit directly to `main`.

**1. Sync dependencies** (only if `package.json` / lockfile changed):

```bash
npm install
```

**2. Auto-fix formatting & lint issues:**

```bash
npm run lint:fix     # ESLint --fix + Stylelint --fix
npm run format       # Prettier across the repo
```

**3. Run the full quality gate** (this is exactly what CI runs):

```bash
npm run lint:all     # ESLint + Stylelint, no auto-fix — must be clean
npm run typecheck    # main/preload + renderer type checks
npm run build        # gated build: lint + typecheck + compile
```

**4. Smoke-test the app** — confirm it still runs and your change works:

```bash
npm run dev
```

**5. Commit** — the pre-commit hook runs `lint-staged` on staged files and
blocks the commit if anything fails:

```bash
git add -A
git commit -m "feat: short description of the change"
```

**6. Push and open the PR:**

```bash
git push -u origin <your-branch>
```

Then open the PR against `main`. GitHub Actions re-runs ESLint, Stylelint, and
typecheck — the PR must be green to merge.

### Quick checklist

- [ ] On a feature branch (not `main`)
- [ ] `npm run lint:all` passes (no errors)
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] App runs and the change is verified (`npm run dev`)
- [ ] No hardcoded colors/spacing/shadows — design tokens only
- [ ] Component styles live in a co-located `*.module.scss`
- [ ] Commit message is clear; no unrelated changes bundled in

> Shortcut: `npm run build` alone runs lint + stylelint + typecheck before
> compiling, so a green `build` means steps 3's checks all passed.

---

## System documentation

Each subsystem has its own docs, and every one includes a **“How to add /
modify”** workflow — read the relevant guide before extending that area.

| System                      | Docs                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Styling (SCSS)**          | [styles/GUIDE.md](src/renderer/src/styles/GUIDE.md) · [REFERENCE.md](src/renderer/src/styles/REFERENCE.md) |
| **Routing**                 | [router/README.md](src/renderer/src/router/README.md)                                                      |
| **State (Zustand)**         | [store/GUIDE.md](src/renderer/src/store/GUIDE.md) · [REFERENCE.md](src/renderer/src/store/REFERENCE.md)    |
| **Motion**                  | [animations/README.md](src/renderer/src/animations/README.md)                                              |
| **Hooks**                   | [hooks/README.md](src/renderer/src/hooks/README.md)                                                        |
| **Electron main + preload** | [main/GUIDE.md](src/main/GUIDE.md) · [REFERENCE.md](src/main/REFERENCE.md)                                 |
| **Testing**                 | [tests/GUIDE.md](src/tests/GUIDE.md) · [REFERENCE.md](src/tests/REFERENCE.md)                              |

Rule of thumb everywhere: use the design tokens / centralized config, never
hardcode values, and keep component styles in a co-located `Component.module.scss`.

---

## Recommended IDE setup

[VSCode](https://code.visualstudio.com/) with:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)

Debug configurations for the main and renderer processes are provided in
`.vscode/launch.json`.
