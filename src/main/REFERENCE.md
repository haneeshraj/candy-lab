# Electron Architecture Reference

Complete catalog of the **main** and **preload** modules — exports, signatures,
IPC channels, and the renderer API surface. For concepts and flow, see
**[GUIDE.md](./GUIDE.md)**.

---

## Table of contents

- [IPC channels](#ipc-channels)
- [Renderer API (`window.api`)](#renderer-api-windowapi)
- [`window.electron` (toolkit helper)](#windowelectron-toolkit-helper)
- [Main — app/](#main--app)
- [Main — windows/](#main--windows)
- [Main — ipc/](#main--ipc)
- [Main — services/](#main--services)
- [Main — utils/](#main--utils)
- [Preload — bridge/](#preload--bridge)
- [Preload — ipc/](#preload--ipc)
- [Preload — utils/](#preload--utils)

---

## IPC channels

Defined once in [ipc/channels.ts](./ipc/channels.ts) as `IPC_CHANNELS`.
Direction key: **R→M send** (fire-and-forget), **R→M invoke** (request/response),
**M→R** (push).

| Constant                  | String                    | Direction  | Payload       | Returns    |
| ------------------------- | ------------------------- | ---------- | ------------- | ---------- |
| `WINDOW_MINIMIZE`         | `window:minimize`         | R→M send   | —             | —          |
| `WINDOW_TOGGLE_MAXIMIZE`  | `window:toggle-maximize`  | R→M send   | —             | —          |
| `WINDOW_CLOSE`            | `window:close`            | R→M send   | —             | —          |
| `WINDOW_IS_MAXIMIZED`     | `window:is-maximized`     | R→M invoke | —             | `boolean`  |
| `WINDOW_MAXIMIZE_CHANGED` | `window:maximize-changed` | M→R        | `boolean`     | —          |
| `APP_GET_VERSION`         | `app:get-version`         | R→M invoke | —             | `string`   |
| `APP_GET_PLATFORM`        | `app:get-platform`        | R→M invoke | —             | `Platform` |
| `SYSTEM_OPEN_EXTERNAL`    | `system:open-external`    | R→M invoke | `url: string` | `void`     |
| `SETTINGS_GET`            | `settings:get`            | R→M invoke | `key: string` | `unknown`  |
| `SETTINGS_SET`            | `settings:set`            | R→M invoke | `key, value`  | `void`     |

`type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]`.

---

## Renderer API (`window.api`)

Typed by `RendererApi` in [../preload/ipc/types.ts](../preload/ipc/types.ts).
This is the surface the renderer should use.

### `api.app`

| Method          | Signature                 | Notes                      |
| --------------- | ------------------------- | -------------------------- |
| `getVersion()`  | `() => Promise<string>`   | App version.               |
| `getPlatform()` | `() => Promise<Platform>` | e.g. `'darwin'`/`'win32'`. |

### `api.window`

| Method                 | Signature                                            | Notes                      |
| ---------------------- | ---------------------------------------------------- | -------------------------- |
| `minimize()`           | `() => void`                                         | Fire-and-forget.           |
| `maximize()`           | `() => void`                                         | Toggles maximize/restore.  |
| `close()`              | `() => void`                                         | Fire-and-forget.           |
| `isMaximized()`        | `() => Promise<boolean>`                             | Current state.             |
| `onMaximizeChange(cb)` | `(cb: (isMaximized: boolean) => void) => () => void` | Returns an unsubscribe fn. |

### `api.system`

| Method                   | Signature                                        | Notes                          |
| ------------------------ | ------------------------------------------------ | ------------------------------ |
| `openExternal(url)`      | `(url: string) => Promise<void>`                 | http(s) only; sanitized twice. |
| `getSetting(key)`        | `(key: string) => Promise<unknown>`              | From userData `settings.json`. |
| `setSetting(key, value)` | `(key: string, value: unknown) => Promise<void>` | Persists to `settings.json`.   |

### `Platform`

Union: `'aix' | 'android' | 'darwin' | 'freebsd' | 'haiku' | 'linux' | 'openbsd' | 'sunos' | 'win32' | 'cygwin' | 'netbsd'`.

---

## `window.electron` (toolkit helper)

From `@electron-toolkit/preload`. Safe (contextBridge) but generic — prefer
`window.api`. Provides:

- `electron.process` — `{ platform, versions, env, … }` (sync).
- `electron.ipcRenderer` — `send` / `invoke` / `on` / `once` / `removeAllListeners`.
- `electron.webFrame` — `insertCSS`, `setZoomFactor`, etc.

---

## Main — app/

### [config.ts](./app/config.ts)

| Export                | Type / value                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `APP_CONFIG`          | `{ appUserModelId, enableSplash, window: { main, splash } }` (`as const`) |
| `getPreloadPath()`    | `() => string` — absolute path to `preload/index.js`                      |
| `getRendererHtml()`   | `() => string` — built renderer `index.html` (production)                 |
| `getRendererDevUrl()` | `() => string \| undefined` — electron-vite dev server URL                |

`APP_CONFIG` values: `appUserModelId: 'com.electron.candy-lab'`,
`enableSplash: false`, `window.main: { width: 900, height: 670, minWidth: 640, minHeight: 480 }`,
`window.splash: { width: 420, height: 260 }`.

### [events.ts](./app/events.ts)

| Export                  | Signature    | Purpose                                                                  |
| ----------------------- | ------------ | ------------------------------------------------------------------------ |
| `registerAppSecurity()` | `() => void` | Deny child windows, route links externally, block off-origin navigation. |

### [lifecycle.ts](./app/lifecycle.ts)

| Export        | Signature    | Purpose                                                                                                                  |
| ------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `bootstrap()` | `() => void` | Wire `whenReady`/`activate`/`window-all-closed`, register IPC + security, open windows. The only thing `index.ts` calls. |

---

## Main — windows/

### [windowManager.ts](./windows/windowManager.ts)

`windowManager` (singleton):

| Method                | Signature                                                          |
| --------------------- | ------------------------------------------------------------------ |
| `register(name, win)` | `(name: string, w: BrowserWindow) => void` — auto-removes on close |
| `get(name)`           | `(name: string) => BrowserWindow \| undefined`                     |
| `all()`               | `() => BrowserWindow[]`                                            |
| `has(name)`           | `(name: string) => boolean`                                        |

### [createMainWindow.ts](./windows/createMainWindow.ts)

`createMainWindow(options?: { autoShow?: boolean }): BrowserWindow`

- Secure `webPreferences`: `contextIsolation: true`, `nodeIntegration: false`,
  `sandbox: false`, `preload: getPreloadPath()`.
- `titleBarStyle: 'hidden'`, `autoHideMenuBar: true`, min size enforced.
- Emits `WINDOW_MAXIMIZE_CHANGED` on maximize/unmaximize.
- Loads dev URL (dev) or built HTML (prod); registers as `'main'`.
- `autoShow` (default `true`) — show on `ready-to-show`; pass `false` for the
  splash handoff.

### [createSplashWindow.ts](./windows/createSplashWindow.ts)

`createSplashWindow(): BrowserWindow` — frameless, centered, inline markup (no
renderer dependency). Registered as `'splash'`. Only used when
`APP_CONFIG.enableSplash` is `true`.

---

## Main — ipc/

### [channels.ts](./ipc/channels.ts)

`IPC_CHANNELS` (see [table above](#ipc-channels)) and `type IpcChannel`.

### [handlers/](./ipc/handlers)

| Export                     | File                | Registers                                          |
| -------------------------- | ------------------- | -------------------------------------------------- |
| `registerAppHandlers()`    | `app.handler.ts`    | `APP_GET_VERSION`, `APP_GET_PLATFORM`              |
| `registerWindowHandlers()` | `window.handler.ts` | window minimize/toggle-maximize/close/is-maximized |
| `registerSystemHandlers()` | `system.handler.ts` | `SYSTEM_OPEN_EXTERNAL`, `SETTINGS_GET/SET`         |

Each handler resolves its window via `BrowserWindow.fromWebContents(event.sender)`
and delegates logic to a service.

### [registerIpc.ts](./ipc/registerIpc.ts)

`registerIpc(): void` — calls all three `registerXHandlers()`; invoked once on
app ready.

---

## Main — services/

### [file.service.ts](./services/file.service.ts) — `fileService`

| Method                        | Signature                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `readJson<T>(path, fallback)` | `(filePath: string, fallback: T) => Promise<T>` — returns fallback if missing/invalid |
| `writeJson(path, data)`       | `(filePath: string, data: unknown) => Promise<void>` — pretty-printed                 |

### [settings.service.ts](./services/settings.service.ts) — `settingsService`

| Method            | Signature                                        |
| ----------------- | ------------------------------------------------ |
| `getAll()`        | `() => Promise<Record<string, unknown>>`         |
| `get(key)`        | `(key: string) => Promise<unknown>`              |
| `set(key, value)` | `(key: string, value: unknown) => Promise<void>` |

Backed by `userData/settings.json` via `fileService`.

### [system.service.ts](./services/system.service.ts) — `systemService`

| Method              | Signature                        | Notes                                    |
| ------------------- | -------------------------------- | ---------------------------------------- |
| `openExternal(url)` | `(url: string) => Promise<void>` | Re-validates http(s) (defense in depth). |
| `getVersion()`      | `() => string`                   | `app.getVersion()`.                      |
| `getPlatform()`     | `() => NodeJS.Platform`          | `process.platform`.                      |

---

## Main — utils/

### [logger.ts](./utils/logger.ts) — `logger`

`logger.debug/info/warn/error(...args: unknown[]): void` — prefixed console
sink; swap here for a file logger without changing call sites.

### [paths.ts](./utils/paths.ts) — `paths`

`userData()`, `logs()`, `temp()`, `settingsFile()` — all `() => string`, lazily
reading `app.getPath` (call after app ready).

### [helpers.ts](./utils/helpers.ts)

| Export      | Type                                           |
| ----------- | ---------------------------------------------- |
| `isDev`     | `boolean` (`@electron-toolkit/utils` `is.dev`) |
| `delay(ms)` | `(ms: number) => Promise<void>`                |

---

## Preload — bridge/

Each bridge implements a slice of `RendererApi` and is composed in
[../preload/index.ts](../preload/index.ts).

| File               | Export         | Implements  |
| ------------------ | -------------- | ----------- |
| `app.bridge.ts`    | `appBridge`    | `AppApi`    |
| `window.bridge.ts` | `windowBridge` | `WindowApi` |
| `system.bridge.ts` | `systemBridge` | `SystemApi` |

---

## Preload — ipc/

### [invoke.ts](../preload/ipc/invoke.ts)

| Export                        | Signature                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `invoke<T>(channel, ...args)` | `(channel: string, ...args: unknown[]) => Promise<T>` (default `T = unknown`) |
| `send(channel, ...args)`      | `(channel: string, ...args: unknown[]) => void`                               |

### [on.ts](../preload/ipc/on.ts)

`on(channel, listener): () => void` — subscribes, strips the Electron event so
the listener receives only payload args, and returns an unsubscribe function.

### [types.ts](../preload/ipc/types.ts)

`Platform`, `AppApi`, `WindowApi`, `SystemApi`, `RendererApi` — the renderer
contract (self-contained, no Electron/Node imports).

---

## Preload — utils/

### [sanitize.ts](../preload/utils/sanitize.ts)

| Export                     | Signature                 | Behavior                             |
| -------------------------- | ------------------------- | ------------------------------------ |
| `sanitizeExternalUrl(url)` | `(url: string) => string` | Throws unless a valid `http(s)` URL. |
| `sanitizeKey(key)`         | `(key: string) => string` | Throws unless a non-empty string.    |
