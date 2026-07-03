# Electron Architecture Guide

How the **main** (backend) and **preload** (secure bridge) processes are
organized, and how to work within them. This covers `src/main` and
`src/preload`; the renderer (React) is documented separately. For a full catalog
of every module, channel, and API, see **[REFERENCE.md](./REFERENCE.md)**.

---

## Table of contents

1. [The three processes](#1-the-three-processes)
2. [Security model](#2-security-model)
3. [Folder structure](#3-folder-structure)
4. [How a request flows](#4-how-a-request-flows)
5. [The layers explained](#5-the-layers-explained)
6. [The two exposed globals](#6-the-two-exposed-globals)
7. [Recipes](#7-recipes)
8. [Rules & conventions](#8-rules--conventions)
9. [FAQ](#9-faq)

---

## 1. The three processes

| Process      | Runs in            | Responsibility                                           |
| ------------ | ------------------ | -------------------------------------------------------- |
| **main**     | Node.js            | Windows, app lifecycle, OS/filesystem, IPC handlers      |
| **preload**  | Isolated bridge    | Curated, typed API surface — the ONLY renderer↔main link |
| **renderer** | Chromium (sandbox) | React UI — no Node, no direct IPC                        |

The golden rule: **the renderer never touches Node or `ipcRenderer` directly.**
It only calls methods on `window.api`, which the preload defines.

---

## 2. Security model

Enforced on the main window ([windows/createMainWindow.ts](./windows/createMainWindow.ts)):

- `contextIsolation: true` — renderer and preload run in separate JS contexts.
- `nodeIntegration: false` — no Node globals in the renderer.
- `sandbox: false` — required so the preload can use the `@electron-toolkit`
  helper; the renderer itself stays isolated. (Set to `true` once the preload
  no longer needs Node builtins.)
- **Preload is the only bridge.** Only `window.api` (curated) and `window.electron`
  (the toolkit helper) are exposed — nothing else leaks onto `window`.

App-wide hardening ([app/events.ts](./app/events.ts)) applies to **every**
web-contents:

- `setWindowOpenHandler` denies all native child windows; real `http(s)` links
  open in the OS browser instead.
- `will-navigate` blocks navigation to anything that isn't our own dev server or
  `file://` bundle.

**Defense in depth:** untrusted renderer input is validated in the preload
(`utils/sanitize.ts`) **and** again in the main service (e.g. `system.service`
re-checks URLs). Never trust an argument just because the preload sent it.

---

## 3. Folder structure

```
src/
├── main/                       # BACKEND (Node)
│   ├── index.ts                # entry — calls bootstrap()
│   ├── app/
│   │   ├── config.ts           # static config + path resolvers
│   │   ├── events.ts           # web-contents security hardening
│   │   └── lifecycle.ts        # ready / activate / quit wiring
│   ├── windows/
│   │   ├── windowManager.ts    # named registry of live windows
│   │   ├── createMainWindow.ts # secure main window factory
│   │   └── createSplashWindow.ts
│   ├── ipc/
│   │   ├── channels.ts         # IPC_CHANNELS registry (single source of truth)
│   │   ├── registerIpc.ts      # registers all handlers, once
│   │   └── handlers/           # app / window / system handlers (thin)
│   ├── services/               # business logic: file / settings / system
│   └── utils/                  # logger / paths / helpers
│
└── preload/                    # SECURE BRIDGE
    ├── index.ts                # exposes window.api + window.electron
    ├── index.d.ts              # global window typings
    ├── bridge/                 # domain APIs: app / window / system
    ├── ipc/                    # invoke / send / on wrappers + types
    └── utils/sanitize.ts       # input validation
```

---

## 4. How a request flows

A renderer call travels through clearly separated layers:

```
Renderer                Preload                       Main
────────                ───────                       ────
window.api.app          appBridge.getVersion()        ipcMain.handle(
  .getVersion()  ─────▶   → invoke(APP_GET_VERSION) ─▶   APP_GET_VERSION,
                                (ipcRenderer.invoke)      () => systemService.getVersion())
                                                              │
       string  ◀───────────────  Promise<string>  ◀──────────┘ (service does the work)
```

- **Channel names** come from one place: `ipc/channels.ts` (`IPC_CHANNELS`).
  Both the preload bridge and the main handler import it — they can never drift.
- **Handlers stay thin.** They map a channel to a **service** call; the service
  holds the real logic (filesystem, OS, validation).

Two directions exist:

- **Request/response** — `invoke` (renderer) ↔ `ipcMain.handle` (main). Returns a
  `Promise`. Use for anything that returns data or can fail.
- **Fire-and-forget** — `send` (renderer) ↔ `ipcMain.on` (main). No return. Used
  for window controls (minimize/close).
- **Main → renderer push** — `webContents.send` (main) ↔ `on` wrapper (preload).
  Used for `window:maximize-changed`.

---

## 5. The layers explained

- **`app/`** — application-level concerns. `config` holds constants and path
  resolvers; `events` centralizes security; `lifecycle` is the single
  `bootstrap()` that wires ready/activate/quit and opens windows.
- **`windows/`** — window factories + a `windowManager` registry so any code can
  find a window by name without passing references around. Each factory sets the
  secure `webPreferences` and registers itself.
- **`ipc/`** — the messaging contract. `channels.ts` is the registry;
  `handlers/` contains thin, domain-grouped handlers; `registerIpc()` is the one
  place they're all registered (called on app ready).
- **`services/`** — all business logic (filesystem, settings persistence, OS
  integration). This is where heavy code lives so it never leaks into the IPC
  layer, and so it's unit-testable in isolation.
- **`utils/`** — cross-cutting helpers: `logger`, `paths`, small `helpers`.

**Preload** mirrors this with a thin, typed surface:

- **`ipc/`** — `invoke`/`send`/`on` wrappers (so no bridge touches `ipcRenderer`
  directly) and `types.ts` (the `RendererApi` contract).
- **`bridge/`** — one file per domain (`app`, `window`, `system`), each exporting
  an object implementing its slice of `RendererApi`.
- **`utils/sanitize.ts`** — validates input before it crosses the boundary.

---

## 6. The two exposed globals

The preload exposes exactly two objects on `window`:

- **`window.api`** — the curated, typed, production surface. **Prefer this.**
  Shape: `{ app, window, system }` (see [REFERENCE.md](./REFERENCE.md)).
- **`window.electron`** — the `@electron-toolkit/preload` helper (`process`,
  `ipcRenderer`, `webFrame`). Kept for convenience and used by a few existing
  renderer utilities. It's a safe contextBridge wrapper, but it exposes a generic
  `ipcRenderer`, so **new code should use `window.api`**; `window.electron` can
  be removed once nothing depends on it.

---

## 7. Recipes

### Add a new IPC feature (e.g. "read clipboard")

1. **Channel** — add to [ipc/channels.ts](./ipc/channels.ts):
   ```ts
   SYSTEM_READ_CLIPBOARD: 'system:read-clipboard'
   ```
2. **Logic** — put it in a service ([services/system.service.ts](./services/system.service.ts)):
   ```ts
   function readClipboard(): string {
     return clipboard.readText()
   }
   export const systemService = { /* … */ readClipboard }
   ```
3. **Handler** — wire the channel to the service ([ipc/handlers/system.handler.ts](./ipc/handlers/system.handler.ts)):
   ```ts
   ipcMain.handle(IPC_CHANNELS.SYSTEM_READ_CLIPBOARD, () => systemService.readClipboard())
   ```
4. **Type** — extend the contract ([../preload/ipc/types.ts](../preload/ipc/types.ts)):
   ```ts
   interface SystemApi {
     /* … */ readClipboard: () => Promise<string>
   }
   ```
5. **Bridge** — expose it ([../preload/bridge/system.bridge.ts](../preload/bridge/system.bridge.ts)):
   ```ts
   readClipboard: () => invoke<string>(IPC_CHANNELS.SYSTEM_READ_CLIPBOARD)
   ```

Now `await window.api.system.readClipboard()` works, fully typed.

> New handler _group_? Create `xxx.handler.ts` with a `registerXxxHandlers()`,
> export it from `ipc/handlers/index.ts`, and call it in `registerIpc()`.

### Add a window

Create `windows/createXWindow.ts` (secure `webPreferences`, register with
`windowManager`), then open it from `app/lifecycle.ts`.

### Add a service

Create `services/x.service.ts` exporting an object of functions. Call it from a
handler — never from the preload or renderer.

---

## 8. Rules & conventions

- ✔ **One `IPC_CHANNELS` registry.** No raw channel strings anywhere else.
- ✔ **Handlers are thin;** logic lives in `services/`.
- ✔ **Preload is the only bridge;** renderer uses `window.api`, never `ipcRenderer`.
- ✔ **Validate untrusted input** in the preload _and_ the service.
- ✔ **One responsibility per module;** windows via `windowManager`, no duplicated
  window setup.
- ❌ No UI/DOM logic in main. ❌ No business logic in preload. ❌ No Node APIs
  exposed to the renderer.

---

## 9. FAQ

**Why keep `window.electron` if `window.api` exists?**
A few existing renderer utilities (and the toolkit's `process` info) use it.
It's safe (contextBridge), but curated `window.api` is preferred; drop
`window.electron` once nothing references it.

**Where do channel strings live?** Only in `ipc/channels.ts`. The preload imports
the same file, so sender and handler always agree.

**Why does the preload import from `main/ipc/channels`?** That file is a pure
constant map (no Node/Electron runtime) — it's the shared IPC _contract_, so both
sides import it to stay DRY. It bundles into the preload with zero runtime cost.

**How do I turn on the splash screen?** Set `APP_CONFIG.enableSplash = true` in
[app/config.ts](./app/config.ts). Lifecycle then shows the splash, creates the
main window hidden, and swaps when it's ready.

**Can I make it more locked down?** Yes — once the renderer no longer needs the
toolkit helper, stop exposing `window.electron` and set `sandbox: true`.

---

## 10. How to add / modify

The §7 recipes show the happy path; this is the full checklist including the
preload side and modification rules. A new renderer-callable capability touches
**five** places (channel → service → handler → type → bridge).

### Add a new IPC handler

1. **Channel** — add a constant to [ipc/channels.ts](./ipc/channels.ts):
   ```ts
   SYSTEM_READ_CLIPBOARD: 'system:read-clipboard'
   ```
2. **Service** — put the logic in `services/` (validate untrusted input here):
   ```ts
   // services/system.service.ts
   function readClipboard(): string {
     return clipboard.readText()
   }
   export const systemService = { /* … */ readClipboard }
   ```
3. **Handler** — wire channel → service in the matching `ipc/handlers/*.handler.ts`:
   ```ts
   ipcMain.handle(IPC_CHANNELS.SYSTEM_READ_CLIPBOARD, () => systemService.readClipboard())
   ```
   For a brand-new domain: create `xxx.handler.ts` with `registerXxxHandlers()`,
   export it from `ipc/handlers/index.ts`, and call it in
   [registerIpc.ts](./ipc/registerIpc.ts).

### Add a new service

Create `services/x.service.ts` exporting an object of functions (no `this`):

```ts
// services/window.service.ts
import { BrowserWindow } from 'electron'

function focusMain(): void {
  BrowserWindow.getAllWindows()[0]?.focus()
}
export const windowService = { focusMain }
```

Call it **only** from a handler — never from the preload or renderer. Heavy
logic, filesystem, and OS calls live here so handlers stay one line.

### Add a new preload API bridge

1. **Type** — extend the contract in [../preload/ipc/types.ts](../preload/ipc/types.ts):
   ```ts
   export interface SystemApi {
     /* … */ readClipboard: () => Promise<string>
   }
   ```
2. **Bridge method** — implement in the domain bridge, going through the typed
   `invoke`/`send`/`on` wrappers and sanitizing input:
   ```ts
   // ../preload/bridge/system.bridge.ts
   readClipboard: () => invoke<string>(IPC_CHANNELS.SYSTEM_READ_CLIPBOARD)
   ```
3. **A whole new domain?** Create `../preload/bridge/<domain>.bridge.ts`
   exporting an object that implements its `RendererApi` slice, then compose it
   into `api` in [../preload/index.ts](../preload/index.ts) and add it to
   `RendererApi`. It's exposed via the existing `contextBridge.exposeInMainWorld('api', api)`
   — you never call `exposeInMainWorld` again.

Now `await window.api.system.readClipboard()` works, fully typed.

### How to modify safely

- **Rename a channel:** change it in `channels.ts` only — both the handler and
  bridge import the constant, so they stay in sync. Never type a raw string.
- **Change a handler's return/args:** update the `RendererApi` type + bridge in
  the same change; TypeScript flags renderer callers.
- **New window:** add `windows/createXWindow.ts` (secure `webPreferences`,
  register with `windowManager`) and open it from `app/lifecycle.ts`.
- Keep the security profile intact: `contextIsolation: true`,
  `nodeIntegration: false`, preload as the only bridge.

### Common mistakes

- ❌ Calling `ipcMain`/`ipcRenderer` outside `ipc/handlers` (main) or the preload
  bridge — no scattered IPC.
- ❌ Raw channel strings anywhere but `channels.ts`.
- ❌ Business logic in a handler or the preload — it belongs in a `service`.
- ❌ Trusting renderer input — validate in the preload **and** the service.
- ❌ A new `contextBridge.exposeInMainWorld` call — extend the existing `api` object.
- ❌ Importing Node/Electron modules into a preload bridge beyond the IPC wrappers.
