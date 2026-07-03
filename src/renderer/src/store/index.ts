// ===========================================================================
// State management — public API (domain-based Zustand stores)
// ---------------------------------------------------------------------------
// Import stores from here (or `@renderer/store`):
//
//   import { useUIStore, useSettingsStore } from '@renderer/store'
//
// See ./GUIDE.md and ./REFERENCE.md.
// ===========================================================================

export { useAppStore } from './app/useAppStore'
export type { AppState, AppActions, AppStore } from './app/types'

export { useUIStore } from './ui/useUIStore'
export type { UIState, UIActions, UIStore } from './ui/types'

export { useSettingsStore } from './settings/useSettingsStore'
export type { SettingsState, SettingsActions, SettingsStore, ThemeMode } from './settings/types'

export { useElectronStore } from './electron/useElectronStore'
export type { ElectronState, ElectronActions, ElectronStore, UpdateStatus } from './electron/types'
