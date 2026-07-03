import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke, send } from '../ipc/invoke'
import { on } from '../ipc/on'
import type { WindowApi } from '../ipc/types'

/** Window controls for a custom title bar. */
export const windowBridge: WindowApi = {
  minimize: () => send(IPC_CHANNELS.WINDOW_MINIMIZE),
  maximize: () => send(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE),
  close: () => send(IPC_CHANNELS.WINDOW_CLOSE),
  isMaximized: () => invoke<boolean>(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
  onMaximizeChange: (callback) =>
    on(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, (state) => callback(Boolean(state)))
}
