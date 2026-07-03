import { create } from 'zustand'
import type { AppState, AppStore } from './types'

const initialState: AppState = {
  initialized: false,
  bootError: null
}

/** Global app lifecycle state (startup, fatal errors). */
export const useAppStore = create<AppStore>()((set) => ({
  ...initialState,
  setInitialized: (value) => set({ initialized: value }),
  setBootError: (error) => set({ bootError: error }),
  reset: () => set(initialState)
}))
