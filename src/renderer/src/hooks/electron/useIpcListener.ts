import { useEffect, useRef } from 'react'

/**
 * Subscribe to a main→renderer IPC channel for the lifetime of the component.
 * The listener is removed automatically on unmount, and the latest callback is
 * always used without re-subscribing on every render.
 *
 *   useIpcListener('download:progress', (percent) => setProgress(percent as number))
 *
 * (Send the message from the main process with `webContents.send(channel, ...)`.)
 */
export function useIpcListener(channel: string, callback: (...args: unknown[]) => void): void {
  const saved = useRef(callback)

  useEffect(() => {
    saved.current = callback
  }, [callback])

  useEffect(() => {
    const removeListener = window.electron.ipcRenderer.on(channel, (_event, ...args) => {
      saved.current(...args)
    })
    return () => removeListener()
  }, [channel])
}
