// User preferences. This is the domain that will later be persisted (see the
// persistence note in useSettingsStore).

export type ThemeMode = 'dark' | 'light' | 'system'

export interface SettingsState {
  theme: ThemeMode
  language: string
}

export interface SettingsActions {
  setTheme: (theme: ThemeMode) => void
  setLanguage: (language: string) => void
  reset: () => void
}

export type SettingsStore = SettingsState & SettingsActions
