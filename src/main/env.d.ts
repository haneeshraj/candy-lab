import type { AppInfo } from '../preload/ipc/types'

// Injected by Vite `define` (see `electron.vite.config.ts`) at build/dev time.
declare global {
  const __APP_INFO__: AppInfo
  /** Read-only GitHub token for private-repo update downloads (may be empty). */
  const __UPDATE_TOKEN__: string
}

export {}
