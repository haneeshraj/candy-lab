import { ipcRenderer, type IpcRendererEvent } from 'electron'

/**
 * Subscribe to a main → renderer channel. Returns an unsubscribe function and
 * strips the Electron event so callers only receive the payload args.
 */
export function on(channel: string, listener: (...args: unknown[]) => void): () => void {
  const wrapped = (_event: IpcRendererEvent, ...args: unknown[]): void => listener(...args)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}
