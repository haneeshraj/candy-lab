// Global application lifecycle state.

export interface AppState {
  /** True once the app has finished its startup sequence. */
  initialized: boolean
  /** Fatal startup error message, if bootstrapping failed. */
  bootError: string | null
}

export interface AppActions {
  setInitialized: (value: boolean) => void
  setBootError: (error: string | null) => void
  /** Restore the store to its initial state. */
  reset: () => void
}

export type AppStore = AppState & AppActions
