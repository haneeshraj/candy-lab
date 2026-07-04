// System / IPC-related state, mirrored from the main process. Future-ready: a
// bridging hook will populate these from `window.api`; the store itself stays
// pure (no IPC calls inside it).

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

/** Static app metadata, mirrored from `window.api.app.getInfo()`. */
export interface AppInfo {
  name: string
  version: string
  description: string
  author: string
  license: string
  homepage: string
  commit: string
  buildDate: string
}

/** Auto-updater snapshot, mirrored from `window.api.updater`. */
export interface UpdateInfo {
  status: UpdateStatus
  version?: string | null
  percent?: number | null
  error?: string | null
}

export interface ElectronState {
  /** App version, mirrored from `window.api.app.getVersion()`. */
  version: string | null
  /** OS platform, mirrored from `window.api.app.getPlatform()`. */
  platform: string | null
  /** Static build metadata, mirrored from `window.api.app.getInfo()`. */
  appInfo: AppInfo | null
  /** Auto-update lifecycle status. */
  updateStatus: UpdateStatus
  /** Version of the available/downloaded update, if any. */
  updateVersion: string | null
  /** Download progress (0–100) while `updateStatus === 'downloading'`. */
  downloadProgress: number | null
}

export interface ElectronActions {
  setVersion: (version: string | null) => void
  setPlatform: (platform: string | null) => void
  setAppInfo: (info: AppInfo | null) => void
  setUpdateStatus: (status: UpdateStatus) => void
  /** Apply a full updater snapshot (status + version + progress) at once. */
  applyUpdate: (update: UpdateInfo) => void
  reset: () => void
}

export type ElectronStore = ElectronState & ElectronActions
