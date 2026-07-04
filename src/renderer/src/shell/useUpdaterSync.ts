import { useEffect } from 'react'
import { useElectronStore, type UpdateInfo } from '@renderer/store'

/**
 * Mirrors the main-process auto-updater into the electron store. Fetches the
 * last known status once (covers events emitted before mount), then subscribes
 * to live changes. The store stays pure — the IPC I/O lives here.
 */
export function useUpdaterSync(): void {
  useEffect(() => {
    const apply = (update: UpdateInfo): void => {
      useElectronStore.getState().applyUpdate(update)
    }

    void window.api.updater.getStatus().then(apply)
    const unsubscribe = window.api.updater.onStatusChange(apply)
    return unsubscribe
  }, [])
}
