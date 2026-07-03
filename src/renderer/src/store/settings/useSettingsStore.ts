import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SettingsState, SettingsStore } from './types'

const initialState: SettingsState = {
  theme: 'dark',
  language: 'en'
}

// Persisted to localStorage via zustand's `persist` middleware. Only state
// (not actions) is stored, and it rehydrates synchronously on load. To persist
// to the main process instead, swap in a custom `storage` adapter backed by
// `window.api.system.getSetting/setSetting`.
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      reset: () => set(initialState)
    }),
    {
      name: 'candy-lab-settings',
      partialize: (state) => ({ theme: state.theme, language: state.language })
    }
  )
)
