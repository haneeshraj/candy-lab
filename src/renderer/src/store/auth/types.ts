// Renderer-side mirror of the auth/access contract (kept independent of the
// preload types, like the other stores). Structural typing keeps it compatible
// with the `window.api.auth` / `window.api.access` surfaces.

export type AccessStatus = 'pending' | 'approved' | 'banned'
export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  email: string
  name: string | null
  notes: string | null
  role: UserRole
  status: AccessStatus
  createdAt: string
}

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthState {
  authenticated: boolean
  user: AuthUser | null
  profile: Profile | null
}

/** Coarse phase the UI gates on. */
export type AuthPhase = 'loading' | 'signed-out' | 'pending' | 'restricted' | 'approved'

export interface AuthStoreState {
  /** True once the initial state has been read from main. */
  ready: boolean
  authenticated: boolean
  user: AuthUser | null
  profile: Profile | null
}

export interface AuthActions {
  /** Apply an auth-state snapshot from main. */
  setAuth: (state: AuthState) => void
  reset: () => void
}

export type AuthStore = AuthStoreState & AuthActions
