/** The host platform, e.g. `'darwin'` | `'win32'` | `'linux'`. */
export type Platform = typeof window.electron.process.platform

/**
 * The current OS platform, read from the preload-exposed process info. Useful
 * for platform-specific UI (e.g. reserving space for macOS traffic lights).
 *
 *   const platform = usePlatform()
 *   const isMac = platform === 'darwin'
 *
 * This value is stable for the app's lifetime, so no subscription is needed.
 */
export function usePlatform(): Platform {
  return window.electron.process.platform
}
