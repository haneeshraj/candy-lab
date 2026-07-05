import { create } from 'zustand'
import type { AuthPhase, AuthState, AuthStore, AuthStoreState } from './types'

const initialState: AuthStoreState = {
  ready: false,
  authenticated: false,
  user: null,
  profile: null
}

/** Auth/access state, mirrored from the main process (see `useAuthSync`). */
export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,
  setAuth: (state: AuthState) =>
    set({
      ready: true,
      authenticated: state.authenticated,
      user: state.user,
      profile: state.profile
    }),
  reset: () => set(initialState)
}))

/** Derive the coarse gate phase from the current store state. */
export function selectAuthPhase(state: AuthStoreState): AuthPhase {
  if (!state.ready) return 'loading'
  if (!state.authenticated) return 'signed-out'
  if (!state.profile) return 'pending' // authenticated but profile not created yet
  if (state.profile.status === 'approved') return 'approved'
  if (state.profile.status === 'banned') return 'restricted'
  return 'pending'
}
