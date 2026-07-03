import { useEffect } from 'react'
import { useAppStore, useElectronStore } from '@renderer/store'

/**
 * App startup glue: reads system info from the preload bridge (`window.api`)
 * into the electron store, then marks the app initialized. This is the intended
 * IPC-bridge pattern — the store stays pure; the I/O lives here.
 */
export function useAppBootstrap(): void {
  useEffect(() => {
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const [version, platform] = await Promise.all([
          window.api.app.getVersion(),
          window.api.app.getPlatform()
        ])
        if (cancelled) return
        useElectronStore.getState().setVersion(version)
        useElectronStore.getState().setPlatform(platform)
        useAppStore.getState().setInitialized(true)
      } catch (error) {
        if (!cancelled) useAppStore.getState().setBootError(String(error))
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])
}
