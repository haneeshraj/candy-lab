import type { AppInfo } from '../preload/ipc/types'

// Injected by Vite `define` (see `electron.vite.config.ts`) at build/dev time.
declare global {
  const __APP_INFO__: AppInfo

  // Env vars injected into the MAIN bundle by electron-vite (the `MAIN_VITE_`
  // prefix). Loaded from `.env` in dev and baked in at build time. Merges with
  // electron-vite's `ImportMetaEnv`. See `supabase/README.md`.
  interface ImportMetaEnv {
    readonly MAIN_VITE_SUPABASE_URL?: string
    readonly MAIN_VITE_SUPABASE_KEY?: string
  }
}

export {}
