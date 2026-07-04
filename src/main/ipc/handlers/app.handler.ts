import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../channels'
import { systemService } from '../../services/system.service'

// App-level info handlers. Business logic lives in services; handlers just wire
// a channel to a service call.

export function registerAppHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, () => systemService.getVersion())
  ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => systemService.getPlatform())
  ipcMain.handle(IPC_CHANNELS.APP_GET_INFO, () => systemService.getInfo())
}
