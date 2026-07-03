import { ipcRenderer } from 'electron'

/**
 * Typed wrapper over `ipcRenderer.invoke` (request → response). Bridges call
 * this instead of touching `ipcRenderer` directly, so the renderer never sees
 * raw IPC.
 */
export function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

/** One-way send (fire-and-forget), for actions with no return value. */
export function send(channel: string, ...args: unknown[]): void {
  ipcRenderer.send(channel, ...args)
}
