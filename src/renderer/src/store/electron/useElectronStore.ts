import { create } from 'zustand'
import type { ElectronState, ElectronStore } from './types'

const initialState: ElectronState = {
  version: null,
  platform: null,
  appInfo: null,
  updateStatus: 'idle',
  updateVersion: null,
  downloadProgress: null
}

// IPC-ready: a bridging hook/effect reads from `window.api` (see the preload
// bridge) and pushes values here via these setters. No IPC lives in the store,
// so it stays a pure, framework-agnostic container.
export const useElectronStore = create<ElectronStore>()((set) => ({
  ...initialState,
  setVersion: (version) => set({ version }),
  setPlatform: (platform) => set({ platform }),
  setAppInfo: (appInfo) => set({ appInfo }),
  setUpdateStatus: (updateStatus) => set({ updateStatus }),
  applyUpdate: (update) =>
    set({
      updateStatus: update.status,
      updateVersion: update.version ?? null,
      downloadProgress: update.percent ?? null
    }),
  reset: () => set(initialState)
}))
