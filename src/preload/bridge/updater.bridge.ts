import { IPC_CHANNELS } from '../../main/ipc/channels'
import { invoke, send } from '../ipc/invoke'
import { on } from '../ipc/on'
import type { ReleaseInfo, UpdaterApi, UpdaterStatus } from '../ipc/types'

/** Auto-updater API — drive checks/installs and observe progress. */
export const updaterBridge: UpdaterApi = {
  check: () => invoke<void>(IPC_CHANNELS.UPDATER_CHECK),
  install: () => send(IPC_CHANNELS.UPDATER_INSTALL),
  getStatus: () => invoke<UpdaterStatus>(IPC_CHANNELS.UPDATER_GET_STATUS),
  onStatusChange: (callback) =>
    on(IPC_CHANNELS.UPDATER_STATUS_CHANGED, (payload) => callback(payload as UpdaterStatus)),
  getCurrentRelease: () => invoke<ReleaseInfo | null>(IPC_CHANNELS.UPDATER_GET_CURRENT_RELEASE)
}
