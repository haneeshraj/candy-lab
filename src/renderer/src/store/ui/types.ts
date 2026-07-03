// Transient UI state: modals, toggles, layout flags. Nothing persisted, nothing
// page-specific.

export interface UIState {
  /** IDs of currently-open modals/overlays. */
  openModals: string[]
  sidebarOpen: boolean
}

export interface UIActions {
  openModal: (id: string) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean
  /** Toggle, or set explicitly when a boolean is passed. */
  toggleSidebar: (open?: boolean) => void
  reset: () => void
}

export type UIStore = UIState & UIActions
