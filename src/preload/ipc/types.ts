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

export interface AppApi {
  getVersion: () => Promise<string>
  getPlatform: () => Promise<Platform>
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

/** The complete API surface exposed to the renderer. */
export interface RendererApi {
  app: AppApi
  window: WindowApi
  system: SystemApi
}
