// Central registry of every IPC channel. This is the single source of truth
// shared by the main handlers and the preload bridges — no raw channel strings
// anywhere else in the codebase.

export const IPC_CHANNELS = {
  // Window controls (renderer → main, fire-and-forget unless noted)
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_TOGGLE_MAXIMIZE: 'window:toggle-maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized', // invoke → boolean
  WINDOW_MAXIMIZE_CHANGED: 'window:maximize-changed', // main → renderer

  // App info
  APP_GET_VERSION: 'app:get-version', // invoke → string
  APP_GET_PLATFORM: 'app:get-platform', // invoke → Platform
  APP_GET_INFO: 'app:get-info', // invoke → AppInfo

  // System / OS
  SYSTEM_OPEN_EXTERNAL: 'system:open-external', // invoke(url)

  // Auto-updater
  UPDATER_CHECK: 'updater:check', // invoke → void (kicks off a check)
  UPDATER_INSTALL: 'updater:install', // send (quit & install a downloaded update)
  UPDATER_GET_STATUS: 'updater:get-status', // invoke → UpdaterStatus (last known)
  UPDATER_STATUS_CHANGED: 'updater:status-changed', // main → renderer
  UPDATER_GET_LATEST_RELEASE: 'updater:get-latest-release', // invoke → ReleaseInfo | null

  // Settings
  SETTINGS_GET: 'settings:get', // invoke(key) → unknown
  SETTINGS_SET: 'settings:set' // invoke(key, value)
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]
