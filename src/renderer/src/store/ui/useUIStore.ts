import { create } from 'zustand'
import type { UIState, UIStore } from './types'

const initialState: UIState = {
  openModals: [],
  sidebarOpen: false
}

/** UI behavior flags — modals and layout toggles. */
export const useUIStore = create<UIStore>()((set, get) => ({
  ...initialState,
  openModal: (id) =>
    set((state) => ({
      openModals: state.openModals.includes(id) ? state.openModals : [...state.openModals, id]
    })),
  closeModal: (id) =>
    set((state) => ({ openModals: state.openModals.filter((modalId) => modalId !== id) })),
  isModalOpen: (id) => get().openModals.includes(id),
  toggleSidebar: (open) =>
    set((state) => ({ sidebarOpen: typeof open === 'boolean' ? open : !state.sidebarOpen })),
  reset: () => set(initialState)
}))
