import { useEffect } from 'react'
import { useAuthStore, type AuthState } from '@renderer/store'

/**
 * Mirrors the main-process auth/access state into the auth store. Reads the
 * current state once on mount (restoring any persisted session), then subscribes
 * to live changes (sign-in / sign-out / approval updates). The store stays
 * pure — the IPC I/O lives here.
 */
export function useAuthSync(): void {
  useEffect(() => {
    const apply = (state: AuthState): void => {
      useAuthStore.getState().setAuth(state)
    }

    void window.api.auth.getState().then(apply)
    const unsubscribe = window.api.auth.onStateChange(apply)
    return unsubscribe
  }, [])
}
