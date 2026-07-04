// Public shape of the API exposed on `window.api`. This is the contract the
// renderer codes against — self-contained (no Electron/Node imports) so it can
// be consumed safely from the web context.

export type Platform =
  | 'aix'
  | 'android'
  | 'darwin'
  | 'freebsd'
  | 'haiku'
  | 'linux'
  | 'openbsd'
  | 'sunos'
  | 'win32'
  | 'cygwin'
  | 'netbsd'

/** Static application metadata, baked in at build time. */
export interface AppInfo {
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage: string
  /** Short git commit hash, or `'unknown'` outside a git checkout. */
  commit: string
  /** ISO timestamp of when the bundle was built. */
  buildDate: string
}

export interface AppApi {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<Platform>
  getInfo: () => Promise<AppInfo>
}

export interface WindowApi {
  minimize: () => void
  /** Toggle maximize/restore. */
  maximize: () => void
  close: () => void
  isMaximized: () => Promise<boolean>
  /** Subscribe to maximize-state changes; returns an unsubscribe function. */
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => () => void
}

export interface SystemApi {
  /** Open an http(s) URL in the OS default browser. */
  openExternal: (url: string) => Promise<void>
  getSetting: (key: string) => Promise<unknown>
  setSetting: (key: string, value: unknown) => Promise<void>
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

/** Snapshot of the auto-updater, pushed to the renderer as things progress. */
export interface UpdaterStatus {
  status: UpdateStatus
  /** Version of the available/downloaded update. */
  version?: string | null
  /** Download progress, 0–100 (only during `downloading`). */
  percent?: number | null
  /** Message for the `error` status. */
  error?: string | null
}

/** Details of a GitHub release, for the "Release Notes" dialog. */
export interface ReleaseInfo {
  /** Tag, e.g. `v1.0.0`. */
  version: string
  /** Release title. */
  name: string
  /** Release body, in Markdown. */
  notes: string
  /** Link to the release on GitHub. */
  url: string
  /** ISO timestamp the release was published. */
  publishedAt: string
}

export interface UpdaterApi {
  /** Trigger a check now (no-op in unpackaged dev builds). */
  check: () => Promise<void>
  /** Quit and install a downloaded update immediately. */
  install: () => void
  /** Last known status (covers events emitted before the renderer subscribed). */
  getStatus: () => Promise<UpdaterStatus>
  /** Subscribe to status changes; returns an unsubscribe function. */
  onStatusChange: (callback: (status: UpdaterStatus) => void) => () => void
  /** Fetch the latest published release from GitHub (`null` if unavailable). */
  getLatestRelease: () => Promise<ReleaseInfo | null>
}

/** The complete API surface exposed to the renderer. */
export interface RendererApi {
  app: AppApi
  window: WindowApi
  system: SystemApi
  updater: UpdaterApi
}
