import { create } from 'zustand'
import type { SettingsState, SettingsStore } from './types'

const initialState: SettingsState = {
  theme: 'dark',
  language: 'en'
}

// PERSISTENCE (future): wrap this creator with zustand's `persist` middleware.
// For localStorage:
//   persist(creator, { name: 'settings' })
// For the main process (electron-store via IPC), supply a custom `storage`
// adapter backed by `window.api.system.getSetting/setSetting`. Kept plain for
// now — the shape is already persistence-ready.
export const useSettingsStore = create<SettingsStore>()((set) => ({
  ...initialState,
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language }),
  reset: () => set(initialState)
}))
