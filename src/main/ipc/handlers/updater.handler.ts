import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import {
  checkForUpdates,
  getCurrentRelease,
  getUpdaterStatus,
  quitAndInstall
} from '../../services/updater.service'

// Auto-updater controls. Event wiring + the automatic check live in the service
// (`initUpdater`); these just expose manual actions and the current status.

export function registerUpdaterHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.UPDATER_CHECK, () => checkForUpdates())
  ipcMain.handle(IPC_CHANNELS.UPDATER_GET_STATUS, () => getUpdaterStatus())
  ipcMain.handle(IPC_CHANNELS.UPDATER_GET_CURRENT_RELEASE, () => getCurrentRelease())
  ipcMain.on(IPC_CHANNELS.UPDATER_INSTALL, () => quitAndInstall())
}
