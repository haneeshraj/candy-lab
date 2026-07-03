// System / IPC-related state, mirrored from the main process. Future-ready: a
// bridging hook will populate these from `window.api`; the store itself stays
// pure (no IPC calls inside it).

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'

export interface ElectronState {
  /** App version, mirrored from `window.api.app.getVersion()`. */
  version: string | null
  /** OS platform, mirrored from `window.api.app.getPlatform()`. */
  platform: string | null
  /** Auto-update lifecycle status (for a future updater integration). */
  updateStatus: UpdateStatus
}

export interface ElectronActions {
  setVersion: (version: string | null) => void
  setPlatform: (platform: string | null) => void
  setUpdateStatus: (status: UpdateStatus) => void
  reset: () => void
}

export type ElectronStore = ElectronState & ElectronActions
