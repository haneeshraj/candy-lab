import { create } from 'zustand'
import type { ElectronState, ElectronStore } from './types'

const initialState: ElectronState = {
  version: null,
  platform: null,
  updateStatus: 'idle'
}

// IPC-ready: a bridging hook/effect reads from `window.api` (see the preload
// bridge) and pushes values here via these setters. No IPC lives in the store,
// so it stays a pure, framework-agnostic container.
export const useElectronStore = create<ElectronStore>()((set) => ({
  ...initialState,
  setVersion: (version) => set({ version }),
  setPlatform: (platform) => set({ platform }),
  setUpdateStatus: (updateStatus) => set({ updateStatus }),
  reset: () => set(initialState)
}))
